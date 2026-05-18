// ── Constants ─────────────────────────────────────────────────────────────────

const HYDRA_MEMORY_KEY = 'devradar_user_'
const LOCAL_FALLBACK = new Map()

// ── SDK init (dynamic import so missing package never crashes the server) ──────

let hydra = null

try {
  const { createClient } = await import('hydradb')
  hydra = createClient({
    apiKey: process.env.HYDRADB_API_KEY,
    projectId: process.env.HYDRADB_PROJECT_ID,
  })
  console.log('[HydraDB] SDK initialized ✓')
} catch (err) {
  console.warn('[HydraDB] SDK unavailable — running on local Map fallback:', err.message)
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function hydraKey(userId) {
  return `${HYDRA_MEMORY_KEY}${userId}`
}

async function hydraGet(userId) {
  const key = hydraKey(userId)
  console.log(`[HydraDB] GET ${key}`)
  const result = await hydra.memory.get(key)
  return result ?? null
}

async function hydraSet(userId, data) {
  const key = hydraKey(userId)
  console.log(`[HydraDB] SET ${key}`)
  await hydra.memory.set(key, data)
  return data
}

function fallbackGet(userId) {
  const data = LOCAL_FALLBACK.get(hydraKey(userId)) ?? null
  console.log(`[HydraDB:fallback] GET ${hydraKey(userId)} →`, data ? 'found' : 'miss')
  return data
}

function fallbackSet(userId, data) {
  LOCAL_FALLBACK.set(hydraKey(userId), data)
  console.log(`[HydraDB:fallback] SET ${hydraKey(userId)}`)
  return data
}

// ── Exported functions ────────────────────────────────────────────────────────

/**
 * Creates or retrieves a user in HydraDB.
 * userData: { userId, stack, experience, goals, created_at }
 */
export async function initUser(userData) {
  const { userId } = userData
  console.log(`[HydraDB] initUser → ${userId}`)

  try {
    // Return existing user if already stored
    const existing = hydra ? await hydraGet(userId) : fallbackGet(userId)
    if (existing) {
      console.log(`[HydraDB] initUser: returning user found for ${userId}`)
      return existing
    }

    const newUser = {
      userId,
      stack: userData.stack ?? [],
      experience: userData.experience ?? '0-1 years',
      goals: userData.goals ?? [],
      created_at: userData.created_at ?? new Date().toISOString(),
      startups_viewed: [],
      hackathons_viewed: [],
      gap_analyses: [],
      journey: [],
    }

    if (hydra) {
      await hydraSet(userId, newUser)
    } else {
      fallbackSet(userId, newUser)
    }

    console.log(`[HydraDB] initUser: new user created for ${userId}`)
    return newUser
  } catch (err) {
    console.error(`[HydraDB] initUser error for ${userId}:`, err.message)
    const fallback = fallbackGet(userId)
    if (fallback) return fallback

    const newUser = {
      userId,
      stack: userData.stack ?? [],
      experience: userData.experience ?? '0-1 years',
      goals: userData.goals ?? [],
      created_at: userData.created_at ?? new Date().toISOString(),
      startups_viewed: [],
      hackathons_viewed: [],
      gap_analyses: [],
      journey: [],
    }
    return fallbackSet(userId, newUser)
  }
}

/**
 * Returns the full user profile and journey history.
 */
export async function getUser(userId) {
  console.log(`[HydraDB] getUser → ${userId}`)
  try {
    const user = hydra ? await hydraGet(userId) : fallbackGet(userId)
    return user
  } catch (err) {
    console.error(`[HydraDB] getUser error for ${userId}:`, err.message)
    return fallbackGet(userId)
  }
}

/**
 * Replaces the user's stack array.
 */
export async function updateStack(userId, newStack) {
  console.log(`[HydraDB] updateStack → ${userId}`, newStack)
  try {
    const user = await getUser(userId)
    if (!user) throw new Error(`User ${userId} not found`)

    const updated = { ...user, stack: newStack }

    if (hydra) {
      await hydraSet(userId, updated)
    } else {
      fallbackSet(userId, updated)
    }

    return updated
  } catch (err) {
    console.error(`[HydraDB] updateStack error for ${userId}:`, err.message)
    const user = fallbackGet(userId)
    if (!user) return null
    const updated = { ...user, stack: newStack }
    return fallbackSet(userId, updated)
  }
}

/**
 * Appends a startup view event with timestamp.
 */
export async function recordStartupView(userId, startupId, startupName) {
  console.log(`[HydraDB] recordStartupView → ${userId} | ${startupName}`)
  try {
    const user = await getUser(userId)
    if (!user) throw new Error(`User ${userId} not found`)

    const entry = {
      startupId,
      startupName,
      viewed_at: new Date().toISOString(),
    }

    const startups_viewed = [...(user.startups_viewed ?? []), entry]
    const updated = { ...user, startups_viewed }

    if (hydra) {
      await hydraSet(userId, updated)
    } else {
      fallbackSet(userId, updated)
    }

    return updated
  } catch (err) {
    console.error(`[HydraDB] recordStartupView error for ${userId}:`, err.message)
    const user = fallbackGet(userId)
    if (!user) return null
    const entry = { startupId, startupName, viewed_at: new Date().toISOString() }
    const updated = { ...user, startups_viewed: [...(user.startups_viewed ?? []), entry] }
    return fallbackSet(userId, updated)
  }
}

/**
 * Appends a hackathon view event with timestamp.
 */
export async function recordHackathonView(userId, hackathonId, hackathonName) {
  console.log(`[HydraDB] recordHackathonView → ${userId} | ${hackathonName}`)
  try {
    const user = await getUser(userId)
    if (!user) throw new Error(`User ${userId} not found`)

    const entry = {
      hackathonId,
      hackathonName,
      viewed_at: new Date().toISOString(),
    }

    const hackathons_viewed = [...(user.hackathons_viewed ?? []), entry]
    const updated = { ...user, hackathons_viewed }

    if (hydra) {
      await hydraSet(userId, updated)
    } else {
      fallbackSet(userId, updated)
    }

    return updated
  } catch (err) {
    console.error(`[HydraDB] recordHackathonView error for ${userId}:`, err.message)
    const user = fallbackGet(userId)
    if (!user) return null
    const entry = { hackathonId, hackathonName, viewed_at: new Date().toISOString() }
    const updated = { ...user, hackathons_viewed: [...(user.hackathons_viewed ?? []), entry] }
    return fallbackSet(userId, updated)
  }
}

/**
 * Saves a gap analysis result. Keeps only the last 5.
 */
export async function saveGapAnalysis(userId, analysisResult) {
  console.log(`[HydraDB] saveGapAnalysis → ${userId}`)
  try {
    const user = await getUser(userId)
    if (!user) throw new Error(`User ${userId} not found`)

    const entry = {
      ...analysisResult,
      saved_at: new Date().toISOString(),
    }

    const gap_analyses = [...(user.gap_analyses ?? []), entry].slice(-5)
    const updated = { ...user, gap_analyses }

    if (hydra) {
      await hydraSet(userId, updated)
    } else {
      fallbackSet(userId, updated)
    }

    return updated
  } catch (err) {
    console.error(`[HydraDB] saveGapAnalysis error for ${userId}:`, err.message)
    const user = fallbackGet(userId)
    if (!user) return null
    const entry = { ...analysisResult, saved_at: new Date().toISOString() }
    const gap_analyses = [...(user.gap_analyses ?? []), entry].slice(-5)
    const updated = { ...user, gap_analyses }
    return fallbackSet(userId, updated)
  }
}

/**
 * Builds a personalized return context from the user's full HydraDB history.
 * Checks hackathon deadlines and startup hiring status against live data.
 *
 * Returns:
 *   { hasHistory: true, message: string, urgentItems: [{ type, name, daysLeft }] }
 *   { hasHistory: false, message: "", urgentItems: [] }
 */
export async function getReturnContext(userId, startups, hackathons) {
  console.log(`[HydraDB] getReturnContext → ${userId}`)
  const empty = { hasHistory: false, message: '', urgentItems: [] }

  try {
    const user = hydra ? await hydraGet(userId) : fallbackGet(userId)
    if (!user) return empty

    const viewedStartups = user.startups_viewed ?? []
    const viewedHackathons = user.hackathons_viewed ?? []
    const lastAnalysis = user.gap_analyses?.at(-1)
    const stack = user.stack ?? []

    if (viewedStartups.length === 0 && viewedHackathons.length === 0) return empty

    const now = new Date()
    const urgentItems = []

    // Hackathons they viewed — check deadline urgency
    for (const viewed of viewedHackathons) {
      const live = hackathons.find(h => h.id === viewed.hackathonId)
      if (!live) continue
      const daysLeft = Math.ceil((new Date(live.deadline) - now) / (1000 * 60 * 60 * 24))
      if (daysLeft > 0 && daysLeft <= 14) {
        urgentItems.push({ type: 'hackathon', name: live.name, daysLeft })
      }
    }

    // Startups they viewed — check still hiring
    for (const viewed of viewedStartups) {
      const live = startups.find(s => s.id === viewed.startupId)
      if (live?.hiring) {
        urgentItems.push({ type: 'startup', name: live.name, daysLeft: null })
      }
    }

    // Build personalized message
    const recentStartup = viewedStartups.at(-1)?.startupName
    const recentHackathon = viewedHackathons.at(-1)?.hackathonName
    const gapSkill = lastAnalysis?.gaps?.[0]?.skill

    let message = `Welcome back! `

    if (recentStartup && recentHackathon) {
      message += `Last time you explored ${recentStartup} and checked out ${recentHackathon}. `
    } else if (recentStartup) {
      message += `Last time you were looking at ${recentStartup}. `
    } else if (recentHackathon) {
      message += `Last time you checked out ${recentHackathon}. `
    }

    if (gapSkill) {
      message += `Your top skill gap was ${gapSkill} — let's see how your stack looks now.`
    } else if (stack.length > 0) {
      message += `Your stack has ${stack.length} skills — here's what's changed.`
    }

    urgentItems.sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999))

    console.log(`[HydraDB] getReturnContext: ${urgentItems.length} urgent items for ${userId}`)
    return { hasHistory: true, message: message.trim(), urgentItems }
  } catch (err) {
    console.error(`[HydraDB] getReturnContext error for ${userId}:`, err.message)

    // Fallback path — same logic using Map
    const user = fallbackGet(userId)
    if (!user) return empty

    const viewedHackathons = user.hackathons_viewed ?? []
    const urgentItems = []

    for (const viewed of viewedHackathons) {
      const live = hackathons.find(h => h.id === viewed.hackathonId)
      if (!live) continue
      const daysLeft = Math.ceil((new Date(live.deadline) - new Date()) / (1000 * 60 * 60 * 24))
      if (daysLeft > 0 && daysLeft <= 14) {
        urgentItems.push({ type: 'hackathon', name: live.name, daysLeft })
      }
    }

    return {
      hasHistory: true,
      message: `Welcome back! Your session was loaded from local memory.`,
      urgentItems,
    }
  }
}

/**
 * Generic journey event logger. Keeps an append-only log on the user object.
 * event: { type, data, timestamp }
 */
export async function updateJourney(userId, event) {
  console.log(`[HydraDB] updateJourney → ${userId} | type: ${event.type}`)
  try {
    const user = await getUser(userId)
    if (!user) throw new Error(`User ${userId} not found`)

    const journeyEvent = {
      type: event.type,
      data: event.data ?? {},
      timestamp: event.timestamp ?? new Date().toISOString(),
    }

    const journey = [...(user.journey ?? []), journeyEvent]
    const updated = { ...user, journey }

    if (hydra) {
      await hydraSet(userId, updated)
    } else {
      fallbackSet(userId, updated)
    }

    return updated
  } catch (err) {
    console.error(`[HydraDB] updateJourney error for ${userId}:`, err.message)
    const user = fallbackGet(userId)
    if (!user) return null
    const journeyEvent = {
      type: event.type,
      data: event.data ?? {},
      timestamp: event.timestamp ?? new Date().toISOString(),
    }
    const updated = { ...user, journey: [...(user.journey ?? []), journeyEvent] }
    return fallbackSet(userId, updated)
  }
}
