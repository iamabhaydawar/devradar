import StartupCard from './StartupCard.jsx'
import HackathonCard from './HackathonCard.jsx'
import GapAnalysis from './GapAnalysis.jsx'
import MemoryBadge from './MemoryBadge.jsx'

const TEAL = '#00C4B4'

// ── Skeleton primitives ───────────────────────────────────────────────────────

function SkeletonBar({ w = '100%', h = '12px', mb = '8px' }) {
  return (
    <div style={{
      width: w, height: h, marginBottom: mb, borderRadius: '6px',
      background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.8s ease-in-out infinite',
    }} />
  )
}

function SkeletonCard() {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px', padding: '16px', marginBottom: '10px' }}>
      <SkeletonBar w="60%" h="14px" />
      <SkeletonBar w="40%" h="10px" mb="12px" />
      <div style={{ display: 'flex', gap: '6px' }}>
        <SkeletonBar w="50px" h="20px" mb="0" />
        <SkeletonBar w="50px" h="20px" mb="0" />
        <SkeletonBar w="50px" h="20px" mb="0" />
      </div>
    </div>
  )
}

// ── Empty states ──────────────────────────────────────────────────────────────

function EmptyState({ icon, message }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px',
                  color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>
      <div style={{ fontSize: '28px', marginBottom: '10px' }}>{icon}</div>
      {message}
    </div>
  )
}

// ── Column wrapper ────────────────────────────────────────────────────────────

function Column({ heading, count, children, flex = '1' }) {
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
      <div style={{ overflowY: 'auto', maxHeight: '70vh',
                    paddingRight: '4px', scrollbarWidth: 'thin' }}>
        {children}
      </div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard({
  startups = [],
  hackathons = [],
  gapReport = null,
  returnContext = null,
  userStack = [],
  userId,
  onReset,
  loading = false,
}) {
  const hasHistory = returnContext?.hasHistory ?? false

  return (
    <div style={{ backgroundColor: '#0A0F1E', minHeight: '100vh', padding: '0 0 80px' }}>

      {/* ── Memory banner ── */}
      {hasHistory && (
        <MemoryBadge
          message={returnContext.message}
          urgentItems={returnContext.urgentItems}
        />
      )}

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>

        {/* ── Header row ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start',
                      justifyContent: 'space-between', gap: '16px', marginBottom: '28px' }}>
          <div>
            <h2 style={{ color: 'white', fontSize: 'clamp(20px,4vw,28px)',
                         fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
              Your DevRadar is ready
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', margin: 0 }}>
              {startups.length} startups · {hackathons.length} hackathons · {gapReport?.priority_skills?.length ?? 0} skill gaps found
            </p>
          </div>

          {/* Stack pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '480px' }}>
            {userStack.map(skill => (
              <span key={skill} style={{
                backgroundColor: `${TEAL}18`, border: `1px solid ${TEAL}40`,
                color: TEAL, borderRadius: '6px', padding: '3px 10px',
                fontSize: '11px', fontFamily: 'monospace', fontWeight: 500,
              }}>
                {skill}
              </span>
            ))}
            {onReset && (
              <button onClick={onReset} style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px', padding: '3px 10px', color: 'rgba(255,255,255,0.4)',
                fontSize: '11px', fontFamily: 'monospace', cursor: 'pointer',
              }}>
                ← New Search
              </button>
            )}
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: '1px', marginBottom: '28px',
                      background: 'linear-gradient(to right, transparent, rgba(0,196,180,0.3), transparent)' }} />

        {/* ── Three-column layout ── */}
        <div style={{
          display: 'flex', gap: '24px',
          flexDirection: 'column',    /* mobile default */
        }}
          className="dashboard-cols"
        >
          {/* Col 1 — Startups (40%) */}
          <Column heading="Startup Matches" count={`${startups.length} found`} flex="0 0 100%">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : startups.length === 0
                ? <EmptyState icon="🏢" message="No startup matches found. Try adding more skills." />
                : startups.slice(0, 10).map(s => (
                    <StartupCard key={s.id} startup={s} userId={userId} />
                  ))
            }
          </Column>

          {/* Col 2 — Skill Gaps (30%) */}
          <Column heading="Skill Gaps" count={gapReport?.priority_skills?.length ? `${gapReport.priority_skills.length} identified` : undefined} flex="0 0 100%">
            {loading
              ? <><SkeletonCard /><SkeletonCard /></>
              : !gapReport
                ? <EmptyState icon="⚡" message="Gap analysis is loading..." />
                : <GapAnalysis gapReport={gapReport} userStack={userStack} />
            }
          </Column>

          {/* Col 3 — Hackathons (30%) */}
          <Column heading="Hackathon Radar" count={`${hackathons.length} matches`} flex="0 0 100%">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              : hackathons.length === 0
                ? <EmptyState icon="⚡" message="No upcoming hackathons matched. Try adding Web3 or AI skills." />
                : hackathons.slice(0, 8).map(h => (
                    <HackathonCard key={h.id} hackathon={h} userId={userId} />
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
        padding: '10px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: '10px', zIndex: 40,
      }}>
        {/* Pulsing dot */}
        <span style={{ position: 'relative', display: 'inline-flex', width: '8px', height: '8px' }}>
          <span style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            backgroundColor: TEAL, opacity: 0.5,
            animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
          }} />
          <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%',
                         width: '8px', height: '8px', backgroundColor: TEAL }} />
        </span>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', fontFamily: 'monospace' }}>
          Powered by HydraDB Memory · Claude AI · Your journey is being saved
        </span>
      </div>

      {/* Desktop 3-col styles */}
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @media (min-width: 1024px) {
          .dashboard-cols {
            flex-direction: row !important;
          }
          .dashboard-cols > *:nth-child(1) { flex: 0 0 40% !important; max-width: 40%; }
          .dashboard-cols > *:nth-child(2) { flex: 0 0 30% !important; max-width: 30%; }
          .dashboard-cols > *:nth-child(3) { flex: 0 0 30% !important; max-width: 30%; }
        }
      `}</style>
    </div>
  )
}
