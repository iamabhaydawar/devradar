export function matchStartups(userStack, startups) {
  const normalized = userStack.map(s => s.toLowerCase().trim())

  return startups
    .map(startup => {
      const startupStack = startup.stack.map(s => s.toLowerCase())
      const matchedSkills = normalized.filter(s =>
        startupStack.some(ss => ss.includes(s) || s.includes(ss))
      )
      const missingSkills = startup.stack.filter(ss =>
        !normalized.some(s => ss.toLowerCase().includes(s) || s.includes(ss.toLowerCase()))
      )
      const matchScore = Math.round((matchedSkills.length / Math.max(startupStack.length, 1)) * 100)

      return { ...startup, matchScore, matchedSkills, missingSkills }
    })
    .sort((a, b) => b.matchScore - a.matchScore)
}

export function filterHackathons(userStack, hackathons) {
  const normalized = userStack.map(s => s.toLowerCase().trim())
  const now = new Date()

  return hackathons
    .filter(h => new Date(h.date) >= now)
    .map(h => {
      const hackSkills = h.skills.map(s => s.toLowerCase())
      const matchedSkills = normalized.filter(s =>
        hackSkills.some(hs => hs.includes(s) || s.includes(hs))
      )
      const relevanceScore = Math.round((matchedSkills.length / Math.max(hackSkills.length, 1)) * 100)
      return { ...h, relevanceScore, matchedSkills }
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
}
