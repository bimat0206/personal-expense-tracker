# Personal Expense Tracker

A locally-run, single-user personal finance web application. No cloud services, no accounts, no internet dependency at runtime.

## Features

- Log expenses and income with categories, payment methods, tags, and receipt attachments
- Annual and monthly dashboards with year-over-year comparison and multi-year trend
- Monthly Wish List with purchase conversion workflow
- Global full-text search across notes, tags, and taxonomy names
- CSV import from bank exports
- Recurring transaction rules with backfill on launch
- Full JSON export/import backup with reminder banner

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+

### Development

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure environment
cp .env.example .env
# Edit .env if needed (defaults work out of the box)

# 3. Start backend + frontend together
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API docs: http://localhost:3001/docs

### Docker

```bash
docker compose up
```

## Data Storage

All user data lives in `./data/` (gitignored):

| Path | Contents |
|---|---|
| `data/expense-tracker.db` | SQLite database — all structured data |
| `data/attachments/` | Uploaded receipt/photo files |
| `data/tmp/imports/` | Temporary CSV upload files (auto-swept on startup) |

**Backup:** use the in-app Export feature (Settings → Export) to download a full JSON backup. Also manually copy the entire `data/` directory to preserve attachment files, which the JSON export does not include.

## Project Structure

```
personal-expense-tracker/
├── contracts/          # OpenAPI spec (source of truth for the API)
├── backend/            # Node.js + TypeScript REST API
├── frontend/           # React + TypeScript SPA (Vite)
└── data/               # Runtime data (gitignored)
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Recharts |
| Backend | Node.js 20, TypeScript, Express |
| Database | SQLite via Drizzle ORM |
| API Contract | OpenAPI 3.1 (spec-first) |

## Security Note

The API has **no authentication**. It binds to `127.0.0.1` (localhost only) by default. Do not expose it on a public or untrusted network interface without adding authentication.
