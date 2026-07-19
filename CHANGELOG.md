# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-07-05

### Added
- Multi-currency support across the application with settings to configure USD, EUR, and VND dynamically. Formatting natively adapts to zero-decimal currencies.
- Single-page dashboard for finance overview with side-by-side grouped monthly charts and net savings bars.
- `TransactionList` component unified to display both Expense and Income sections on a single screen without tabs.
- `BreakdownTable` and `TopExpenses` components with collapsible views and tooltip support for long descriptions.
- Taxonomies UI to configure Expense Categories, Income Sources, Payment Methods, and Tags with inline bulk-edit validation.
- Auto-opening startup script `start.sh`.
- Local SQLite database layer using Prisma, including full schema and auto-migrator.
- Frontend routing and context providers for theme (light/dark mode with gradient vibes).
- Robust error handling middleware in the backend, surfacing specific conflict and validation messages to the UI.

### Fixed
- Zod schema validation bug failing on empty optional fields (`null` vs `undefined`).
- Bulk save state reset issue when editing config lists by detaching refetch from individual row creates.

### Changed
- Replaced the tabbed transaction UI with a stacked view requested by the user.
- Refactored `Cash Flow by Month` back to an overlapping area chart per user preference.
