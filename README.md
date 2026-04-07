<div align="center">

```
 █████╗ ██╗    ██████╗  ██████╗  █████╗ ███████╗████████╗
██╔══██╗██║    ██╔══██╗██╔═══██╗██╔══██╗██╔════╝╚══██╔══╝
███████║██║    ██████╔╝██║   ██║███████║███████╗   ██║   
██╔══██║██║    ██╔══██╗██║   ██║██╔══██║╚════██║   ██║   
██║  ██║██║    ██║  ██║╚██████╔╝██║  ██║███████║   ██║   
╚═╝  ╚═╝╚═╝    ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝   ╚═╝   
███╗   ███╗██╗   ██╗     ██████╗ ██████╗ ██████╗ ███████╗
████╗ ████║╚██╗ ██╔╝    ██╔════╝██╔═══██╗██╔══██╗██╔════╝
██╔████╔██║ ╚████╔╝     ██║     ██║   ██║██║  ██║█████╗  
██║╚██╔╝██║  ╚██╔╝      ██║     ██║   ██║██║  ██║██╔══╝  
██║ ╚═╝ ██║   ██║       ╚██████╗╚██████╔╝██████╔╝███████╗
╚═╝     ╚═╝   ╚═╝        ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝
```

### *Paste a GitHub repo. Get destroyed.*

<br/>

[![Live Demo](https://img.shields.io/badge/LIVE_DEMO-ai--roast--my--code.vercel.app-00ff88?style=for-the-badge&logo=vercel&logoColor=black)](https://ai-roast-my-code.vercel.app)
[![Backend](https://img.shields.io/badge/BACKEND-ai--roast--backend.onrender.com-00ff88?style=for-the-badge&logo=render&logoColor=black)](https://ai-roast-backend.onrender.com/health)
[![License](https://img.shields.io/badge/LICENSE-MIT-ff3355?style=for-the-badge)](LICENSE)
[![100 Days](https://img.shields.io/badge/100_DAYS_OF-VIBE_CODING-ffaa00?style=for-the-badge)](https://github.com/Swapnil-bo)

<br/>

> **"Error handling? What's that?"**
> — the AI, reviewing one of my own repos at brutality level 5

<br/>

</div>

---

## What Is This?

**AI Roast My Code** is a full-stack web app that uses a large language model to review any public GitHub repository and roast its code quality — with a brutality slider that goes from *gentle mentor* to *Gordon Ramsay screaming at your variable names*.

Paste a repo URL. Pick how much pain you want. Watch an AI tear apart your life choices.

It gives you:
- An **overall score** out of 100 with a letter grade
- **5 category breakdowns** — code quality, naming, error handling, architecture, documentation
- A **full roast** written in your chosen persona
- A **savage quote** — the most brutal single line, ready to screenshot
- A **downloadable roast card** to share on X / LinkedIn

---

## Demo

<div align="center">

| Input | Result |
|-------|--------|
| Paste any public GitHub URL | Score, grade, full roast, category breakdown |
| Drag the brutality slider to 5 | Gordon Ramsay mode activates |
| Click "Download Card" | Get a 1200×630 PNG to post anywhere |
| Click "Share on 𝕏" | Pre-filled tweet with your roast card |

</div>

---

## Brutality Levels

| Level | Persona | Vibe |
|-------|---------|------|
| 1 | 🌱 Gentle Mentor | Warm, encouraging, "here's an opportunity to grow..." |
| 2 | 📋 Code Reviewer | Professional PR tone, firm but respectful |
| 3 | 💼 Senior Dev | Blunt, direct, zero sugarcoating |
| 4 | 😤 Tech Lead on Monday | Sarcastic, tired, technically devastating |
| 5 | 🔥 Gordon Ramsay Mode | "This code is RAW. Delete the repo. Salt the earth." |

---

## Grading Scale

| Score | Grade | Verdict |
|-------|-------|---------|
| 95–100 | S | "Actually clean. Are you even human?" |
| 90–94 | A | "Senior dev would merge without comments." |
| 80–89 | A- | "Solid. Minor things, nothing embarrassing." |
| 70–79 | B+ | "Good bones. A few rooms need renovation." |
| 60–69 | B / B- | "Decent. Ship it, fix it later." |
| 50–59 | C | "Tech debt moving in. It brought luggage." |
| 40–49 | D+ / D | "Junior energy. Everywhere." |
| 35–39 | D- | "Every PR reviewer aged 5 years." |
| 0–34 | F | "Delete the repo. Salt the earth. Begin again." |

---

## Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Framework | FastAPI (Python 3.11+) |
| LLM | Groq API — `llama-3.3-70b-versatile` |
| GitHub Data | GitHub REST API (no auth needed for public repos) |
| HTTP Client | `httpx` with `AsyncClient` + `asyncio.gather()` |
| Card Generation | `Pillow` — 1200×630 PNG |
| Validation | Pydantic v2 |
| Server | Uvicorn |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite |
| Styling | Plain CSS + CSS variables (zero Tailwind) |
| HTTP | Axios with 60s timeout |
| Card Export | `html2canvas` |
| Fonts | JetBrains Mono + Syne (Google Fonts) |

### Infrastructure
| Concern | Service |
|---------|---------|
| Backend | Render (free tier) |
| Frontend | Vercel |
| LLM | Groq (free tier) |

---

## Project Structure

```
ai-roast-my-code/
├── backend/
│   ├── main.py               # FastAPI routes, CORS, rate limiting
│   ├── roaster.py            # Groq prompt logic, JSON parse, retry
│   ├── github_fetcher.py     # Concurrent file fetching, tree parsing
│   ├── card_generator.py     # Pillow roast card generation
│   ├── models.py             # Pydantic v2 request/response models
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── components/
        │   ├── BrutalitySlider.jsx   # Custom range input, level labels
        │   ├── RepoInput.jsx         # URL input + validation
        │   ├── RoastCard.jsx         # Score ring, bars, savage quote
        │   ├── ShareButton.jsx       # html2canvas + X share
        │   └── Loader.jsx            # Animated terminal loading
        └── api/
            └── roast.js              # Axios client, 60s timeout
```

---

## API Reference

### `POST /api/roast`

```json
// Request
{
  "repo_url": "https://github.com/owner/repo",
  "brutality": 5
}

// Response
{
  "roast_id": "uuid-here",
  "overall_score": 23,
  "grade": "F",
  "headline": "A monument to chaos, held together by hope and duct tape.",
  "roast": "...",
  "categories": {
    "code_quality":       { "score": 20, "comment": "..." },
    "naming_conventions": { "score": 35, "comment": "..." },
    "error_handling":     { "score": 10, "comment": "..." },
    "architecture":       { "score": 30, "comment": "..." },
    "documentation":      { "score": 15, "comment": "..." }
  },
  "savage_quote": "I've seen better architecture in a tent.",
  "one_good_thing": "At least you used version control. Barely."
}
```

### `GET /api/card/{roast_id}`

Returns a `1200×630` PNG roast card. Used as the OG image when sharing on X.

### `GET /health`

```json
{ "status": "alive", "model": "llama-3.3-70b-versatile" }
```

---

## Run Locally

### Prerequisites
- Python 3.11+
- Node.js 18+
- A free [Groq API key](https://console.groq.com)

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env`:
```
GROQ_API_KEY=your_groq_api_key_here
```

Start the server:
```bash
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`. Test it:
```bash
curl http://localhost:8000/health
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:8000
```

Start the dev server:
```bash
npm run dev
```

Frontend runs at `http://localhost:5173`. The Vite proxy forwards `/api` calls to the backend — no CORS issues.

---

## Deploy

### Backend → Render

| Field | Value |
|-------|-------|
| Root Directory | `backend` |
| Runtime | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Instance Type | Free |

**Environment Variables:**
```
GROQ_API_KEY=your_key
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend → Vercel

| Field | Value |
|-------|-------|
| Root Directory | `frontend` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

**Environment Variables:**
```
VITE_API_URL=https://your-backend.onrender.com
```

> **Note on cold starts:** Render free tier spins down after inactivity. First request may take 20–40 seconds. The animated loader will keep users company.

---

## How It Works

```
User pastes GitHub URL
        │
        ▼
  Frontend validates URL regex
        │
        ▼
  POST /api/roast → FastAPI
        │
        ├── Fetch /repos/{owner}/{repo} → get default_branch
        │
        ├── Fetch repo tree (recursive)
        │
        ├── Filter source files (.py, .js, .ts, .jsx, .tsx, .go...)
        │       Exclude: node_modules, dist, build, venv, *.lock
        │
        ├── Select top 8 files (root-level first, then by priority)
        │
        ├── asyncio.gather() → fetch all 8 files concurrently
        │       Cap each file at 300 lines
        │
        ├── Build prompt with brutality persona
        │
        ├── Call Groq API → Llama 3.3 70B
        │
        ├── Parse JSON response → validate with Pydantic
        │       Retry once on parse failure
        │       Fallback roast if both attempts fail
        │
        └── Return structured roast + roast_id
                │
                ▼
        Frontend renders RoastCard
                │
                ├── Animated SVG score ring
                ├── Grade badge with bounce-in animation  
                ├── Staggered category bar fills
                ├── Savage quote highlight block
                └── Share on 𝕏 → tweet with backend card URL
                        │
                        ▼
                GET /api/card/{roast_id}
                → Pillow generates 1200×630 PNG
                → Twitter crawler fetches it as OG image
```

---

## Key Design Decisions

**Why Groq?** Free tier is actually generous, Llama 3.3 70B writes savage roasts, and inference is fast enough for real-time use.

**Why concurrent file fetching?** Sequential fetching of 8 files at 15s timeout each = worst case 2 minutes. `asyncio.gather()` brings that down to one round-trip latency.

**Why `default_branch` instead of `HEAD`?** The Git Trees API returns 404 on non-standard default branches when using `HEAD`. Fetching the repo metadata first guarantees correctness.

**Why Pillow on backend instead of html2canvas only?** Twitter's OG crawler needs a real URL that returns an image. A backend card endpoint lets the tweet preview render properly — not just a screenshot of someone's screen.

**Why no auth?** This is a public tool. Friction kills viral potential.

---

## Limitations

- **Public repos only** — private repos return a friendly error, not a crash
- **Max 8 files sampled** — large repos are analyzed via representative sampling, not exhaustively
- **Render cold starts** — first request after inactivity takes 20–40 seconds on the free tier
- **GitHub rate limit** — unauthenticated: 60 req/hour. Add `GITHUB_TOKEN` to the backend env if you expect traffic.

---

## Part of 100 Days of Vibe Coding

This project is part of my **#100DaysOfVibeCoding** challenge — building and shipping one AI project per session, in public, no tutorials, no hand-holding.

Follow the journey:

[![X](https://img.shields.io/badge/X-@SwapnilHazra4-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/SwapnilHazra4)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Swapnil_Hazra-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/swapnil-hazra)
[![GitHub](https://img.shields.io/badge/GitHub-Swapnil--bo-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Swapnil-bo)

---

## License

MIT — use it, fork it, roast your friends' code with it.

---

<div align="center">

*Built with FastAPI, Groq, React, and a concerning amount of spite.*

**[ ai-roast-my-code.vercel.app ]**

</div>