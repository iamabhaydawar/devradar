import { useState, useRef, useEffect } from 'react'

const POPULAR_SKILLS = [
  'React', 'Node.js', 'Python', 'TypeScript', 'Go', 'Java',
  'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'AWS', 'Kubernetes',
  'React Native', 'Kotlin', 'Machine Learning', 'TensorFlow', 'GraphQL',
  'Spring Boot', 'Django', 'FastAPI', 'Next.js', 'Tailwind CSS',
]

const EXPERIENCE_OPTIONS = [
  { value: 'beginner',     label: '0–1 yr',      sub: 'Student / Fresher' },
  { value: 'intermediate', label: '1–3 yrs',     sub: 'Junior Developer' },
  { value: 'experienced',  label: '3+ yrs',      sub: 'Mid / Senior' },
]

export default function StackInput({ onSubmit, returnContext, error }) {
  const [input, setInput]           = useState('')
  const [tags, setTags]             = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [experience, setExperience] = useState('beginner')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!input.trim()) { setSuggestions([]); return }
    const q = input.toLowerCase()
    setSuggestions(
      POPULAR_SKILLS.filter(s => s.toLowerCase().includes(q) && !tags.includes(s)).slice(0, 6)
    )
  }, [input, tags])

  const addTag = (skill) => {
    const cleaned = skill.trim()
    if (!cleaned || tags.includes(cleaned)) return
    setTags(prev => [...prev, cleaned])
    setInput('')
    setSuggestions([])
    inputRef.current?.focus()
  }

  const removeTag = (skill) => setTags(prev => prev.filter(t => t !== skill))

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      addTag(input)
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      setTags(prev => prev.slice(0, -1))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim()) addTag(input)
    const finalTags = input.trim() ? [...tags, input.trim()] : tags
    if (finalTags.length === 0) return
    onSubmit({ stack: finalTags, experience })
  }

  return (
    <div className="max-w-2xl mx-auto pt-14 pb-8">

      {/* ── Hero ── */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-teal-900/40 border border-teal-700/40
                        rounded-full px-3 py-1 text-xs text-teal-400 font-mono mb-6">
          WikiThon 2025 · HydraDB
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3 leading-tight">
          Your career.<br />
          <span className="text-teal-400">One screen.</span>
        </h1>
        <p className="text-white/40 text-lg">Always remembered.</p>
      </div>

      {/* ── Return context banner ── */}
      {returnContext?.hasHistory && (
        <div className="mb-5 rounded-xl border border-teal-700/40 bg-teal-900/20 px-4 py-3.5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-2 h-2 rounded-full bg-teal-400 shrink-0 animate-pulse" />
            <div>
              <p className="text-teal-300 text-sm font-medium">{returnContext.message}</p>
              {returnContext.urgentItems?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {returnContext.urgentItems.slice(0, 3).map((item, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded bg-amber-900/40
                                             border border-amber-700/40 text-amber-300 font-mono">
                      {item.type === 'hackathon'
                        ? `⏰ ${item.name} — ${item.daysLeft}d left`
                        : `📌 ${item.name} still hiring`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} className="card space-y-5">

        {/* Stack input */}
        <div>
          <label className="section-title block">Your Tech Stack</label>
          <div
            className="min-h-[52px] flex flex-wrap gap-2 p-3 rounded-lg border border-white/10
                       bg-white/4 focus-within:border-teal-500/60 transition-colors cursor-text"
            onClick={() => inputRef.current?.focus()}
          >
            {tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md
                                         text-xs font-mono font-medium bg-teal-900/50 text-teal-300
                                         border border-teal-700/40">
                {tag}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
                  className="text-teal-400/60 hover:text-white transition-colors leading-none"
                >×</button>
              </span>
            ))}
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={tags.length === 0 ? 'Type a skill and press Enter...' : 'Add more...'}
              className="flex-1 min-w-28 bg-transparent outline-none text-sm text-white
                         placeholder:text-white/25 font-mono"
            />
          </div>

          {/* Autocomplete */}
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {suggestions.map(s => (
                <button key={s} type="button" onClick={() => addTag(s)}
                  className="text-xs px-2 py-0.5 rounded bg-white/5 text-white/50
                             hover:text-white hover:bg-teal-800/40 border border-white/8
                             transition-all font-mono">
                  + {s}
                </button>
              ))}
            </div>
          )}

          {/* Quick-add */}
          {tags.length === 0 && !input && (
            <div className="mt-3">
              <p className="text-xs text-white/25 font-mono mb-2">Popular</p>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SKILLS.slice(0, 12).map(s => (
                  <button key={s} type="button" onClick={() => addTag(s)}
                    className="text-xs px-2.5 py-1 rounded-md bg-white/4 text-white/40
                               hover:text-white hover:bg-teal-800/40 border border-white/8
                               transition-all font-mono">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Experience selector */}
        <div>
          <label className="section-title block">Experience Level</label>
          <div className="grid grid-cols-3 gap-2">
            {EXPERIENCE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setExperience(opt.value)}
                className={`flex flex-col items-center py-2.5 px-2 rounded-lg border text-center
                            transition-all duration-150 ${
                  experience === opt.value
                    ? 'border-teal-500/60 bg-teal-900/30 text-white'
                    : 'border-white/8 bg-white/3 text-white/40 hover:border-white/20 hover:text-white/70'
                }`}
              >
                <span className="text-sm font-semibold">{opt.label}</span>
                <span className="text-xs mt-0.5 opacity-70">{opt.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm font-mono bg-red-900/20 px-3 py-2 rounded-lg
                        border border-red-700/30">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={tags.length === 0 && !input.trim()}
          className="w-full py-3 rounded-lg font-semibold text-sm text-white
                     bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors duration-150"
        >
          Analyze My Stack →
        </button>

        <p className="text-center text-white/20 text-xs font-mono">
          Enter or comma to add · Backspace to remove
        </p>
      </form>
    </div>
  )
}
