import { useEffect, useState } from 'react'

const TEAL = '#00C4B4'

// ── Pill color by urgency ────────────────────────────────────────────────────

function pillStyle(daysLeft) {
  if (daysLeft < 3) return {
    bg:     'rgba(239,68,68,0.15)',
    border: 'rgba(239,68,68,0.45)',
    color:  '#f87171',
  }
  if (daysLeft < 7) return {
    bg:     'rgba(249,115,22,0.15)',
    border: 'rgba(249,115,22,0.45)',
    color:  '#fb923c',
  }
  return {
    bg:     'rgba(251,191,36,0.12)',
    border: 'rgba(251,191,36,0.35)',
    color:  '#fbbf24',
  }
}

// ── Urgent item pill ──────────────────────────────────────────────────────────

function UrgentPill({ item }) {
  const s = pillStyle(item.daysLeft ?? 999)
  const label = item.type === 'hackathon'
    ? `${item.name} · ${item.daysLeft}d left`
    : `${item.name} still hiring`

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      backgroundColor: s.bg, border: `1px solid ${s.border}`,
      color: s.color, borderRadius: '6px', padding: '4px 10px',
      fontSize: '11px', fontFamily: 'monospace', fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      {item.type === 'hackathon' ? '⏰' : '📌'} {label}
    </span>
  )
}

// ── Brain SVG ────────────────────────────────────────────────────────────────

function BrainIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={TEAL} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46
               2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58
               2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46
               2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58
               2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  )
}

// ── MemoryBadge ───────────────────────────────────────────────────────────────
// Props:
//   message       — string  — Claude/HydraDB recall summary for this user
//   urgentItems   — array   — [{ type:'hackathon'|'startup', name, daysLeft }]
//   lastActiveAt  — string? — ISO date of last session (optional)

export default function MemoryBadge({ message, urgentItems = [], lastActiveAt = null }) {
  const [mounted, setMounted] = useState(false)

  // Trigger fade-in on next tick so the CSS transition fires
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // "Last active X days ago"
  let lastActiveText = 'recently'
  if (lastActiveAt) {
    const days = Math.floor(
      (Date.now() - new Date(lastActiveAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    if      (days === 0) lastActiveText = 'today'
    else if (days === 1) lastActiveText = '1 day ago'
    else                 lastActiveText = `${days} days ago`
  }

  return (
    <>
      {/* ── Scoped keyframes ── */}
      <style>{`
        @keyframes hydra-fadein {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0);     }
        }
        @keyframes hydra-border-glow {
          0%, 100% { box-shadow: inset 0 0 40px rgba(0,196,180,0.03),
                                 -4px 0 18px rgba(0,196,180,0.18); }
          50%       { box-shadow: inset 0 0 40px rgba(0,196,180,0.07),
                                 -4px 0 28px rgba(0,196,180,0.38); }
        }
        @keyframes hydra-ping {
          75%, 100% { transform: scale(2.4); opacity: 0; }
        }
      `}</style>

      <div
        className="hydra-memory-banner"
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #0D2030 0%, #0A1628 100%)',
          borderLeft: `4px solid ${TEAL}`,
          padding: '18px 24px 14px',
          // Fade-in from top
          opacity:   mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'opacity 0.45s ease, transform 0.45s ease',
          // Shimmer glow on left border (via box-shadow)
          animation: 'hydra-border-glow 3s ease-in-out infinite',
        }}
      >
        {/* ── Main content row ── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '20px', flexWrap: 'wrap',
        }}>

          {/* Left: brain + label + message */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px',
                        flex: 1, minWidth: '240px' }}>

            {/* Brain icon box */}
            <div style={{
              flexShrink: 0, width: '42px', height: '42px',
              backgroundColor: `${TEAL}18`, border: `1px solid ${TEAL}30`,
              borderRadius: '11px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BrainIcon />
            </div>

            <div>
              <p style={{
                color: TEAL, fontSize: '10px', fontFamily: 'monospace',
                fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', margin: '0 0 5px',
              }}>
                HydraDB recalls your journey
              </p>
              <p style={{
                color: 'rgba(255,255,255,0.88)', fontSize: '13px',
                fontWeight: 500, lineHeight: 1.6, margin: 0,
              }}>
                {message}
              </p>
            </div>
          </div>

          {/* Right: urgent items */}
          {urgentItems.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column',
                          gap: '8px', alignItems: 'flex-start' }}>
              <p style={{
                color: 'rgba(255,255,255,0.3)', fontSize: '10px',
                fontFamily: 'monospace', fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                margin: 0,
              }}>
                Urgent
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {urgentItems.map((item, i) => (
                  <UrgentPill key={i} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Bottom row ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '9px',
          marginTop: '14px', paddingTop: '12px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>

          {/* Pulsing green dot */}
          <span style={{ position: 'relative', display: 'inline-flex',
                         width: '8px', height: '8px', flexShrink: 0 }}>
            <span style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              backgroundColor: '#4ade80', opacity: 0.55,
              animation: 'hydra-ping 1.6s cubic-bezier(0,0,0.2,1) infinite',
            }} />
            <span style={{
              position: 'relative', width: '8px', height: '8px',
              borderRadius: '50%', backgroundColor: '#4ade80',
              display: 'inline-block',
            }} />
          </span>

          <span style={{
            color: 'rgba(255,255,255,0.25)', fontSize: '11px',
            fontFamily: 'monospace',
          }}>
            Memory powered by HydraDB · Last active {lastActiveText}
          </span>
        </div>
      </div>
    </>
  )
}
