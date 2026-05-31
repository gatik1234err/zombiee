# ZADDP — Zombie API Discovery & Defence Platform

A full-stack cybersecurity dashboard for financial institutions to discover, classify, secure, and decommission "zombie" and "shadow" APIs.

## Quick Start

```bash
docker-compose up
```

Access the app at **http://localhost** (NGINX proxy on port 80).

### Demo Login
Click "Demo Login (Quick Access)" on the login page to enter the dashboard.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   NGINX     │────▶│  Next.js 14  │     │  FastAPI    │
│   (Port 80) │     │  (Port 3000) │     │  (Port 8000)│
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                    ┌───────────────────────────┼───────────┐
                    │                           │           │
              ┌─────▼─────┐             ┌───────▼───────┐   │
              │ PostgreSQL │             │    Redis 7    │   │
              │ + Timescale│             │  Cache/PubSub │   │
              └───────────┘             └───────────────┘   │
                                                           │
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Components | shadcn/ui-inspired, Recharts, Framer Motion |
| State | TanStack Query, Zustand, TanStack Table |
| BFF | Next.js API Routes + Server Actions |
| Backend | Python 3.11 + FastAPI |
| Database | PostgreSQL 15 + TimescaleDB |
| Cache | Redis 7 |
| Auth | NextAuth.js v5 (OAuth 2.0 / OIDC) |
| Realtime | Socket.io |
| Infrastructure | Docker + Docker Compose |

## Features

### Dashboard (Command Center)
- 5 stat cards with clickable drill-down
- Risk distribution donut chart
- API status trend (30-day stacked area)
- Real-time discovery feed with WebSocket
- Critical alerts panel with investigate button
- Decommission progress bar
- Monthly scoreboard preview
- Environment breakdown
- Top owners leaderboard

### API Inventory
- Advanced data table with server-side pagination
- Faceted filtering (status, environment, risk, sensitivity)
- Global search with debounced matching
- Bulk actions (export, assign owner)
- Real-time updates

### API Detail View
- Risk score gauge with animated loading
- Overview, Security, Traffic, Dependencies, Audit tabs
- 12-dimension security scorecard
- Time-series traffic charts
- Contextual action bar (Quarantine, Rescue, Decommission)

### Zombie Graveyard
- Kanban board with 4 workflow stages
- Safety catch alerts with traffic spike graph
- Shadow API detection feed
- One-click quarantine from detection feed
- Auto-PR tracking and decommission scheduling

### Security Center
- Findings by severity (pie chart)
- Compliance coverage (bar chart)
- Top 10 risk APIs list
- Summary metrics

### Reports
- Monthly Zombie Scoreboard with executive summary
- Risk and security score trends (area charts)
- PDF export with jsPDF + html2canvas
- Regulatory templates (PCI-DSS, GDPR, Internal Audit)

### Settings
- Risk scoring weight sliders with preview
- User management table with role/MFA status
- Audit log viewer with real-time feed
- 7 configuration categories

## API Endpoints

### Inventory
- `GET /api/v1/inventory` — List APIs (paginated, filterable)
- `GET /api/v1/inventory/{id}` — API detail
- `GET /api/v1/inventory/{id}/risk` — Risk breakdown
- `GET /api/v1/inventory/{id}/security` — Security findings
- `POST /api/v1/inventory/{id}/quarantine` — Quarantine API
- `POST /api/v1/inventory/{id}/rescue` — Rescue API
- `POST /api/v1/inventory/{id}/decommission` — Decommission API

### Dashboard
- `GET /api/v1/dashboard` — Aggregated stats
- `GET /api/v1/scoreboard` — Monthly report data

### Zombies & Shadows
- `GET /api/v1/zombies` — Zombie workflow queue
- `GET /api/v1/shadows` — Shadow API alerts

### Reports
- `POST /api/v1/reports/{id}/export` — Trigger PDF export

## Database Schema

- **apis** — Core inventory (75 synthetic records)
- **security_findings** — 30 pre-seeded findings
- **traffic_metrics** — 30 days of time-series per API (TimescaleDB hypertable)
- **decommission_workflows** — 8 zombie workflows across stages
- **audit_trail** — Immutable action log
- **users** — Platform users with RBAC
- **api_dependencies** — Dependency graph edges

## Demo Data

75 synthetic banking APIs:
- 45 Active (documented, recent traffic)
- 12 Deprecated (sunset, residual traffic)
- 8 Orphaned (no owner, 120+ days stale)
- 5 Shadow (no documentation, observed traffic)
- 5 Zombie (45+ days no traffic, still reachable)

## User Roles

| Role | Permissions |
|------|------------|
| Viewer | Read-only dashboard, inventory, reports |
| Analyst | Viewer + investigate, comment, assign |
| Engineer | Analyst + quarantine/rescue, resolve findings |
| Admin | Engineer + decommission, manage users, configure |
| Auditor | Read-only + full audit trail export |

## Demo Walkthrough (5-Minute Judge Script)

1. Open http://localhost → Login page with branding
2. Click "Demo Login" → Dashboard with 75 APIs, risk charts, live feed
3. Click a "Shadow" API → Risk score 90+, security findings with CVSS
4. Navigate to "Zombie Graveyard" → Kanban board with 4 stages
5. Click "Quarantine" on a zombie → Toast notification, card updates
6. Go to "Reports" → Monthly Scoreboard with charts → "Export PDF"
7. Toggle dark mode → Full theme switch
8. Return to dashboard → See real-time stat updates

## Development

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && pip install -r requirements.txt && python -m app.seed && uvicorn app.main:app --reload

# Infrastructure
docker-compose up db redis
```
