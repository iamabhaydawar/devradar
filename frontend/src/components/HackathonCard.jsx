import { useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function urgencyClass(days) {
  if (days <= 7) return 'tag-red'
  if (days <= 21) return 'tag-amber'
  return 'tag-green'
}

export default function HackathonCard({ hackathon, userId }) {
  const [bookmarked, setBookmarked] = useState(false)

  const days = daysUntil(hackathon.registrationDeadline)

  const handleBookmark = async (e) => {
    e.stopPropagation()
    if (!userId || bookmarked) return
    try {
      await axios.post(`${API_BASE}/api/user/${userId}/bookmark`, {
        type: 'hackathon',
        name: hackathon.name,
      })
      setBookmarked(true)
    } catch {
      // silently fail
    }
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white text-sm">{hackathon.name}</span>
            <span className={`tag ${urgencyClass(days)}`}>
              {days === 0 ? 'Deadline today' : `${days}d left`}
            </span>
          </div>
          <p className="text-white/40 text-xs mt-0.5">{hackathon.organizer}</p>
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

      {/* Info row */}
      <div className="flex flex-wrap gap-3 mt-2 text-xs text-white/30">
        <span>{hackathon.location}</span>
        <span>·</span>
        <span>{hackathon.prize}</span>
        <span>·</span>
        <span>Team: {hackathon.teamSize}</span>
      </div>

      {/* Matched skills */}
      {hackathon.matchedSkills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {hackathon.matchedSkills.slice(0, 5).map(s => (
            <span key={s} className="tag-green tag">{s}</span>
          ))}
        </div>
      )}

      {/* Description */}
      <p className="text-white/40 text-xs mt-3 line-clamp-2">{hackathon.description}</p>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/8">
        <span className="text-xs text-white/25 font-mono">
          Event: {new Date(hackathon.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <a
          href={hackathon.registrationUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors"
        >
          Register →
        </a>
      </div>
    </div>
  )
}
