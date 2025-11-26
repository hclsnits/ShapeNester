<!-- Copilot / AI agent instructions tailored to the ShapeNester repo -->
# ShapeNester — AI Assistant Instructions

**Purpose:** give an AI coding agent immediately useful, project-specific context to be productive without basic repo orientation.

## Quick Facts
- **Repo layout:** server (Express/Node), client (React/Vite in `client/`), shared types (`shared/schema.ts`), static assets (`attached_assets/`).
- **Dev start:** `npm run dev` — runs `tsx server/index.ts`, enables Vite HMR. Set `PORT` via `PORT=5010 npm run dev` (PowerShell: `$env:PORT=5010; npm run dev`).
- **Build/prod:** `npm run build` → `npm start` runs `node dist/index.js`.
- **Type-check:** `npm run check` (tsc).
- **Tests:** `npx vitest` (not in npm scripts); unit tests in `client/src/lib/__tests__/`.

## Architecture

**Single-port monorepo:** Server serves API `/api/*` + static SPA from `dist/public`.
- **Dev:** Express mounts Vite middleware (`server/vite.ts`) for HMR after route registration.
- **Prod:** Vite builds to `dist/public`, Express serves it via `serveStatic`.
- **Key flow:** `server/index.ts` (bootstrap + logging) → `registerRoutes(app)` in `server/routes.ts` → Vite middleware setup.

**Request logging:** All `/api` responses logged to stdout via middleware in `server/index.ts`. Preserve this when modifying response flow.

## Important Files

| File | Purpose |
|------|---------|
| `server/index.ts` | Bootstrap, logging middleware, error handler, dev vs prod setup |
| `server/routes.ts` | **Where to add API routes** — use `/api` prefix always |
| `server/vite.ts` | Vite middleware + static serve logic |
| `server/storage.ts` | `IStorage` interface + `MemStorage` (in-mem CRUD) |
| `shared/schema.ts` | Drizzle tables + Zod schemas (e.g., `users`, `insertUserSchema`) |
| `vite.config.ts` | Path aliases, client root, build output to `dist/public` |
| `client/src/lib/` | Core algorithms: `nesting.ts`, `advanced-nesting.ts`, `geometry/` (heavy compute) |

## Conventions & Patterns

**Path aliases:** Use `@` (client/src), `@shared` (shared), `@assets` (attached_assets) in imports. Configured in `vite.config.ts` + `tsconfig.json`.

**API routes:** All endpoints under `/api`. Register in `server/routes.ts` via `app.get|post|put|delete(...)`. Example: serving Excel from `attached_assets` (see `routes.ts` — set `Content-Type`, `Content-Disposition`, `Content-Length` headers).

**Storage:** Use `storage` instance for CRUD (e.g., `storage.createUser(user)`, `storage.getUserByUsername(name)`). Implement via `IStorage` interface to enable future DB swaps (currently `MemStorage`).

**Nesting logic:** Geometry and packing algorithms in `client/src/lib/geometry/` and `nesting.ts`. Keep computations isolated, mirror helpers between UI and algorithm layers.

## How To Add/Modify

**Add API route:**
1. Edit `server/routes.ts` 
2. Add `app.get|post(...)` with `/api` prefix
3. Use `storage` for persistence
4. Run `npm run dev` — Vite middleware reloads client automatically

**Type changes:**
1. Update `shared/schema.ts` (Drizzle table + Zod schema)
2. Both server and client import via `@shared` alias
3. Run `npm run check` to validate TypeScript

**Client components:**
- Radix UI primitives in `client/src/components/ui/` (pre-built shadcn-style components)
- App state in `App.tsx` with React hooks; use React Query for async data via `queryClient.ts`
- CSS: Tailwind (config in `tailwind.config.ts`)

## When Making Changes

- ✓ Preserve `/api` prefix and logging middleware semantics
- ✓ Use path aliases (`@`, `@shared`, `@assets`) consistently
- ✓ Register routes **before** Vite middleware setup to avoid conflicts
- ✓ Run `npm run check` before committing (TypeScript validation)
- ✓ Keep server code TypeScript-first (strict mode enabled)

## Node Version & Environment
- Requires **Node 18+** (uses `import.meta.dirname`, ESM modules)
- Scripts use `NODE_ENV=development|production` (see `package.json`)

## Useful Commands
```bash
npm install              # Install deps
npm run dev              # Start dev server (HMR enabled)
npm run build            # Build client + bundle server
npm start                # Run prod (requires build first)
npm run check            # Type-check all files
npx vitest               # Run unit tests (client/src/lib/__tests__/)
$env:PORT=5010; npm run dev  # Custom port (PowerShell)
```
- Preserve API prefix `/api` and the existing logging middleware semantics for `/api` endpoints.
- Keep server-side changes TypeScript-first and ensure `npm run check` passes.
- When adding imports use the repository aliases (`@`, `@shared`, `@assets`) for consistency with Vite and TS paths.
- Do not add server routes that conflict with Vite's dev catch-all — register routes before enabling Vite middleware and avoid file-system based catch-alls at top-level.

If you need more info
- Ask for build output logs or a failing test case to debug locally.
- Point to a file you want changed and specify desired behaviour; include expected input/output and whether changes affect client, server, or shared code.

Feedback requested: Are there any unclear areas you want the AI to expand (examples, test-run commands, Node version, or security notes)?
