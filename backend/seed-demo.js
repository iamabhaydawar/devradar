/**
 * seed-demo.js
 * Pre-populates HydraDB with a demo user simulating 7 days of activity.
 * Run: node seed-demo.js
 */

import dotenv from 'dotenv'
dotenv.config()

import {
  initUser,
  recordStartupView,
  recordHackathonView,
  saveGapAnalysis,
  updateJourney,
  getUser,
} from './hydradb.js'

const DEMO_USER_ID = 'demo_user_001'

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

async function seed() {
  console.log('â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”')
  console.log('  DevRadar â€” Demo Seed Script')
  console.log('â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”')

  // â”€â”€ Day 0: Create user â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\n[Day 0] Creating demo user...')
  await initUser({
    userId: DEMO_USER_ID,
    stack: ['React', 'Node.js', 'Python'],
    experience: '0-1 years',
    goals: ['Land a job at an Indian unicorn', 'Participate in ETHIndia'],
    created_at: daysAgo(7),
  })
  console.log(`  âœ“ User created: ${DEMO_USER_ID}`)
  console.log('  âœ“ Stack: React, Node.js, Python')

  await updateJourney(DEMO_USER_ID, {
    type: 'account_created',
    data: { stack: ['React', 'Node.js', 'Python'] },
    timestamp: daysAgo(7),
  })

  // â”€â”€ Day 1: Viewed Razorpay and Groww â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\n[Day 1] User browses startups...')

  await recordStartupView(DEMO_USER_ID, 'razorpay', 'Razorpay')
  console.log('  âœ“ Viewed Razorpay')

  await updateJourney(DEMO_USER_ID, {
    type: 'startup_viewed',
    data: { startupId: 'razorpay', startupName: 'Razorpay', match_score: 62 },
    timestamp: daysAgo(6),
  })

  await recordStartupView(DEMO_USER_ID, 'groww', 'Groww')
  console.log('  âœ“ Viewed Groww')

  await updateJourney(DEMO_USER_ID, {
    type: 'startup_viewed',
    data: { startupId: 'groww', startupName: 'Groww', match_score: 58 },
    timestamp: daysAgo(6),
  })

  // â”€â”€ Day 3: Gap analysis â€” TypeScript and Docker identified â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\n[Day 3] Gap analysis run...')

  const gapAnalysisResult = {
    priority_skills: [
      {
        skill: 'TypeScript',
        why: 'Required by Razorpay, Groww, and 4 other unicorns',
        time_weeks: 2,
        difficulty: 'Easy if you know JavaScript',
        resource: 'https://www.typescriptlang.org/docs',
        salary_impact: '+15-20%',
      },
      {
        skill: 'Docker',
        why: 'Expected in all backend engineering interviews at unicorns',
        time_weeks: 1,
        difficulty: 'Beginner-friendly with good docs',
        resource: 'https://docs.docker.com/get-started',
        salary_impact: '+10-15%',
      },
      {
        skill: 'PostgreSQL',
        why: 'Razorpay and Groww both require strong SQL fundamentals',
        time_weeks: 2,
        difficulty: 'Moderate â€” focus on indexing and query optimization',
        resource: 'https://www.postgresql.org/docs/current/tutorial.html',
        salary_impact: '+8-12%',
      },
    ],
    quick_wins: ['Docker', 'REST APIs', 'Git'],
    long_term: ['System Design', 'DSA', 'Kubernetes'],
    overall_message:
      'Your React + Node.js + Python base is strong. Adding TypeScript and Docker will unlock most unicorn applications immediately. You are closer than you think.',
    stack: ['React', 'Node.js', 'Python'],
    targets: ['Razorpay', 'Groww'],
  }

  await saveGapAnalysis(DEMO_USER_ID, gapAnalysisResult)
  console.log('  âœ“ Gap analysis saved: TypeScript and Docker identified as top gaps')

  await updateJourney(DEMO_USER_ID, {
    type: 'gap_analysis_run',
    data: { top_gap: 'TypeScript', targets: ['Razorpay', 'Groww'] },
    timestamp: daysAgo(4),
  })

  // â”€â”€ Day 5: Viewed ETHIndia hackathon â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\n[Day 5] User checks hackathons...')

  await recordHackathonView(DEMO_USER_ID, 'ethindia-2026', 'ETHIndia 2026')
  console.log('  âœ“ Viewed ETHIndia 2026')

  await updateJourney(DEMO_USER_ID, {
    type: 'hackathon_viewed',
    data: { hackathonId: 'ethindia-2026', hackathonName: 'ETHIndia 2026', match_score: 45 },
    timestamp: daysAgo(2),
  })

  await recordHackathonView(DEMO_USER_ID, 'devfolio-season-10', 'Devfolio Season 10')
  console.log('  âœ“ Viewed Devfolio Season 10')

  await updateJourney(DEMO_USER_ID, {
    type: 'hackathon_viewed',
    data: { hackathonId: 'devfolio-season-10', hackathonName: 'Devfolio Season 10', match_score: 78 },
    timestamp: daysAgo(2),
  })

  // â”€â”€ Day 7: Return visit â€” memory recall â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\n[Day 7] User returns â€” HydraDB memory recall...')

  await updateJourney(DEMO_USER_ID, {
    type: 'return_visit',
    data: {
      message:
        'Welcome back! Last time you explored Razorpay and checked out ETHIndia 2026. Your top skill gap was TypeScript â€” let\'s see how your stack looks now.',
    },
    timestamp: new Date().toISOString(),
  })

  console.log('  âœ“ Return visit journey event logged')

  // â”€â”€ Verify â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\n[Verify] Reading demo user back from HydraDB...')
  const user = await getUser(DEMO_USER_ID)

  console.log(`  userId           : ${user.userId}`)
  console.log(`  stack            : ${user.stack.join(', ')}`)
  console.log(`  startups_viewed  : ${user.startups_viewed.length} entries`)
  console.log(`  hackathons_viewed: ${user.hackathons_viewed.length} entries`)
  console.log(`  gap_analyses     : ${user.gap_analyses.length} entries`)
  console.log(`  journey events   : ${user.journey.length} events`)

  console.log('\nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”')
  console.log('  Seed complete.')
  console.log(`  Demo user ID: ${DEMO_USER_ID}`)
  console.log('  Use this ID in the frontend to demo returning-user memory.')
  console.log('â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n')
}

seed().catch(err => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})

