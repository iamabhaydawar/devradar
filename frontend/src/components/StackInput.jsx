import { useState, useRef, useEffect } from 'react'

const POPULAR_SKILLS = [
  'React', 'Node.js', 'Python', 'TypeScript', 'Go', 'Java',
  'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'AWS', 'Kubernetes',
  'React Native', 'Kotlin', 'Machine Learning', 'TensorFlow', 'GraphQL',
  'Spring Boot', 'Django', 'FastAPI', 'Next.js', 'Tailwind CSS',
]

export default function StackInput({ onAnalyze, error }) {
  const [input, setInput] = useState('')
  const [tags, setTags] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const inputRef = useRef(null)

  const savedUserId = localStorage.getItem('devradar_user_id')

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
    if (tags.length === 0 && !input.trim()) return
    const finalTags = input.trim() ? [...tags, input.trim()] : tags
    onAnalyze({ stack: finalTags, userId: savedUserId || undefined })
  }

  return (
    <div className="max-w-2xl mx-auto pt-16 pb-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-brand-900/60 border border-brand-700/40
                        rounded-full px-3 py-1 text-xs text-brand-400 font-mono mb-6">
          WikiThon 2025
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3">
          Your career.<br />
          <span className="text-brand-400">One screen.</span>
        </h1>
        <p className="text-white/50 text-lg">
          Always remembered.
        </p>
      </div>

      {/* Returning user banner */}
      {savedUserId && (
        <div className="mb-6 flex items-center gap-3 bg-emerald-900/30 border border-emerald-700/40
                        rounded-xl px-4 py-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
          <p className="text-emerald-400 text-sm font-medium">
            Welcome back — HydraDB loaded your session history
          </p>
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="card">
        <label className="section-title block">Your Tech Stack</label>

        {/* Tag input */}
        <div
          className="min-h-[52px] flex flex-wrap gap-2 p-3 bg-surface-700/60 rounded-lg border
                     border-white/10 focus-within:border-brand-500 transition-colors cursor-text mb-3"
          onClick={() => inputRef.current?.focus()}
        >
          {tags.map(tag => (
            <span key={tag} className="tag flex items-center gap-1.5">
              {tag}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
                className="text-brand-400/60 hover:text-white transition-colors leading-none"
              >
                ×
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? 'Type a skill and press Enter...' : 'Add more...'}
            className="flex-1 min-w-32 bg-transparent outline-none text-sm text-white
                       placeholder:text-white/30 font-mono"
          />
        </div>

        {/* Autocomplete suggestions */}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestions.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => addTag(s)}
                className="text-xs px-2.5 py-1 rounded-md bg-surface-600/80 text-white/60
                           hover:text-white hover:bg-brand-700/40 border border-white/8
                           transition-all font-mono"
              >
                + {s}
              </button>
            ))}
          </div>
        )}

        {/* Quick-add popular skills */}
        {tags.length === 0 && !input && (
          <div className="mb-4">
            <p className="section-title">Popular</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SKILLS.slice(0, 10).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addTag(s)}
                  className="text-xs px-2.5 py-1 rounded-md bg-surface-600/60 text-white/50
                             hover:text-white hover:bg-brand-700/40 border border-white/8
                             transition-all font-mono"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm mb-3 font-mono bg-red-900/20 px-3 py-2 rounded-lg border border-red-700/30">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={tags.length === 0 && !input.trim()}
          className="btn-primary w-full"
        >
          Analyze My Stack →
        </button>

        <p className="text-center text-white/25 text-xs mt-3 font-mono">
          Press Enter or comma to add skills
        </p>
      </form>
    </div>
  )
}
