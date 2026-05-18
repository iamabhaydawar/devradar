import { useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''
const TEAL = '#00C4B4'

function scoreStyle(score) {
  if (score >= 60) return { color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)' }
  if (score >= 30) return { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)' }
  return { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' }
}

function ScoreBadge({ score }) {
  const s = scoreStyle(score)
  return (
    <span style={{
      backgroundColor: s.bg, border: `1px solid ${s.border}`,
      color: s.color, borderRadius: '6px', padding: '2px 8px',
      fontSize: '11px', fontFamily: 'monospace', fontWeight: 600,
    }}>
      {score}% match
    </span>
  )
}

function SkillChip({ name, variant = 'match' }) {
  const styles = {
    match:   { bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.3)',  color: '#34d399' },
    missing: { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', color: '#f87171' },
    neutral: { bg: `${TEAL}12`,             border: `${TEAL}35`,             color: TEAL },
  }[variant]
  return (
    <span style={{
      backgroundColor: styles.bg, border: `1px solid ${styles.border}`,
      color: styles.color, borderRadius: '5px', padding: '2px 8px',
      fontSize: '11px', fontFamily: 'monospace',
    }}>
      {name}
    </span>
  )
}

export default function StartupCard({ startup, userId }) {
  const [bookmarked, setBookmarked] = useState(false)
  const [expanded, setExpanded]     = useState(false)
  const [hovered, setHovered]       = useState(false)

  // Field names from server — match_score, claude_analysis, skills_required, etc.
  const score    = startup.match_score ?? startup.matchScore ?? 0
  const analysis = startup.claude_analysis ?? null
  const matched  = analysis?.matching_skills ?? []
  const missing  = analysis?.missing_skills  ?? []

  const handleBookmark = async (e) => {
    e.stopPropagation()
    if (!userId || bookmarked) return
    try {
      await axios.post(`${API_BASE}/api/user/${userId}/bookmark`, { type: 'startup', name: startup.name })
      setBookmarked(true)
    } catch { /* silently fail */ }
  }

  return (
    <div
      onClick={() => setExpanded(v => !v)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: hovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: '12px', padding: '14px 16px', marginBottom: '10px',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      {/* ── Top row ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>{startup.name}</span>
            <ScoreBadge score={score} />
            {startup.hiring && (
              <span style={{ color: '#34d399', fontSize: '10px', fontFamily: 'monospace',
                             backgroundColor: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
                             borderRadius: '4px', padding: '1px 6px' }}>
                Hiring
              </span>
            )}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {startup.description}
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
      <div style={{ display: 'flex', gap: '10px', marginTop: '8px',
                    color: 'rgba(255,255,255,0.25)', fontSize: '11px', fontFamily: 'monospace' }}>
        <span>{startup.location}</span>
        <span>·</span>
        <span>{startup.type}</span>
        <span>·</span>
        <span>{startup.stage}</span>
        <span>·</span>
        <span>{startup.salary_range_lpa} LPA</span>
      </div>

      {/* ── Matched skills ── */}
      {matched.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '10px' }}>
          {matched.slice(0, 6).map(s => <SkillChip key={s} name={s} variant="match" />)}
        </div>
      )}

      {/* ── Expanded ── */}
      {expanded && (
        <div style={{ marginTop: '14px', paddingTop: '14px',
                      borderTop: '1px solid rgba(255,255,255,0.06)' }}>

          {/* Claude assessment */}
          {analysis?.assessment && (
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px',
                        lineHeight: 1.6, marginBottom: '12px' }}>
              {analysis.assessment}
            </p>
          )}

          {/* Missing skills */}
          {missing.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px',
                          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                Missing from your stack
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {missing.slice(0, 6).map(s => <SkillChip key={s} name={s} variant="missing" />)}
              </div>
            </div>
          )}

          {/* Recommended action */}
          {analysis?.recommended_action && (
            <div style={{ backgroundColor: `${TEAL}0d`, border: `1px solid ${TEAL}25`,
                          borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
              <p style={{ color: TEAL, fontSize: '12px', margin: 0 }}>
                → {analysis.recommended_action}
              </p>
            </div>
          )}

          {/* Open roles */}
          {startup.roles_available?.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px',
                          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                Open roles
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {startup.roles_available.map(r => <SkillChip key={r} name={r} variant="neutral" />)}
              </div>
            </div>
          )}

          {/* Interview info + Apply */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginTop: '12px', paddingTop: '10px',
                        borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', fontFamily: 'monospace' }}>
              {startup.interview_rounds} rounds · {startup.interview_topics?.slice(0, 2).join(', ')}
            </span>
            {startup.apply_url && (
              <a href={startup.apply_url} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{ color: TEAL, fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                Apply →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
