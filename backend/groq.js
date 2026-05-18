/**
 * Groq API — drop-in replacement for Claude wiki functions.
 * Uses Llama 3.3-70b-versatile (free tier, fast).
 * Function signatures match claude.js so server.js can swap transparently.
 */

import fetch from 'node-fetch'

// Read lazily so dotenv.config() in server.js fires before these are evaluated
const GROQ_URL  = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL     = 'llama-3.3-70b-versatile'

export const isAvailable = () => Boolean(process.env.GROQ_API_KEY)

// ── Core chat helper ──────────────────────────────────────────────────────────

async function groqChat(systemPrompt, userMessage, maxTokens = 1000) {
  const GROQ_KEY = process.env.GROQ_API_KEY
  if (!GROQ_KEY) throw new Error('GROQ_API_KEY not set')

  const resp = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system',  content: systemPrompt },
        { role: 'user',    content: userMessage  },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  })

  if (!resp.ok) {
    const txt = await resp.text()
    const err = new Error(`Groq ${resp.status}: ${txt.slice(0, 200)}`)
    if (resp.status === 429) err.isRateLimit = true
    throw err
  }

  const data = await resp.json()
  return data.choices?.[0]?.message?.content ?? ''
}

function safeJSON(text, fallback) {
  try {
    const cleaned = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()
    // Extract first JSON object or array
    const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
    return match ? JSON.parse(match[0]) : fallback
  } catch {
    return fallback
  }
}

// ── Wiki ingest pipeline ──────────────────────────────────────────────────────

/**
 * Step 1 — Extract entities from raw content.
 * Returns: { companies, skills, hackathons, gaps, summary }
 */
export async function ingestStep1(content, userStack = []) {
  const fallback = { companies: [], skills: [], hackathons: [], gaps: [], summary: '' }

  try {
    const system = `You are a career intelligence extractor for Indian developers.
Respond ONLY with valid JSON. No markdown fences. No extra text.`

    const user = `User's current stack: ${userStack.length ? userStack.join(', ') : 'unknown'}

Content to analyze:
---
${content.slice(0, 5000)}
---

Extract career entities. Return JSON exactly:
{
  "companies": [{"name":"","type":"startup|bigtech","skills_required":[],"notes":""}],
  "skills": [{"name":"","category":"frontend|backend|devops|ml|other","relevance":""}],
  "hackathons": [{"name":"","platform":"","skills_relevant":[],"deadline":null,"prize":null}],
  "gaps": [{"skill":"","why":"","urgency":"high|medium|low"}],
  "summary": ""
}`

    const raw = await groqChat(system, user, 1500)
    return safeJSON(raw, fallback)
  } catch (err) {
    console.error('[Groq] ingestStep1 error:', err.message)
    if (err.isRateLimit) throw err  // let caller handle rate limit
    return fallback
  }
}

/**
 * Step 2 — Generate a markdown wiki page for one extracted entity.
 */
export async function ingestStep2GeneratePage(entityType, entity, userStack = [], sourceContent = '') {
  try {
    const system = `Generate a career wiki page in markdown with YAML frontmatter.
Use [[type/name]] wikilinks to connect related pages.
Respond ONLY with markdown. No extra text.`

    const today = new Date().toISOString().split('T')[0]
    const user = `Generate wiki page:
Type: ${entityType}
Entity: ${JSON.stringify(entity)}
User stack: ${userStack.join(', ')}
Source snippet: ${sourceContent.slice(0, 500)}

Format:
---
type: ${entityType}
name: [name]
tags: []
updated: ${today}
---

# [Name]

## Overview
[2-3 sentences on why this matters for the user's career]

## Key Details
- [detail]
- [detail]

## Career Relevance
[Use [[skill/typescript]], [[company/razorpay]] style wikilinks]

## Action Items
- [ ] [specific step]`

    const md = await groqChat(system, user, 800)
    return md.trim() || `---\ntype: ${entityType}\nname: ${entity.name ?? entity.skill ?? 'Unknown'}\nupdated: ${today}\n---\n\n# ${entity.name ?? entity.skill ?? 'Unknown'}\n\nContent generation failed.`
  } catch (err) {
    console.error('[Groq] ingestStep2GeneratePage error:', err.message)
    return `---\ntype: ${entityType}\nname: ${entity.name ?? entity.skill ?? 'Unknown'}\nupdated: ${new Date().toISOString().split('T')[0]}\n---\n\n# ${entity.name ?? entity.skill ?? 'Unknown'}\n\nFailed to generate. Please try again.`
  }
}

/**
 * Answer a question using the user's wiki as context.
 * Returns: { answer, citations }
 */
export async function queryWiki(question, wikiPages, userStack = []) {
  const fallback = {
    answer: wikiPages.length === 0
      ? 'Your wiki is empty. Ingest some job postings or URLs first to build your career knowledge base.'
      : 'Could not find relevant information in your wiki.',
    citations: [],
  }

  try {
    const chunks = []
    let total = 0
    for (const p of [...wikiPages].reverse()) {
      const chunk = `=== ${p.key} ===\n${(p.content ?? '').slice(0, 600)}\n`
      if (total + chunk.length > 5500) break
      chunks.push(p)
      total += chunk.length
    }

    const context = chunks.map(p => `=== ${p.key} ===\n${(p.content ?? '').slice(0, 600)}`).join('\n\n')

    const system = `You are DevRadar AI helping an Indian developer.
User stack: ${userStack.join(', ')}.
Answer ONLY from the wiki pages provided. Cite as [page-key]. Be specific and actionable.
Respond ONLY with valid JSON: {"answer":"...with [citations]","cited_keys":[]}`

    const raw = await groqChat(system,
      `Wiki:\n${context}\n\nQuestion: ${question}`, 600)

    const result = safeJSON(raw, null)
    if (!result?.answer) return fallback

    const citations = (result.cited_keys ?? [])
      .map(key => {
        const page = wikiPages.find(p => p.key === key)
        if (!page) return null
        const excerpt = (page.content ?? '').split('\n').find(l => l.trim() && !l.startsWith('---') && !l.startsWith('#'))
        return { key, pageName: page.pageName, excerpt: excerpt?.trim() ?? '' }
      })
      .filter(Boolean)

    return { answer: result.answer, citations }
  } catch (err) {
    console.error('[Groq] queryWiki error:', err.message)
    return fallback
  }
}

/**
 * Generate a 4-week career roadmap.
 */
export async function generateRoadmap(userStack, gapSkills, goals = [], wikiPages = []) {
  const fallback = {
    weeks: [
      { week: 1, theme: 'Foundation', focus_skill: gapSkills[0]?.skill ?? 'Core Skills', tasks: ['Identify your primary learning goal', 'Set a 2-hour daily study schedule', 'Review your stack strengths vs market demand'], resources: [], milestone: 'Have a clear 4-week learning plan' },
      { week: 2, theme: 'Skill Building', focus_skill: gapSkills[0]?.skill ?? 'Core Skills', tasks: ['Start the highest-impact skill gap', 'Build a mini project using the new skill', 'Push to GitHub daily'], resources: [], milestone: 'Ship a small project using the new skill' },
    ],
    summary: 'Focus on your highest-impact skill gap and build consistently every day.',
  }

  try {
    const gapList = gapSkills.slice(0, 6)
      .map(g => `${g.skill}: ${g.why ?? ''} (${g.time_weeks ?? 2}w)`)
      .join('\n')

    const wikiCtx = wikiPages.slice(0, 4)
      .map(p => `${p.key}: ${(p.content ?? '').split('\n').slice(0, 4).join(' ')}`)
      .join('\n')

    const system = `You are a developer career coach for Indian students.
Generate specific, actionable roadmaps. Respond ONLY with valid JSON. No markdown fences.`

    const user = `Stack: ${userStack.join(', ')}
Goals: ${goals.length ? goals.join(', ') : 'Get hired at a funded startup'}
Gaps:
${gapList}
Wiki context: ${wikiCtx}

Return JSON:
{
  "weeks":[{
    "week":1,"theme":"","focus_skill":"",
    "tasks":["specific task"],
    "resources":[{"title":"","url":"https://...","type":"course|docs|project|article"}],
    "milestone":""
  }],
  "summary":""
}`

    const raw = await groqChat(system, user, 1500)
    return safeJSON(raw, fallback)
  } catch (err) {
    console.error('[Groq] generateRoadmap error:', err.message)
    return fallback
  }
}
