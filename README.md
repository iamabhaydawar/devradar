# DevRadar
**Your career. One screen. Always remembered.**

> Built for **WikiThon 2025** — "Build your own Wikipedia with HydraDB"

DevRadar is an AI-powered career intelligence platform for Indian developers. It matches your tech stack against 20 top Indian startups, surfaces relevant hackathons, identifies skill gaps with Claude AI, and **remembers your entire journey across sessions using HydraDB** — making it a living, personal Wikipedia of your developer career.

---

## What Makes DevRadar Different

Every other tool forgets you the moment you close the tab. DevRadar doesn't.

When you return, HydraDB recalls your stack, which startups you explored, what gaps Claude identified, and which hackathons you bookmarked. Claude's responses are context-aware: *"Welcome back — last time you were interested in Zepto and needed to learn Go. Here's what's changed."*

**HydraDB is not a side feature. It is the product.**

---

## Features

| Feature | Description |
|---|---|
| Stack Matching | Enter your tech skills → ranked matches against 20 Indian startups |
| Hackathon Radar | Upcoming hackathons filtered by your stack and interests |
| Gap Analysis | Claude AI identifies what skills you're missing for your target companies |
| Persistent Memory | HydraDB stores your full journey — returns are context-aware |
| Memory Timeline | Visual history of every session, viewable on the dashboard |

---

## Tech Stack

- **Frontend**: React 18 + Tailwind CSS (dark mode, mobile-first) → Vercel
- **Backend**: Node.js + Express → Render
- **AI**: Anthropic Claude API (`claude-sonnet-4-20250514`)
- **Memory**: HydraDB SDK (persistent cross-session user profiles)
- **Data**: Hardcoded JSON (realistic, curated data)

---

## Setup

### Prerequisites
- Node.js ≥ 18
- Anthropic API key
- HydraDB API key (from [hydradb.io](https://hydradb.io))

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in your API keys in .env
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server runs at `http://localhost:5173` and proxies `/api` calls to the backend at `http://localhost:3001`.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze` | Analyze a user's stack — returns startup matches, hackathons, skill gaps. Stores result in HydraDB. |
| `GET` | `/api/user/:userId` | Retrieve a user's full HydraDB profile (history, sessions, preferences) |
| `GET` | `/api/startups` | List all 20 startup profiles with tech stacks |
| `GET` | `/api/hackathons` | List all upcoming hackathons |
| `POST` | `/api/user/:userId/bookmark` | Bookmark a startup or hackathon (persisted in HydraDB) |
| `GET` | `/api/health` | Health check |

---

## How HydraDB Powers DevRadar

HydraDB stores a **user profile document** that grows with every session:

```json
{
  "userId": "uuid-v4",
  "profile": {
    "stack": ["React", "Node.js", "PostgreSQL"],
    "sessions": [
      {
        "timestamp": "2025-07-15T10:30:00Z",
        "startupsViewed": ["Zepto", "Razorpay"],
        "gapAnalysis": "You need Go and Kafka to be competitive at Zepto.",
        "hackathonsBookmarked": ["ETHIndia 2025"]
      }
    ],
    "totalSessions": 3,
    "bookmarkedStartups": ["Zepto"],
    "bookmarkedHackathons": ["ETHIndia 2025"]
  }
}
```

On every return visit, this profile is loaded and injected into Claude's system prompt, enabling personalized, context-aware career guidance.

---

## Project Structure

```
devradar/
├── backend/
│   ├── server.js        # Express API server
│   ├── hydradb.js       # HydraDB client wrapper (core memory layer)
│   ├── claude.js        # Anthropic Claude AI integration
│   ├── analyzer.js      # Stack matching + gap scoring logic
│   └── data/
│       ├── startups.json    # 20 Indian startup profiles
│       ├── hackathons.json  # Upcoming hackathon listings
│       └── skills.json      # Skill taxonomy + relationships
└── frontend/
    └── src/
        ├── App.jsx
        └── components/
            ├── StackInput.jsx    # Tech stack entry + user ID
            ├── Dashboard.jsx     # Main results view
            ├── StartupCard.jsx   # Startup match card
            ├── HackathonCard.jsx # Hackathon listing card
            ├── GapAnalysis.jsx   # Claude AI gap analysis panel
            └── MemoryBadge.jsx   # HydraDB session history indicator
```

---

## Deployment

**Backend → Render**
- Connect GitHub repo, set root to `backend/`
- Add environment variables in Render dashboard
- Build command: `npm install` | Start command: `npm start`

**Frontend → Vercel**
- Connect GitHub repo, set root to `frontend/`
- Add `VITE_API_URL` env var pointing to your Render backend URL
- Framework preset: Vite

---

## WikiThon 2025 Alignment

DevRadar is a **personalized Wikipedia of developer careers**:
- Every user's career data is stored, versioned, and retrievable (like a Wikipedia article)
- HydraDB is the database engine making this persistence possible
- The "article" grows richer with every session — more context, better AI responses
- It's queryable, structured, and always up to date

*Built solo in 48 hours for WikiThon 2025.*
