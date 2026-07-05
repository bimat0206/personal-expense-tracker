# Backend

This is the Node.js + TypeScript (Express) backend for the Personal Expense Tracker.
It provides a local REST API and manages the SQLite database.

## Stack
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** SQLite (local file only) via Prisma ORM
- **Validation:** Zod
- **Contract:** OpenAPI 3.1 schema (source of truth)

## Architecture

- `src/routes/`: Express route handlers wrapped in a custom async error handler.
- `src/services/`: Business logic, separating database operations from transport layers.
- `src/middleware/`: Global error handling (`wrap`, `errorHandler`) and request validation (`validateBody`).
- `data/`: Location of the local `database.sqlite` file (gitignored).

## Commands

- `npm run dev`: Start the server in watch mode using `tsx`.
- `npm run build`: Compile TypeScript to JavaScript.
- `npm run typecheck`: Run TypeScript type checking.
- `npm run db:push`: Sync the Prisma schema to the SQLite database without full migrations.

## Error Handling Pattern
Routes throw exceptions directly via synchronous-like `AppError` throws. A global wrapper catches all exceptions and routes them to a centralized Express error handler, parsing specific Zod and PRISMA codes into friendly UI strings.
