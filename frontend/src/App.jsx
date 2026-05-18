import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import StackInput from './components/StackInput.jsx'
import Dashboard  from './components/Dashboard.jsx'

const API_BASE = import.meta.env.VITE_API_URL || ''
const TEAL     = '#00C4B4'

// ── Loading step messages ─────────────────────────────────────────────────────
const LOADING_STEPS = [
  'HydraDB is recalling your journey...',
  'Matching you with Indian startups...',
  'Finding your next hackathon...',
  'Asking Claude about your stack...',
]

// ── Error classification ──────────────────────────────────────────────────────
function classifyError(err) {
  if (!err.response)                          return 'network'
  const status = err.response.status
  const msg    = (err.response.data?.error ?? '').toLowerCase()
  if (status === 408 || err.code === 'ECONNABORTED' || msg.includes('timeout')) return 'timeout'
  if (msg.includes('hydra') || msg.includes('memory') || status === 503)         return 'hydradb'
  return 'generic'
}

const ERROR_MESSAGES = {
  network:  'Could not connect. Using cached data.',
  timeout:  'AI took too long. Showing quick analysis.',
  hydradb:  'Memory temporarily unavailable. Running in local mode.',
  generic:  'Something went wrong. Please try again.',
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [userId,        setUserId]        = useState(null)
  const [userStack,     setUserStack]     = useState([])
  const [view,          setView]          = useState('input')   // 'input'|'loading'|'dashboard'
  const [startups,      setStartups]      = useState([])
  const [hackathons,    setHackathons]    = useState([])
  const [gapReport,     setGapReport]     = useState(null)
  const [returnContext, setReturnContext] = useState(null)
  const [loading,       setLoading]       = useState(false)
  const [loadingStep,   setLoadingStep]   = useState(0)
  const [error,         setError]         = useState(null)

  // ── Check returning user on mount ────────────────────────────────────────────
  useEffect(() => {
    const savedId = localStorage.getItem('devradar_user_id')
    if (!savedId) return
    setUserId(savedId)
    axios.get(`${API_BASE}/api/return-context/${savedId}`)
      .then(({ data }) => { if (data.hasHistory) setReturnContext(data) })
      .catch(() => {}) // non-critical
  }, [])

  // Track whether dashboard has been revealed (ref avoids stale closure inside async fn)
  const dashboardRevealedRef = useRef(false)

  // ── 4-step submit ─────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (stack, experience, goals = []) => {
    dashboardRevealedRef.current = false
    setLoading(true)
    setView('loading')
    setLoadingStep(0)
    setError(null)

    try {
      // Step 0 — init user in HydraDB
      const { data: initData } = await axios.post(`${API_BASE}/api/user/init`, {
        stack, experience, goals,
      })
      const newUserId = initData.userId
      setUserId(newUserId)
      localStorage.setItem('devradar_user_id', newUserId)

      // Step 1 — match startups + Claude deep-analyzes top 5
      setLoadingStep(1)
      const { data: analyzeData } = await axios.post(`${API_BASE}/api/analyze`, {
        userId: newUserId, stack, experience,
      })
      const fetchedStartups = analyzeData.startups ?? []
      setStartups(fetchedStartups)
      setUserStack(stack)

      // ─ Early reveal: show dashboard with first 5 startups immediately ─
      setView('dashboard')
      dashboardRevealedRef.current = true

      // Step 2 — rank hackathons (background — dashboard shows skeleton)
      setLoadingStep(2)
      const { data: hackData } = await axios.get(
        `${API_BASE}/api/hackathons/${newUserId}?stack=${encodeURIComponent(stack.join(','))}`
      )
      setHackathons(hackData.ranked_hackathons ?? [])

      // Step 3 — Claude gap report (background — dashboard shows skeleton)
      setLoadingStep(3)
      const topCompanies = fetchedStartups.slice(0, 5).map(s => s.name)
      const { data: gapData } = await axios.post(`${API_BASE}/api/gaps`, {
        userId: newUserId, stack, targetCompanies: topCompanies,
      })
      setGapReport(gapData)

    } catch (err) {
      const kind = classifyError(err)
      setError(ERROR_MESSAGES[kind])
      // Only reset to input if the dashboard was never revealed (step 1 failed)
      if (!dashboardRevealedRef.current) setView('input')
    } finally {
      setLoading(false)
    }
  }, []) // no stale deps — uses ref for view tracking

  const handleReset = useCallback(() => {
    setView('input')
    setStartups([])
    setHackathons([])
    setGapReport(null)
    setError(null)
    setLoadingStep(0)
  }, [])

  return (
    <div style={{ backgroundColor: '#0A0F1E', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <header style={{
        backgroundColor: 'rgba(10,15,30,0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, zIndex: 30,
      }}>
        <div style={{
          maxWidth: '1280px', margin: '0 auto', padding: '0 20px',
          height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button
            onClick={handleReset}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'none', border: 'none', cursor: 'pointer', padding: '0',
              minHeight: '44px',
            }}
          >
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              backgroundColor: TEAL,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#0A0F1E', fontWeight: 900, fontSize: '13px' }}>⬡</span>
            </div>
            <span style={{
              color: 'white', fontWeight: 700, fontSize: '15px', letterSpacing: '-0.01em',
            }}>
              DevRadar
            </span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {userId && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                color: TEAL, fontSize: '12px', fontFamily: 'monospace',
              }}
                title="HydraDB stores your career journey persistently. Every visit builds on the last."
              >
                <span style={{
                  width: '7px', height: '7px', borderRadius: '50%', backgroundColor: TEAL,
                  display: 'inline-block', animation: 'hdr-ping 1.6s ease-in-out infinite',
                }} />
                HydraDB active
              </span>
            )}
            <span style={{
              color: 'rgba(255,255,255,0.2)', fontSize: '12px', fontFamily: 'monospace',
            }}>
              WikiThon 2026
            </span>
          </div>
        </div>
      </header>

      <style>{`
        @keyframes hdr-ping {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 ${TEAL}60; }
          50%       { opacity: 0.5; box-shadow: 0 0 0 5px ${TEAL}00; }
        }
        @keyframes app-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* ── Error banner (shown over dashboard on partial failure) ── */}
      {error && view === 'dashboard' && (
        <div style={{
          backgroundColor: 'rgba(248,113,113,0.1)',
          borderBottom: '1px solid rgba(248,113,113,0.3)',
          padding: '10px 20px', textAlign: 'center',
          color: '#f87171', fontSize: '13px', fontFamily: 'monospace',
        }}>
          {error}
        </div>
      )}

      {/* ── Main ── */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px' }}>

        {view === 'input' && (
          <StackInput
            onSubmit={handleSubmit}
            returnContext={returnContext}
            error={error}
          />
        )}

        {view === 'loading' && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '68vh', gap: '24px',
          }}>
            {/* Spinner */}
            <div style={{ position: 'relative', width: '56px', height: '56px' }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.06)',
              }} />
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                border: '2px solid transparent', borderTopColor: TEAL,
                animation: 'app-spin 0.75s linear infinite',
              }} />
            </div>

            {/* Step text */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'white', fontSize: '14px', fontWeight: 600, margin: '0 0 14px' }}>
                {LOADING_STEPS[loadingStep]}
              </p>
              {/* Progress dots */}
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                {LOADING_STEPS.map((_, i) => (
                  <div key={i} style={{
                    height: '3px', borderRadius: '2px',
                    width: i <= loadingStep ? '28px' : '10px',
                    backgroundColor: i <= loadingStep ? TEAL : 'rgba(255,255,255,0.12)',
                    transition: 'all 0.4s ease',
                  }} />
                ))}
              </div>
            </div>

            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', fontFamily: 'monospace' }}>
              Powered by Claude + HydraDB
            </p>
          </div>
        )}

        {view === 'dashboard' && (
          <Dashboard
            userId={userId}
            userStack={userStack}
            startups={startups}
            hackathons={hackathons}
            gapReport={gapReport}
            returnContext={returnContext}
            onReset={handleReset}
            loading={loading}
            loadingStep={loadingStep}
          />
        )}

      </main>
    </div>
  )
}
