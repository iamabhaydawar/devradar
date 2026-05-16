import fetch from 'node-fetch'
import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LOCAL_STORE_PATH = join(__dirname, 'hydra_local_store.json')

const BASE_URL = process.env.HYDRADB_BASE_URL || 'https://api.hydradb.io'
const API_KEY = process.env.HYDRADB_API_KEY
const COLLECTION = 'devradar_users'

const useLocalFallback = !API_KEY || API_KEY === 'your_hydradb_api_key_here'

// ── Local fallback (dev without HydraDB key) ─────────────────────────────────

async function localGet(userId) {
  if (!existsSync(LOCAL_STORE_PATH)) return null
  const store = JSON.parse(await readFile(LOCAL_STORE_PATH, 'utf8'))
  return store[userId] || null
}

async function localSet(userId, profile) {
  let store = {}
  if (existsSync(LOCAL_STORE_PATH)) {
    store = JSON.parse(await readFile(LOCAL_STORE_PATH, 'utf8'))
  }
  store[userId] = { profile }
  await writeFile(LOCAL_STORE_PATH, JSON.stringify(store, null, 2))
}

// ── HydraDB REST client ───────────────────────────────────────────────────────

async function hydraRequest(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HydraDB ${method} ${path} → ${res.status}: ${text}`)
  }
  return res.json()
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getUser(userId) {
  if (useLocalFallback) {
    return localGet(userId)
  }
  try {
    const result = await hydraRequest('GET', `/v1/collections/${COLLECTION}/documents/${userId}`)
    return result.data ?? null
  } catch {
    return null
  }
}

export async function saveUser(userId, profile) {
  if (useLocalFallback) {
    return localSet(userId, profile)
  }
  return hydraRequest('PUT', `/v1/collections/${COLLECTION}/documents/${userId}`, { profile })
}

export async function updateSession(userId, session, stack) {
  const existing = await getUser(userId)

  const profile = existing?.profile ?? {
    stack: [],
    sessions: [],
    totalSessions: 0,
    bookmarkedStartups: [],
    bookmarkedHackathons: [],
  }

  profile.stack = stack
  profile.sessions = [...(profile.sessions ?? []), session].slice(-20)
  profile.totalSessions = (profile.totalSessions ?? 0) + 1

  await saveUser(userId, profile)
  return profile
}
