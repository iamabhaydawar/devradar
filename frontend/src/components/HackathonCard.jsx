import { useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''
const TEAL = '#00C4B4'

function daysUntil(dateStr) {
  if (!dateStr) return 999
  return Math.max(0, Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24)))
}

function urgencyStyle(days) {
  if (days <= 7)  return { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' }
  if (days <= 21) return { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.3)' }
  return              { color: '#34d399',  bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.3)' }
}

function formatPrize(inr) {
  if (!inr) return null
  if (inr >= 100000) return `₹${(inr / 100000).toFixed(1)}L`
  return `₹${(inr / 1000).toFixed(0)}K`
}

export default function HackathonCard({ hackathon, userId }) {
  const [bookmarked, setBookmarked] = useState(false)
  const [hovered, setHovered]       = useState(false)

  // Correct field names from hackathons.json
  const days       = daysUntil(hackathon.deadline)
  const urgency    = urgencyStyle(days)
  const matchScore = hackathon.match_score ?? 0

  const handleBookmark = async (e) => {
    e.stopPropagation()
    if (!userId || bookmarked) return
    try {
      await axios.post(`${API_BASE}/api/user/${userId}/bookmark`, { type: 'hackathon', name: hackathon.name })
      setBookmarked(true)
    } catch { /* silently fail */ }
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: hovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: '12px', padding: '14px 16px', marginBottom: '10px',
        transition: 'all 0.15s',
      }}
    >
      {/* ── Top row ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '13px' }}>{hackathon.name}</span>

            {/* Deadline badge */}
            <span style={{
              backgroundColor: urgency.bg, border: `1px solid ${urgency.border}`,
              color: urgency.color, borderRadius: '6px', padding: '2px 7px',
              fontSize: '10px', fontFamily: 'monospace', fontWeight: 600,
            }}>
              {days === 0 ? 'Deadline today' : `${days}d left`}
            </span>

            {/* Beginner friendly */}
            {hackathon.beginner_friendly && (
              <span style={{ color: TEAL, fontSize: '10px', fontFamily: 'monospace',
                             backgroundColor: `${TEAL}10`, border: `1px solid ${TEAL}30`,
                             borderRadius: '4px', padding: '1px 6px' }}>
                Beginner ✓
              </span>
            )}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px',
                      margin: 0, fontFamily: 'monospace' }}>
            {hackathon.organizer}
          </p>
        </div>

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          title="Save to HydraDB"
          style={{
            flexShrink: 0, width: '28px', height: '28px', borderRadius: '7px',
            border: '1px solid rgba(255,255,255,0.08)',
            backgroundColor: bookmarked ? `${TEAL}20` : 'rgba(255,255,255,0.04)',
            color: bookmarked ? TEAL : 'rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '13px',
          }}
        >
          {bookmarked ? '★' : '☆'}
        </button>
      </div>

      {/* ── Meta row ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px',
                    color: 'rgba(255,255,255,0.25)', fontSize: '11px', fontFamily: 'monospace' }}>
        <span>{hackathon.type}</span>
        {hackathon.prize_pool_inr && <><span>·</span><span>{formatPrize(hackathon.prize_pool_inr)}</span></>}
        <span>·</span>
        <span>Team {hackathon.team_size_min}–{hackathon.team_size_max}</span>
        <span>·</span>
        <span>{hackathon.difficulty}</span>
      </div>

      {/* ── Relevant skills ── */}
      {hackathon.skills_relevant?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '10px' }}>
          {hackathon.skills_relevant.slice(0, 5).map(s => (
            <span key={s} style={{
              backgroundColor: `${TEAL}12`, border: `1px solid ${TEAL}35`,
              color: TEAL, borderRadius: '5px', padding: '2px 8px',
              fontSize: '10px', fontFamily: 'monospace',
            }}>
              {s}
            </span>
          ))}
        </div>
      )}

      {/* ── Theme ── */}
      {hackathon.theme && (
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px',
                    marginTop: '8px', lineHeight: 1.5,
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {hackathon.theme}
        </p>
      )}

      {/* ── Footer ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginTop: '12px', paddingTop: '10px',
                    borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', fontFamily: 'monospace' }}>
          {hackathon.event_date
            ? new Date(hackathon.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : '—'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {matchScore > 0 && (
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', fontFamily: 'monospace' }}>
              {matchScore}% match
            </span>
          )}
          {hackathon.registration_url && (
            <a href={hackathon.registration_url} target="_blank" rel="noopener noreferrer"
              style={{ color: TEAL, fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
              Register →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
