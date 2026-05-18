import StartupCard from './StartupCard.jsx'
import HackathonCard from './HackathonCard.jsx'
import GapAnalysis from './GapAnalysis.jsx'
import MemoryBadge from './MemoryBadge.jsx'

export default function Dashboard({
  userId,
  userStack,
  startups,
  hackathons,
  gapReport,
  returnContext,
  experience,
  onReset,
}) {
  const isReturning = returnContext?.hasHistory ?? false

  return (
    <div className="space-y-7">

      {/* ── Top bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {isReturning ? 'Welcome back 👋' : 'Your Career Radar'}
          </h2>
          <p className="text-white/40 text-sm mt-0.5">
            {startups.length} startups matched · {hackathons.length} hackathons found
            {userStack.length > 0 && (
              <span className="ml-2 text-white/25">
                · {userStack.slice(0, 3).join(', ')}{userStack.length > 3 ? ` +${userStack.length - 3}` : ''}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MemoryBadge userId={userId} isReturning={isReturning} />
          <button onClick={onReset} className="btn-ghost text-sm">← New Search</button>
        </div>
      </div>

      {/* ── Return context urgent items ── */}
      {isReturning && returnContext.urgentItems?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {returnContext.urgentItems.map((item, i) => (
            <div key={i}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border
                         border-amber-700/40 bg-amber-900/20 text-amber-300 text-xs font-mono">
              {item.type === 'hackathon'
                ? `⏰ ${item.name} — ${item.daysLeft}d to deadline`
                : `📌 ${item.name} is still hiring`}
            </div>
          ))}
        </div>
      )}

      {/* ── Gap Analysis — hero section ── */}
      <GapAnalysis gapReport={gapReport} userStack={userStack} />

      {/* ── Two-column: Startups + Hackathons ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <section>
          <p className="section-title">Startup Matches</p>
          <div className="space-y-3">
            {startups.slice(0, 8).map(startup => (
              <StartupCard key={startup.id} startup={startup} userId={userId} />
            ))}
          </div>
        </section>

        <section>
          <p className="section-title">Hackathon Radar</p>
          <div className="space-y-3">
            {hackathons.slice(0, 6).map(h => (
              <HackathonCard key={h.id} hackathon={h} userId={userId} />
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
