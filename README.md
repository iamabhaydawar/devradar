# DevRadar
**Your Guide to Real-Time Developer Discovery**

> Built for **WikiThon 2026** â€” "Build your own Wikipedia with HydraDB"

DevRadar is an AI-powered career intelligence platform for Indian developers. It maps your tech stack into a live knowledge graph, matches you against 20 top Indian startups, surfaces relevant hackathons, identifies skill gaps, lets you chat with your own career wiki, and **remembers everything across sessions using HydraDB**.

---

## Live Links

| Service | URL |
|---|---|
| Frontend (Vercel) | https://devradar-seven.vercel.app |
| Backend (Render) | https://devradar-3v4h.onrender.com |
| Health check | https://devradar-3v4h.onrender.com/api/health |

---

## API Keys Required

Only **2 keys** needed for full end-to-end functionality:

| Key | Service | Cost | Purpose |
|-----|---------|------|---------|
| `GROQ_API_KEY` | Groq | **Free** â€” [console.groq.com](https://console.groq.com) | All AI features â€” ingest, chat, roadmap, gap analysis |
| `HYDRADB_API_KEY` + `HYDRADB_PROJECT_ID` | HydraDB | See pricing | Persistent memory â€” user profiles, wiki pages, journey log |

> `ANTHROPIC_API_KEY` (Claude) is only used if Groq is **not** configured. You don't need both.
> The app runs without any keys using an in-memory fallback â€” data resets on server restart.

---

## One-Command Setup

```bash
git clone https://github.com/iamabhaydawar/devradar.git && cd devradar
cp backend/.env.example backend/.env   # fill in GROQ_API_KEY + HYDRADB keys
cd backend && npm install && cd ../frontend && npm install
```

Two terminals:

```bash
# Terminal 1 â€” backend
cd backend && npm run dev

# Terminal 2 â€” frontend
cd frontend && npm run dev
```

App runs at **http://localhost:5173**

---
<img width="1915" height="1075" alt="image" src="https://github.com/user-attachments/assets/4eba8571-733c-453d-8b4d-6e3c10f15477" />

## Architecture

```mermaid
flowchart TD
    subgraph Browser["Browser - React 18 (Vite)"]
        A[OnboardingWizard\ncreates profile] --> B{App state}
        B -->|checking| LS[LoadingScreen]
        B -->|onboarding| A
        B -->|returning| RS[ReturningScreen]
        B -->|app| MAIN[Main graph layout]

        MAIN --> SB[Sidebar]
        MAIN --> CG[CareerGraph]
        MAIN --> EG[EmptyGraphState]
        MAIN --> DP[DetailPanel]
        MAIN --> RP[Right panel router]
        RP --> IN[IngestPanel]
        RP --> CH[ChatInterface]
        RP --> RM[RoadmapView]
        RP --> JV[JourneyView]
    end

    subgraph Backend["Backend - Node.js + Express"]
        API["/api/* - 15 endpoints"]
        API --> HEALTH[GET /health]
        API --> USERI[POST /user/init]
        API --> USERG[GET /user/:userId]
        API --> USERS[POST /user/:userId/stack]
        API --> ANL[POST /analyze]
        API --> GAP[POST /gaps]
        API --> HACK[GET /hackathons/:userId]
        API --> RET[GET /return-context/:userId]
        API --> SK[GET /skills]
        API --> ING[POST /ingest]
        API --> WIKIS[GET /wiki-pages/:userId]
        API --> WIKI[GET /wiki/:userId/:pageType/:pageName]
        API --> CHAT[POST /chat]
        API --> ROAD[GET /roadmap/:userId]
        API --> JOUR[GET /journey/:userId]
        API --> GRAPH[GET /graph-data/:userId]
    end

    subgraph AI["AI providers"]
        SEL[Provider selection at startup]
        GROQ[Groq - primary when key exists]
        CLAUDE[Claude module]
        SEL --> GROQ
        SEL --> CLAUDE
        GROQ -->|ingest step1/step2,\nchat, roadmap| Backend
        CLAUDE -->|analyze, gaps,\nhackathons| Backend
        CLAUDE -->|fallback for ingest,\nchat, roadmap| Backend
    end

    subgraph Memory["HydraDB memory layer"]
        HKEY["devradar_user_(userId)"]
        HKEY --> PROF[profile + targets + timeline]
        HKEY --> VIEWS[startup/hackathon views]
        HKEY --> GAPS[gap analyses]
        HKEY --> WPAGES[wiki pages by type/name]
        HKEY --> ILOG[ingest log]
        HKEY --> JLOG[journey events]
    end

    subgraph StaticData["Static JSON datasets"]
        SD1[startups.json]
        SD2[hackathons.json]
        SD3[skills.json]
    end

    Browser <-->|axios REST| Backend
    Backend <-->|HydraDB SDK or in-memory Map fallback| Memory
    Backend --> StaticData
    Backend <--> AI
```

---

## Features

| Feature | Description |
|---|---|
| **4-Step Onboarding** | First-run wizard collects name, experience, 3-state skill picker, goals, target companies and timeline |
| **Career Knowledge Graph** | vis-network graph â€” you, skills, gap skills, startups, hackathons as live nodes |
| **3 Light Themes** | RosÃ© Pine Dawn (default), Catppuccin Latte, Neutral Soft â€” persisted in localStorage |
| **Stack â†’ Startup Matching** | Basic score for all 20 startups; deep Claude analysis for top 5 with target company boosting |
| **Hackathon Radar** | Upcoming hackathons ranked by your stack; deadline urgency badges |
| **Skill Gap Analysis** | AI-identified gaps with salary impact, time-to-learn, and learning resources |
| **Wiki Ingest** | Paste a JD, drop a URL, or upload a screenshot â†’ 2-step LLM pipeline creates structured wiki pages |
| **Career Chat** | Ask anything â€” answers grounded in your personal wiki pages |
| **Learning Roadmap** | Week-by-week plan generated from your stack, gaps, goals and wiki |
| **Journey Log** | Typed timeline of every career event stored in HydraDB |
| **Persistent Memory** | HydraDB stores full profile â€” returning users see personalised welcome with stack, urgency alerts |
| **Empty State Prompts** | When graph has no data, action cards guide user to ingest |
| **Graceful Degradation** | App runs on in-memory Map if HydraDB key is missing; Groq â†’ Claude fallback for AI |

---

## App State Machine

```
checking â†’ onboarding â†’ [loading] â†’ app
         â†˜ returning  â†—
```

| State | Trigger | Screen |
|---|---|---|
| `checking` | App mount | Spinner while reading localStorage |
| `onboarding` | No userId found | 4-step OnboardingWizard |
| `returning` | userId found + HydraDB has history | Personalised ReturningScreen |
| `app` | Profile loaded | Main graph layout |
| `loading` (sub-state) | Fetching graph data | Step-progress LoadingScreen |

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, vis-network (graph), CSS custom properties (3 themes), Vite â†’ Vercel |
| Backend | Node.js, Express (ESM) â†’ Render |
| AI â€” primary | Groq (`llama-3.3-70b-versatile`) â€” free tier |
| AI â€” fallback | Anthropic Claude (`claude-sonnet-4-20250514`) |
| Memory | HydraDB SDK with in-process `Map()` fallback |
| Data | Curated JSON â€” 20 startups, 15 hackathons, 30 skills |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/health` | HydraDB + AI key status |
| `POST` | `/api/user/init` | Create profile (name, stack, experience, goals, companies) |
| `GET`  | `/api/user/:userId` | Full HydraDB profile |
| `POST` | `/api/user/:userId/stack` | Update stack |
| `POST` | `/api/analyze` | Match stack vs startups; boosts target companies; Claude top-5 |
| `POST` | `/api/gaps` | Prioritised skill gap report with salary impact |
| `GET`  | `/api/hackathons/:userId?stack=` | Hackathons ranked by skill match |
| `GET`  | `/api/return-context/:userId` | Personalised return message + urgent deadlines |
| `POST` | `/api/ingest` | 2-step LLM pipeline: extract entities â†’ generate wiki pages |
| `GET`  | `/api/wiki-pages/:userId` | All wiki pages for a user |
| `GET`  | `/api/wiki/:userId/:type/:name` | Single wiki page |
| `POST` | `/api/chat` | Wiki-grounded Q&A |
| `GET`  | `/api/roadmap/:userId` | Week-by-week learning roadmap |
| `GET`  | `/api/journey/:userId` | Career journey event log |
| `GET`  | `/api/skills` | Full skill taxonomy |

---

## Project Structure

```
devradar/
├── backend/
│   ├── server.js           # Express API - 15 endpoints
│   ├── hydradb.js          # HydraDB SDK wrapper + Map fallback
│   ├── claude.js           # Claude AI - analyze, gaps, hackathons, roadmap
│   ├── groq.js             # Groq AI - ingest, chat, roadmap (primary)
│   ├── analyzer.js         # Stack matching and scoring helpers
│   ├── fetcher.js          # URL fetch + input type detection
│   ├── seed-demo.js        # Demo data seeder
│   ├── render.yaml         # Render deployment config
│   ├── .env.example        # Environment variable template
│   └── data/
│       ├── startups.json   # 20 Indian startup profiles with tech stacks
│       ├── hackathons.json # 15 hackathons with deadlines + prize pools
│       └── skills.json     # 30 skills with demand scores + salary data
└── frontend/
    ├── index.html          # Landing page shell + meta
    ├── vercel.json         # Vercel deployment config
    ├── vite.config.js      # Vite dev server + API proxy
    └── src/
        ├── App.jsx                      # State machine + graph builder
        ├── index.css                    # 3-theme CSS custom property system
        ├── main.jsx                     # Theme flash prevention
        ├── hooks/
        │   └── useTheme.js              # Theme read/write hook
        └── components/
            ├── LandingPage.jsx          # Marketing landing + CTA
            ├── OnboardingWizard.jsx     # 4-step first-run wizard
            ├── OpeningScreen.jsx        # Legacy skill picker (fallback)
            ├── ReturningScreen.jsx      # Personalised welcome back
            ├── CareerGraph.jsx          # vis-network knowledge graph
            ├── EmptyGraphState.jsx      # Empty graph action cards
            ├── Sidebar.jsx              # Navigation + search + panels
            ├── DetailPanel.jsx          # Node detail drawer
            ├── WikiPanel.jsx            # Wiki page browser
            ├── IngestPanel.jsx          # Wiki ingest (JD / URL / screenshot)
            ├── ChatInterface.jsx        # Wiki-grounded career chat
            ├── RoadmapView.jsx          # Week-by-week learning plan
            ├── JourneyView.jsx          # Career event timeline
            ├── StackInput.jsx           # Skill stack input control
            ├── MemoryBadge.jsx          # HydraDB session indicator
            ├── ThemeSwitcher.jsx        # 3-theme switcher
            ├── Logo.jsx                 # Brand mark
            ├── DevRadarLogo.jsx         # Animated logo variant
            └── icons.jsx                # Icon components
```

---

## HydraDB Data Model

Each user is a single document keyed `devradar_user_{userId}`:

```json
{
  "userId": "uuid-v4",
  "name": "Arjun",
  "stack": ["React", "Node.js", "TypeScript"],
  "learning_stack": ["Rust", "Docker"],
  "experience": "student",
  "goals": ["internship", "hackathon"],
  "target_role": "Full Stack Developer",
  "target_companies": ["razorpay", "groww"],
  "timeline": "3-6 months",
  "startups_viewed": [
    { "startupId": "razorpay", "startupName": "Razorpay", "viewed_at": "â€¦" }
  ],
  "hackathons_viewed": [
    { "hackathonId": "ethindia-2026", "hackathonName": "ETHIndia 2026", "viewed_at": "â€¦" }
  ],
  "gap_analyses": [
    { "priority_skills": [{ "skill": "TypeScript", "time_weeks": 2, "salary_impact": "+15%" }] }
  ],
  "wiki_pages": {
    "company/razorpay": "# Razorpay\nâ€¦markdownâ€¦",
    "skill/typescript": "# TypeScript\nâ€¦markdownâ€¦"
  },
  "ingest_log": [
    { "inputType": "url", "source": "https://â€¦", "pagesCreated": 3 }
  ],
  "journey": [
    { "type": "account_created", "data": {}, "timestamp": "â€¦" },
    { "type": "wiki_ingest", "data": { "pagesCreated": 3 }, "timestamp": "â€¦" }
  ]
}
```

---

## Deployment

### Backend â†’ Render

1. Connect GitHub repo at [render.com](https://render.com)
2. Set root directory to `backend/`
3. Add env vars: `GROQ_API_KEY`, `HYDRADB_API_KEY`, `HYDRADB_PROJECT_ID`
4. `render.yaml` handles build and start commands automatically

### Frontend â†’ Vercel

1. Connect GitHub repo at [vercel.com](https://vercel.com)
2. Set root directory to `frontend/`
3. Add env var: `VITE_API_URL=https://devradar-3v4h.onrender.com`
4. `vercel.json` handles SPA routing automatically

---

## Fresh Start / Reset

To wipe all data and restart the onboarding flow:

```js
// Browser DevTools console
localStorage.clear()
location.reload()
```

Then restart the backend (clears the in-memory Map if HydraDB isn't configured).

---

## What Judges Should Look for

**1. HydraDB is the product, not a feature**
Every meaningful API call reads or writes HydraDB. `GET /api/return-context/:userId` reconstructs a personalised narrative purely from stored memory â€” stack, viewed startups, gap history, hackathon urgency.

**2. The onboarding â†’ graph â†’ ingest â†’ chat loop**
Complete the 4-step wizard â†’ see your career graph â†’ paste a job description into Ingest â†’ watch the graph grow â†’ ask Career Chat a question grounded in what you just ingested.

**3. Returning user experience**
Log out (clear localStorage), return â€” the ReturningScreen shows your name, stack pills, and upcoming deadlines sourced entirely from HydraDB.

**4. Graceful degradation**
Remove all API keys â†’ the app still runs, the graph still renders, data just resets on restart. The server log shows which mode is active.

**5. Three-theme light design**
Switch between RosÃ© Pine Dawn, Catppuccin Latte, and Neutral Soft in the sidebar. The graph node colours re-render live.

---

## WikiThon 2026 Alignment

DevRadar is a **living, personal Wikipedia of developer careers**:
- Every user's career data is stored, structured, and enriched every session (like a Wikipedia article being edited)
- HydraDB is the persistence engine â€” the "article" grows richer with every ingest, chat, and analysis
- The wiki ingest pipeline turns raw job descriptions and URLs into structured knowledge pages
- Returning users experience compounding value â€” the system knows more about them every time

*Built for WikiThon 2026 by Team DevRadar.*

