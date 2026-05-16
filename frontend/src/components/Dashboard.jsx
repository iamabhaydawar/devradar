import StartupCard from './StartupCard.jsx'
import HackathonCard from './HackathonCard.jsx'
import GapAnalysis from './GapAnalysis.jsx'
import MemoryBadge from './MemoryBadge.jsx'

export default function Dashboard({ results, onReset }) {
  const {
    userId,
    isReturning,
    matchedStartups,
    matchedHackathons,
    gapAnalysis,
    sessionCount,
  } = results

  return (
    <div className="space-y-8">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {isReturning ? 'Welcome back' : 'Your Career Radar'}
          </h2>
          <p className="text-white/40 text-sm mt-0.5">
            {matchedStartups.length} startups matched · {matchedHackathons.length} hackathons found
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MemoryBadge userId={userId} sessionCount={sessionCount} isReturning={isReturning} />
          <button onClick={onReset} className="btn-ghost text-sm">
            ← New Search
          </button>
        </div>
      </div>

      {/* Gap Analysis (full width — Claude insight is the hero) */}
      <GapAnalysis gapAnalysis={gapAnalysis} stack={results.matchedStartups?.[0]?.matchedSkills ?? []} />

      {/* Two-column: Startups + Hackathons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Startup matches */}
        <section>
          <p className="section-title">Startup Matches</p>
          <div className="space-y-3">
            {matchedStartups.slice(0, 8).map(startup => (
              <StartupCard key={startup.id} startup={startup} userId={userId} />
            ))}
          </div>
        </section>

        {/* Hackathons */}
        <section>
          <p className="section-title">Hackathon Radar</p>
          <div className="space-y-3">
            {matchedHackathons.slice(0, 6).map(h => (
              <HackathonCard key={h.id} hackathon={h} userId={userId} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
