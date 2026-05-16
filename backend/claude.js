import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-sonnet-4-20250514'

export async function analyzeGaps(stack, matchedStartups, userProfile) {
  const topStartups = matchedStartups.slice(0, 5)
  const isReturning = Boolean(userProfile?.profile)
  const profile = userProfile?.profile

  const historyContext = isReturning
    ? `USER HISTORY (loaded from HydraDB — ${profile.totalSessions} total sessions):
- Last known stack: ${profile.stack?.join(', ') || 'unknown'}
- Previously viewed startups: ${profile.sessions?.at(-1)?.startupsViewed?.join(', ') || 'none'}
- Last gap analysis: "${profile.sessions?.at(-1)?.gapAnalysis || 'none'}"
- Bookmarked startups: ${profile.bookmarkedStartups?.join(', ') || 'none'}
- Bookmarked hackathons: ${profile.bookmarkedHackathons?.join(', ') || 'none'}`
    : 'NEW USER — no history available yet.'

  const prompt = `You are a senior career coach specializing in Indian startups and developer career growth.

${historyContext}

CURRENT TECH STACK: ${stack.join(', ')}

TOP MATCHED STARTUPS:
${topStartups.map(s => `- ${s.name} [${s.domain}] (match: ${s.matchScore}%): requires ${s.stack.slice(0, 6).join(', ')}`).join('\n')}

${isReturning
  ? 'This is a RETURNING user. Reference their history directly. Note any stack improvements since last visit. Build on your previous advice. Be personal and specific.'
  : 'This is a NEW user. Be welcoming, clear, and motivating. Focus on quick wins.'
}

Respond ONLY with valid JSON matching this exact shape:
{
  "summary": "2-3 sentence personalized overview of their current position",
  "gaps": [
    {
      "skill": "exact skill name",
      "reason": "which startup needs it and why",
      "priority": "high|medium|low",
      "learnIn": "estimated weeks"
    }
  ],
  "strengths": ["skill1", "skill2"],
  "topRecommendation": "single most impactful next action",
  "personalNote": "${isReturning ? 'reference their journey and progress' : 'welcoming encouragement for their first visit'}"
}`

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].text
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Claude returned non-JSON')
  return JSON.parse(jsonMatch[0])
}
