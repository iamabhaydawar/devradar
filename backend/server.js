import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'
import { readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

import {
  initUser,
  getUser,
  updateStack,
  recordStartupView,
  recordHackathonView,
  saveGapAnalysis,
  getReturnContext,
  saveWikiPage,
  getWikiPage,
  getAllWikiPages,
  appendToIngestLog,
  getGraphData,
} from './hydradb.js'

import {
  analyzeStackVsStartup,
  generateGapReport,
  generateInterviewQuestions,
  matchHackathons,
} from './claude.js'

import { detectInputType, fetchURL, extractText } from './fetcher.js'

// ── Load env BEFORE any lazy reads ────────────────────────────────────────────
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '.env') })

// ── AI provider selection: Groq (free/fast) preferred, Claude as fallback ─────
import * as groqAI from './groq.js'
import {
  ingestStep1 as claudeIngestStep1,
  ingestStep2GeneratePage as claudeIngestStep2,
  queryWiki as claudeQueryWiki,
  generateRoadmap as claudeRoadmap,
} from './claude.js'

const useGroq = groqAI.isAvailable()
const ingestStep1           = useGroq ? groqAI.ingestStep1           : claudeIngestStep1
const ingestStep2GeneratePage = useGroq ? groqAI.ingestStep2GeneratePage : claudeIngestStep2
const queryWiki             = useGroq ? groqAI.queryWiki             : claudeQueryWiki
const generateRoadmap       = useGroq ? groqAI.generateRoadmap       : claudeRoadmap

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

// ── Load static data ──────────────────────────────────────────────────────────

const startups  = JSON.parse(await readFile(join(__dirname, 'data/startups.json'),  'utf8'))
const hackathons = JSON.parse(await readFile(join(__dirname, 'data/hackathons.json'), 'utf8'))
const skills    = JSON.parse(await readFile(join(__dirname, 'data/skills.json'),    'utf8'))

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    /\.vercel\.app$/,
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json())

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// ── Internal helpers ──────────────────────────────────────────────────────────

function basicMatchScore(userStack, startup) {
  const userNorm = userStack.map(s => s.toLowerCase().trim())
  const required = startup.skills_required.map(s => s.toLowerCase())
  const matched  = userNorm.filter(s => required.some(r => r.includes(s) || s.includes(r)))
  return Math.round((matched.length / Math.max(required.length, 1)) * 100)
}

// ── Routes ────────────────────────────────────────────────────────────────────

// Health
app.get('/api/health', (_req, res) => {
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    hydradb:   Boolean(process.env.HYDRADB_API_KEY),
    ai:        useGroq ? 'groq' : (Boolean(process.env.ANTHROPIC_API_KEY) ? 'claude' : 'none'),
    claude:    Boolean(process.env.ANTHROPIC_API_KEY),
    groq:      useGroq,
  })
})

// POST /api/user/init
app.post('/api/user/init', async (req, res) => {
  try {
    const {
      name = '',
      stack = [],
      learning_stack = [],
      experience = '',
      goals = [],
      target_role = '',
      target_companies = [],
      timeline = '',
      learning_style = '',
    } = req.body

    // Required field validation
    if (!Array.isArray(stack) || stack.length === 0) {
      return res.status(400).json({ error: 'At least one skill is required' })
    }
    if (!experience) {
      return res.status(400).json({ error: 'Experience level is required' })
    }

    const userId = uuidv4()

    const user = await initUser({
      userId,
      name,
      stack,
      learning_stack,
      experience,
      goals,
      target_role,
      target_companies,
      timeline,
      learning_style,
      created_at: new Date().toISOString(),
    })

    res.status(201).json({ userId, message: 'Profile created', user })
  } catch (err) {
    console.error('[POST /api/user/init]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/user/:userId
app.get('/api/user/:userId', async (req, res) => {
  try {
    const user = await getUser(req.params.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    console.error('[GET /api/user/:userId]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/user/:userId/stack
app.post('/api/user/:userId/stack', async (req, res) => {
  try {
    const { stack } = req.body
    if (!Array.isArray(stack) || stack.length === 0) {
      return res.status(400).json({ error: 'stack must be a non-empty array' })
    }
    await updateStack(req.params.userId, stack)
    res.json({ updated: true })
  } catch (err) {
    console.error('[POST /api/user/:userId/stack]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/analyze
app.post('/api/analyze', async (req, res) => {
  try {
    const { userId, stack: bodyStack, experience: bodyExperience } = req.body

    if (!userId) return res.status(400).json({ error: 'userId is required' })

    // Load user profile from HydraDB to personalize results
    const userProfile = await getUser(userId).catch(() => null)

    // Use stored stack if body doesn't supply one
    const stack = (Array.isArray(bodyStack) && bodyStack.length > 0)
      ? bodyStack
      : (userProfile?.stack ?? [])

    if (stack.length === 0) {
      return res.status(400).json({ error: 'stack must be a non-empty array' })
    }

    const experience = bodyExperience ?? userProfile?.experience ?? 'beginner'
    const targetCompanies = userProfile?.target_companies ?? []

    // Basic match score for all startups
    let scored = startups.map(startup => ({
      ...startup,
      match_score: basicMatchScore(stack, startup),
    }))

    // Personalize: boost startups that match user's target companies
    if (targetCompanies.length > 0) {
      scored = scored.map(startup => {
        const nameNorm = startup.name.toLowerCase()
        const isTarget = targetCompanies.some(tc => {
          const tcNorm = tc.toLowerCase()
          return nameNorm.includes(tcNorm) || tcNorm.includes(nameNorm)
        })
        return isTarget
          ? { ...startup, match_score: Math.min(100, startup.match_score + 20), is_target: true }
          : startup
      })
    }

    scored.sort((a, b) => b.match_score - a.match_score)

    // Deep Claude analysis for top 5
    const top5 = scored.slice(0, 5)
    const claudeResults = await Promise.allSettled(
      top5.map(startup => analyzeStackVsStartup(stack, startup))
    )

    const enrichedTop5 = top5.map((startup, i) => ({
      ...startup,
      claude_analysis: claudeResults[i].status === 'fulfilled'
        ? claudeResults[i].value
        : { match_percentage: startup.match_score, matching_skills: [], missing_skills: [], assessment: '', recommended_action: '' },
    }))

    // Merge enriched top 5 back, keep rest as-is
    const enrichedMap = new Map(enrichedTop5.map(s => [s.id, s]))
    const allStartups = scored.map(s => enrichedMap.get(s.id) ?? s)

    // Record top match view in HydraDB
    const topMatch = enrichedTop5[0]
    if (topMatch) {
      await recordStartupView(userId, topMatch.id, topMatch.name)
    }

    // Update stack in HydraDB
    await updateStack(userId, stack)

    res.json({
      startups: allStartups,
      topMatch: topMatch ?? null,
      total: allStartups.length,
    })
  } catch (err) {
    console.error('[POST /api/analyze]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/gaps
app.post('/api/gaps', async (req, res) => {
  try {
    const { userId, stack, targetCompanies } = req.body

    if (!userId) return res.status(400).json({ error: 'userId is required' })
    if (!Array.isArray(stack) || stack.length === 0) {
      return res.status(400).json({ error: 'stack must be a non-empty array' })
    }

    // Resolve company names to full startup objects
    const targets = Array.isArray(targetCompanies) && targetCompanies.length > 0
      ? startups.filter(s => targetCompanies.includes(s.name) || targetCompanies.includes(s.id))
      : startups.slice(0, 5) // Default to top 5 if none specified

    const report = await generateGapReport(stack, targets)
    await saveGapAnalysis(userId, { ...report, stack, targets: targets.map(t => t.name) })

    res.json(report)
  } catch (err) {
    console.error('[POST /api/gaps]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/hackathons/:userId
app.get('/api/hackathons/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const rawStack = req.query.stack ?? ''
    const stack = rawStack ? rawStack.split(',').map(s => s.trim()).filter(Boolean) : []

    if (stack.length === 0) {
      return res.json({ ranked_hackathons: hackathons.map(h => ({ ...h, match_score: 0 })) })
    }

    const { ranked_hackathons } = await matchHackathons(stack, hackathons)

    // Record top hackathon view in HydraDB
    const top = ranked_hackathons[0]
    if (top) {
      await recordHackathonView(userId, top.id, top.name)
    }

    res.json({ ranked_hackathons })
  } catch (err) {
    console.error('[GET /api/hackathons/:userId]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/return-context/:userId
app.get('/api/return-context/:userId', async (req, res) => {
  try {
    const context = await getReturnContext(req.params.userId, startups, hackathons)
    res.json(context)
  } catch (err) {
    console.error('[GET /api/return-context/:userId]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/skills
app.get('/api/skills', (_req, res) => {
  res.json(skills)
})

// ── Wiki ingest pipeline ──────────────────────────────────────────────────────

// POST /api/ingest
// Body: { userId, input, inputType? }
// Runs 2-step LLM pipeline: extract entities → generate wiki pages
app.post('/api/ingest', async (req, res) => {
  try {
    const { userId, input } = req.body
    if (!userId) return res.status(400).json({ error: 'userId is required' })
    if (!input || typeof input !== 'string' || !input.trim()) {
      return res.status(400).json({ error: 'input is required' })
    }

    const inputType = detectInputType(input)
    let content = ''

    if (inputType === 'screenshot') {
      return res.status(422).json({ error: 'Screenshot analysis is not yet supported. Please copy and paste the text from the page directly.' })
    }

    if (inputType === 'url') {
      try {
        content = await fetchURL(input.trim())
      } catch (fetchErr) {
        return res.status(422).json({ error: `Could not fetch URL: ${fetchErr.message}` })
      }
      // JS-rendered pages (React/Next SPAs) return a near-empty HTML shell
      if (content.replace(/\s+/g, '').length < 300) {
        return res.status(422).json({
          error: 'This page is JavaScript-rendered and cannot be scraped directly. Please copy and paste the job description text instead.',
        })
      }
    } else {
      content = extractText(input, inputType)
    }

    // Get user's current stack for context
    const user = await getUser(userId)
    const userStack = user?.stack ?? []

    // Step 1 — extract entities
    console.log(`[/api/ingest] Step 1: extracting entities for ${userId}`)
    const entities = await ingestStep1(content, userStack)

    // Step 2 — generate wiki pages for each entity (in parallel, capped at 6)
    const pageJobs = []

    for (const company of (entities.companies ?? []).slice(0, 3)) {
      pageJobs.push({ type: 'company', entity: company, name: company.name?.toLowerCase().replace(/\s+/g, '-') })
    }
    for (const skill of (entities.skills ?? []).slice(0, 2)) {
      pageJobs.push({ type: 'skill', entity: skill, name: skill.name?.toLowerCase().replace(/\s+/g, '-') })
    }
    for (const hackathon of (entities.hackathons ?? []).slice(0, 1)) {
      pageJobs.push({ type: 'hackathon', entity: hackathon, name: hackathon.name?.toLowerCase().replace(/\s+/g, '-') })
    }
    for (const gap of (entities.gaps ?? []).slice(0, 2)) {
      pageJobs.push({ type: 'gap', entity: gap, name: gap.skill?.toLowerCase().replace(/\s+/g, '-') })
    }

    console.log(`[/api/ingest] Step 2: generating ${pageJobs.length} wiki pages`)

    const results = await Promise.allSettled(
      pageJobs.map(async job => {
        const markdown = await ingestStep2GeneratePage(job.type, job.entity, userStack, content)
        await saveWikiPage(userId, job.type, job.name, markdown, { source: inputType === 'url' ? input.trim() : inputType })
        return { type: job.type, name: job.name, pageKey: `${job.type}/${job.name}` }
      })
    )

    const saved = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)

    // Log ingest event
    await appendToIngestLog(userId, {
      inputType,
      source: inputType === 'url' ? input.trim().slice(0, 200) : `${content.slice(0, 60)}…`,
      pagesCreated: saved.length,
      summary: entities.summary ?? '',
    })

    res.json({
      ok: true,
      summary: entities.summary ?? '',
      entities: {
        companies: entities.companies?.length ?? 0,
        skills: entities.skills?.length ?? 0,
        hackathons: entities.hackathons?.length ?? 0,
        gaps: entities.gaps?.length ?? 0,
      },
      pages: saved,
    })
  } catch (err) {
    console.error('[POST /api/ingest]', err.message)
    if (err.isRateLimit) {
      return res.status(429).json({ error: 'AI daily token limit reached. Add ANTHROPIC_API_KEY to .env to use Claude as fallback, or wait until tomorrow (UTC midnight) for Groq to reset.' })
    }
    res.status(500).json({ error: err.message })
  }
})

// GET /api/wiki-pages/:userId
// Returns all wiki pages for a user
app.get('/api/wiki-pages/:userId', async (req, res) => {
  try {
    const pages = await getAllWikiPages(req.params.userId)
    res.json({ pages, total: pages.length })
  } catch (err) {
    console.error('[GET /api/wiki-pages/:userId]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/wiki/:userId/:pageType/:pageName
// Returns a single wiki page
app.get('/api/wiki/:userId/:pageType/:pageName', async (req, res) => {
  try {
    const { userId, pageType, pageName } = req.params
    const page = await getWikiPage(userId, pageType, pageName)
    if (!page) return res.status(404).json({ error: 'Page not found' })
    res.json(page)
  } catch (err) {
    console.error('[GET /api/wiki/:userId/:pageType/:pageName]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/chat
// Body: { userId, question, userStack? }
// Answers a question using the user's wiki as context
app.post('/api/chat', async (req, res) => {
  try {
    const { userId, question, userStack: bodyStack } = req.body
    if (!userId) return res.status(400).json({ error: 'userId is required' })
    if (!question?.trim()) return res.status(400).json({ error: 'question is required' })

    const user = await getUser(userId)
    const userStack = bodyStack ?? user?.stack ?? []
    const wikiPages = await getAllWikiPages(userId)

    const result = await queryWiki(question, wikiPages, userStack)
    res.json(result)
  } catch (err) {
    console.error('[POST /api/chat]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/roadmap/:userId
// Generates a personalized week-by-week learning roadmap
app.get('/api/roadmap/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const user = await getUser(userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const userStack = user.stack ?? []
    const lastGapAnalysis = user.gap_analyses?.at(-1)
    const gapSkills = lastGapAnalysis?.priority_skills ?? []
    const goals = user.goals ?? []
    const wikiPages = await getAllWikiPages(userId)

    const roadmap = await generateRoadmap(userStack, gapSkills, goals, wikiPages)
    res.json(roadmap)
  } catch (err) {
    console.error('[GET /api/roadmap/:userId]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/journey/:userId
// Returns the user's career journey log
app.get('/api/journey/:userId', async (req, res) => {
  try {
    const user = await getUser(req.params.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ journey: user.journey ?? [] })
  } catch (err) {
    console.error('[GET /api/journey/:userId]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/graph-data/:userId
// Returns wiki-derived graph data (supplements the existing client-side graph)
app.get('/api/graph-data/:userId', async (req, res) => {
  try {
    const data = await getGraphData(req.params.userId)
    res.json(data)
  } catch (err) {
    console.error('[GET /api/graph-data/:userId]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Error middleware ──────────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  console.error('[Unhandled error]', err.message)
  res.status(500).json({ error: 'Internal server error', detail: err.message })
})

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log('─────────────────────────────────────────')
  console.log(`  DevRadar backend   http://localhost:${PORT}`)
  console.log(`  HydraDB            ${process.env.HYDRADB_API_KEY ? '✓ key set' : '✗ using local Map fallback'}`)
  console.log(`  Claude             ${process.env.ANTHROPIC_API_KEY ? '✓ key set' : '✗ missing key'}`)
  console.log(`  Startups loaded    ${startups.length}`)
  console.log(`  Hackathons loaded  ${hackathons.length}`)
  console.log(`  Skills loaded      ${skills.length}`)
  console.log('─────────────────────────────────────────')
})
