import { useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''
const TEAL     = '#00C4B4'

// ── Helpers ───────────────────────────────────────────────────────────────────

function diffStyle(difficulty) {
  const d = (difficulty ?? '').toLowerCase()
  if (d.includes('easy') || d.includes('beginner'))
    return { bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)', color: '#34d399' }
  if (d.includes('hard') || d.includes('advanced'))
    return { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)', color: '#f87171' }
  return { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', color: '#fbbf24' }
}

function MiniChip({ children, style }) {
  return (
    <span style={{
      display: 'inline-block', borderRadius: '5px', padding: '2px 8px',
      fontSize: '10px', fontFamily: 'monospace', fontWeight: 600,
      border: '1px solid', ...style,
    }}>
      {children}
    </span>
  )
}

// ── Confetti burst ────────────────────────────────────────────────────────────
// Pure CSS — no external lib. 14 particles cycle through 4 keyframes.

const CONFETTI_COLORS = [TEAL, '#34d399', '#fbbf24', '#a78bfa', '#60a5fa', '#f472b6', '#f87171']

function Confetti({ active }) {
  if (!active) return null
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      overflow: 'hidden', borderRadius: '10px',
    }}>
      {Array.from({ length: 14 }, (_, i) => (
        <span key={i} style={{
          position: 'absolute',
          width:  i % 3 === 0 ? '7px' : '5px',
          height: i % 3 === 0 ? '7px' : '5px',
          borderRadius: i % 2 === 0 ? '50%' : '2px',
          backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          left: `${8 + (i * 6) % 84}%`,
          top: '50%',
          // stagger each particle's start by 25ms
          animation: `gapc-fly${i % 4} 0.75s ease-out ${i * 25}ms both`,
        }} />
      ))}
    </div>
  )
}

// ── Skill card ────────────────────────────────────────────────────────────────

function SkillCard({ item, index, userId }) {
  const [progress,     setProgress]     = useState(0)
  const [learned,      setLearned]      = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [saving,       setSaving]       = useState(false)

  const diff = diffStyle(item.difficulty)
  const href = item.resource
    ? (item.resource.startsWith('http') ? item.resource : `https://${item.resource}`)
    : null

  async function handleLearn() {
    if (learned || saving) return
    setSaving(true)

    // 1. Animate progress bar immediately
    setProgress(100)

    // 2. Fire confetti burst
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 850)

    // 3. POST to HydraDB (silent fail — demo must never crash)
    if (userId) {
      try {
        await axios.post(`${API_BASE}/api/user/${userId}/stack`, { skill: item.skill })
      } catch { /* silently continue */ }
    }

    // 4. Gray out card after bar finishes filling
    setTimeout(() => setLearned(true), 500)
    setSaving(false)
  }

  return (
    <div style={{
      position: 'relative',
      backgroundColor: learned ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.035)',
      border: `1px solid ${learned ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.09)'}`,
      borderRadius: '10px',
      padding: '14px 16px',
      marginBottom: '10px',
      opacity: learned ? 0.48 : 1,
      transition: 'opacity 0.5s ease, background-color 0.5s ease, border-color 0.5s ease',
    }}>
      <Confetti active={showConfetti} />

      {/* ── Rank circle + skill name + salary impact ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '9px' }}>
        <span style={{
          flexShrink: 0, width: '22px', height: '22px', borderRadius: '50%',
          backgroundColor: learned ? 'rgba(52,211,153,0.15)' : `${TEAL}18`,
          border: `1px solid ${learned ? 'rgba(52,211,153,0.4)' : `${TEAL}38`}`,
          color: learned ? '#34d399' : TEAL,
          fontSize: '11px', fontFamily: 'monospace', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.4s ease',
        }}>
          {learned ? '✓' : index + 1}
        </span>

        <span style={{
          color: learned ? 'rgba(255,255,255,0.3)' : 'white',
          fontWeight: 700, fontSize: '15px', flex: 1,
          transition: 'color 0.5s ease',
        }}>
          {item.skill}
        </span>

        {item.salary_impact && (
          <span style={{
            color: '#34d399', fontSize: '11px',
            fontFamily: 'monospace', fontWeight: 700, flexShrink: 0,
          }}>
            {item.salary_impact}
          </span>
        )}
      </div>

      {/* ── Badges row: why · time · difficulty ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
        {item.why && (
          <MiniChip style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderColor: 'rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.45)',
            maxWidth: '220px', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {item.why}
          </MiniChip>
        )}
        {item.time_weeks && (
          <MiniChip style={{
            backgroundColor: `${TEAL}10`, borderColor: `${TEAL}30`, color: TEAL,
          }}>
            ~{item.time_weeks}w
          </MiniChip>
        )}
        {item.difficulty && (
          <MiniChip style={{
            backgroundColor: diff.bg, borderColor: diff.border, color: diff.color,
          }}>
            {item.difficulty}
          </MiniChip>
        )}
      </div>

      {/* ── Teal progress bar ── */}
      <div style={{
        height: '3px', backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: '2px', marginBottom: '12px', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          backgroundColor: learned ? '#34d399' : TEAL,
          borderRadius: '2px',
          transition: 'width 0.65s cubic-bezier(0.4,0,0.2,1), background-color 0.4s ease',
          boxShadow: progress > 0 ? `0 0 8px ${learned ? '#34d399' : TEAL}80` : 'none',
        }} />
      </div>

      {/* ── Resource link + Mark as Learned button ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px',
      }}>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              color: TEAL, fontSize: '12px',
              fontFamily: 'monospace', textDecoration: 'none', fontWeight: 600,
            }}
          >
            Start learning →
          </a>
        ) : (
          <span />
        )}

        <button
          onClick={handleLearn}
          disabled={learned || saving}
          style={{
            padding: '5px 14px', borderRadius: '7px',
            fontSize: '11px', fontWeight: 600, fontFamily: 'monospace',
            border: `1px solid ${learned
              ? 'rgba(52,211,153,0.35)'
              : 'rgba(255,255,255,0.12)'}`,
            backgroundColor: learned
              ? 'rgba(52,211,153,0.1)'
              : saving
                ? `${TEAL}18`
                : 'rgba(255,255,255,0.04)',
            color: learned ? '#34d399' : saving ? TEAL : 'rgba(255,255,255,0.5)',
            cursor: learned ? 'default' : 'pointer',
            transition: 'all 0.3s ease',
          }}
        >
          {learned ? '✓ Learned!' : saving ? 'Saving…' : 'Mark as Learned'}
        </button>
      </div>
    </div>
  )
}

// ── GapAnalysis ───────────────────────────────────────────────────────────────

export default function GapAnalysis({ gapReport, userStack, userId }) {
  if (!gapReport) return null

  const {
    priority_skills = [],
    quick_wins      = [],
    long_term       = [],
    overall_message,
  } = gapReport

  return (
    <div>

      {/* ── Scoped keyframes ── */}
      <style>{`
        @keyframes gapc-fly0 {
          0%   { transform: translate(0,0) rotate(0deg);        opacity: 1; }
          100% { transform: translate(-38px,-58px) rotate(720deg);  opacity: 0; }
        }
        @keyframes gapc-fly1 {
          0%   { transform: translate(0,0) rotate(0deg);        opacity: 1; }
          100% { transform: translate(38px,-58px) rotate(-720deg);  opacity: 0; }
        }
        @keyframes gapc-fly2 {
          0%   { transform: translate(0,0) rotate(0deg);        opacity: 1; }
          100% { transform: translate(-58px,-18px) rotate(540deg);  opacity: 0; }
        }
        @keyframes gapc-fly3 {
          0%   { transform: translate(0,0) rotate(0deg);        opacity: 1; }
          100% { transform: translate(58px,-18px) rotate(-540deg);  opacity: 0; }
        }
        @keyframes gapc-ping {
          75%, 100% { transform: scale(2.3); opacity: 0; }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: '18px' }}>
        <h3 style={{
          color: 'white', fontWeight: 800, fontSize: '17px',
          margin: '0 0 3px', letterSpacing: '-0.01em',
        }}>
          Your Skill Gap Report
        </h3>
        <p style={{
          color: 'rgba(255,255,255,0.3)', fontSize: '11px',
          fontFamily: 'monospace', margin: 0,
        }}>
          Powered by Claude AI
        </p>
      </div>

      {/* ── Overall message ── */}
      {overall_message && (
        <div style={{
          borderLeft: `3px solid ${TEAL}`,
          backgroundColor: `${TEAL}08`,
          borderRadius: '0 8px 8px 0',
          padding: '12px 16px',
          marginBottom: '20px',
        }}>
          <p style={{
            color: 'rgba(255,255,255,0.82)', fontSize: '13px',
            fontStyle: 'italic', lineHeight: 1.65, margin: 0,
          }}>
            {overall_message}
          </p>
        </div>
      )}

      {/* ── Priority skills ── */}
      {priority_skills.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <p style={{
            color: 'rgba(255,255,255,0.3)', fontSize: '10px',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            fontFamily: 'monospace', margin: '0 0 10px',
          }}>
            Priority Skills to Learn
          </p>
          {priority_skills.map((item, i) => (
            <SkillCard key={item.skill} item={item} index={i} userId={userId} />
          ))}
        </div>
      )}

      {/* ── Quick wins + Long term ── */}
      {(quick_wins.length > 0 || long_term.length > 0) && (
        <div style={{
          display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px',
        }}>
          {quick_wins.length > 0 && (
            <div style={{ flex: '1', minWidth: '140px' }}>
              <p style={{
                color: 'rgba(255,255,255,0.3)', fontSize: '10px',
                textTransform: 'uppercase', letterSpacing: '0.1em',
                fontFamily: 'monospace', margin: '0 0 8px',
              }}>
                Quick Wins
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {quick_wins.map(s => (
                  <span key={s} style={{
                    backgroundColor: `${TEAL}12`, border: `1px solid ${TEAL}35`,
                    color: TEAL, borderRadius: '5px', padding: '3px 9px',
                    fontSize: '11px', fontFamily: 'monospace',
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {long_term.length > 0 && (
            <div style={{ flex: '1', minWidth: '140px' }}>
              <p style={{
                color: 'rgba(255,255,255,0.3)', fontSize: '10px',
                textTransform: 'uppercase', letterSpacing: '0.1em',
                fontFamily: 'monospace', margin: '0 0 8px',
              }}>
                Long Term
              </p>
              <ul style={{
                margin: 0, paddingLeft: '14px',
                display: 'flex', flexDirection: 'column', gap: '5px',
              }}>
                {long_term.map(s => (
                  <li key={s} style={{
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: '12px', fontFamily: 'monospace',
                  }}>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Bottom: HydraDB memory note ── */}
      <div style={{
        backgroundColor: `${TEAL}08`,
        border: `1px solid ${TEAL}20`,
        borderRadius: '10px', padding: '12px 16px',
        display: 'flex', alignItems: 'flex-start', gap: '10px',
      }}>
        {/* Pulsing dot */}
        <span style={{
          position: 'relative', display: 'inline-flex',
          width: '8px', height: '8px', flexShrink: 0, marginTop: '3px',
        }}>
          <span style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            backgroundColor: TEAL, opacity: 0.5,
            animation: 'gapc-ping 1.6s cubic-bezier(0,0,0.2,1) infinite',
          }} />
          <span style={{
            position: 'relative', width: '8px', height: '8px',
            borderRadius: '50%', backgroundColor: TEAL, display: 'inline-block',
          }} />
        </span>
        <p style={{
          color: 'rgba(255,255,255,0.35)', fontSize: '11px',
          fontFamily: 'monospace', margin: 0, lineHeight: 1.55,
        }}>
          This analysis was saved to your HydraDB memory.
          Come back to track progress.
        </p>
      </div>

    </div>
  )
}
