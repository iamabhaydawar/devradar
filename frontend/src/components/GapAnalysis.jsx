export default function GapAnalysis({ gapReport, userStack }) {
  if (!gapReport) return null

  const { priority_skills = [], quick_wins = [], long_term = [], overall_message } = gapReport

  return (
    <div className="rounded-xl border border-teal-700/30 p-5
                    bg-gradient-to-br from-[#0d1a2a] to-[#0a1520]">

      {/* ── Header ── */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-md bg-teal-600/30 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-teal-400" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-white">Claude AI · Skill Gap Report</span>
        <span className="ml-auto text-xs text-white/25 font-mono hidden sm:block">
          via HydraDB context
        </span>
      </div>

      {/* ── Overall message ── */}
      {overall_message && (
        <div className="mb-5 px-4 py-3 rounded-lg bg-teal-900/30 border border-teal-700/30">
          <p className="text-teal-200 text-sm leading-relaxed">{overall_message}</p>
        </div>
      )}

      {/* ── Priority skills table ── */}
      {priority_skills.length > 0 && (
        <div className="mb-5">
          <p className="section-title">Priority Skills to Learn</p>
          <div className="space-y-2.5">
            {priority_skills.map((item, i) => (
              <div key={item.skill}
                className="flex items-start gap-3 rounded-lg border border-white/6
                           bg-white/3 px-3 py-3">
                {/* Rank */}
                <span className="shrink-0 w-5 h-5 rounded-full bg-teal-900/60 border border-teal-700/40
                                 text-teal-400 text-xs font-mono flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white text-sm font-semibold">{item.skill}</span>
                    {item.salary_impact && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-900/40
                                       border border-emerald-700/40 text-emerald-400 font-mono">
                        {item.salary_impact}
                      </span>
                    )}
                    {item.time_weeks && (
                      <span className="text-xs text-white/30 font-mono">
                        ~{item.time_weeks}w
                      </span>
                    )}
                  </div>
                  {item.why && (
                    <p className="text-white/45 text-xs mt-1 leading-relaxed">{item.why}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {item.difficulty && (
                      <span className="text-white/30 text-xs">{item.difficulty}</span>
                    )}
                    {item.resource && (
                      <a href={`https://${item.resource.replace(/^https?:\/\//, '')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs text-teal-400 hover:text-teal-300 transition-colors font-mono">
                        {item.resource.replace(/^https?:\/\//, '')} →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick wins + Long term ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quick_wins.length > 0 && (
          <div>
            <p className="section-title">Quick Wins <span className="normal-case text-white/20">&lt; 1 week</span></p>
            <div className="flex flex-wrap gap-1.5">
              {quick_wins.map(s => (
                <span key={s}
                  className="text-xs px-2.5 py-1 rounded-md font-mono
                             bg-emerald-900/30 border border-emerald-700/40 text-emerald-400">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
        {long_term.length > 0 && (
          <div>
            <p className="section-title">Long Term <span className="normal-case text-white/20">&gt; 1 month</span></p>
            <div className="flex flex-wrap gap-1.5">
              {long_term.map(s => (
                <span key={s}
                  className="text-xs px-2.5 py-1 rounded-md font-mono
                             bg-amber-900/30 border border-amber-700/40 text-amber-400">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
