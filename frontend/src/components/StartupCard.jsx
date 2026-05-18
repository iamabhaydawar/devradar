import { useState, useEffect, useRef } from 'react'

const TEAL = '#00C4B4'

// Left border color by match score
function borderColor(score) {
  if (score >= 80) return TEAL
  if (score >= 60) return '#3b82f6'
  return '#f97316'
}

// Large score text color
function scoreColor(score) {
  if (score >= 80) return TEAL
  if (score >= 60) return '#3b82f6'
  return '#f97316'
}

// ── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0)
  const rafRef = useRef(null)
  useEffect(() => {
    if (target === 0) return
    const start = performance.now()
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setValue(Math.round(eased * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])
  return value
}

export default function StartupCard({ startup, matchData, onView, animIndex = 0 }) {
  const [expanded,      setExpanded]      = useState(false)
  const [hovered,       setHovered]       = useState(false)
  const [watchlisted,   setWatchlisted]   = useState(false)
  const [showQuestions, setShowQuestions] = useState(false)

  const score             = matchData?.match_percentage ?? 0
  const displayScore      = useCountUp(score)
  const matching          = matchData?.matching_skills   ?? []
  const missing           = matchData?.missing_skills    ?? []
  const assessment        = matchData?.assessment        ?? ''
  const recommendedAction = matchData?.recommended_action ?? ''
  const questions         = matchData?.questions          ?? []

  // Skills: show max 5 per group with "+N more" overflow
  const visibleMatching = matching.slice(0, 5)
  const extraMatching   = matching.length - visibleMatching.length
  const visibleMissing  = missing.slice(0, 5)
  const extraMissing    = missing.length - visibleMissing.length

  const leftBorder = borderColor(score)
  const scoreCol   = scoreColor(score)

  function handleCardClick() {
    setExpanded(v => !v)
    onView?.(startup)
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleCardClick}
      style={{
        backgroundColor: hovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
        border:     `1px solid ${hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
        borderLeft: `3px solid ${leftBorder}`,
        borderRadius: '12px',
        padding:    '16px',
        marginBottom: '10px',
        cursor:     'pointer',
        transition: 'all 0.2s ease',
        transform:  hovered ? 'scale(1.01)' : 'scale(1)',
        boxShadow:  hovered
          ? '0 8px 32px rgba(0,0,0,0.45)'
          : '0 2px 8px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        animation: 'card-fadein 0.3s ease both',
        animationDelay: `${animIndex * 50}ms`,
      }}
    >
      {/* ── Top row: name + type badge │ score ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px',
                        flexWrap: 'wrap', marginBottom: '2px' }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '15px' }}>
              {startup.name}
            </span>
            <span style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.45)',
              borderRadius: '5px', padding: '2px 8px',
              fontSize: '10px', fontFamily: 'monospace',
            }}>
              {startup.type}
            </span>
            {startup.hiring && (
              <span style={{
                color: '#34d399', fontSize: '10px', fontFamily: 'monospace',
                backgroundColor: 'rgba(52,211,153,0.08)',
                border: '1px solid rgba(52,211,153,0.2)',
                borderRadius: '4px', padding: '1px 6px',
              }}>
                Hiring
              </span>
            )}
          </div>
        </div>

        {/* Large match % */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ color: scoreCol, fontSize: '24px', fontWeight: 800,
                        fontFamily: 'monospace', lineHeight: 1 }}>
            {displayScore}%
          </div>
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px',
                        fontFamily: 'monospace', marginTop: '2px' }}>
            match
          </div>
        </div>
      </div>

      {/* ── Second row: location · stage · experience ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px',
                    color: 'rgba(255,255,255,0.25)', fontSize: '11px', fontFamily: 'monospace' }}>
        <span>{startup.location}</span>
        <span>·</span>
        <span>{startup.stage}</span>
        <span>·</span>
        <span>{startup.min_experience}+ yrs exp</span>
      </div>

      {/* ── Skills row: green = matching, red = missing ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '10px' }}>
        {visibleMatching.map(s => (
          <span key={s} style={{
            backgroundColor: 'rgba(52,211,153,0.1)',
            border: '1px solid rgba(52,211,153,0.3)',
            color: '#34d399', borderRadius: '5px',
            padding: '2px 8px', fontSize: '10px', fontFamily: 'monospace',
          }}>
            {s}
          </span>
        ))}
        {extraMatching > 0 && (
          <span style={{ color: '#34d399', fontSize: '10px',
                         fontFamily: 'monospace', alignSelf: 'center' }}>
            +{extraMatching} more
          </span>
        )}
        {visibleMissing.map(s => (
          <span key={s} style={{
            backgroundColor: 'rgba(248,113,113,0.1)',
            border: '1px solid rgba(248,113,113,0.3)',
            color: '#f87171', borderRadius: '5px',
            padding: '2px 8px', fontSize: '10px', fontFamily: 'monospace',
          }}>
            {s}
          </span>
        ))}
        {extraMissing > 0 && (
          <span style={{ color: '#f87171', fontSize: '10px',
                         fontFamily: 'monospace', alignSelf: 'center' }}>
            +{extraMissing} more
          </span>
        )}
      </div>

      {/* ── Assessment: italic, clamped to 2 lines ── */}
      {assessment && (
        <p style={{
          color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontStyle: 'italic',
          marginTop: '10px', lineHeight: 1.6,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          "{assessment}"
        </p>
      )}

      {/* ── Salary + interview preview ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginTop: '10px', flexWrap: 'wrap', gap: '6px' }}>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontFamily: 'monospace' }}>
          ₹{startup.salary_range_lpa} LPA
        </span>
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', fontFamily: 'monospace' }}>
          {startup.interview_topics?.slice(0, 2).join(' · ')}
          {startup.interview_topics?.length > 2 && ' …'}
        </span>
      </div>

      {/* ── Footer: View Details teal button ── */}
      <div style={{
        marginTop: '10px', paddingTop: '10px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', justifyContent: 'flex-end',
      }}>
        <span style={{ color: TEAL, fontSize: '12px', fontWeight: 600 }}>
          {expanded ? 'Hide Details ↑' : 'View Details →'}
        </span>
      </div>

      {/* ── Expanded panel ── */}
      {expanded && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            marginTop: '14px', paddingTop: '14px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* All interview topics */}
          {startup.interview_topics?.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{
                color: 'rgba(255,255,255,0.3)', fontSize: '10px',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                margin: '0 0 6px',
              }}>
                Interview Topics
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {startup.interview_topics.map(t => (
                  <span key={t} style={{
                    backgroundColor: `${TEAL}12`, border: `1px solid ${TEAL}30`,
                    color: TEAL, borderRadius: '5px',
                    padding: '2px 8px', fontSize: '10px', fontFamily: 'monospace',
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Claude recommended action */}
          {recommendedAction && (
            <div style={{
              backgroundColor: `${TEAL}0d`, border: `1px solid ${TEAL}25`,
              borderRadius: '8px', padding: '10px 12px', marginBottom: '12px',
            }}>
              <p style={{ color: TEAL, fontSize: '12px', margin: 0 }}>
                → {recommendedAction}
              </p>
            </div>
          )}

          {/* Sample interview questions (toggleable) */}
          {showQuestions && questions.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <p style={{
                color: 'rgba(255,255,255,0.3)', fontSize: '10px',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                margin: '0 0 8px',
              }}>
                Sample Interview Questions
              </p>
              <ol style={{
                margin: 0, paddingLeft: '16px',
                display: 'flex', flexDirection: 'column', gap: '8px',
              }}>
                {questions.slice(0, 3).map((q, i) => (
                  <li key={i} style={{
                    color: 'rgba(255,255,255,0.5)', fontSize: '12px', lineHeight: 1.55,
                  }}>
                    {q}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
            <button
              onClick={() => {
                const next = !watchlisted
                setWatchlisted(next)
                if (next) window.dispatchEvent(new CustomEvent('devradar:memory-saved'))
              }}
              style={{
                padding: '0 16px', minHeight: '44px', borderRadius: '8px',
                fontSize: '13px', fontWeight: 600,
                border: `1px solid ${watchlisted ? TEAL : 'rgba(255,255,255,0.12)'}`,
                backgroundColor: watchlisted ? `${TEAL}20` : 'rgba(255,255,255,0.04)',
                color: watchlisted ? TEAL : 'rgba(255,255,255,0.5)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {watchlisted ? '★ Watchlisted' : '☆ Save to Watchlist'}
            </button>

            <button
              onClick={() => setShowQuestions(v => !v)}
              style={{
                padding: '0 16px', minHeight: '44px', borderRadius: '8px',
                fontSize: '13px', fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.12)',
                backgroundColor: showQuestions
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {showQuestions ? 'Hide Questions' : '💡 Practice Interview'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
