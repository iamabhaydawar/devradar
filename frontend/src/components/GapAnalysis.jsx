const priorityOrder = { high: 0, medium: 1, low: 2 }
const priorityTag = { high: 'tag-red', medium: 'tag-amber', low: 'tag-green' }

export default function GapAnalysis({ gapAnalysis }) {
  if (!gapAnalysis) return null

  const sortedGaps = [...(gapAnalysis.gaps ?? [])].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  )

  return (
    <div className="card border-brand-700/30 bg-gradient-to-br from-surface-800 to-brand-900/20">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-md bg-brand-600/30 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-brand-400" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-white">Claude AI · Skill Gap Analysis</span>
        <span className="ml-auto text-xs text-white/25 font-mono">via HydraDB context</span>
      </div>

      {/* Summary */}
      <p className="text-white/80 text-sm leading-relaxed mb-4">{gapAnalysis.summary}</p>

      {/* Personal note (context-aware for returning users) */}
      {gapAnalysis.personalNote && (
        <div className="bg-brand-900/40 border border-brand-700/30 rounded-lg px-4 py-3 mb-4">
          <p className="text-brand-300 text-sm italic">"{gapAnalysis.personalNote}"</p>
        </div>
      )}

      {/* Top recommendation */}
      {gapAnalysis.topRecommendation && (
        <div className="flex items-start gap-3 mb-5 bg-white/4 rounded-lg px-4 py-3">
          <span className="text-brand-400 mt-0.5 shrink-0">→</span>
          <p className="text-white text-sm font-medium">{gapAnalysis.topRecommendation}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Skill gaps */}
        {sortedGaps.length > 0 && (
          <div>
            <p className="section-title">Skill Gaps</p>
            <div className="space-y-2.5">
              {sortedGaps.map(gap => (
                <div key={gap.skill} className="flex items-start gap-3 bg-white/3 rounded-lg px-3 py-2.5">
                  <span className={`tag ${priorityTag[gap.priority]} mt-0.5 shrink-0`}>
                    {gap.priority}
                  </span>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium">{gap.skill}</p>
                    <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{gap.reason}</p>
                    {gap.learnIn && (
                      <p className="text-white/25 text-xs mt-1 font-mono">~{gap.learnIn} weeks</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {gapAnalysis.strengths?.length > 0 && (
          <div>
            <p className="section-title">Your Strengths</p>
            <div className="flex flex-wrap gap-2">
              {gapAnalysis.strengths.map(s => (
                <span key={s} className="tag-green tag">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
