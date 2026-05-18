import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import StackInput from './components/StackInput.jsx'
import Dashboard from './components/Dashboard.jsx'

const API_BASE = import.meta.env.VITE_API_URL || ''

const LOADING_STEPS = [
  'Creating your profile in HydraDB...',
  'Matching your stack to 20 Indian startups...',
  'Finding relevant hackathons...',
  'Generating skill gap report with Claude AI...',
]

export default function App() {
  // ── State ────────────────────────────────────────────────────────────────
  const [userId, setUserId]               = useState(null)
  const [userStack, setUserStack]         = useState([])
  const [view, setView]                   = useState('input')   // 'input' | 'loading' | 'dashboard'
  const [startups, setStartups]           = useState([])
  const [hackathons, setHackathons]       = useState([])
  const [gapReport, setGapReport]         = useState(null)
  const [returnContext, setReturnContext] = useState(null)
  const [loading, setLoading]             = useState(false)
  const [experience, setExperience]       = useState('beginner')
  const [loadingStep, setLoadingStep]     = useState(0)
  const [error, setError]                 = useState(null)

  // ── On mount: check localStorage for returning user ──────────────────────
  useEffect(() => {
    const savedId = localStorage.getItem('devradar_user_id')
    if (!savedId) return
    setUserId(savedId)
    axios
      .get(`${API_BASE}/api/return-context/${savedId}`)
      .then(({ data }) => { if (data.hasHistory) setReturnContext(data) })
      .catch(() => {}) // silently fail — non-critical
  }, [])

  // ── Submit handler: 4-step API flow ──────────────────────────────────────
  const handleSubmit = useCallback(async (stack, experience, goals = []) => {
    setLoading(true)
    setView('loading')
    setLoadingStep(0)
    setError(null)

    try {
      // Step 1 — create user in HydraDB
      setLoadingStep(0)
      const { data: initData } = await axios.post(`${API_BASE}/api/user/init`, {
        stack,
        experience,
        goals,
      })
      const newUserId = initData.userId
      setUserId(newUserId)
      localStorage.setItem('devradar_user_id', newUserId)

      // Step 2 — match stack vs all startups, Claude deep-analyzes top 5
      setLoadingStep(1)
      const { data: analyzeData } = await axios.post(`${API_BASE}/api/analyze`, {
        userId: newUserId,
        stack,
        experience,
      })
      setStartups(analyzeData.startups ?? [])

      // Step 3 — rank hackathons by skill match
      setLoadingStep(2)
      const { data: hackData } = await axios.get(
        `${API_BASE}/api/hackathons/${newUserId}?stack=${encodeURIComponent(stack.join(','))}`
      )
      setHackathons(hackData.ranked_hackathons ?? [])

      // Step 4 — Claude gap report against top matched companies
      setLoadingStep(3)
      const topCompanies = (analyzeData.startups ?? []).slice(0, 5).map(s => s.name)
      const { data: gapData } = await axios.post(`${API_BASE}/api/gaps`, {
        userId: newUserId,
        stack,
        targetCompanies: topCompanies,
      })
      setGapReport(gapData)

      setUserStack(stack)
      setExperience(experience)
      setView('dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
      setView('input')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleReset = useCallback(() => {
    setView('input')
    setStartups([])
    setHackathons([])
    setGapReport(null)
    setError(null)
    setLoadingStep(0)
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0F1E' }}>

      {/* ── Header ── */}
      <header className="border-b border-white/8 backdrop-blur-sm sticky top-0 z-10"
        style={{ backgroundColor: 'rgba(10,15,30,0.85)' }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={handleReset} className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center
                            group-hover:bg-brand-500 transition-colors">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <span className="font-semibold text-white tracking-tight">DevRadar</span>
          </button>
          <div className="flex items-center gap-3">
            {userId && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                HydraDB active
              </span>
            )}
            <span className="text-xs text-white/30 font-mono hidden sm:block">WikiThon 2025</span>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-6xl mx-auto px-4 py-8">

        {view === 'input' && (
          <div className="animate-fade-in">
            <StackInput
              onSubmit={handleSubmit}
              returnContext={returnContext}
              error={error}
            />
          </div>
        )}

        {view === 'loading' && (
          <div className="flex flex-col items-center justify-center min-h-[65vh] gap-6 animate-fade-in">
            {/* Spinner */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-white/8" />
              <div className="absolute inset-0 rounded-full border-2 border-t-teal-400
                              border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            </div>

            {/* Step indicator */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-white text-sm font-medium">{LOADING_STEPS[loadingStep]}</p>
              <div className="flex gap-1.5 mt-1">
                {LOADING_STEPS.map((_, i) => (
                  <div key={i}
                    className={`h-1 rounded-full transition-all duration-500 ${
                      i < loadingStep  ? 'w-6 bg-teal-400' :
                      i === loadingStep ? 'w-6 bg-teal-400 animate-pulse' :
                                          'w-3 bg-white/15'
                    }`}
                  />
                ))}
              </div>
            </div>

            <p className="text-white/30 text-xs font-mono">
              Powered by Claude + HydraDB
            </p>
          </div>
        )}

        {view === 'dashboard' && (
          <div className="animate-slide-up">
            <Dashboard
              userId={userId}
              userStack={userStack}
              startups={startups}
              hackathons={hackathons}
              gapReport={gapReport}
              returnContext={returnContext}
              experience={experience}
              onReset={handleReset}
            />
          </div>
        )}

      </main>
    </div>
  )
}
