import { useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

const scoreColor = (score) => {
  if (score >= 60) return 'tag-green'
  if (score >= 30) return 'tag-amber'
  return 'tag-red'
}

export default function StartupCard({ startup, userId }) {
  const [bookmarked, setBookmarked] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleBookmark = async (e) => {
    e.stopPropagation()
    if (!userId || bookmarked) return
    try {
      await axios.post(`${API_BASE}/api/user/${userId}/bookmark`, {
        type: 'startup',
        name: startup.name,
      })
      setBookmarked(true)
    } catch {
      // silently fail — bookmark is nice-to-have
    }
  }

  return (
    <div
      className="card cursor-pointer hover:border-white/20 transition-all duration-150"
      onClick={() => setExpanded(v => !v)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white">{startup.name}</span>
            <span className={`tag ${scoreColor(startup.matchScore)}`}>
              {startup.matchScore}% match
            </span>
          </div>
          <p className="text-white/40 text-xs mt-0.5 truncate">{startup.tagline}</p>
        </div>

        <button
          onClick={handleBookmark}
          title="Bookmark (saved to HydraDB)"
          className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors
            ${bookmarked
              ? 'bg-brand-700/60 text-brand-300'
              : 'bg-white/5 text-white/30 hover:text-white hover:bg-white/10'
            }`}
        >
          <svg className="w-3.5 h-3.5" fill={bookmarked ? 'currentColor' : 'none'}
            viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      {/* Metadata chips */}
      <div className="flex items-center gap-3 mt-2 text-xs text-white/30">
        <span>{startup.location}</span>
        <span>·</span>
        <span>{startup.domain}</span>
        <span>·</span>
        <span>{startup.funding}</span>
      </div>

      {/* Matched skills */}
      {startup.matchedSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {startup.matchedSkills.slice(0, 6).map(s => (
            <span key={s} className="tag-green tag">{s}</span>
          ))}
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/8 space-y-3 animate-fade-in">
          {startup.missingSkills.length > 0 && (
            <div>
              <p className="text-xs text-white/30 mb-1.5">Missing from your stack</p>
              <div className="flex flex-wrap gap-1.5">
                {startup.missingSkills.slice(0, 6).map(s => (
                  <span key={s} className="tag-red tag">{s}</span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-white/30 mb-1.5">Open roles</p>
            <div className="flex flex-wrap gap-1.5">
              {startup.openRoles.map(r => (
                <span key={r} className="tag">{r}</span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 text-xs text-white/30">
            {startup.perks.map(p => (
              <span key={p} className="px-2 py-0.5 bg-white/5 rounded">{p}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
