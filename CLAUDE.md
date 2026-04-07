# CLAUDE.md — AI Roast My Code
> *"Paste a GitHub repo. Get destroyed."*

---

## ⛔ ABSOLUTE LAWS — READ BEFORE TOUCHING ANYTHING

```
┌─────────────────────────────────────────────────────────────┐
│  LAW 1: NO GIT COMMITS. EVER. NOT ONE. NOT EVEN STAGING.   │
│  LAW 2: ONE STEP AT A TIME. DO NOT RUN AHEAD.              │
│  LAW 3: DO NOT EXPLORE THE FULL CODEBASE UNPROMPTED.       │
│  LAW 4: DO NOT ADD DEPENDENCIES NOT IN THIS FILE.          │
│  LAW 5: DO NOT MODIFY FILES OUTSIDE THE CURRENT STEP.      │
└─────────────────────────────────────────────────────────────┘
```

**On git:** Do not run `git commit`, `git add`, `git push`, `git branch`, or any command
that writes to git history. Do not stage files. Git is **read-only** until the user
explicitly says otherwise. Violations are unacceptable. This is not a suggestion.

---

## Project Identity

| Field | Value |
|-------|-------|
| **Name** | AI Roast My Code |
| **Tagline** | Paste a GitHub repo. Get destroyed. |
| **Type** | Full-stack web app — FastAPI backend + React/Vite frontend |
| **Purpose** | Users paste a public GitHub repo URL, pick a brutality level (1–5), and an LLM roasts their code with a score + shareable roast card image |
| **Aesthetic** | Dark cyberpunk terminal — VS Code Dark meets underground hacker BBS |

---

## Tech Stack

### Backend
| Concern | Choice |
|---------|--------|
| Language | Python 3.11+ |
| Framework | FastAPI |
| LLM SDK | `groq` (official Python SDK) |
| LLM Model | `llama-3.3-70b-versatile` |
| HTTP Client | `httpx` with `AsyncClient` |
| Validation | Pydantic v2 |
| Server | `uvicorn` |
| Env | `python-dotenv` |
| Image gen | `Pillow` (for roast card image generation) |

### Frontend
| Concern | Choice |
|---------|--------|
| Framework | React 18 + Vite |
| Language | JavaScript (no TypeScript) |
| Styling | Plain CSS + CSS variables — zero Tailwind, zero component libs |
| HTTP | `axios` with a **60-second timeout** hardcoded |
| Card export | `html2canvas` (generates real shareable PNG of the roast card) |
| Fonts | `JetBrains Mono` (display/code), `Syne` (headlines) via Google Fonts |

### Infrastructure
| Concern | Choice |
|---------|--------|
| Backend deploy | Render (free tier) |
| Frontend deploy | Vercel |
| LLM | Groq free tier |
| GitHub data | GitHub REST API — token optional, but strongly recommended |

---

## Project Structure

```
ai-roast-my-code/
├── CLAUDE.md
├── .gitignore                    # See gitignore spec below
│
├── backend/
│   ├── main.py                   # FastAPI app, routes, CORS, rate limiting
│   ├── roaster.py                # Groq prompt logic + JSON parse + retry
│   ├── github_fetcher.py         # GitHub API: repo tree + concurrent file fetch
│   ├── card_generator.py         # Pillow: generates roast card PNG
│   ├── models.py                 # Pydantic v2 request/response models
│   ├── requirements.txt
│   └── .env                      # GROQ_API_KEY, GITHUB_TOKEN (never commit)
│
└── frontend/
    ├── index.html
    ├── vite.config.js            # Proxy: /api → localhost:8000 in dev
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css              # Global styles + all CSS variables
        ├── components/
        │   ├── RepoInput.jsx      # GitHub URL input + validation
        │   ├── BrutalitySlider.jsx # Standalone slider — brutality 1–5
        │   ├── RoastCard.jsx      # Score ring, grade, roast text, categories
        │   ├── ShareButton.jsx    # Generates PNG via html2canvas → share on X
        │   └── Loader.jsx         # Animated terminal loading with rotating lines
        └── api/
            └── roast.js           # axios POST /api/roast — 60s timeout
```

### .gitignore Contents (Explicit)
```
# Python
__pycache__/
*.pyc
*.pyo
venv/
.env

# Node
node_modules/
dist/
.env.local
.env.production

# OS
.DS_Store
Thumbs.db

# Build artifacts
*.egg-info/
```

---

## Environment Variables

### `backend/.env`
```
GROQ_API_KEY=your_groq_api_key_here
GITHUB_TOKEN=your_github_pat_here   # optional but critical — see GitHub rate limit section
```

### `frontend/.env`
```
VITE_API_URL=http://localhost:8000
```

### `frontend/.env.production`
```
VITE_API_URL=https://your-render-backend-url.onrender.com
```

**Rule:** Never reference these values directly in source. Backend uses `os.getenv()`.
Frontend always uses `import.meta.env.VITE_API_URL`. No exceptions.

---

## Vite Dev Proxy — REQUIRED

`vite.config.js` **must** configure a proxy so dev frontend can hit the backend without
CORS issues:

```js
export default {
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
    }
  }
}
```

This means in development, `axios` should call `/api/roast` (relative), not the full
`http://localhost:8000/api/roast`. The proxy handles it. In production, `VITE_API_URL`
provides the absolute Render URL.

---

## GitHub API — Rate Limits (Critical)

| Mode | Requests/hour | Survives production? |
|------|--------------|----------------------|
| Unauthenticated (same Render IP) | 60 total | ❌ Dies after 6 roasts |
| Authenticated (`Authorization: Bearer TOKEN`) | 5,000/user | ✅ Yes |

**Implementation rule:** `github_fetcher.py` must:
1. Check if `GITHUB_TOKEN` is set in env
2. If yes → include `Authorization: Bearer {token}` header on all GitHub API calls
3. If no → still work, but log a warning at startup: `"WARNING: No GITHUB_TOKEN set. Rate limit is 60 req/hr shared across ALL users."`

Never fail hard if the token is missing — degrade gracefully. But the token must be
documented as strongly recommended.

---

## Backend: `github_fetcher.py` — Full Spec

### Step 1: Parse GitHub URL
- Use regex to extract `owner` and `repo` from input URL
- Valid patterns: `https://github.com/{owner}/{repo}` (with or without trailing slash or `.git`)
- Reject anything that doesn't match — raise a `ValueError` with a clear message

### Step 2: Fetch Default Branch (Do NOT hardcode `HEAD`)
```
GET https://api.github.com/repos/{owner}/{repo}
```
Extract `default_branch` from the response. Use this value for all subsequent calls.
`HEAD` is unreliable for the Trees API on repos with non-standard default branches.

### Step 3: Fetch Repo Tree
```
GET https://api.github.com/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1
```
- If the tree is `truncated: true`, log a warning but continue with what was returned
- If the repo is private or doesn't exist, raise a specific `RepoNotFoundError`

### Step 4: Filter Source Files
**Include extensions:** `.py`, `.js`, `.ts`, `.jsx`, `.tsx`, `.go`, `.java`, `.cpp`, `.c`,
`.cs`, `.rs`, `.rb`, `.swift`, `.kt`, `.php`

**Exclude paths containing:** `node_modules`, `.git`, `dist`, `build`, `__pycache__`,
`venv`, `.venv`, `vendor`, `target`, `*.lock`, `*.min.js`, `*.min.css`, `package-lock.json`

**Priority order for file selection:**
1. Root-level files (path has no `/`)
2. Files named `main`, `index`, `app`, `server`, `router` (any extension)
3. Non-test, non-config source files
4. Everything else

**Hard cap:** Select max **8 files** from the prioritised list.

### Step 5: Fetch File Contents Concurrently
Use `asyncio.gather()` — do NOT fetch files sequentially. All 8 file fetches must
fire in parallel:

```python
import asyncio

async def fetch_all_files(client, owner, repo, branch, file_paths, headers):
    tasks = [fetch_single_file(client, owner, repo, branch, path, headers)
             for path in file_paths]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    # Filter out exceptions, log them, continue with successful results
    return [(path, content) for path, content in zip(file_paths, results)
            if not isinstance(content, Exception)]
```

Fetch URL: `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`

**Per-file rules:**
- Timeout: 15 seconds per file
- Cap at **300 lines** — truncate from the bottom if longer, append `\n# [TRUNCATED]`
- If a file fetch fails (404, timeout, etc.) — skip it silently, continue with others
- Never let one failed file abort the entire roast

### Async Client Setup
```python
async with httpx.AsyncClient(timeout=15.0) as client:
    # all GitHub calls happen inside this context
```

---

## Backend: `roaster.py` — Full Spec

### Input
- `files: list[tuple[str, str]]` — list of `(filename, content)` pairs
- `brutality: int` — 1 through 5

### Brutality Personas — System Prompts

| Level | Name | Persona Instructions |
|-------|------|----------------------|
| 1 | Gentle Mentor | Warm, encouraging senior dev. Lead with praise. Frame every criticism as an opportunity. Never say anything that would discourage a beginner. |
| 2 | Code Reviewer | Professional PR review. Technically precise. Point out issues firmly but respectfully. Use "consider", "this could be improved", "I'd suggest". |
| 3 | Senior Dev | Blunt and direct. No sugarcoating. Call out bad patterns by name. Zero tolerance for obvious mistakes, but no theatrics. |
| 4 | Tech Lead on Monday | Sarcastic. Visibly tired. Every comment drips with "why are we still doing this in 2024". Technically precise under the sarcasm. |
| 5 | Gordon Ramsay Mode | SAVAGE. Theatrical. Brutally funny. Use cooking metaphors. "This code is RAW!", "What IS this?", "My grandmother writes better loops and she's DEAD." Technically accurate under the drama. |

### JSON Response Schema

The model must return **only** valid JSON. No markdown fences. No preamble. No trailing
text. Enforce this in both the system prompt and the user message.

```json
{
  "overall_score": 42,
  "grade": "D",
  "headline": "One-liner that captures the roast in under 12 words",
  "roast": "Full roast — 3 to 5 paragraphs. Technically grounded. Persona-accurate.",
  "categories": {
    "code_quality":        { "score": 40, "comment": "One punchy sentence." },
    "naming_conventions":  { "score": 55, "comment": "One punchy sentence." },
    "error_handling":      { "score": 30, "comment": "One punchy sentence." },
    "architecture":        { "score": 45, "comment": "One punchy sentence." },
    "documentation":       { "score": 20, "comment": "One punchy sentence." }
  },
  "savage_quote": "The single most brutal / tweetable line from the roast. Under 140 chars.",
  "one_good_thing": "One genuine compliment. Even Gordon has to find something."
}
```

### Valid Grades (Strict Enum)
`S`, `A`, `A-`, `B+`, `B`, `B-`, `C+`, `C`, `C-`, `D+`, `D`, `D-`, `F`

The Pydantic model must use `Literal[...]` for grade — invalid grades are rejected at
parse time, not passed through.

### Parse + Retry Logic
```python
async def get_roast(files, brutality):
    for attempt in range(2):       # try twice before giving up
        raw = await call_groq(files, brutality)
        try:
            data = json.loads(raw)
            return RoastResponse(**data)   # Pydantic validates grade, scores, etc.
        except (json.JSONDecodeError, ValidationError):
            if attempt == 1:
                return FALLBACK_ROAST      # never crash the user
    return FALLBACK_ROAST
```

**FALLBACK_ROAST** is a hardcoded `RoastResponse` with score=0, grade="F",
headline="The LLM broke. Which is ironic.", and a funny canned roast.

### Token Budget Awareness
- 8 files × ~300 lines × ~10 tokens/line ≈ **24,000 tokens** of code context
- Llama 3.3 70B context window: 128K tokens — you are safe
- If this changes (file count or line cap increases), recalculate this estimate

---

## Backend: `card_generator.py` — Full Spec

Generates a **1200×630px PNG** (standard OG image size, perfect for Twitter cards).

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│  🔥 AI ROAST MY CODE            [SCORE CIRCLE]  [GRADE]     │
│                                                               │
│  "HEADLINE TEXT HERE"                                         │
│                                                               │
│  ─────────────────────────────────────────────────────────   │
│  SAVAGE QUOTE                                                 │
│  "The most brutal line from the roast"                        │
│  ─────────────────────────────────────────────────────────   │
│                                                               │
│  CODE QUALITY ████████░░ 80    NAMING ██████░░░░ 60          │
│  ERROR HDLNG  ████░░░░░░ 40    ARCH   ███████░░░ 70          │
│  DOCS         ██░░░░░░░░ 20                                   │
│                                                               │
│  roastmycode.vercel.app                    @YourHandle        │
└──────────────────────────────────────────────────────────────┘
```

- Background: `#0a0a0f` with a subtle green grid overlay
- Score circle: color-coded ring (green/amber/red) with score number centered
- Grade badge: large, bold, same color coding
- Headline: `Syne` or fallback monospace, large, white
- Savage quote: italic, electric green `#00ff88`, quoted
- Score bars: filled rectangles, color-coded per score
- Footer: site URL left, Twitter handle right

### API Endpoint
```
GET /api/card/{roast_id}
```
- Backend stores the last N roasts in an in-memory dict keyed by `roast_id` (UUID)
- `POST /api/roast` returns a `roast_id` in its response alongside the roast data
- `GET /api/card/{roast_id}` calls `card_generator.py`, returns `image/png`
- If `roast_id` not found: return 404

**Why Pillow instead of html2canvas?**
- html2canvas is used on the frontend for a quick "download card" button
- Pillow on the backend generates the canonical shareable image at a fixed resolution
- The X share link should point to the backend card URL for proper OG image embedding

---

## Backend: `models.py` — Full Spec

```python
from pydantic import BaseModel, Field
from typing import Literal

class RoastRequest(BaseModel):
    repo_url: str
    brutality: int = Field(ge=1, le=5)

class CategoryScore(BaseModel):
    score: int = Field(ge=0, le=100)
    comment: str

class RoastResponse(BaseModel):
    roast_id: str                    # UUID, generated in main.py
    overall_score: int = Field(ge=0, le=100)
    grade: Literal["S","A","A-","B+","B","B-","C+","C","C-","D+","D","D-","F"]
    headline: str
    roast: str
    categories: dict[str, CategoryScore]
    savage_quote: str
    one_good_thing: str

class ErrorResponse(BaseModel):
    error: str                       # machine-readable slug
    message: str                     # human-readable, can be sarcastic
```

---

## Backend: `main.py` — Full Spec

### Routes
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Returns `{"status": "alive", "model": "llama-3.3-70b-versatile"}` |
| `POST` | `/api/roast` | Main roast endpoint |
| `GET` | `/api/card/{roast_id}` | Returns roast card PNG |

### Rate Limiting
In-memory rate limiting is **best-effort only** — it resets on Render cold starts.
Implement it anyway (max 5 requests per IP per minute) with a clear code comment:

```python
# NOTE: This rate limiter is in-memory and resets on process restart.
# On Render free tier, cold starts will reset it. This is best-effort,
# not a security guarantee. For real rate limiting, use Redis or Upstash.
```

Do not present this as robust protection. The code comment is mandatory.

### CORS
```python
# Dev: allow all origins
# Prod: restrict to Vercel frontend URL only
allow_origins = [os.getenv("FRONTEND_URL", "*")]
```

Add `FRONTEND_URL` to the backend env var list.

### Error Handling
| Condition | HTTP Status | `error` slug |
|-----------|-------------|--------------|
| Invalid GitHub URL | 422 | `invalid_url` |
| Repo not found / private | 404 | `repo_not_found` |
| No source files in repo | 422 | `no_code_found` |
| Groq API failure | 503 | `llm_unavailable` |
| Rate limit hit | 429 | `rate_limited` |
| Card not found | 404 | `card_not_found` |

All error messages can be sarcastic. Never expose raw exception text to the frontend.

---

## Grading Scale

| Score | Grade | Vibe |
|-------|-------|------|
| 95–100 | S | "Actually clean. Are you even human?" |
| 90–94 | A | "Senior dev would merge without comments." |
| 80–89 | A- | "Solid. Minor things, but nothing embarrassing." |
| 75–79 | B+ | "Good bones. A few rooms need renovation." |
| 70–74 | B | "Decent. Ship it, fix it later." |
| 65–69 | B- | "Functional. But the tech debt is... visible." |
| 60–64 | C+ | "It works. That's the best I can say." |
| 55–59 | C | "Tech debt is moving in. It brought luggage." |
| 50–54 | C- | "Half the code is holding up the other half." |
| 45–49 | D+ | "Junior energy. Everywhere." |
| 40–44 | D | "Production? Bold move, Cotton." |
| 35–39 | D- | "Every PR reviewer aged 5 years." |
| 0–34 | F | "Delete the repo. Salt the earth. Begin again." |

---

## Frontend Implementation

### Design System — Dark Cyberpunk Terminal

```css
:root {
  /* Backgrounds */
  --bg-void:        #0a0a0f;   /* page background */
  --bg-surface:     #12121a;   /* card backgrounds */
  --bg-elevated:    #1a1a26;   /* input fields, hover states */

  /* Accents */
  --green:          #00ff88;   /* primary accent — "code" color */
  --green-dim:      rgba(0, 255, 136, 0.15); /* borders, glows */
  --green-glow:     rgba(0, 255, 136, 0.08); /* subtle bg tints */
  --crimson:        #ff3355;   /* bad scores, danger, level 5 */
  --amber:          #ffaa00;   /* mid scores, warnings */
  --white:          #e8e8f0;   /* body text */
  --muted:          #6b6b8a;   /* secondary text */

  /* Score color thresholds */
  --score-good:     var(--green);     /* ≥70 */
  --score-mid:      var(--amber);     /* 40–69 */
  --score-bad:      var(--crimson);   /* <40 */

  /* Typography */
  --font-mono:      'JetBrains Mono', 'Fira Code', monospace;
  --font-display:   'Syne', sans-serif;
  --font-body:      'Syne', sans-serif;

  /* Borders */
  --border:         1px solid var(--green-dim);
  --border-bright:  1px solid var(--green);
}
```

### `BrutalitySlider.jsx` — Standalone Component

This is its own component. `RepoInput.jsx` imports it. The slider logic lives here and
nowhere else.

- Custom-styled range input (CSS `appearance: none`)
- 5 labeled ticks: Gentle Mentor / Code Reviewer / Senior Dev / Tech Lead on Monday / Gordon Ramsay Mode
- Track color shifts from green (level 1) → amber (level 3) → crimson (level 5)
- At level 5: the entire slider glows red with a `box-shadow` pulse animation
- Props: `value`, `onChange`

### `RepoInput.jsx`

- Monospace text input for GitHub URL
- Imports and renders `<BrutalitySlider />` — does NOT contain slider logic
- "Roast My Code 🔥" button
  - At brutality 5: button border glows crimson, label changes to "DESTROY MY CODE 🔥"
  - Disabled during loading
- Validation on submit: must match `/^https:\/\/github\.com\/[^/]+\/[^/]+/`
- Show inline error if URL fails validation — never reach the backend with a bad URL

### `RoastCard.jsx`

- **Score ring:** SVG circle with `stroke-dashoffset` animation on mount. Color based on score thresholds.
- **Grade badge:** Large, bold, color-coded. Bounces in on mount with a CSS keyframe.
- **Headline:** Large `Syne` font, white, full width.
- **Roast text:** Styled `<blockquote>` with a green left border, slightly indented, body font.
- **Category bars:** 5 bars with `width` animated from 0 to score% on mount using CSS transitions with staggered `animation-delay` (each bar starts 100ms after the previous).
- **Savage quote:** Separate highlighted block — green text, larger font, quotation marks rendered as decorative oversized characters.
- **One good thing:** Green text, small, at the bottom. Preceded by a ✓ checkmark.
- **Download Card button:** Calls `html2canvas` on the card element → downloads PNG. This is the quick local download, distinct from the shareable backend card.

### `ShareButton.jsx`

```js
// Tweet text construction
const tweetText = encodeURIComponent(
  `My code got roasted ${score}/100 (${grade})\n\n"${savageQuote}"\n\n🔥 via AI Roast My Code`
);
const cardUrl = encodeURIComponent(`${backendUrl}/api/card/${roastId}`);
const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${cardUrl}`;
window.open(tweetUrl, '_blank');
```

- The `url` param in the tweet points to the backend card endpoint — Twitter's crawler
  will fetch it and render the PNG as an OG image card in the tweet.
- Button styled with X branding. Label: "Share on 𝕏"

### `Loader.jsx`

Rotating messages displayed as animated terminal output — each line types in, then the
next appears:

```js
const MESSAGES = [
  "Initializing judgment protocol...",
  "Summoning the code demons...",
  "Reading your spaghetti...",
  "Counting the TODO comments...",
  "Judging your variable names...",
  "Calculating technical debt...",
  "Preparing the damage report...",
  "Consulting the ancient scrolls of Stack Overflow...",
  "Sharpening the critique...",
];
```

- Each message appears with a typewriter effect using CSS animation
- Rotating every 3 seconds
- Green blinking cursor at the end of each line
- Show elapsed time: "Roasting... (12s)" — Render cold starts are slow, users need feedback

### `api/roast.js`

```js
import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '';

const client = axios.create({
  baseURL: BASE,
  timeout: 60000,   // 60 seconds — non-negotiable. Render cold start + Groq = slow.
});

export async function submitRoast(repoUrl, brutality) {
  const res = await client.post('/api/roast', { repo_url: repoUrl, brutality });
  return res.data;
}
```

- The 60-second timeout is **mandatory** — do not reduce it
- On timeout: display "The roast is taking forever. This might be a Render cold start — try again in 30 seconds." as a user-facing error message

---

## API Contract

### `POST /api/roast`

**Request:**
```json
{ "repo_url": "https://github.com/owner/repo", "brutality": 3 }
```

**Success (200):**
```json
{
  "roast_id": "550e8400-e29b-41d4-a716-446655440000",
  "overall_score": 42,
  "grade": "D",
  "headline": "A love letter to Stack Overflow, written in panic.",
  "roast": "...",
  "categories": {
    "code_quality":       { "score": 40, "comment": "..." },
    "naming_conventions": { "score": 55, "comment": "..." },
    "error_handling":     { "score": 30, "comment": "..." },
    "architecture":       { "score": 45, "comment": "..." },
    "documentation":      { "score": 20, "comment": "..." }
  },
  "savage_quote": "I've seen better architecture in a tent.",
  "one_good_thing": "At least you used version control. Barely."
}
```

**Errors:**
```json
{ "error": "repo_not_found",  "message": "Couldn't reach that repo. Is it public?" }
{ "error": "no_code_found",   "message": "No source files found. Nothing to roast." }
{ "error": "rate_limited",    "message": "Slow down. Even bad code deserves a moment." }
{ "error": "llm_unavailable", "message": "The roasting engine is down. Try again." }
{ "error": "invalid_url",     "message": "That's not a GitHub URL. Come on." }
```

### `GET /api/card/{roast_id}`

**Success (200):** Returns `image/png` — 1200×630px roast card

**Error (404):**
```json
{ "error": "card_not_found", "message": "That roast has expired or never existed." }
```

---

## Code Style — Non-Negotiable

### Python
- Type hints on every function signature — no exceptions
- `async def` for all route handlers and any function that does I/O
- Pydantic v2 models for every request and response shape
- f-strings only — no `.format()`, no `%`
- Max function length: 40 lines — split if longer
- No bare `except:` — always catch specific exception types
- Log startup warnings (missing GITHUB_TOKEN, etc.) with `logging.warning()`

### JavaScript / React
- Functional components only — no class components
- `async/await` for all API calls — no `.then()` chains
- Destructure props always — `function Card({ score, grade, headline })`
- No inline styles except for truly dynamic values (score-based colors, animation delays)
- No inline event handler logic — extract named functions
- Components must be focused — if a component renders more than 150 lines of JSX, split it

---

## Deployment Checklist — DO NOT TOUCH UNTIL USER SAYS

### Backend → Render
- [ ] Set `GROQ_API_KEY` in Render dashboard environment variables
- [ ] Set `GITHUB_TOKEN` in Render dashboard environment variables
- [ ] Set `FRONTEND_URL` to the Vercel frontend URL (for CORS)
- [ ] Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- [ ] Confirm health check passes: `GET /health`

### Frontend → Vercel
- [ ] Set `VITE_API_URL` to Render backend URL in Vercel environment variables
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Confirm `ShareButton` tweet URL points to backend card endpoint

---

## What NOT To Do

```
✗ Use TypeScript                    → Keep it plain JS
✗ Install Tailwind or any CSS lib   → Plain CSS + CSS variables only
✗ Use Redux, Zustand, or Context    → Local component state is enough
✗ Fetch the entire repo             → Max 8 files, 300 lines each, concurrent
✗ Expose GROQ_API_KEY in frontend   → Backend only, always
✗ Use HEAD as the git ref           → Fetch default_branch from /repos/{owner}/{repo}
✗ Fetch files sequentially          → asyncio.gather() always
✗ Hardcode backend URL in source    → Always import.meta.env.VITE_API_URL
✗ Trust the in-memory rate limiter  → It resets on cold start; comment this clearly
✗ Omit the 60-second axios timeout  → Non-negotiable; Render cold starts are slow
✗ Commit anything                   → EVER. Until user explicitly says so.
✗ Run ahead of the current step     → One step at a time
✗ Add unlisted dependencies         → Ask first
✗ Make the backend stateful         → Every request is independent (except card cache)
✗ Add auth                          → Public tool, no login
✗ Use .then() chains                → async/await only
✗ Bare except clauses               → Always catch specific exceptions
✗ Expose raw API errors to frontend → Catch and wrap them
```

---

## Step Build Order (Follow Exactly)

Claude Code will be given one step at a time. Do not proceed to the next step unless
explicitly told to.

```
Step 0:  Project scaffold — folder structure, .gitignore, requirements.txt, package.json
Step 1:  models.py — all Pydantic models
Step 2:  github_fetcher.py — URL parse, default branch fetch, tree fetch, concurrent file fetch
Step 3:  roaster.py — Groq call, prompt construction, JSON parse, retry, fallback
Step 4:  card_generator.py — Pillow card generation
Step 5:  main.py — routes, CORS, rate limiting, error handling, in-memory card store
Step 6:  Backend smoke test — manual curl tests for /health and /api/roast
Step 7:  index.css — full design system, CSS variables, base styles
Step 8:  api/roast.js — axios client with 60s timeout
Step 9:  Loader.jsx — animated terminal loading component
Step 10: BrutalitySlider.jsx — standalone slider component
Step 11: RepoInput.jsx — URL input + imports BrutalitySlider
Step 12: RoastCard.jsx — score ring, grade, roast text, category bars, savage quote
Step 13: ShareButton.jsx — html2canvas download + X share with card URL
Step 14: App.jsx + main.jsx — wire everything together, state management
Step 15: vite.config.js — dev proxy configuration
Step 16: Full integration test — run both servers, submit a real repo, verify end to end
Step 17: Deploy — backend to Render, frontend to Vercel (only when user says)
```