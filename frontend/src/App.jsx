import { useState, useEffect } from 'react'
import StackInput from './components/StackInput'
import Dashboard from './components/Dashboard'

export default function App() {
  const [userId, setUserId] = useState(null)
  const [view, setView] = useState('input')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [isReturning, setIsReturning] = useState(false)

  // Check localStorage and load context on mount
  useEffect(() => {
    const savedUserId = localStorage.getItem('devradar_user_id')
    if (savedUserId) {
      setUserId(savedUserId)
      setIsReturning(true)
      fetchReturnContext(savedUserId)
    } else {
      setView('input')
    }
  }, [])

  const fetchReturnContext = async (id) => {
    try {
      const response = await fetch(`/api/return-context/${id}`)
      if (response.ok) {
        const data = await response.json()
        setResults({
          userId: id,
          isReturning: true,
          matchedStartups: data.startups || [],
          matchedHackathons: data.hackathons || [],
          gapAnalysis: data.gapReport || null,
          sessionCount: data.sessionCount || 1,
        })
        setView('dashboard')
      } else {
        // If return context fails, go back to input
        setView('input')
        setIsReturning(false)
      }
    } catch (error) {
      console.error('Error fetching return context:', error)
      setView('input')
      setIsReturning(false)
    }
  }

  const handleAnalyze = async ({ stack, userId: providedUserId }) => {
    setLoading(true)
    try {
      let newUserId = providedUserId
      
      // If no userId, initialize user first
      if (!newUserId) {
        const initResponse = await fetch('/api/user/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initialStack: stack })
        })
        if (!initResponse.ok) throw new Error('Failed to initialize user')
        const initData = await initResponse.json()
        newUserId = initData.userId
        localStorage.setItem('devradar_user_id', newUserId)
        setUserId(newUserId)
      }

      // Analyze stack
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: newUserId, stack })
      })
      if (!analyzeResponse.ok) throw new Error('Failed to analyze')
      const analyzeData = await analyzeResponse.json()

      // Fetch hackathons
      const hacksResponse = await fetch('/api/hackathons')
      const hacksData = hacksResponse.ok ? await hacksResponse.json() : { hackathons: [] }

      // Fetch gaps
      const gapsResponse = await fetch('/api/gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: newUserId, stack })
      })
      const gapsData = gapsResponse.ok ? await gapsResponse.json() : { report: null }

      // Set results
      setResults({
        userId: newUserId,
        isReturning: false,
        matchedStartups: analyzeData.startups || [],
        matchedHackathons: hacksData.hackathons || [],
        gapAnalysis: gapsData.report || null,
        sessionCount: 1,
      })
      setView('dashboard')
    } catch (error) {
      console.error('Error analyzing stack:', error)
      alert('Failed to analyze stack. Check backend.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setView('input')
    setResults(null)
    setIsReturning(false)
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      {view === 'input' ? (
        <StackInput onAnalyze={handleAnalyze} loading={loading} />
      ) : (
        <Dashboard results={results} onReset={handleReset} />
      )}
    </div>
  )
}
