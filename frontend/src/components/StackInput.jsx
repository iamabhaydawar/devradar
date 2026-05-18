import { useState, useRef, useEffect, useCallback } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''
const TEAL = '#00C4B4'

const FALLBACK_SKILLS = [
  'React', 'Node.js', 'Python', 'TypeScript', 'Go', 'Java',
  'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'AWS', 'Kubernetes',
  'React Native', 'Kotlin', 'Machine Learning', 'TensorFlow', 'GraphQL',
  'Spring Boot', 'Django', 'FastAPI', 'Next.js', 'Tailwind CSS',
  'Vue.js', 'Angular', 'Rust', 'Swift', 'Flutter', 'Firebase',
  'Supabase', 'Prisma', 'tRPC',
]

const EXPERIENCES = [
  { id: 'beginner',      label: 'Student / Fresher',    sub: '0–1 yr' },
  { id: 'intermediate',  label: 'Junior Developer',     sub: '1–3 yrs' },
  { id: 'experienced',   label: 'Mid-level Engineer',   sub: '3+ yrs' },
]

const GOALS = [
  { id: 'internship',  label: 'Internship' },
  { id: 'job',         label: 'Full-time Job' },
  { id: 'hackathon',   label: 'Hackathons' },
  { id: 'freelance',   label: 'Freelance' },
]

export default function StackInput({ onSubmit, returnContext, error }) {
  const [input,      setInput]      = useState('')
  const [tags,       setTags]       = useState([])
  const [justAdded,  setJustAdded]  = useState(null)   // for spring animation
  const [suggestions, setSugs]      = useState([])
  const [allSkills,  setAllSkills]  = useState(FALLBACK_SKILLS)
  const [experience, setExperience] = useState('beginner')
  const [goals,      setGoals]      = useState(['job'])
  const [dropOpen,   setDropOpen]   = useState(false)
  const [dropIndex,  setDropIndex]  = useState(-1)
  const [submitting, setSubmitting] = useState(false)

  const inputRef   = useRef(null)
  const debounceRef = useRef(null)

  // Fetch skills from API on mount
  useEffect(() => {
    axios.get(`${API_BASE}/api/skills`)
      .then(({ data }) => {
        const names = (data.skills ?? data).map(s => (typeof s === 'string' ? s : s.name))
        if (names.length) setAllSkills(names)
      })
      .catch(() => { /* keep FALLBACK_SKILLS */ })
  }, [])

  // Debounced suggestion filter — 300ms
  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!input.trim()) { setSugs([]); setDropOpen(false); return }
    debounceRef.current = setTimeout(() => {
      const q = input.toLowerCase()
      const matches = allSkills.filter(s => s.toLowerCase().includes(q) && !tags.includes(s)).slice(0, 7)
      setSugs(matches)
      setDropOpen(matches.length > 0)
      setDropIndex(-1)
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [input, tags, allSkills])

  const addTag = useCallback((skill) => {
    const cleaned = skill.trim()
    if (!cleaned || tags.includes(cleaned) || tags.length >= 15) return
    setTags(prev => [...prev, cleaned])
    setJustAdded(cleaned)
    setTimeout(() => setJustAdded(null), 500)
    setInput('')
    setSugs([])
    setDropOpen(false)
    inputRef.current?.focus()
  }, [tags])

  const removeTag = useCallback((skill) => {
    setTags(prev => prev.filter(t => t !== skill))
  }, [])

  const toggleGoal = useCallback((id) => {
    setGoals(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id])
  }, [])

  const handleKeyDown = (e) => {
    if (dropOpen && suggestions.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setDropIndex(i => Math.min(i + 1, suggestions.length - 1)); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setDropIndex(i => Math.max(i - 1, -1)); return }
      if (e.key === 'Enter' && dropIndex >= 0) { e.preventDefault(); addTag(suggestions[dropIndex]); return }
      if (e.key === 'Escape') { setDropOpen(false); return }
    }
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) { e.preventDefault(); addTag(input); return }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      setTags(prev => prev.slice(0, -1))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (input.trim()) addTag(input)
    const finalTags = input.trim() ? [...tags, input.trim()] : tags
    if (finalTags.length === 0) return
    setSubmitting(true)
    try {
      await onSubmit(finalTags, experience, goals)
    } finally {
      setSubmitting(false)
    }
  }

  const hasHistory = returnContext?.hasHistory ?? false

  return (
    <>
      <style>{`
        @keyframes spring-pop {
          0%   { transform: scale(0.3) rotate(-6deg); opacity: 0; }
          55%  { transform: scale(1.14) rotate(1deg); opacity: 1; }
          75%  { transform: scale(0.97); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>

      <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '48px', paddingBottom: '40px' }}>

        {/* ── HydraDB recall banner ── */}
        {hasHistory && returnContext.message && (
          <div style={{
            backgroundColor: `${TEAL}0d`, border: `1px solid ${TEAL}30`,
            borderLeft: `3px solid ${TEAL}`,
            borderRadius: '0 10px 10px 0',
            padding: '12px 16px', marginBottom: '24px',
          }}>
            <p style={{ color: TEAL, fontSize: '12px', fontFamily: 'monospace',
                        fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                        margin: '0 0 4px' }}>
              HydraDB recalls your journey
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', margin: 0 }}>
              {returnContext.message}
            </p>
          </div>
        )}

        {/* ── Hero ── */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            backgroundColor: `${TEAL}15`, border: `1px solid ${TEAL}30`,
            borderRadius: '999px', padding: '4px 14px',
            fontSize: '11px', fontFamily: 'monospace', color: TEAL,
            marginBottom: '20px',
          }}>
            WikiThon 2026
          </div>
          <h1 style={{
            color: 'white', fontSize: 'clamp(28px,6vw,48px)', fontWeight: 900,
            letterSpacing: '-0.03em', lineHeight: 1.15, margin: '0 0 10px',
          }}>
            Your career.<br />
            <span style={{ color: TEAL }}>One screen.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px', margin: 0 }}>
            Always remembered.
          </p>
        </div>

        {/* ── Form card ── */}
        <div style={{
          backgroundColor: '#131C30', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '28px',
        }}>

          {/* Skills label */}
          <label style={{
            color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontFamily: 'monospace',
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
            display: 'block', marginBottom: '10px',
          }}>
            Your Tech Stack
          </label>

          {/* Tag input box */}
          <div
            onClick={() => inputRef.current?.focus()}
            style={{
              minHeight: '56px', display: 'flex', flexWrap: 'wrap',
              gap: '7px', padding: '10px', alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px', cursor: 'text', position: 'relative',
            }}
          >
            {tags.map(tag => (
              <span key={tag} style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                backgroundColor: `${TEAL}18`, border: `1px solid ${TEAL}40`,
                color: TEAL, borderRadius: '6px', padding: '4px 10px',
                fontSize: '13px', fontFamily: 'monospace', fontWeight: 600,
                animation: justAdded === tag
                  ? 'spring-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both'
                  : undefined,
              }}>
                {tag}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removeTag(tag) }}
                  style={{
                    background: 'none', border: 'none',
                    color: `${TEAL}99`, cursor: 'pointer',
                    padding: '0', minHeight: '20px', minWidth: '20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', lineHeight: 1,
                  }}
                  aria-label={`Remove ${tag}`}
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
              onFocus={() => input.trim() && setDropOpen(suggestions.length > 0)}
              onBlur={() => setTimeout(() => setDropOpen(false), 150)}
              placeholder={tags.length === 0 ? 'Type a skill, press Enter or comma...' : 'Add more...'}
              style={{
                flex: '1', minWidth: '160px', background: 'transparent', border: 'none',
                outline: 'none', color: 'white',
                // 16px prevents iOS zoom on focus
                fontSize: '16px', fontFamily: 'monospace',
              }}
              autoComplete="off"
              autoCapitalize="none"
              inputMode="text"
            />

            {/* Dropdown */}
            {dropOpen && suggestions.length > 0 && (
              <div style={{
                position: 'absolute', left: 0, right: 0, top: '100%',
                marginTop: '6px', zIndex: 50,
                backgroundColor: '#131C30', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px', overflow: 'hidden',
                boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              }}>
                {suggestions.map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={() => addTag(s)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '10px 14px',
                      backgroundColor: i === dropIndex ? `${TEAL}15` : 'transparent',
                      color: i === dropIndex ? TEAL : 'rgba(255,255,255,0.6)',
                      border: 'none', cursor: 'pointer',
                      fontSize: '14px', fontFamily: 'monospace',
                      minHeight: '44px',
                      transition: 'all 0.1s',
                    }}
                  >
                    + {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick-add grid */}
          {tags.length === 0 && !input && (
            <div style={{ marginTop: '12px' }}>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px',
                          fontFamily: 'monospace', margin: '0 0 8px' }}>
                Popular
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {allSkills.slice(0, 12).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addTag(s)}
                    style={{
                      padding: '0 12px', minHeight: '44px', borderRadius: '7px',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                      fontSize: '13px', fontFamily: 'monospace',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = `${TEAL}18`
                      e.currentTarget.style.color = TEAL
                      e.currentTarget.style.borderColor = `${TEAL}40`
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'
                      e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Experience selector */}
          <div style={{ marginTop: '22px' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontFamily: 'monospace',
                        fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                        margin: '0 0 10px' }}>
              Experience Level
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {EXPERIENCES.map(({ id, label, sub }) => {
                const active = experience === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setExperience(id)}
                    style={{
                      flex: '1', minWidth: '120px', minHeight: '52px',
                      padding: '8px 12px', borderRadius: '9px',
                      border: `1px solid ${active ? TEAL : 'rgba(255,255,255,0.1)'}`,
                      backgroundColor: active ? `${TEAL}18` : 'rgba(255,255,255,0.03)',
                      color: active ? TEAL : 'rgba(255,255,255,0.5)',
                      cursor: 'pointer', textAlign: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: '11px', fontFamily: 'monospace', marginTop: '2px',
                                  color: active ? `${TEAL}cc` : 'rgba(255,255,255,0.25)' }}>
                      {sub}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Goals */}
          <div style={{ marginTop: '18px' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontFamily: 'monospace',
                        fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                        margin: '0 0 10px' }}>
              I'm Looking For
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {GOALS.map(({ id, label }) => {
                const active = goals.includes(id)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleGoal(id)}
                    style={{
                      padding: '0 16px', minHeight: '44px', borderRadius: '8px',
                      border: `1px solid ${active ? TEAL : 'rgba(255,255,255,0.1)'}`,
                      backgroundColor: active ? `${TEAL}18` : 'rgba(255,255,255,0.03)',
                      color: active ? TEAL : 'rgba(255,255,255,0.45)',
                      cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                      transition: 'all 0.15s',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginTop: '16px', padding: '10px 14px', borderRadius: '8px',
              backgroundColor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
              color: '#f87171', fontSize: '13px', fontFamily: 'monospace',
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={tags.length === 0 && !input.trim()}
            style={{
              width: '100%', minHeight: '52px', marginTop: '20px',
              borderRadius: '10px', border: 'none', cursor: 'pointer',
              backgroundColor: tags.length > 0 || input.trim() ? TEAL : 'rgba(255,255,255,0.08)',
              color: tags.length > 0 || input.trim() ? '#0A0F1E' : 'rgba(255,255,255,0.2)',
              fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em',
              transition: 'all 0.2s ease',
            }}
          >
            {submitting ? 'Analyzing…' : 'Analyze My Career →'}
          </button>

          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)',
                      fontSize: '11px', fontFamily: 'monospace', marginTop: '10px' }}>
            Press Enter or comma to add skills · max 15
          </p>
        </div>
      </div>
    </>
  )
}
