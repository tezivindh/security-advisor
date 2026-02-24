# SecOps — AI-Powered Security Advisor

A full-stack SaaS platform that continuously audits GitHub repositories for security vulnerabilities, reviews pull requests automatically, and scans live deployments — powered by Groq's LLaMA 3.3 AI model.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Data Models](#data-models)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Pages & UI](#pages--ui)
- [Known Bugs Fixed](#known-bugs-fixed)

---

## Features

| Feature | Description |
|---|---|
| **GitHub OAuth Login** | Authenticate with GitHub; encrypted OAuth token stored per user |
| **Repository Scanner** | Clone → regex rule engine (11 rules) → Groq AI enrichment → security score |
| **Live Deployment Scan** | Passive HTTP checks: HTTPS, security headers, cookies, CORS, exposed paths, server leakage |
| **PR Automation** | GitHub webhook triggers AI security review on every opened/updated pull request |
| **Security Dashboard** | Global score gauge, severity breakdown, OWASP pie chart, 30-day trend graph |
| **Repository Detail** | Per-repo scan history with vulnerability list, AI explanation + patch suggestions |
| **Team Management** | Create teams, invite members, assign roles (owner / developer / viewer), activity log |
| **Trend Tracking** | `TrendSnapshot` written on every scan completion, aggregated into global 30-day chart |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 Next.js 14 Frontend              │
│  Dashboard · Repositories · Live Scan · Teams   │
│  PR Automation · Repository Detail              │
└────────────────────┬────────────────────────────┘
                     │ REST (JWT Bearer)
┌────────────────────▼────────────────────────────┐
│              Express + TypeScript API            │
│  /api/auth   /api/github   /api/scans           │
│  /api/trends /api/teams    /api/live-scan        │
│  /api/pr     /api/ai                            │
└──────┬──────────────────────────┬───────────────┘
       │                          │
┌──────▼──────┐          ┌────────▼────────┐
│   MongoDB   │          │  Redis + Bull   │
│  (Data)     │          │  (Scan Queue)   │
└─────────────┘          └────────┬────────┘
                                  │
                         ┌────────▼────────┐
                         │  Worker Process │
                         │  Clone → Index  │
                         │  → Rule Engine  │
                         │  → Groq AI      │
                         └─────────────────┘
```

### Scan Pipeline (Worker)

1. **Clone** — `simple-git` shallow clone (`--depth 1`) of target branch into temp dir
2. **Index** — Walk all files with 30 supported extensions (JS/TS, Python, Java, Kotlin, C/C++, Go, Rust, Ruby, PHP, C#, Shell, YAML, JSON, TOML, HCL, .env, Terraform); skip `node_modules`, `.git`, build dirs
3. **Rule Engine** — 11 regex-based security rules covering SQL injection, hardcoded secrets, weak crypto (MD5/SHA1/DES), eval/Function injection, command injection (exec/spawn), CORS wildcard, missing Helmet, missing auth middleware, JWT decode-without-verify, SSRF, and prototype pollution
4. **AI Enrichment** — Flagged snippets batched into Groq LLaMA for: confirmation, OWASP mapping, impact summary, patch suggestion
5. **Score** — Weighted deduction: Critical −25, High −10, Medium −5, Low −2
6. **Persist** — `Vulnerability` docs + updated `Scan` + `Repository.lastScanScore` + `TrendSnapshot`

---

## Tech Stack

### Backend

| Component | Technology |
|---|---|
| Runtime | Node.js 20, TypeScript (CommonJS) |
| Framework | Express 4 |
| Database | MongoDB 7 + Mongoose |
| Queue | Bull (Redis-backed) |
| AI | Groq SDK — `llama-3.3-70b-versatile` |
| Auth | GitHub OAuth (Passport.js) + JWT |
| VCS | simple-git |
| Dev Server | ts-node-dev |

### Frontend

| Component | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS v4 |
| HTTP | Axios with JWT interceptor |
| Charts | Recharts (AreaChart, PieChart) |
| Animation | Framer Motion |
| Icons | Lucide React |

---

## Data Models

```
User            — GitHub login, encrypted OAuth token, avatar URL
Repository      — GitHub repo metadata, scanning state, last scan score/date
Scan            — Status, score, vuln counts, OWASP distribution, duration
Vulnerability   — Severity, OWASP ID, file path + line, code snippet, AI fields
PRReview        — PR number/URL, findings array, bot comment body
Team            — Name, slug, ownerId
TeamMember      — userId + teamId + role (owner / developer / viewer)
ActivityLog     — Action string, resource type/id, metadata, userId, teamId
TrendSnapshot   — Daily security score + vuln counts per repo
```

---

## Project Structure

```
security advisor/
├── backend/
│   ├── src/
│   │   ├── config/           # DB, Redis, env config
│   │   ├── middleware/        # auth.middleware, error.middleware
│   │   ├── models/            # Mongoose schemas (all 9 collections)
│   │   ├── modules/
│   │   │   ├── ai/            # groq.service — analyzeSnippet, batch AI, retry logic
│   │   │   ├── auth/          # GitHub OAuth callback, JWT issue, /me route
│   │   │   ├── github/        # listRepos (GitHub API + DB enrichment), toggleScanning
│   │   │   ├── liveScan/      # performLiveScan — HTTP passive security checks
│   │   │   ├── pr/            # PR review CRUD + GitHub webhook handler (HMAC verified)
│   │   │   ├── queue/         # scan.queue.ts + worker.ts (standalone process)
│   │   │   ├── scanner/       # file-indexer, rule-engine, scanner.service, score-calculator
│   │   │   ├── team/          # team CRUD, member management, activity log
│   │   │   └── trends/        # 30-day snapshots, global aggregation
│   │   ├── utils/             # logger
│   │   └── index.ts           # Express app bootstrap
│   ├── .env                   # Environment variables (see below)
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── (app)/              # Authenticated layout with sidebar
    │   │   │   ├── dashboard/      # Score gauge, severity cards, charts
    │   │   │   ├── repositories/   # List + toggle + manual scan trigger
    │   │   │   │   └── [slug]/     # Per-repo detail: scan stats + vuln list
    │   │   │   ├── live-scan/      # URL input → passive HTTP security scan
    │   │   │   ├── pr-automation/  # PR review history per tracked repo
    │   │   │   └── team/           # Team CRUD, members, roles, activity log
    │   │   └── auth/callback/      # Receives token from GitHub OAuth redirect
    │   ├── lib/
    │   │   ├── api.ts              # Axios client + all API helpers (typed)
    │   │   └── utils.ts            # getScoreColor, formatRelative, cn()
    │   └── types/index.ts          # TypeScript interfaces for all entities
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- MongoDB running on `localhost:27017`
- Redis running on `localhost:6379`
- A [GitHub OAuth App](https://github.com/settings/developers)
- A [Groq API key](https://console.groq.com)

### Install & Run

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

```bash
# Terminal 1 — API server (port 4000)
cd backend && npm run dev

# Terminal 2 — Scan worker (required for scan jobs)
cd backend && npm run worker

# Terminal 3 — Frontend (port 3000)
cd frontend && npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and sign in with GitHub.

---

## Environment Variables

### `backend/.env`

```env
# Server
PORT=4000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/secops

# Redis
REDIS_URL=redis://localhost:6379

# Session
SESSION_SECRET=<64-char hex>

# JWT
JWT_SECRET=<64-char hex>
JWT_EXPIRES_IN=7d

# GitHub OAuth App
GITHUB_CLIENT_ID=<your-client-id>
GITHUB_CLIENT_SECRET=<your-client-secret>
GITHUB_CALLBACK_URL=http://localhost:4000/api/auth/github/callback

# GitHub App (for webhooks + PR automation)
GITHUB_APP_ID=<your-app-id>
GITHUB_APP_PRIVATE_KEY=<base64-encoded-pem>
GITHUB_WEBHOOK_SECRET=<random-string>

# Groq AI
GROQ_API_KEY=<your-groq-key>
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_MAX_TOKENS=1024

# Token Encryption (AES-256)
TOKEN_ENCRYPTION_KEY=<32-char hex>

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Scan Limits
MAX_CONCURRENT_SCANS_PER_TEAM=3
```

**Generate secrets:**

```bash
# SESSION_SECRET / JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# TOKEN_ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## GitHub OAuth App Setup

1. **GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App**
2. Homepage URL: `http://localhost:3000`
3. Authorization callback URL: `http://localhost:4000/api/auth/github/callback`
4. Copy Client ID + Secret → `backend/.env`

## GitHub Webhook Setup (PR Automation)

1. Repo **Settings → Webhooks → Add webhook**
2. Payload URL: `https://your-domain/api/pr/webhook`
3. Content type: `application/json`
4. Secret: matches `GITHUB_WEBHOOK_SECRET`
5. Events: **Pull requests** only

> Use [ngrok](https://ngrok.com) to expose `localhost:4000` for local webhook testing.

---

## API Reference

All endpoints prefixed `/api`. Authenticated routes require `Authorization: Bearer <jwt>`.

### Auth

| Method | Path | Description |
|---|---|---|
| GET | `/auth/github` | Redirect to GitHub OAuth |
| GET | `/auth/github/callback` | OAuth callback — issues JWT, redirects to frontend |
| GET | `/auth/me` | Get current user profile |
| POST | `/auth/logout` | Clear session |

### GitHub Repositories

| Method | Path | Description |
|---|---|---|
| GET | `/github/repos` | List all repos (GitHub API merged with DB scan metadata) |
| POST | `/github/repos/:repoId/toggle` | Enable/disable scanning (upserts DB record) |

### Scanner

| Method | Path | Description |
|---|---|---|
| POST | `/scans/trigger` | Queue a manual scan `{ repositoryId }` |
| GET | `/scans/dashboard/summary` | Global score, severity breakdown, recent scans, OWASP |
| GET | `/scans/:scanId` | Get scan by ID |
| GET | `/scans/repository/:repositoryId` | Paged scan history for a repo |
| GET | `/scans/repository/by-fullname/:owner/:repo` | Latest completed scan + repositoryId by full name |
| GET | `/scans/:scanId/vulnerabilities` | Vulnerability list (filterable by `?severity=`) |

### Trends

| Method | Path | Description |
|---|---|---|
| GET | `/trends/global` | 30-day aggregated avgScore + critical/high counts |
| GET | `/trends/repository/:repositoryId` | 30-day snapshots for one repo |

### Live Scan

| Method | Path | Description |
|---|---|---|
| POST | `/live-scan/scan` | Passive scan `{ url, domainVerified: true }` — 5 req/min rate limit |

### PR Automation

| Method | Path | Description |
|---|---|---|
| GET | `/pr/repository/:repositoryId` | PR review history |
| POST | `/pr/webhook` | GitHub webhook (HMAC-SHA256 verified, no JWT) |

### Teams

| Method | Path | Description |
|---|---|---|
| POST | `/teams` | Create team |
| GET | `/teams/mine` | List teams the current user belongs to |
| POST | `/teams/:teamId/invite` | Invite user by userId (owner only) |
| GET | `/teams/:teamId/members` | List members with populated profile |
| GET | `/teams/:teamId/activity` | Activity log with human-readable descriptions |
| PATCH | `/teams/:teamId/members/:memberId/role` | Change member role (owner only) |

### AI Demo

| Method | Path | Description |
|---|---|---|
| POST | `/ai/demo/analyze` | Public single-snippet AI analysis (no auth) |

---

## Pages & UI

### Dashboard (`/dashboard`)
- Half-circle **score gauge** (average score across all completed scans)
- **4 severity stat cards** — Critical / High / Medium / Low total vulnerability counts
- **30-day AreaChart** from global `TrendSnapshot` aggregation
- **OWASP donut chart** showing vulnerability category distribution
- **Recent scans** table with status badges and per-scan scores

### Repositories (`/repositories`)
- Lists all GitHub repos (both tracked and untracked)
- **Enable/Disable toggle** — upserts the repo into DB (`scanningEnabled: true/false`)
- **Scan button** — visible once enabled; triggers queue job; shows green **"Queued!"** for 3 s
- **View link** — navigates to the repository detail page

### Repository Detail (`/repositories/[owner/repo]`)
- **← Back button** returns to repositories list via `router.back()`
- Stats grid: Security Score, Files Scanned, Critical/High counts, Scan Duration
- **Re-scan button** with spinner → green **"Queued!"** feedback
- File vulnerability heatmap (files colour-coded by worst-severity issue)
- Severity filter tabs (All / Critical / High / Medium / Low)
- Expandable **VulnerabilityCard** per finding: code snippet, AI explanation, exploit impact, suggested patch

### Live Scan (`/live-scan`)
- URL input + domain ownership confirmation checkbox (required to unlock scan)
- Passive checks: HTTPS/TLS, 9 security response headers, cookie flags (HttpOnly/Secure/SameSite), CORS, server banner leakage, 5 sensitive exposed paths (`/.env`, `/.git/config`, etc.), CSP/XSS protection
- Result: score gauge + checks grouped by category (Transport / Headers / Cookies / CORS / Exposed Files / Injection Defense / Information Exposure)

### PR Automation (`/pr-automation`)
- Repo selector (filtered to currently tracked repositories)
- Expandable **PRReviewCard** per PR: per-finding severity badges, file/line reference, AI bot comment preview
- Auto-review toggle (UI state) + manual Refresh button

### Team (`/team`)
- **Create Team** modal with name input
- Team switcher if member of multiple teams
- Member list with **role badges**: Owner (👑), Developer (</> ), Viewer (👁)
- **Activity log** with human-readable action labels

---

## Security Notes

- GitHub OAuth tokens are **AES-256 encrypted** before storage; the field has `select: false`
- Only **small code snippets** (≤ 800 tokens from flagged lines) are ever sent to the AI — never full files
- Worker cleans up cloned temp directories on both success and failure
- All authenticated routes enforce JWT; 7-day token TTL
- Rate limiting: 300 req/15 min globally; 5 req/min on live scan
- SSRF protection in live scan: blocks `localhost`, `127.0.0.1`, `0.0.0.0`, `::1`, RFC-1918 private ranges, `.internal` and `.local` TLDs
- PR webhook verifies HMAC-SHA256 signature before processing

---

## Known Bugs Fixed

| Area | Bug | Fix Applied |
|---|---|---|
| Repositories | Toggle → Scan button still failed (guard on `tracked` never updated) | Set `tracked: enabled` in optimistic state merge |
| Repositories | No feedback after pressing Scan | `scanQueued` state → green "Queued!" for 3 s |
| Repository detail | Re-scan had no success confirmation | `scanQueued` boolean → green "Queued!" for 3 s |
| Repository detail | No way to go back | `router.back()` back button above page title |
| Live scan | Results never rendered | `setResult(data.result)` → `setResult(data)` (backend returns flat object) |
| Dashboard | One failing request killed entire load | `Promise.all` → `Promise.allSettled` |
| Trends global | Route crashed on every call | `req.user._id` → `new mongoose.Types.ObjectId(req.userId!)` |
| Scan trigger | 400 error — passed `fullName` string not MongoDB `_id` | `handleScan` reads `repo._id` from enriched list |
| AI model | `llama3-70b-8192` decommissioned by Groq | Updated to `llama-3.3-70b-versatile` |
| AI rate limits | 429 crashes | Retry loop (4×) with exact delay parsed from Groq error response |
| AI concurrency | Too many parallel requests | Batch concurrency 5→2, inter-batch gap 500ms→1500ms |
| File indexer | Only JS/TS files indexed | Added Python, Java, Kotlin, Go, Rust, Ruby, PHP, C#, Shell, YAML, JSON, TOML, HCL |
| Rule engine | `MISSING_AUTH_MIDDLEWARE` false positives | Global auth detection + fixed word-boundary regex |
| Team members | Showing raw ObjectId strings | `.populate('userId', 'login name avatarUrl email')` |
| Team list | Wrong response shape `[{ team, role }]` | Flatten to `Team[]` with embedded `role` field |
| Activity log | `description` field missing | Generated server-side from `ACTION_LABEL` map |
| PR Automation | Showed hardcoded mock repos | Replaced with real `githubApi.listRepos()` filtered to tracked |

---

## Production Checklist

- [ ] `NODE_ENV=production` (enables JSON logging, disables morgan dev)
- [ ] Run worker as a separate process or container (`npm run worker`)
- [ ] Use PM2 or systemd for process management
- [ ] MongoDB Atlas with connection pooling
- [ ] Redis persistence (`appendonly yes`) for queue durability
- [ ] SSL termination at reverse proxy (Nginx / Caddy)
- [ ] Set `FRONTEND_URL` and `GITHUB_CALLBACK_URL` to production domains
- [ ] Rotate all secrets (JWT, session, encryption key, webhook secret)
