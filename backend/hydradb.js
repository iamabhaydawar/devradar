// â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const HYDRA_MEMORY_KEY = 'devradar_user_'
const LOCAL_FALLBACK = new Map()

// â”€â”€ SDK init (dynamic import so missing package never crashes the server) â”€â”€â”€â”€â”€â”€

let hydra = null

try {
  const { createClient } = await import('hydradb')
  hydra = createClient({
    apiKey: process.env.HYDRADB_API_KEY,
    projectId: process.env.HYDRADB_PROJECT_ID,
  })
  console.log('[HydraDB] SDK initialized âœ“')
} catch (err) {
  console.warn('[HydraDB] SDK unavailable â€” running on local Map fallback:', err.message)
}

// â”€â”€ Internal helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  console.log(`[HydraDB:fallback] GET ${hydraKey(userId)} â†’`, data ? 'found' : 'miss')
  return data
}

function fallbackSet(userId, data) {
  LOCAL_FALLBACK.set(hydraKey(userId), data)
  console.log(`[HydraDB:fallback] SET ${hydraKey(userId)}`)
  return data
}

// â”€â”€ Exported functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Creates or retrieves a user in HydraDB.
 * userData: { userId, stack, experience, goals, created_at }
 */
export async function initUser(userData) {
  const { userId } = userData
  console.log(`[HydraDB] initUser â†’ ${userId}`)

  try {
    // Return existing user if already stored
    const existing = hydra ? await hydraGet(userId) : fallbackGet(userId)
    if (existing) {
      console.log(`[HydraDB] initUser: returning user found for ${userId}`)
      return existing
    }

    const newUser = {
      userId,
      name:             userData.name             ?? '',
      stack:            userData.stack            ?? [],
      learning_stack:   userData.learning_stack   ?? [],
      experience:       userData.experience       ?? '0-1 years',
      goals:            userData.goals            ?? [],
      target_role:      userData.target_role      ?? '',
      target_companies: userData.target_companies ?? [],
      timeline:         userData.timeline         ?? '',
      learning_style:   userData.learning_style   ?? '',
      created_at:       userData.created_at       ?? new Date().toISOString(),
      startups_viewed:  [],
      hackathons_viewed:[],
      gap_analyses:     [],
      journey:          [],
    }

    // Always write to local fallback Map so reads work even if HydraDB is flaky
    fallbackSet(userId, newUser)
    if (hydra) {
      await hydraSet(userId, newUser)
    }

    console.log(`[HydraDB] initUser: new user created for ${userId}`)
    return newUser
  } catch (err) {
    console.error(`[HydraDB] initUser error for ${userId}:`, err.message)
    const fallback = fallbackGet(userId)
    if (fallback) return fallback

    const newUser = {
      userId,
      stack:            userData.stack            ?? [],
      learning_stack:   userData.learning_stack   ?? [],
      experience:       userData.experience       ?? '0-1 years',
      goals:            userData.goals            ?? [],
      target_role:      userData.target_role      ?? '',
      target_companies: userData.target_companies ?? [],
      timeline:         userData.timeline         ?? '',
      learning_style:   userData.learning_style   ?? '',
      created_at:       userData.created_at       ?? new Date().toISOString(),
      startups_viewed:  [],
      hackathons_viewed:[],
      gap_analyses:     [],
      journey:          [],
    }
    return fallbackSet(userId, newUser)
  }
}

/**
 * Returns the full user profile and journey history.
 */
export async function getUser(userId) {
  console.log(`[HydraDB] getUser â†’ ${userId}`)
  try {
    // Try HydraDB first; if null or missing, fall through to local Map
    const user = hydra ? await hydraGet(userId) : null
    if (user) return user
    return fallbackGet(userId)
  } catch (err) {
    console.error(`[HydraDB] getUser error for ${userId}:`, err.message)
    return fallbackGet(userId)
  }
}

/**
 * Replaces the user's stack array.
 */
export async function updateStack(userId, newStack) {
  console.log(`[HydraDB] updateStack â†’ ${userId}`, newStack)
  try {
    const user = await getUser(userId)
    if (!user) throw new Error(`User ${userId} not found`)

    const updated = { ...user, stack: newStack }

    fallbackSet(userId, updated)
    if (hydra) {
      await hydraSet(userId, updated)
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
  console.log(`[HydraDB] recordStartupView â†’ ${userId} | ${startupName}`)
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

    fallbackSet(userId, updated)
    if (hydra) {
      await hydraSet(userId, updated)
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
  console.log(`[HydraDB] recordHackathonView â†’ ${userId} | ${hackathonName}`)
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

    fallbackSet(userId, updated)
    if (hydra) {
      await hydraSet(userId, updated)
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
  console.log(`[HydraDB] saveGapAnalysis â†’ ${userId}`)
  try {
    const user = await getUser(userId)
    if (!user) throw new Error(`User ${userId} not found`)

    const entry = {
      ...analysisResult,
      saved_at: new Date().toISOString(),
    }

    const gap_analyses = [...(user.gap_analyses ?? []), entry].slice(-5)
    const updated = { ...user, gap_analyses }

    fallbackSet(userId, updated)
    if (hydra) {
      await hydraSet(userId, updated)
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
  console.log(`[HydraDB] getReturnContext â†’ ${userId}`)
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

    // Hackathons they viewed â€” check deadline urgency
    for (const viewed of viewedHackathons) {
      const live = hackathons.find(h => h.id === viewed.hackathonId)
      if (!live) continue
      const daysLeft = Math.ceil((new Date(live.deadline) - now) / (1000 * 60 * 60 * 24))
      if (daysLeft > 0 && daysLeft <= 14) {
        urgentItems.push({ type: 'hackathon', name: live.name, daysLeft })
      }
    }

    // Startups they viewed â€” check still hiring
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
      message += `Your top skill gap was ${gapSkill} â€” let's see how your stack looks now.`
    } else if (stack.length > 0) {
      message += `Your stack has ${stack.length} skills â€” here's what's changed.`
    }

    urgentItems.sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999))

    console.log(`[HydraDB] getReturnContext: ${urgentItems.length} urgent items for ${userId}`)
    return {
      hasHistory: true,
      message: message.trim(),
      urgentItems,
      name: user.name ?? '',
      stack: stack,
      learning_stack: user.learning_stack ?? [],
      lastVisit: user.last_visit ?? user.created_at ?? null,
    }
  } catch (err) {
    console.error(`[HydraDB] getReturnContext error for ${userId}:`, err.message)

    // Fallback path â€” same logic using Map
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

    const fallbackUser = fallbackGet(userId)
    return {
      hasHistory: true,
      message: `Welcome back! Your session was loaded from local memory.`,
      urgentItems,
      name: fallbackUser?.name ?? '',
      stack: fallbackUser?.stack ?? [],
      learning_stack: fallbackUser?.learning_stack ?? [],
      lastVisit: fallbackUser?.last_visit ?? null,
    }
  }
}

// â”€â”€ Wiki page functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Saves (or replaces) a wiki page for a user.
 * pageType: 'company' | 'skill' | 'hackathon' | 'gap' | 'note'
 * pageName: slug (e.g. 'razorpay', 'typescript')
 * content: markdown string with YAML frontmatter
 * Returns the saved page object.
 */
export async function saveWikiPage(userId, pageType, pageName, content, meta = {}) {
  console.log(`[HydraDB] saveWikiPage â†’ ${userId} | ${pageType}/${pageName}`)

  const userWithPages = await _getOrCreateUserWithPages(userId)

  const pages = userWithPages.wiki_pages ?? []
  const key = `${pageType}/${pageName}`
  const now = new Date().toISOString()

  const existing = pages.findIndex(p => p.key === key)
  const page = {
    key,
    pageType,
    pageName,
    content,
    meta,
    created_at: existing >= 0 ? pages[existing].created_at : now,
    updated_at: now,
  }

  const updated_pages = existing >= 0
    ? pages.map((p, i) => (i === existing ? page : p))
    : [...pages, page]

  const updated = { ...userWithPages, wiki_pages: updated_pages }
  await _setUser(userId, updated)
  return page
}

/**
 * Retrieves a single wiki page by type + name.
 * Returns null if not found.
 */
export async function getWikiPage(userId, pageType, pageName) {
  console.log(`[HydraDB] getWikiPage â†’ ${userId} | ${pageType}/${pageName}`)
  const user = await _getOrCreateUserWithPages(userId)
  const key = `${pageType}/${pageName}`
  return user.wiki_pages?.find(p => p.key === key) ?? null
}

/**
 * Returns all wiki pages for a user.
 */
export async function getAllWikiPages(userId) {
  console.log(`[HydraDB] getAllWikiPages â†’ ${userId}`)
  const user = await _getOrCreateUserWithPages(userId)
  return user.wiki_pages ?? []
}

/**
 * Appends an entry to the user's ingest activity log.
 * Keeps the last 50 entries.
 */
export async function appendToIngestLog(userId, entry) {
  console.log(`[HydraDB] appendToIngestLog â†’ ${userId}`)
  const user = await _getOrCreateUserWithPages(userId)
  const ingest_log = [...(user.ingest_log ?? []), {
    ...entry,
    timestamp: entry.timestamp ?? new Date().toISOString(),
  }].slice(-50)

  const updated = { ...user, ingest_log }
  await _setUser(userId, updated)
  return ingest_log
}

/**
 * Builds a lightweight graph dataset from the user's wiki pages.
 * Extracts [[wikilinks]] and creates nodes + edges.
 */
export async function getGraphData(userId) {
  console.log(`[HydraDB] getGraphData â†’ ${userId}`)
  const user = await _getOrCreateUserWithPages(userId)
  const pages = user.wiki_pages ?? []

  const nodes = []
  const edges = []
  const nodeSet = new Set()

  const typeColors = {
    company: { background: '#F97316', border: '#EA6A0A' },
    skill: { background: '#3B82F6', border: '#2563EB' },
    hackathon: { background: '#8B5CF6', border: '#7C3AED' },
    gap: { background: '#EF4444', border: '#DC2626' },
    note: { background: '#94A3B8', border: '#64748B' },
  }

  for (const page of pages) {
    const id = page.key
    if (!nodeSet.has(id)) {
      nodeSet.add(id)
      nodes.push({
        id,
        label: page.pageName.replace(/-/g, ' '),
        group: page.pageType,
        color: typeColors[page.pageType] ?? typeColors.note,
        title: `${page.pageType}: ${page.pageName}`,
      })
    }

    // Extract [[wikilinks]] from content
    const links = [...(page.content ?? '').matchAll(/\[\[([^\]]+)\]\]/g)].map(m => m[1])
    for (const link of links) {
      const parts = link.split('/')
      const linkedType = parts.length > 1 ? parts[0] : page.pageType
      const linkedName = parts.length > 1 ? parts[1] : parts[0]
      const linkedId = `${linkedType}/${linkedName}`

      if (!nodeSet.has(linkedId)) {
        nodeSet.add(linkedId)
        nodes.push({
          id: linkedId,
          label: linkedName.replace(/-/g, ' '),
          group: linkedType,
          color: typeColors[linkedType] ?? typeColors.note,
          title: linkedId,
        })
      }

      edges.push({ from: id, to: linkedId })
    }
  }

  return { nodes, edges, page_count: pages.length }
}

// â”€â”€ Internal wiki helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function _getOrCreateUserWithPages(userId) {
  try {
    const user = hydra ? await hydraGet(userId) : fallbackGet(userId)
    if (user) return user
    // Create a minimal user record so wiki operations can proceed
    const minimal = {
      userId,
      stack: [],
      wiki_pages: [],
      ingest_log: [],
      created_at: new Date().toISOString(),
    }
    await _setUser(userId, minimal)
    return minimal
  } catch (err) {
    console.error(`[HydraDB] _getOrCreateUserWithPages error for ${userId}:`, err.message)
    return fallbackGet(userId) ?? { userId, wiki_pages: [], ingest_log: [] }
  }
}

async function _setUser(userId, data) {
  try {
    fallbackSet(userId, data)
    if (hydra) {
      await hydraSet(userId, data)
    }
  } catch {
    fallbackSet(userId, data)
  }
}

/**
 * Generic journey event logger. Keeps an append-only log on the user object.
 * event: { type, data, timestamp }
 */
export async function updateJourney(userId, event) {
  console.log(`[HydraDB] updateJourney â†’ ${userId} | type: ${event.type}`)
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

    fallbackSet(userId, updated)
    if (hydra) {
      await hydraSet(userId, updated)
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

