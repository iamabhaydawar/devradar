import { useState, useRef, useEffect, useCallback } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

// Fallback if API unavailable
const FALLBACK_SKILLS = [
  'React', 'Node.js', 'Python', 'TypeScript', 'Go', 'Java', 'PostgreSQL',
  'MongoDB', 'Redis', 'Docker', 'AWS', 'Kubernetes', 'React Native', 'Kotlin',
  'Machine Learning', 'TensorFlow', 'GraphQL', 'Spring Boot', 'Django',
  'FastAPI', 'Next.js', 'Tailwind CSS', 'Rust', 'Flutter', 'Solidity',
  'Git', 'Linux', 'DSA', 'System Design', 'Microservices',
]

const EXPERIENCE_OPTIONS = [
  { value: 'beginner',     label: 'Beginner',      sub: '0–1 yr · Student / Fresher' },
  { value: 'intermediate', label: 'Intermediate',  sub: '1–3 yrs · Junior Dev' },
  { value: 'advanced',     label: 'Advanced',      sub: '3+ yrs · Mid / Senior' },
]

const GOAL_OPTIONS = [
  { value: 'internship', label: 'Internship', icon: '🎓' },
  { value: 'job',        label: 'Full-time Job', icon: '💼' },
  { value: 'hackathon',  label: 'Hackathon',    icon: '⚡' },
  { value: 'freelance',  label: 'Freelance',    icon: '🚀' },
]

const TEAL = '#00C4B4'

// ── Inline styles ─────────────────────────────────────────────────────────────
const S = {
  root:      { backgroundColor: '#0A0F1E', minHeight: '100vh' },
  card:      { backgroundColor: '#131C30', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' },
  badge:     { borderColor: 'rgba(0,196,180,0.35)', color: TEAL, backgroundColor: 'rgba(0,196,180,0.08)' },
  dot:       { backgroundColor: TEAL },
  divider:   { background: `linear-gradient(to right, transparent, ${TEAL}55, transparent)` },
  label:     { color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 600,
               letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' },
  tagInput:  { backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
               borderRadius: '10px', minHeight: '52px' },
  tagFocus:  { borderColor: `${TEAL}60` },
  tag:       { backgroundColor: 'rgba(0,196,180,0.12)', border: `1px solid ${TEAL}40`,
               color: TEAL, borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace',
               padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '6px' },
  dropdown:  { backgroundColor: '#1a2540', border: '1px solid rgba(255,255,255,0.08)',
               borderRadius: '10px', marginTop: '6px', overflow: 'hidden',
               boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
  dropItem:  { padding: '9px 14px', fontSize: '13px', fontFamily: 'monospace',
               cursor: 'pointer', color: 'rgba(255,255,255,0.7)' },
  dropActive:{ backgroundColor: 'rgba(0,196,180,0.12)', color: TEAL },
  expInact:  { backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
               borderRadius: '10px', cursor: 'pointer' },
  expActiv:  { backgroundColor: 'rgba(0,196,180,0.15)', border: `1px solid ${TEAL}60`,
               borderRadius: '10px', cursor: 'pointer' },
  goalInact: { backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
               borderRadius: '10px', cursor: 'pointer' },
  goalActiv: { backgroundColor: 'rgba(0,196,180,0.15)', border: `1px solid ${TEAL}60`,
               borderRadius: '10px', cursor: 'pointer' },
  btn:       { backgroundColor: TEAL, color: '#0A0F1E', border: 'none', borderRadius: '10px',
               width: '100%', padding: '14px', fontSize: '15px', fontWeight: 700,
               cursor: 'pointer', transition: 'opacity 0.15s, transform 0.1s' },
  btnDis:    { opacity: 0.4, cursor: 'not-allowed' },
  footer:    { color: 'rgba(255,255,255,0.2)', fontSize: '12px', textAlign: 'center', marginTop: '20px' },
  error:     { backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
               borderRadius: '8px', padding: '10px 14px', color: '#f87171', fontSize: '13px', fontFamily: 'monospace' },
  returnBanner: { backgroundColor: 'rgba(0,196,180,0.08)', border: `1px solid ${TEAL}35`,
                  borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' },
  urgentChip: { backgroundColor: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: '6px', padding: '3px 10px', fontSize: '11px', fontFamily: 'monospace',
                color: '#fbbf24' },
}

export default function StackInput({ onSubmit, returnContext, error: externalError }) {
  const [allSkills, setAllSkills]       = useState(FALLBACK_SKILLS)
  const [tags, setTags]                 = useState([])
  const [input, setInput]               = useState('')
  const [dropdown, setDropdown]         = useState([])
  const [dropOpen, setDropOpen]         = useState(false)
  const [dropIdx, setDropIdx]           = useState(0)
  const [focused, setFocused]           = useState(false)
  const [experience, setExperience]     = useState('beginner')
  const [goals, setGoals]               = useState([])
  const [submitError, setSubmitError]   = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const inputRef  = useRef(null)
  const wrapRef   = useRef(null)

  // Fetch real skill list from backend
  useEffect(() => {
    axios.get(`${API_BASE}/api/skills`)
      .then(({ data }) => {
        const names = Array.isArray(data) ? data.map(s => s.name ?? s).filter(Boolean) : []
        if (names.length > 0) setAllSkills(names)
      })
      .catch(() => {}) // keep fallback silently
  }, [])

  // Compute dropdown matches
  useEffect(() => {
    if (!input.trim()) { setDropdown([]); setDropOpen(false); return }
    const q = input.toLowerCase()
    const matches = allSkills
      .filter(s => s.toLowerCase().includes(q) && !tags.includes(s))
      .slice(0, 8)
    setDropdown(matches)
    setDropOpen(matches.length > 0)
    setDropIdx(0)
  }, [input, allSkills, tags])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setDropOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const addTag = useCallback((skill) => {
    const cleaned = (skill ?? '').trim()
    if (!cleaned || tags.includes(cleaned) || tags.length >= 15) return
    setTags(prev => [...prev, cleaned])
    setInput('')
    setDropdown([])
    setDropOpen(false)
    setSubmitError('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [tags])

  const removeTag = (skill) => setTags(prev => prev.filter(t => t !== skill))

  const toggleGoal = (g) =>
    setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])

  const handleKeyDown = (e) => {
    if (dropOpen) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setDropIdx(i => Math.min(i + 1, dropdown.length - 1)); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setDropIdx(i => Math.max(i - 1, 0)); return }
      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(dropdown[dropIdx] ?? input); return }
      if (e.key === 'Escape') { setDropOpen(false); return }
    }
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) { e.preventDefault(); addTag(input); return }
    if (e.key === 'Backspace' && !input && tags.length > 0) setTags(prev => prev.slice(0, -1))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (input.trim()) addTag(input)
    const finalTags = input.trim() ? [...tags, input.trim()] : tags
    if (finalTags.length === 0) { setSubmitError('Add at least one skill to continue.'); return }
    setSubmitError('')
    setSubmitting(true)
    try {
      await onSubmit(finalTags, experience, goals)
    } catch {
      setSubmitting(false)
    }
  }

  const inputBorderStyle = focused ? { ...S.tagInput, ...S.tagFocus } : S.tagInput

  return (
    <div style={S.root} className="flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">

        {/* ── Badge ── */}
        <div className="flex justify-center mb-7">
          <span style={{ ...S.badge, borderWidth: '1px', borderStyle: 'solid',
                         borderRadius: '999px', padding: '4px 14px',
                         fontSize: '11px', fontFamily: 'monospace',
                         display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ ...S.dot, width: '6px', height: '6px', borderRadius: '50%',
                           animation: 'pulse 2s infinite' }} />
            WikiThon 2025 · Powered by HydraDB
          </span>
        </div>

        {/* ── Title ── */}
        <div className="text-center mb-8">
          <h1 style={{ color: 'white', fontSize: 'clamp(52px,10vw,80px)', fontWeight: 800,
                       letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '12px' }}>
            Dev<span style={{ color: TEAL }}>Radar</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', letterSpacing: '0.01em' }}>
            Your career. One screen. Always remembered.
          </p>
        </div>

        {/* ── Teal divider ── */}
        <div style={{ ...S.divider, height: '1px', marginBottom: '28px' }} />

        {/* ── Return context banner ── */}
        {returnContext?.hasHistory && (
          <div style={S.returnBanner}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ ...S.dot, width: '7px', height: '7px', borderRadius: '50%',
                             marginTop: '5px', flexShrink: 0 }} />
              <div>
                <p style={{ color: TEAL, fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                  {returnContext.message}
                </p>
                {returnContext.urgentItems?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {returnContext.urgentItems.slice(0, 3).map((item, i) => (
                      <span key={i} style={S.urgentChip}>
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

        {/* ── Card ── */}
        <form onSubmit={handleSubmit} style={{ ...S.card, padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* ── Stack input ── */}
          <div>
            <p style={S.label}>What is your current tech stack?</p>

            {/* Tag + input area */}
            <div ref={wrapRef} style={{ position: 'relative' }}>
              <div
                style={{ ...inputBorderStyle, display: 'flex', flexWrap: 'wrap',
                         gap: '6px', padding: '10px 12px', cursor: 'text' }}
                onClick={() => inputRef.current?.focus()}
              >
                {tags.map(tag => (
                  <span key={tag} style={S.tag}>
                    {tag}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
                      style={{ background: 'none', border: 'none', color: `${TEAL}80`,
                               cursor: 'pointer', fontSize: '14px', lineHeight: 1,
                               padding: 0, display: 'flex', alignItems: 'center' }}
                      onMouseEnter={e => e.target.style.color = 'white'}
                      onMouseLeave={e => e.target.style.color = `${TEAL}80`}
                    >×</button>
                  </span>
                ))}
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder={tags.length === 0 ? 'e.g. React, Node.js, Python...' : tags.length >= 15 ? 'Max 15 skills' : 'Add more...'}
                  disabled={tags.length >= 15}
                  style={{ flex: 1, minWidth: '120px', background: 'none', border: 'none',
                           outline: 'none', color: 'white', fontSize: '13px',
                           fontFamily: 'monospace', padding: '2px 0' }}
                />
              </div>

              {/* Dropdown */}
              {dropOpen && (
                <div style={{ ...S.dropdown, position: 'absolute', left: 0, right: 0, zIndex: 50 }}>
                  {dropdown.map((skill, i) => (
                    <div
                      key={skill}
                      style={{ ...S.dropItem, ...(i === dropIdx ? S.dropActive : {}) }}
                      onMouseEnter={() => setDropIdx(i)}
                      onMouseDown={(e) => { e.preventDefault(); addTag(skill) }}
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick-add chips */}
            {tags.length === 0 && !input && (
              <div style={{ marginTop: '10px' }}>
                <p style={{ ...S.label, marginBottom: '6px' }}>Popular picks</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {FALLBACK_SKILLS.slice(0, 14).map(s => (
                    <button
                      key={s} type="button" onClick={() => addTag(s)}
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                               borderRadius: '6px', padding: '4px 10px', color: 'rgba(255,255,255,0.45)',
                               fontSize: '11px', fontFamily: 'monospace', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.color = TEAL; e.currentTarget.style.borderColor = `${TEAL}50` }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tags.length > 0 && (
              <p style={{ marginTop: '6px', fontSize: '11px', fontFamily: 'monospace',
                          color: 'rgba(255,255,255,0.2)' }}>
                {tags.length}/15 skills · Enter or comma to add · Backspace to remove
              </p>
            )}
          </div>

          {/* ── Experience selector ── */}
          <div>
            <p style={S.label}>Experience Level</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {EXPERIENCE_OPTIONS.map(opt => {
                const active = experience === opt.value
                return (
                  <button
                    key={opt.value} type="button"
                    onClick={() => setExperience(opt.value)}
                    style={{ ...(active ? S.expActiv : S.expInact), padding: '12px 8px',
                             display: 'flex', flexDirection: 'column', alignItems: 'center',
                             gap: '3px', transition: 'all 0.15s' }}
                  >
                    <span style={{ color: active ? TEAL : 'white', fontSize: '13px', fontWeight: 600 }}>
                      {opt.label}
                    </span>
                    <span style={{ color: active ? `${TEAL}99` : 'rgba(255,255,255,0.3)',
                                   fontSize: '11px' }}>
                      {opt.sub}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Goal selector ── */}
          <div>
            <p style={S.label}>What are you aiming for? <span style={{ textTransform: 'none', letterSpacing: 0 }}>(pick all that apply)</span></p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {GOAL_OPTIONS.map(opt => {
                const active = goals.includes(opt.value)
                return (
                  <button
                    key={opt.value} type="button"
                    onClick={() => toggleGoal(opt.value)}
                    style={{ ...(active ? S.goalActiv : S.goalInact), padding: '12px 16px',
                             display: 'flex', alignItems: 'center', gap: '10px',
                             transition: 'all 0.15s' }}
                  >
                    <span style={{ fontSize: '18px' }}>{opt.icon}</span>
                    <span style={{ color: active ? TEAL : 'rgba(255,255,255,0.55)',
                                   fontSize: '13px', fontWeight: 500 }}>
                      {opt.label}
                    </span>
                    {active && (
                      <span style={{ marginLeft: 'auto', color: TEAL, fontSize: '14px' }}>✓</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Errors ── */}
          {(submitError || externalError) && (
            <div style={S.error}>{submitError || externalError}</div>
          )}

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={submitting}
            style={{ ...S.btn, ...(submitting ? S.btnDis : {}) }}
            onMouseEnter={e => { if (!submitting) e.currentTarget.style.opacity = '0.88' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            {submitting ? 'Analyzing...' : 'Analyze My Career'}
          </button>
        </form>

        {/* ── Footer ── */}
        <p style={S.footer}>Powered by HydraDB Memory + Claude AI</p>

      </div>
    </div>
  )
}
