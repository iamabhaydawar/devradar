# DevRadar
**Your career. One screen. Always remembered.**

> Built for **WikiThon 2026** â€” "Build your own Wikipedia with HydraDB"

DevRadar is an AI-powered career intelligence platform for Indian developers. It maps your tech stack into a live knowledge graph, matches you against 20 top Indian startups, surfaces relevant hackathons, identifies skill gaps, lets you chat with your own career wiki â€” and **remembers everything across sessions using HydraDB**.

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

## Architecture

```mermaid
flowchart TD
    subgraph Browser["Browser â€” React 18"]
        A[OnboardingWizard\n4-step first-run setup] --> B{App State Machine}
        B -->|checking| LS[LoadingScreen]
        B -->|onboarding| A
        B -->|returning| RS[ReturningScreen\npersonalised welcome]
        B -->|app + loading| LS
        B -->|app| MAIN[Main Layout]

        MAIN --> SB[Sidebar\ngraph Â· list Â· search]
        MAIN --> CG[CareerGraph\nvis-network knowledge graph]
        MAIN --> EG[EmptyGraphState\nfeed prompts]
        MAIN --> DP[DetailPanel\nnode detail]

        SB --> RP[Right Panels]
        RP --> IN[IngestPanel\npaste Â· URL Â· screenshot]
        RP --> CH[ChatInterface\nwiki-grounded Q&A]
        RP --> RM[RoadmapView\nweek-by-week plan]
        RP --> JV[JourneyView\ncareer timeline]

        MAIN --> TS[ThemeSwitcher\n3 light themes]
    end

    subgraph Backend["Backend â€” Node.js + Express"]
        API["/api/* â€” 11 endpoints"]
        API --> INIT[POST /user/init\ncreate profile]
        API --> ANL[POST /analyze\nstack Ã— startups]
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
        GROQ[Groq\nllama-3.3-70b\nFREE â€” primary]
        CLAUDE[Anthropic Claude\nsonnet-4\nfallback]
        GROQ -->|ingest Â· chat Â· roadmap| Backend
        CLAUDE -->|analyze Â· gaps Â· hackathons| Backend
    end

    subgraph Memory["HydraDB â€” Persistent Memory"]
        HKEY[devradar_user_\{userId\}]
        HKEY --> PROF[profile\nname Â· stack Â· experience Â· goals]
        HKEY --> VIEWS[activity log\nstartups Â· hackathons viewed]
        HKEY --> GAPS[gap analyses\npriority skills Â· salary impact]
        HKEY --> WPAGES[wiki pages\nmarkdown Â· company Â· skill Â· hackathon]
        HKEY --> ILOG[ingest log\nsources Â· pages created]
        HKEY --> JLOG[journey log\ntyped career events]
    end

    subgraph StaticData["Static Data â€” JSON"]
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
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ server.js           # Express API â€” 15 endpoints
â”‚   â”œâ”€â”€ hydradb.js          # HydraDB SDK wrapper + Map fallback
â”‚   â”œâ”€â”€ claude.js           # Claude AI â€” analyze, gaps, hackathons, roadmap
â”‚   â”œâ”€â”€ groq.js             # Groq AI â€” ingest, chat, roadmap (primary)
â”‚   â”œâ”€â”€ fetcher.js          # URL fetch + input type detection
â”‚   â”œâ”€â”€ seed-demo.js        # Demo data seeder
â”‚   â”œâ”€â”€ render.yaml         # Render deployment config
â”‚   â”œâ”€â”€ .env.example        # Environment variable template
â”‚   â””â”€â”€ data/
â”‚       â”œâ”€â”€ startups.json   # 20 Indian startup profiles with tech stacks
â”‚       â”œâ”€â”€ hackathons.json # 15 hackathons with deadlines + prize pools
â”‚       â””â”€â”€ skills.json     # 30 skills with demand scores + salary data
â””â”€â”€ frontend/
    â”œâ”€â”€ vercel.json         # Vercel deployment config
    â””â”€â”€ src/
        â”œâ”€â”€ App.jsx                      # State machine + graph builder
        â”œâ”€â”€ index.css                    # 3-theme CSS custom property system
        â”œâ”€â”€ main.jsx                     # Theme flash prevention
        â”œâ”€â”€ hooks/
        â”‚   â””â”€â”€ useTheme.js              # Theme read/write hook
        â””â”€â”€ components/
            â”œâ”€â”€ OnboardingWizard.jsx     # 4-step first-run wizard
            â”œâ”€â”€ OpeningScreen.jsx        # Legacy skill picker (fallback)
            â”œâ”€â”€ ReturningScreen.jsx      # Personalised welcome back
            â”œâ”€â”€ CareerGraph.jsx          # vis-network knowledge graph
            â”œâ”€â”€ EmptyGraphState.jsx      # Empty graph action cards
            â”œâ”€â”€ Sidebar.jsx              # Navigation + search + panels
            â”œâ”€â”€ DetailPanel.jsx          # Node detail drawer
            â”œâ”€â”€ IngestPanel.jsx          # Wiki ingest (JD Â· URL Â· screenshot)
            â”œâ”€â”€ ChatInterface.jsx        # Wiki-grounded career chat
            â”œâ”€â”€ RoadmapView.jsx          # Week-by-week learning plan
            â”œâ”€â”€ JourneyView.jsx          # Career event timeline
            â”œâ”€â”€ MemoryBadge.jsx          # HydraDB session indicator
            â”œâ”€â”€ ThemeSwitcher.jsx        # 3-theme switcher
            â””â”€â”€ icons.jsx               # Icon components
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

