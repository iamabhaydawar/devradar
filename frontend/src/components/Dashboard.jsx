import { useEffect, useState } from 'react'
import StartupCard   from './StartupCard.jsx'
import HackathonCard from './HackathonCard.jsx'
import GapAnalysis   from './GapAnalysis.jsx'
import MemoryBadge   from './MemoryBadge.jsx'

const TEAL = '#00C4B4'

// ── Skeleton primitives ───────────────────────────────────────────────────────

function SkeletonBar({ w = '100%', h = '12px', mb = '8px' }) {
  return (
    <div style={{
      width: w, height: h, marginBottom: mb, borderRadius: '6px',
      background: 'rgba(255,255,255,0.06)',
      animation: 'sk-pulse 1.8s ease-in-out infinite',
    }} />
  )
}

function SkeletonCard() {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px', padding: '16px', marginBottom: '10px',
    }}>
      <SkeletonBar w="55%" h="15px" mb="10px" />
      <SkeletonBar w="38%" h="10px" mb="14px" />
      <div style={{ display: 'flex', gap: '6px' }}>
        <SkeletonBar w="52px" h="22px" mb="0" />
        <SkeletonBar w="52px" h="22px" mb="0" />
        <SkeletonBar w="52px" h="22px" mb="0" />
      </div>
    </div>
  )
}

function LoadingMessage({ step }) {
  const MESSAGES = [
    'HydraDB is recalling your journey...',
    'Matching you with Indian startups...',
    'Finding your next hackathon...',
    'Asking Claude about your stack...',
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px',
                  color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontFamily: 'monospace',
                  marginBottom: '14px' }}>
      <div style={{
        width: '14px', height: '14px', borderRadius: '50%',
        border: '2px solid transparent', borderTopColor: TEAL,
        animation: 'sk-spin 0.7s linear infinite', flexShrink: 0,
      }} />
      {MESSAGES[step] ?? 'Loading...'}
    </div>
  )
}

// ── Column wrapper ────────────────────────────────────────────────────────────

function Column({ heading, count, loading, loadingStep, children, flex }) {
  return (
    <div style={{ flex, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px' }}>
        <h3 style={{ color: 'white', fontWeight: 700, fontSize: '15px', margin: 0 }}>{heading}</h3>
        {count !== undefined && (
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontFamily: 'monospace' }}>
            {count}
          </span>
        )}
      </div>
      {loading && <LoadingMessage step={loadingStep} />}
      <div style={{ overflowY: 'auto', maxHeight: '72vh',
                    paddingRight: '4px', scrollbarWidth: 'thin' }}>
        {children}
      </div>
    </div>
  )
}

// ── "Saved to memory" toast ───────────────────────────────────────────────────

function MemoryToast({ visible }) {
  return (
    <div style={{
      position: 'fixed',
      right: visible ? '20px' : '-320px',
      bottom: '88px',
      backgroundColor: '#0D2030',
      border: `1px solid ${TEAL}40`,
      borderLeft: `3px solid ${TEAL}`,
      borderRadius: '10px',
      padding: '10px 16px',
      color: TEAL,
      fontSize: '13px', fontFamily: 'monospace', fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: '8px',
      transition: 'right 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      zIndex: 60,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      whiteSpace: 'nowrap',
    }}>
      <span>✓</span> Saved to HydraDB memory
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard({
  startups       = [],
  hackathons     = [],
  gapReport      = null,
  returnContext  = null,
  userStack      = [],
  userId,
  onReset,
  loading        = false,
  loadingStep    = 3,
}) {
  const [toastVisible, setToastVisible] = useState(false)

  // Listen for bookmark/watchlist/learned events from child components
  useEffect(() => {
    let timer
    const handler = () => {
      setToastVisible(true)
      clearTimeout(timer)
      timer = setTimeout(() => setToastVisible(false), 3000)
    }
    window.addEventListener('devradar:memory-saved', handler)
    return () => {
      window.removeEventListener('devradar:memory-saved', handler)
      clearTimeout(timer)
    }
  }, [])

  const hasHistory      = returnContext?.hasHistory ?? false
  const hackLoading     = loading && hackathons.length === 0
  const gapLoading      = loading && !gapReport

  return (
    <div style={{ backgroundColor: '#0A0F1E', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes sk-pulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.8; }
        }
        @keyframes sk-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes card-fadein {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── HydraDB memory banner ── */}
      {hasHistory && (
        <MemoryBadge
          message={returnContext.message}
          urgentItems={returnContext.urgentItems ?? []}
          lastActiveAt={returnContext.lastActiveAt}
        />
      )}

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>

        {/* ── Header row ── */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start',
          justifyContent: 'space-between', gap: '16px', marginBottom: '28px',
        }}>
          <div>
            <h2 style={{
              color: 'white', fontSize: 'clamp(20px,4vw,28px)',
              fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 6px',
            }}>
              Your DevRadar is ready
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', margin: 0 }}>
              {startups.length} startups · {hackathons.length} hackathons ·{' '}
              {gapReport?.priority_skills?.length ?? 0} skill gaps found
            </p>
          </div>

          {/* Stack pills + reset */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '480px', alignItems: 'center' }}>
            {userStack.map(skill => (
              <span key={skill} style={{
                backgroundColor: `${TEAL}18`, border: `1px solid ${TEAL}40`,
                color: TEAL, borderRadius: '6px', padding: '4px 10px',
                fontSize: '12px', fontFamily: 'monospace', fontWeight: 500,
              }}>
                {skill}
              </span>
            ))}
            {onReset && (
              <button
                onClick={onReset}
                style={{
                  minHeight: '44px', padding: '0 14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', color: 'rgba(255,255,255,0.5)',
                  fontSize: '13px', fontFamily: 'monospace', cursor: 'pointer',
                }}
              >
                ← New Search
              </button>
            )}
          </div>
        </div>

        {/* ── Gradient divider ── */}
        <div style={{
          height: '1px', marginBottom: '28px',
          background: 'linear-gradient(to right, transparent, rgba(0,196,180,0.3), transparent)',
        }} />

        {/* ── Three-column layout ── */}
        <div style={{ display: 'flex', gap: '24px', flexDirection: 'column' }}
             className="dash-cols">

          {/* Col 1 — Startups (40%) */}
          <Column
            heading="Startup Matches"
            count={`${startups.length} found`}
            flex="0 0 100%"
          >
            {startups.length === 0 && !loading
              ? <div style={{ textAlign: 'center', padding: '40px 20px',
                              color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
                  <div style={{ fontSize: '28px', marginBottom: '10px' }}>🏢</div>
                  No startup matches found. Try adding more skills.
                </div>
              : startups.slice(0, 10).map((s, i) => (
                  <StartupCard
                    key={s.id ?? s.name}
                    startup={s}
                    matchData={s.claude_analysis}
                    onView={() => {}}
                    animIndex={i}
                    userId={userId}
                  />
                ))
            }
          </Column>

          {/* Col 2 — Skill Gaps (30%) */}
          <Column
            heading="Skill Gaps"
            count={gapReport?.priority_skills?.length
              ? `${gapReport.priority_skills.length} identified`
              : undefined}
            loading={gapLoading}
            loadingStep={loadingStep}
            flex="0 0 100%"
          >
            {gapLoading
              ? <><SkeletonCard /><SkeletonCard /></>
              : !gapReport
                ? <div style={{ textAlign: 'center', padding: '40px 20px',
                                color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
                    <div style={{ fontSize: '28px', marginBottom: '10px' }}>⚡</div>
                    Gap analysis loading...
                  </div>
                : <GapAnalysis gapReport={gapReport} userStack={userStack} userId={userId} />
            }
          </Column>

          {/* Col 3 — Hackathons (30%) */}
          <Column
            heading="Hackathon Radar"
            count={`${hackathons.length} matches`}
            loading={hackLoading}
            loadingStep={loadingStep}
            flex="0 0 100%"
          >
            {hackLoading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              : hackathons.length === 0
                ? <div style={{ textAlign: 'center', padding: '40px 20px',
                                color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
                    <div style={{ fontSize: '28px', marginBottom: '10px' }}>⚡</div>
                    No hackathons matched. Try adding Web3 or AI skills.
                  </div>
                : hackathons.slice(0, 8).map((h, i) => (
                    <HackathonCard
                      key={h.id ?? h.name}
                      hackathon={h}
                      matchScore={h.match_score ?? 0}
                      userStack={userStack}
                      animIndex={i}
                    />
                  ))
            }
          </Column>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(10,15,30,0.95)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '10px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '10px', zIndex: 40,
      }}>
        <span style={{ position: 'relative', display: 'inline-flex', width: '8px', height: '8px' }}>
          <span style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            backgroundColor: TEAL, opacity: 0.5,
            animation: 'card-fadein 0s, sk-ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
          }} />
          <span style={{
            position: 'relative', display: 'inline-flex', borderRadius: '50%',
            width: '8px', height: '8px', backgroundColor: TEAL,
          }} />
        </span>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontFamily: 'monospace' }}>
          Built for WikiThon 2026 · HydraDB + Claude AI ·{' '}
          <a
            href="https://github.com/iamabhaydawar/devradar"
            target="_blank" rel="noopener noreferrer"
            style={{ color: TEAL, textDecoration: 'none' }}
          >
            github.com/iamabhaydawar/devradar
          </a>
        </span>
      </div>

      {/* ── Memory saved toast ── */}
      <MemoryToast visible={toastVisible} />

      {/* Desktop 3-col layout */}
      <style>{`
        @keyframes sk-ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @media (min-width: 1024px) {
          .dash-cols { flex-direction: row !important; }
          .dash-cols > *:nth-child(1) { flex: 0 0 40% !important; max-width: 40%; }
          .dash-cols > *:nth-child(2) { flex: 0 0 30% !important; max-width: 30%; }
          .dash-cols > *:nth-child(3) { flex: 0 0 30% !important; max-width: 30%; }
        }
      `}</style>
    </div>
  )
}
