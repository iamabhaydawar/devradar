import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'
import { readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

import { getUser, updateSession } from './hydradb.js'
import { analyzeGaps } from './claude.js'
import { matchStartups, filterHackathons } from './analyzer.js'

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

const startups = JSON.parse(await readFile(join(__dirname, 'data/startups.json'), 'utf8'))
const hackathons = JSON.parse(await readFile(join(__dirname, 'data/hackathons.json'), 'utf8'))

// ── Routes ──────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/startups', (_req, res) => {
  res.json(startups)
})

app.get('/api/hackathons', (_req, res) => {
  res.json(hackathons)
})

app.get('/api/user/:userId', async (req, res) => {
  try {
    const user = await getUser(req.params.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Core endpoint: stack analysis + HydraDB persistence
app.post('/api/analyze', async (req, res) => {
  try {
    const { userId: existingUserId, stack } = req.body

    if (!stack || !Array.isArray(stack) || stack.length === 0) {
      return res.status(400).json({ error: 'stack must be a non-empty array of strings' })
    }

    const userId = existingUserId || uuidv4()
    const isReturning = Boolean(existingUserId)

    const userProfile = isReturning ? await getUser(userId) : null

    const matchedStartups = matchStartups(stack, startups)
    const matchedHackathons = filterHackathons(stack, hackathons)
    const gapAnalysis = await analyzeGaps(stack, matchedStartups, userProfile)

    const session = {
      timestamp: new Date().toISOString(),
      stack,
      startupsViewed: matchedStartups.slice(0, 3).map(s => s.name),
      gapAnalysis: gapAnalysis.summary,
      hackathonsBookmarked: [],
    }

    await updateSession(userId, session, stack)

    res.json({
      userId,
      isReturning,
      matchedStartups,
      matchedHackathons,
      gapAnalysis,
      sessionCount: (userProfile?.profile?.totalSessions ?? 0) + 1,
    })
  } catch (err) {
    console.error('[/api/analyze]', err)
    res.status(500).json({ error: err.message })
  }
})

// Bookmark a startup or hackathon (persisted in HydraDB)
app.post('/api/user/:userId/bookmark', async (req, res) => {
  try {
    const { type, name } = req.body
    if (!type || !name) return res.status(400).json({ error: 'type and name required' })

    const user = await getUser(req.params.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const field = type === 'startup' ? 'bookmarkedStartups' : 'bookmarkedHackathons'
    if (!user.profile[field].includes(name)) {
      user.profile[field].push(name)
      const { saveUser } = await import('./hydradb.js')
      await saveUser(req.params.userId, user.profile)
    }

    res.json({ success: true, bookmarks: user.profile[field] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`DevRadar backend on http://localhost:${PORT}`)
})
