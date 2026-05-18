import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-sonnet-4-20250514'
const MAX_TOKENS = 1000

const SYSTEM_PROMPT =
  'You are DevRadar AI. Help Indian developers understand career gaps. ' +
  'Respond with valid JSON only. No extra text. Be encouraging but honest.'

// ── Internal helper ───────────────────────────────────────────────────────────

function parseJSON(text, fallback) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return fallback
  try {
    return JSON.parse(match[0])
  } catch {
    return fallback
  }
}

async function callClaude(prompt) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })
  return response.content[0].text
}

// ── Exported functions ────────────────────────────────────────────────────────

/**
 * Scores a single startup against the user's stack.
 * Returns match %, matched/missing skills, assessment, and recommended action.
 */
export async function analyzeStackVsStartup(userStack, startup) {
  const fallback = {
    match_percentage: 0,
    matching_skills: [],
    missing_skills: startup.skills_required ?? [],
    assessment: 'Unable to analyze at this time. Please try again.',
    recommended_action: `Review ${startup.name}'s job listings directly.`,
  }

  try {
    const prompt = `Developer stack: ${userStack.join(', ')}

Startup: ${startup.name} (${startup.type})
Required skills: ${startup.skills_required.join(', ')}
Nice to have: ${(startup.nice_to_have ?? []).join(', ')}
Roles: ${(startup.roles_available ?? []).join(', ')}

Return JSON:
{
  "match_percentage": <0-100 integer>,
  "matching_skills": ["skills from developer stack that appear in required skills"],
  "missing_skills": ["required skills the developer lacks"],
  "assessment": "two sentence honest summary of their fit for this company",
  "recommended_action": "one specific actionable next step to improve their match"
}`

    const text = await callClaude(prompt)
    const result = parseJSON(text, fallback)

    // Clamp match_percentage to valid range
    result.match_percentage = Math.min(100, Math.max(0, result.match_percentage ?? 0))
    return result
  } catch (err) {
    console.error('[Claude] analyzeStackVsStartup error:', err.message)
    return fallback
  }
}

/**
 * Generates a prioritized skill gap report across multiple target companies.
 * Includes quick wins, long-term goals, and salary impact estimates.
 */
export async function generateGapReport(userStack, targetCompanies) {
  const fallback = {
    priority_skills: [],
    quick_wins: [],
    long_term: [],
    overall_message:
      'We could not generate your report right now. Try again in a moment — your stack looks solid!',
  }

  try {
    const companyLines = targetCompanies
      .map(c => `- ${c.name}: requires ${c.skills_required.join(', ')}`)
      .join('\n')

    const prompt = `Developer's current stack: ${userStack.join(', ')}

Target companies:
${companyLines}

Identify the most impactful skills this developer should learn to become competitive at these companies.

Return JSON:
{
  "priority_skills": [
    {
      "skill": "skill name",
      "why": "which companies need it and why it matters",
      "time_weeks": <integer>,
      "difficulty": "short note on difficulty given their current stack",
      "resource": "best free learning URL",
      "salary_impact": "+X-Y%"
    }
  ],
  "quick_wins": ["skills learnable in under 1 week given their stack"],
  "long_term": ["skills requiring over 1 month of dedicated learning"],
  "overall_message": "two sentence encouraging summary of their career trajectory"
}`

    const text = await callClaude(prompt)
    return parseJSON(text, fallback)
  } catch (err) {
    console.error('[Claude] generateGapReport error:', err.message)
    return fallback
  }
}

/**
 * Generates 5 likely interview questions for a specific startup given the user's stack.
 * Mix of technical, behavioral, and company-specific questions.
 */
export async function generateInterviewQuestions(userStack, startup) {
  const fallback = {
    questions: [
      `Why do you want to work at ${startup.name}?`,
      'Walk me through a project where you used your core stack.',
      'How do you approach debugging a production issue?',
      'Describe a time you had to learn a new technology quickly.',
      'Where do you see your engineering career in 2 years?',
    ],
  }

  try {
    const prompt = `Developer stack: ${userStack.join(', ')}

Company: ${startup.name} (${startup.type}, ${startup.stage})
They require: ${startup.skills_required.join(', ')}
Interview topics they focus on: ${(startup.interview_topics ?? []).join(', ')}
Rounds: ${startup.interview_rounds ?? 3}

Generate 5 realistic interview questions this developer is likely to face.
Mix technical questions (based on their stack gaps vs requirements), system design, and behavioral.
Make questions specific to ${startup.name}'s domain (${startup.type}).

Return JSON:
{
  "questions": ["Q1", "Q2", "Q3", "Q4", "Q5"]
}`

    const text = await callClaude(prompt)
    const result = parseJSON(text, fallback)
    if (!Array.isArray(result.questions) || result.questions.length === 0) return fallback
    return result
  } catch (err) {
    console.error('[Claude] generateInterviewQuestions error:', err.message)
    return fallback
  }
}

/**
 * Scores each hackathon 0-100 by skill relevance to the user's stack.
 * Returns the full hackathon list with match_score added, sorted descending.
 */
export async function matchHackathons(userStack, hackathons) {
  const fallback = {
    ranked_hackathons: hackathons.map(h => ({ ...h, match_score: 0 })),
  }

  try {
    const hackathonLines = hackathons
      .map(h => `- id:${h.id} | "${h.name}" | skills: ${h.skills_relevant.join(', ')} | difficulty: ${h.difficulty}`)
      .join('\n')

    const prompt = `Developer stack: ${userStack.join(', ')}

Hackathons to score:
${hackathonLines}

Score each hackathon 0-100 based on how well the developer's stack matches the required skills.
100 = perfect match, 0 = no overlap at all.
Also factor in: beginner_friendly hackathons score slightly higher for developers missing most skills.

Return JSON with every hackathon included, match_score added:
{
  "ranked_hackathons": [
    {
      "id": "hackathon-id",
      "match_score": <0-100>
    }
  ]
}`

    const text = await callClaude(prompt)
    const result = parseJSON(text, null)

    if (!result?.ranked_hackathons) return fallback

    // Merge scores back into full hackathon objects
    const scoreMap = new Map(result.ranked_hackathons.map(r => [r.id, r.match_score ?? 0]))
    const ranked = hackathons
      .map(h => ({ ...h, match_score: Math.min(100, Math.max(0, scoreMap.get(h.id) ?? 0)) }))
      .sort((a, b) => b.match_score - a.match_score)

    return { ranked_hackathons: ranked }
  } catch (err) {
    console.error('[Claude] matchHackathons error:', err.message)
    return fallback
  }
}
