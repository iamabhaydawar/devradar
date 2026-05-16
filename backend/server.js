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
} from './hydradb.js'

import {
  analyzeStackVsStartup,
  generateGapReport,
  generateInterviewQuestions,
  matchHackathons,
} from './claude.js'

dotenv.config()

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
    status: 'ok',
    timestamp: new Date().toISOString(),
    hydradb: Boolean(process.env.HYDRADB_API_KEY),
    claude:  Boolean(process.env.ANTHROPIC_API_KEY),
  })
})

// POST /api/user/init
app.post('/api/user/init', async (req, res) => {
  try {
    const { stack = [], experience = '0-1 years', goals = [] } = req.body
    const userId = uuidv4()

    const user = await initUser({
      userId,
      stack,
      experience,
      goals,
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
    const { userId, stack, experience } = req.body

    if (!userId) return res.status(400).json({ error: 'userId is required' })
    if (!Array.isArray(stack) || stack.length === 0) {
      return res.status(400).json({ error: 'stack must be a non-empty array' })
    }

    // Basic match score for all startups
    const scored = startups.map(startup => ({
      ...startup,
      match_score: basicMatchScore(stack, startup),
    })).sort((a, b) => b.match_score - a.match_score)

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
    const top5Ids = new Set(top5.map(s => s.id))
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
