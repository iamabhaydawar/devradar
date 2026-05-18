import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-sonnet-4-20250514'
const MAX_TOKENS = 1000
const MAX_TOKENS_WIKI = 2000

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

// ── LLM Wiki ingest pipeline ──────────────────────────────────────────────────

/**
 * Step 1 of ingest pipeline — extracts structured entities from raw content.
 * Returns: { companies, skills, hackathons, gaps, summary }
 */
export async function ingestStep1(content, userStack = []) {
  const fallback = { companies: [], skills: [], hackathons: [], gaps: [], summary: '' }

  try {
    const prompt = `You are a career intelligence extractor. Analyze the following content and extract career-relevant entities.

User's current tech stack: ${userStack.length ? userStack.join(', ') : 'unknown'}

Content to analyze:
---
${content.slice(0, 6000)}
---

Extract and return JSON:
{
  "companies": [{ "name": "Company Name", "type": "startup|bigtech|agency", "skills_required": ["skill1"], "notes": "brief note" }],
  "skills": [{ "name": "skill name", "category": "frontend|backend|devops|ml|other", "relevance": "why it matters" }],
  "hackathons": [{ "name": "hackathon name", "platform": "platform name", "skills_relevant": ["skill1"], "deadline": "YYYY-MM-DD or null", "prize": "prize info or null" }],
  "gaps": [{ "skill": "skill name", "why": "why user needs it", "urgency": "high|medium|low" }],
  "summary": "2-3 sentence summary of what this content is about and key career insights"
}

Only include entities actually mentioned or strongly implied by the content. Return valid JSON only.`

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS_WIKI,
      system: 'You are a career intelligence extractor. Return valid JSON only. No extra text.',
      messages: [{ role: 'user', content: prompt }],
    })

    return parseJSON(response.content[0].text, fallback)
  } catch (err) {
    console.error('[Claude] ingestStep1 error:', err.message)
    return fallback
  }
}

/**
 * Step 2 of ingest pipeline — generates a markdown wiki page for one entity.
 * entityType: 'company' | 'skill' | 'hackathon' | 'gap' | 'note'
 * entity: the extracted entity object from step 1
 * Returns: markdown string with YAML frontmatter
 */
export async function ingestStep2GeneratePage(entityType, entity, userStack = [], sourceContent = '') {
  try {
    const entityDesc = JSON.stringify(entity, null, 2)
    const prompt = `Generate a structured career wiki page in markdown for this ${entityType}.

Entity data:
${entityDesc}

User's stack: ${userStack.length ? userStack.join(', ') : 'unknown'}

Source content snippet:
${sourceContent.slice(0, 1000)}

Write a markdown wiki page following this exact format:
---
type: ${entityType}
name: [entity name]
tags: [comma separated tags]
updated: ${new Date().toISOString().split('T')[0]}
---

# [Entity Name]

## Overview
[2-3 sentences about this entity and why it matters for the user's career]

## Key Details
- [relevant detail 1]
- [relevant detail 2]
- [relevant detail 3]

## Career Relevance
[How this relates to the user's stack and goals. Use [[skill/typescript]] style wikilinks to reference related entities]

## Action Items
- [ ] [specific actionable step]
- [ ] [specific actionable step]

Use [[type/name]] wikilinks to connect related entities (e.g., [[skill/react]], [[company/razorpay]]).
Keep it concise and actionable. Return only the markdown, no extra text.`

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS_WIKI,
      system: 'You are a career wiki writer. Generate clean, actionable markdown wiki pages. Return only the markdown content.',
      messages: [{ role: 'user', content: prompt }],
    })

    return response.content[0].text.trim()
  } catch (err) {
    console.error('[Claude] ingestStep2GeneratePage error:', err.message)
    return `---\ntype: ${entityType}\nname: ${entity.name ?? entity.skill ?? 'Unknown'}\nupdated: ${new Date().toISOString().split('T')[0]}\n---\n\n# ${entity.name ?? entity.skill ?? 'Unknown'}\n\nFailed to generate wiki page. Please try again.`
  }
}

/**
 * Answers a question using the user's wiki pages as context.
 * Returns: { answer, citations: [{ key, pageName, excerpt }] }
 */
export async function queryWiki(question, wikiPages, userStack = []) {
  const fallback = { answer: 'I could not find relevant information in your wiki to answer that.', citations: [] }

  try {
    if (!wikiPages.length) {
      return { answer: 'Your wiki is empty. Ingest some job postings, LinkedIn URLs, or notes first to build your career knowledge base.', citations: [] }
    }

    // Build context from wiki pages (most recent first, cap at 6000 chars)
    let contextChunks = []
    let totalLen = 0
    for (const page of [...wikiPages].reverse()) {
      const chunk = `=== ${page.key} ===\n${page.content ?? ''}\n`
      if (totalLen + chunk.length > 6000) break
      contextChunks.push({ key: page.key, pageName: page.pageName, chunk })
      totalLen += chunk.length
    }

    const context = contextChunks.map(c => c.chunk).join('\n')
    const pageKeys = contextChunks.map(c => c.key)

    const prompt = `You have access to a developer's career wiki. Answer their question using ONLY information from the wiki pages below.

User's stack: ${userStack.join(', ')}

Wiki pages:
${context}

Question: ${question}

Rules:
- Answer in 2-4 sentences max
- Cite sources using [page-key] notation
- If information is not in the wiki, say so clearly
- Be specific and actionable
- Return JSON: { "answer": "your answer with [citations]", "cited_keys": ["key1", "key2"] }`

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: 'You are a career intelligence assistant. Answer questions from a developer\'s personal wiki. Be concise and cite your sources. Return valid JSON only.',
      messages: [{ role: 'user', content: prompt }],
    })

    const result = parseJSON(response.content[0].text, null)
    if (!result) return fallback

    const citations = (result.cited_keys ?? [])
      .map(key => {
        const page = wikiPages.find(p => p.key === key)
        if (!page) return null
        const excerpt = (page.content ?? '').split('\n').find(line => line.trim() && !line.startsWith('---') && !line.startsWith('#'))
        return { key, pageName: page.pageName, excerpt: excerpt?.trim() ?? '' }
      })
      .filter(Boolean)

    return { answer: result.answer ?? fallback.answer, citations }
  } catch (err) {
    console.error('[Claude] queryWiki error:', err.message)
    return fallback
  }
}

/**
 * Generates a week-by-week learning roadmap based on the user's current gaps and goals.
 * Returns: { weeks: [{ week, theme, tasks: [], resources: [] }], summary }
 */
export async function generateRoadmap(userStack, gapSkills, goals = [], wikiPages = []) {
  const fallback = {
    weeks: [
      { week: 1, theme: 'Foundation', tasks: ['Identify your primary learning goal', 'Set up a learning schedule', 'Review your current stack strengths'], resources: [] },
      { week: 2, theme: 'Core Skills', tasks: ['Start learning the top skill gap', 'Build a mini project'], resources: [] },
    ],
    summary: 'Start with your highest-impact skill gap and build consistently.',
  }

  try {
    const gapList = gapSkills.slice(0, 6).map(g => `- ${g.skill}: ${g.why ?? ''} (${g.time_weeks ?? 2} weeks)`).join('\n')
    const wikiContext = wikiPages.slice(0, 5).map(p => `${p.key}: ${(p.content ?? '').split('\n').slice(0, 5).join(' ')}`).join('\n')

    const prompt = `Create a 4-week personalized learning roadmap for a developer.

Current stack: ${userStack.join(', ')}
Goals: ${goals.length ? goals.join(', ') : 'Get hired at a funded startup'}

Skill gaps to close:
${gapList}

Career wiki context:
${wikiContext}

Generate a practical 4-week roadmap. Return JSON:
{
  "weeks": [
    {
      "week": 1,
      "theme": "short theme name",
      "focus_skill": "primary skill this week",
      "tasks": ["specific task 1", "specific task 2", "specific task 3"],
      "resources": [{ "title": "resource name", "url": "https://...", "type": "course|docs|project|article" }],
      "milestone": "what they should be able to do by end of week"
    }
  ],
  "summary": "2-3 sentence overview of the roadmap strategy"
}

Be specific, realistic, and actionable. Prioritize skills that unlock multiple job opportunities.`

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS_WIKI,
      system: 'You are a developer career coach. Generate specific, actionable learning roadmaps. Return valid JSON only.',
      messages: [{ role: 'user', content: prompt }],
    })

    const result = parseJSON(response.content[0].text, fallback)
    return result
  } catch (err) {
    console.error('[Claude] generateRoadmap error:', err.message)
    return fallback
  }
}
