import fetch from 'node-fetch'
import TurndownService from 'turndown'

const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' })

// ── Input type detection ──────────────────────────────────────────────────────

/**
 * Detects whether input is a URL, base64 screenshot, or plain text.
 * Returns: 'url' | 'screenshot' | 'text'
 */
export function detectInputType(input) {
  const trimmed = (input ?? '').trim()
  if (trimmed.startsWith('data:image/') || /^https?:\/\/.+\.(png|jpg|jpeg|gif|webp)/i.test(trimmed)) {
    return 'screenshot'
  }
  if (/^https?:\/\//i.test(trimmed)) return 'url'
  return 'text'
}

// ── URL fetcher ───────────────────────────────────────────────────────────────

/**
 * Fetches a URL and converts HTML to clean markdown.
 * Strips scripts, styles, nav, footer before conversion.
 * Returns the markdown string (capped at 8000 chars).
 */
export async function fetchURL(url) {
  const resp = await fetch(url, {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; DevRadar/1.0; +https://devradar.app)',
      Accept: 'text/html,application/xhtml+xml,*/*',
    },
  })

  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`)

  const html = await resp.text()

  // Strip noisy elements before conversion
  const clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')

  const markdown = td.turndown(clean)

  // Collapse excessive blank lines
  const compressed = markdown.replace(/\n{3,}/g, '\n\n').trim()

  return compressed.slice(0, 8000)
}

// ── Text extractor ────────────────────────────────────────────────────────────

/**
 * Returns raw text input cleaned of excess whitespace.
 * For screenshots (base64), returns placeholder text.
 */
export function extractText(input, type) {
  if (type === 'screenshot') {
    return '[Image content — entities will be extracted by vision model]'
  }
  return input.trim().replace(/\s{3,}/g, '\n\n').slice(0, 8000)
}
