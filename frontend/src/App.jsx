import { useState, useCallback } from 'react'
import axios from 'axios'
import StackInput from './components/StackInput.jsx'
import Dashboard from './components/Dashboard.jsx'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function App() {
  const [state, setState] = useState('input') // 'input' | 'loading' | 'results'
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const handleAnalyze = useCallback(async ({ stack, userId }) => {
    setState('loading')
    setError(null)
    try {
      const { data } = await axios.post(`${API_BASE}/api/analyze`, { stack, userId })
      setResults(data)
      if (data.userId) {
        localStorage.setItem('devradar_user_id', data.userId)
      }
      setState('results')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Check backend.')
      setState('input')
    }
  }, [])

  const handleReset = useCallback(() => {
    setState('input')
    setResults(null)
    setError(null)
  }, [])

  return (
    <div className="min-h-screen bg-surface-900">
      {/* Header */}
      <header className="border-b border-white/8 bg-surface-800/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={handleReset} className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center
                            group-hover:bg-brand-500 transition-colors">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <span className="font-semibold text-white tracking-tight">DevRadar</span>
          </button>

          <span className="text-xs text-white/30 font-mono hidden sm:block">
            WikiThon 2025
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {state === 'input' && (
          <div className="animate-fade-in">
            <StackInput onAnalyze={handleAnalyze} error={error} />
          </div>
        )}

        {state === 'loading' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
            <div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
            <p className="text-white/50 text-sm font-mono">Analyzing stack + loading memory...</p>
          </div>
        )}

        {state === 'results' && results && (
          <div className="animate-slide-up">
            <Dashboard results={results} onReset={handleReset} />
          </div>
        )}
      </main>
    </div>
  )
}
