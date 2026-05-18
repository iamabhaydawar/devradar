import { useState } from 'react'

const TEAL = '#00C4B4'

// Top border color by match score
function topBorderColor(score) {
  if (score >= 70) return TEAL
  if (score >= 50) return '#fbbf24'
  return 'rgba(255,255,255,0.15)'
}

// Match badge styles
function badgeStyle(score) {
  if (score >= 70) return { bg: `${TEAL}20`,              border: `${TEAL}50`,              color: TEAL }
  if (score >= 50) return { bg: 'rgba(251,191,36,0.15)',  border: 'rgba(251,191,36,0.4)',   color: '#fbbf24' }
  return                  { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.3)' }
}

function daysUntil(dateStr) {
  if (!dateStr) return 999
  return Math.max(0, Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24)))
}

function formatPrize(inr) {
  if (!inr) return null
  if (inr >= 100000) return `₹${(inr / 100000).toFixed(1)}L`
  return `₹${(inr / 1000).toFixed(0)}K`
}

export default function HackathonCard({ hackathon, matchScore = 0, userStack = [], animIndex = 0 }) {
  const [hovered, setHovered] = useState(false)

  const days        = daysUntil(hackathon.deadline)
  const isUrgent    = days <= 7
  const topBorder   = topBorderColor(matchScore)
  const badge       = badgeStyle(matchScore)
  const prize       = formatPrize(hackathon.prize_pool_inr)

  // Split skills into user-matching (teal) vs others (gray)
  const allSkills     = hackathon.skills_relevant ?? []
  const stackLower    = userStack.map(s => s.toLowerCase())
  const matchingSkills = allSkills.filter(s => stackLower.includes(s.toLowerCase()))
  const otherSkills    = allSkills.filter(s => !stackLower.includes(s.toLowerCase()))

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: hovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
        border:    `1px solid ${hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
        borderTop: `3px solid ${topBorder}`,
        borderRadius: '12px',
        padding: '14px 16px',
        marginBottom: '10px',
        transition: 'all 0.15s ease',
        overflow: 'hidden',
        // stagger entrance animation
        animation: 'card-fadein 0.3s ease both',
        animationDelay: `${animIndex * 50}ms`,
      }}
    >
      {/* ── Top row: name │ match badge ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', gap: '10px' }}>
        <span style={{
          color: 'white', fontWeight: 700, fontSize: '13px',
          flex: 1, minWidth: 0,
        }}>
          {hackathon.name}
        </span>

        {matchScore > 0 && (
          <span style={{
            flexShrink: 0,
            backgroundColor: badge.bg,
            border: `1px solid ${badge.border}`,
            color: badge.color,
            borderRadius: '6px', padding: '2px 8px',
            fontSize: '11px', fontFamily: 'monospace', fontWeight: 600,
          }}>
            {matchScore}% match
          </span>
        )}
      </div>

      {/* ── Deadline row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
        <span style={{
          color: isUrgent ? '#f87171' : 'rgba(255,255,255,0.3)',
          fontSize: '13px', fontFamily: 'monospace',
        }}>
          {hackathon.deadline
            ? new Date(hackathon.deadline).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })
            : '—'}
        </span>

        {isUrgent && (
          <span style={{
            backgroundColor: 'rgba(248,113,113,0.15)',
            border: '1px solid rgba(248,113,113,0.4)',
            color: '#f87171',
            borderRadius: '4px', padding: '1px 7px',
            fontSize: '9px', fontFamily: 'monospace',
            fontWeight: 700, letterSpacing: '0.06em',
          }}>
            CLOSING SOON
          </span>
        )}
      </div>

      {/* ── Details row: platform · prize · duration · team size ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px',
        color: 'rgba(255,255,255,0.25)', fontSize: '12px', fontFamily: 'monospace',
      }}>
        {hackathon.platform && <span>{hackathon.platform}</span>}
        {prize && <><span>·</span><span>{prize}</span></>}
        {hackathon.duration_hours && <><span>·</span><span>{hackathon.duration_hours}h</span></>}
        {(hackathon.team_size_min || hackathon.team_size_max) && (
          <>
            <span>·</span>
            <span>Team {hackathon.team_size_min}–{hackathon.team_size_max}</span>
          </>
        )}
        {hackathon.difficulty && <><span>·</span><span>{hackathon.difficulty}</span></>}
      </div>

      {/* ── Skills row: teal = user match, gray = others ── */}
      {allSkills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '10px' }}>
          {matchingSkills.map(s => (
            <span key={s} style={{
              backgroundColor: `${TEAL}12`, border: `1px solid ${TEAL}35`,
              color: TEAL, borderRadius: '5px',
              padding: '2px 8px', fontSize: '10px', fontFamily: 'monospace',
            }}>
              {s}
            </span>
          ))}
          {otherSkills.slice(0, 4).map(s => (
            <span key={s} style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.3)', borderRadius: '5px',
              padding: '2px 8px', fontSize: '10px', fontFamily: 'monospace',
            }}>
              {s}
            </span>
          ))}
          {otherSkills.length > 4 && (
            <span style={{
              color: 'rgba(255,255,255,0.2)', fontSize: '10px',
              fontFamily: 'monospace', alignSelf: 'center',
            }}>
              +{otherSkills.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* ── Bottom: beginner badge │ Register link ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: '12px', paddingTop: '10px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        flexWrap: 'wrap', gap: '8px',
      }}>
        <div>
          {hackathon.beginner_friendly && (
            <span style={{
              backgroundColor: `${TEAL}10`, border: `1px solid ${TEAL}30`,
              color: TEAL, borderRadius: '4px',
              padding: '1px 6px', fontSize: '10px', fontFamily: 'monospace',
            }}>
              Beginner ✓
            </span>
          )}
        </div>

        {hackathon.registration_url && (
          <a
            href={hackathon.registration_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              color: TEAL, fontSize: '14px', fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center',
              minHeight: '44px', paddingInline: '4px',
            }}
          >
            Register →
          </a>
        )}
      </div>
    </div>
  )
}
