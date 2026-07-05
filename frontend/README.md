# Frontend

This is the React + TypeScript (Vite) frontend for the Personal Expense Tracker. 
It operates completely offline, communicating exclusively with the local backend over port `3001`.

## Stack
- **Framework:** React 18 + Vite
- **Language:** TypeScript
- **Styling:** Vanilla CSS (`index.css`) with a modern gradient dark/light mode theme
- **API Client:** `openapi-fetch` (strongly-typed via generated OpenAPI schema)
- **Charts:** Recharts (for dashboard data visualization)
- **Icons:** `lucide-react`

## Commands

- `npm run dev`: Start the Vite dev server (proxies `/api` to the backend).
- `npm run build`: Compile for production.
- `npm run typecheck`: Run TypeScript type checking.

## Design Philosophy

The UI is built to be fast, local-first, and highly aesthetic with "gradient vibes", prioritizing user control and clarity over complex data synchronization since no cloud features are used.
