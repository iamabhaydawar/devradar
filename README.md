# DevRadar
**Your career. One screen. Always remembered.**

> Built for **WikiThon 2026** — "Build your own Wikipedia with HydraDB"

DevRadar is an AI-powered career intelligence platform for Indian developers. It maps your tech stack into a live knowledge graph, matches you against 20 top Indian startups, surfaces relevant hackathons, identifies skill gaps, lets you chat with your own career wiki — and **remembers everything across sessions using HydraDB**.

---

## Live Links

| Service | URL |
|---|---|
| Frontend (Vercel) | https://devradar.vercel.app |
| Backend (Render) | https://devradar-backend.onrender.com |
| Health check | https://devradar-backend.onrender.com/api/health |

---

## API Keys Required

Only **2 keys** needed for full end-to-end functionality:

| Key | Service | Cost | Purpose |
|-----|---------|------|---------|
| `GROQ_API_KEY` | Groq | **Free** — [console.groq.com](https://console.groq.com) | All AI features — ingest, chat, roadmap, gap analysis |
| `HYDRADB_API_KEY` + `HYDRADB_PROJECT_ID` | HydraDB | See pricing | Persistent memory — user profiles, wiki pages, journey log |

> `ANTHROPIC_API_KEY` (Claude) is only used if Groq is **not** configured. You don't need both.
> The app runs without any keys using an in-memory fallback — data resets on server restart.

---

## One-Command Setup

```bash
git clone https://github.com/iamabhaydawar/devradar.git && cd devradar
cp backend/.env.example backend/.env   # fill in GROQ_API_KEY + HYDRADB keys
cd backend && npm install && cd ../frontend && npm install
```

Two terminals:

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

App runs at **http://localhost:5173**

---

## Architecture

```mermaid
flowchart TD
    subgraph Browser["Browser — React 18"]
        A[OnboardingWizard\n4-step first-run setup] --> B{App State Machine}
        B -->|checking| LS[LoadingScreen]
        B -->|onboarding| A
        B -->|returning| RS[ReturningScreen\npersonalised welcome]
        B -->|app + loading| LS
        B -->|app| MAIN[Main Layout]

        MAIN --> SB[Sidebar\ngraph · list · search]
        MAIN --> CG[CareerGraph\nvis-network knowledge graph]
        MAIN --> EG[EmptyGraphState\nfeed prompts]
        MAIN --> DP[DetailPanel\nnode detail]

        SB --> RP[Right Panels]
        RP --> IN[IngestPanel\npaste · URL · screenshot]
        RP --> CH[ChatInterface\nwiki-grounded Q&A]
        RP --> RM[RoadmapView\nweek-by-week plan]
        RP --> JV[JourneyView\ncareer timeline]

        MAIN --> TS[ThemeSwitcher\n3 light themes]
    end

    subgraph Backend["Backend — Node.js + Express"]
        API["/api/* — 11 endpoints"]
        API --> INIT[POST /user/init\ncreate profile]
        API --> ANL[POST /analyze\nstack × startups]
        API --> GAP[POST /gaps\nskill gap report]
        API --> HACK[GET /hackathons/:id\nranked by stack]
        API --> RET[GET /return-context/:id\npersonalised message]
        API --> ING[POST /ingest\n2-step LLM pipeline]
        API --> WIKI[GET /wiki-pages/:id\nall wiki pages]
        API --> CHAT[POST /chat\nwiki-grounded answer]
        API --> ROAD[GET /roadmap/:id\nlearning plan]
        API --> JOUR[GET /journey/:id\ncareer log]
    end

    subgraph AI["AI Layer"]
        GROQ[Groq\nllama-3.3-70b\nFREE — primary]
        CLAUDE[Anthropic Claude\nsonnet-4\nfallback]
        GROQ -->|ingest · chat · roadmap| Backend
        CLAUDE -->|analyze · gaps · hackathons| Backend
    end

    subgraph Memory["HydraDB — Persistent Memory"]
        HKEY[devradar_user_\{userId\}]
        HKEY --> PROF[profile\nname · stack · experience · goals]
        HKEY --> VIEWS[activity log\nstartups · hackathons viewed]
        HKEY --> GAPS[gap analyses\npriority skills · salary impact]
        HKEY --> WPAGES[wiki pages\nmarkdown · company · skill · hackathon]
        HKEY --> ILOG[ingest log\nsources · pages created]
        HKEY --> JLOG[journey log\ntyped career events]
    end

    subgraph StaticData["Static Data — JSON"]
        SD1[startups.json\n20 Indian startups]
        SD2[hackathons.json\n15 hackathons + deadlines]
        SD3[skills.json\n30 skills + demand scores]
    end

    Browser <-->|axios REST| Backend
    Backend <-->|HydraDB SDK / Map fallback| Memory
    Backend --> StaticData
    Backend <--> AI
```

---

## Features

| Feature | Description |
|---|---|
| **4-Step Onboarding** | First-run wizard collects name, experience, 3-state skill picker, goals, target companies and timeline |
| **Career Knowledge Graph** | vis-network graph — you, skills, gap skills, startups, hackathons as live nodes |
| **3 Light Themes** | Rosé Pine Dawn (default), Catppuccin Latte, Neutral Soft — persisted in localStorage |
| **Stack → Startup Matching** | Basic score for all 20 startups; deep Claude analysis for top 5 with target company boosting |
| **Hackathon Radar** | Upcoming hackathons ranked by your stack; deadline urgency badges |
| **Skill Gap Analysis** | AI-identified gaps with salary impact, time-to-learn, and learning resources |
| **Wiki Ingest** | Paste a JD, drop a URL, or upload a screenshot → 2-step LLM pipeline creates structured wiki pages |
| **Career Chat** | Ask anything — answers grounded in your personal wiki pages |
| **Learning Roadmap** | Week-by-week plan generated from your stack, gaps, goals and wiki |
| **Journey Log** | Typed timeline of every career event stored in HydraDB |
| **Persistent Memory** | HydraDB stores full profile — returning users see personalised welcome with stack, urgency alerts |
| **Empty State Prompts** | When graph has no data, action cards guide user to ingest |
| **Graceful Degradation** | App runs on in-memory Map if HydraDB key is missing; Groq → Claude fallback for AI |

---

## App State Machine

```
checking → onboarding → [loading] → app
         ↘ returning  ↗
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
| Frontend | React 18, vis-network (graph), CSS custom properties (3 themes), Vite → Vercel |
| Backend | Node.js, Express (ESM) → Render |
| AI — primary | Groq (`llama-3.3-70b-versatile`) — free tier |
| AI — fallback | Anthropic Claude (`claude-sonnet-4-20250514`) |
| Memory | HydraDB SDK with in-process `Map()` fallback |
| Data | Curated JSON — 20 startups, 15 hackathons, 30 skills |

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
| `POST` | `/api/ingest` | 2-step LLM pipeline: extract entities → generate wiki pages |
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
│   ├── server.js           # Express API — 15 endpoints
│   ├── hydradb.js          # HydraDB SDK wrapper + Map fallback
│   ├── claude.js           # Claude AI — analyze, gaps, hackathons, roadmap
│   ├── groq.js             # Groq AI — ingest, chat, roadmap (primary)
│   ├── fetcher.js          # URL fetch + input type detection
│   ├── seed-demo.js        # Demo data seeder
│   ├── render.yaml         # Render deployment config
│   ├── .env.example        # Environment variable template
│   └── data/
│       ├── startups.json   # 20 Indian startup profiles with tech stacks
│       ├── hackathons.json # 15 hackathons with deadlines + prize pools
│       └── skills.json     # 30 skills with demand scores + salary data
└── frontend/
    ├── vercel.json         # Vercel deployment config
    └── src/
        ├── App.jsx                      # State machine + graph builder
        ├── index.css                    # 3-theme CSS custom property system
        ├── main.jsx                     # Theme flash prevention
        ├── hooks/
        │   └── useTheme.js              # Theme read/write hook
        └── components/
            ├── OnboardingWizard.jsx     # 4-step first-run wizard
            ├── OpeningScreen.jsx        # Legacy skill picker (fallback)
            ├── ReturningScreen.jsx      # Personalised welcome back
            ├── CareerGraph.jsx          # vis-network knowledge graph
            ├── EmptyGraphState.jsx      # Empty graph action cards
            ├── Sidebar.jsx              # Navigation + search + panels
            ├── DetailPanel.jsx          # Node detail drawer
            ├── IngestPanel.jsx          # Wiki ingest (JD · URL · screenshot)
            ├── ChatInterface.jsx        # Wiki-grounded career chat
            ├── RoadmapView.jsx          # Week-by-week learning plan
            ├── JourneyView.jsx          # Career event timeline
            ├── MemoryBadge.jsx          # HydraDB session indicator
            ├── ThemeSwitcher.jsx        # 3-theme switcher
            └── icons.jsx               # Icon components
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
    { "startupId": "razorpay", "startupName": "Razorpay", "viewed_at": "…" }
  ],
  "hackathons_viewed": [
    { "hackathonId": "ethindia-2026", "hackathonName": "ETHIndia 2026", "viewed_at": "…" }
  ],
  "gap_analyses": [
    { "priority_skills": [{ "skill": "TypeScript", "time_weeks": 2, "salary_impact": "+15%" }] }
  ],
  "wiki_pages": {
    "company/razorpay": "# Razorpay\n…markdown…",
    "skill/typescript": "# TypeScript\n…markdown…"
  },
  "ingest_log": [
    { "inputType": "url", "source": "https://…", "pagesCreated": 3 }
  ],
  "journey": [
    { "type": "account_created", "data": {}, "timestamp": "…" },
    { "type": "wiki_ingest", "data": { "pagesCreated": 3 }, "timestamp": "…" }
  ]
}
```

---

## Deployment

### Backend → Render

1. Connect GitHub repo at [render.com](https://render.com)
2. Set root directory to `backend/`
3. Add env vars: `GROQ_API_KEY`, `HYDRADB_API_KEY`, `HYDRADB_PROJECT_ID`
4. `render.yaml` handles build and start commands automatically

### Frontend → Vercel

1. Connect GitHub repo at [vercel.com](https://vercel.com)
2. Set root directory to `frontend/`
3. Add env var: `VITE_API_URL=https://devradar-backend.onrender.com`
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
Every meaningful API call reads or writes HydraDB. `GET /api/return-context/:userId` reconstructs a personalised narrative purely from stored memory — stack, viewed startups, gap history, hackathon urgency.

**2. The onboarding → graph → ingest → chat loop**
Complete the 4-step wizard → see your career graph → paste a job description into Ingest → watch the graph grow → ask Career Chat a question grounded in what you just ingested.

**3. Returning user experience**
Log out (clear localStorage), return — the ReturningScreen shows your name, stack pills, and upcoming deadlines sourced entirely from HydraDB.

**4. Graceful degradation**
Remove all API keys → the app still runs, the graph still renders, data just resets on restart. The server log shows which mode is active.

**5. Three-theme light design**
Switch between Rosé Pine Dawn, Catppuccin Latte, and Neutral Soft in the sidebar. The graph node colours re-render live.

---

## WikiThon 2026 Alignment

DevRadar is a **living, personal Wikipedia of developer careers**:
- Every user's career data is stored, structured, and enriched every session (like a Wikipedia article being edited)
- HydraDB is the persistence engine — the "article" grows richer with every ingest, chat, and analysis
- The wiki ingest pipeline turns raw job descriptions and URLs into structured knowledge pages
- Returning users experience compounding value — the system knows more about them every time

*Built for WikiThon 2026 by Team DevRadar.*
