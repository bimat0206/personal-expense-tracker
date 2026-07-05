# Contracts

This directory contains the central **OpenAPI 3.1 specification** (`openapi.yaml`) which acts as the single source of truth for the REST API contract between the frontend and the backend.

## Structure

- `openapi.yaml`: The source-of-truth definition of all routes, parameters, and payloads.
- `generated/`: Contains auto-generated TypeScript output derived from the spec.
  - `types.ts`: Generated types for models and operations.
  - `client.ts`: The `openapi-fetch` typed client configured for the frontend.

## Generation Workflow

1. Modify `openapi.yaml` to define new routes or modify existing data structures.
2. Run `npm run generate` from the repository root to regenerate the types and client.
3. The frontend and backend TypeScript compilers will immediately catch any structural mismatches against the newly generated contract.
