<!-- Copilot / AI agent instructions tailored to the ShapeNester repo -->
# ShapeNester — AI Assistant Instructions

Purpose: give an AI coding agent immediately useful, project-specific context so it can be productive without asking for basic repo orientation.

Quick facts
- **Repo layout:** server (Express + API), client (Vite + React in `client/`), shared (types/schema), `attached_assets/` (static files). See `server/index.ts`, `client/src/main.tsx` and `shared/schema.ts`.
- **Dev start:** `npm run dev` — runs `tsx server/index.ts` which starts the Express server and (in development) mounts Vite middleware. Use `PORT` to change the listening port.
- **Build / prod:** `npm run build` (runs `vite build` then bundles server with `esbuild` to `dist`), then `npm start` to run `node dist/index.js`.
- **Type-check:** `npm run check` (uses `tsc`).

Big picture (what to know)
- Single repository serves both API and SPA from the same port. In development, the server enables Vite middleware for HMR (`server/vite.ts`). In production the built client is served from `dist/public` (see `server/vite.ts`).
- API routes should be registered under `/api` via `registerRoutes(app)` in `server/routes.ts`. The server contains a logging middleware that captures JSON responses for `/api` endpoints (see `server/index.ts`) — preserve that behaviour when changing response flow.
- Data model: `shared/schema.ts` contains Drizzle/`zod` types and is imported with the alias `@shared` from client and server.

Project-specific conventions & patterns
- Path aliases (Vite + TS): `@` -> `client/src`, `@shared` -> `shared`, `@assets` -> `attached_assets`. See `vite.config.ts` and `tsconfig.json`. Use those aliases when adding imports.
- API prefix: All endpoints are expected under `/api`. Avoid adding top-level catch-all routes that run before `registerRoutes` — the server loads Vite middleware after registering routes to prevent interference.
- Storage abstraction: `server/storage.ts` exposes an `IStorage` interface and a `MemStorage` implementation. Use `storage` to perform CRUD within routes so swapping to DB later remains simple.
- Static assets: Excel and other assets live in `attached_assets/`. Example route: `GET /api/portfolio/excel` serves a file from `attached_assets` (see `server/routes.ts`) — follow the pattern for Content-Type and Content-Disposition headers.
- Nesting logic: heavy computation lives in `client/src/lib` (`nesting.ts`, `advanced-nesting.ts`, `geometry/`). When changing algorithms, prefer small, well-covered modifications and mirror helper functions used by the UI.

How to change/add API routes (concrete)
- Edit `server/routes.ts`. Add routes using `app.get|post|put|delete(...)`. Keep paths prefixed with `/api`.
- Use the `storage` instance for user persistence (`storage.createUser`, `getUserByUsername`) rather than adding ad-hoc in-memory maps.
- If the route should be available in dev with HMR, make the change and run `npm run dev`; Vite middleware will update the client automatically.

Dev / debug checklist
- Run dependencies install: `npm install`.
- Start dev: `npm run dev` (ts-node-like runner `tsx` executes server; ensure Node >= 18/20 is available). Set `PORT` if needed: `PORT=5010 npm run dev` (Windows PowerShell: `$env:PORT=5010; npm run dev`).
- Build and test production flow: `npm run build` then `npm start`.
- Typecheck: `npm run check`.
- Quick tests: `npx vitest` is available but not wired into `package.json`; inspect `client/src/lib/__tests__/` for unit tests.

Important files to reference
- `server/index.ts` — server bootstrap, logging middleware, error handler, dev vs prod setup.
- `server/vite.ts` — Vite middleware setup and production static serve logic.
- `server/routes.ts` — canonical place to add API endpoints; example of serving `attached_assets`.
- `server/storage.ts` — `IStorage` interface + `MemStorage` implementation.
- `shared/schema.ts` — Drizzle table definitions and `zod` insert/select types used across server and client.
- `vite.config.ts` + `tsconfig.json` — path alias and client root configuration.
- `client/src/lib/*` — core algorithms (nesting, geometry, units) used by UI components.

When making changes, follow these rules
- Preserve API prefix `/api` and the existing logging middleware semantics for `/api` endpoints.
- Keep server-side changes TypeScript-first and ensure `npm run check` passes.
- When adding imports use the repository aliases (`@`, `@shared`, `@assets`) for consistency with Vite and TS paths.
- Do not add server routes that conflict with Vite's dev catch-all — register routes before enabling Vite middleware and avoid file-system based catch-alls at top-level.

If you need more info
- Ask for build output logs or a failing test case to debug locally.
- Point to a file you want changed and specify desired behaviour; include expected input/output and whether changes affect client, server, or shared code.

Feedback requested: Are there any unclear areas you want the AI to expand (examples, test-run commands, Node version, or security notes)?
<!-- Copilot / AI agent instructions tailored to the ShapeNester repo -->
# ShapeNester — AI Assistant Instructions

Purpose: give an AI coding agent immediately useful, project-specific context so it can be productive without asking for basic repo orientation.

Quick facts
- **Repo layout:** server (Express + API), client (Vite + React in `client/`), shared (types/schema), `attached_assets/` (static files). See `server/index.ts`, `client/src/main.tsx` and `shared/schema.ts`.
- **Dev start:** `npm run dev` — runs `tsx server/index.ts` which starts the Express server and (in development) mounts Vite middleware. Use `PORT` to change the listening port.
- **Build / prod:** `npm run build` (runs `vite build` then bundles server with `esbuild` to `dist`), then `npm start` to run `node dist/index.js`.
- **Type-check:** `npm run check` (uses `tsc`).

Big picture (what to know)
- Single repository serves both API and SPA from the same port. In development, the server enables Vite middleware for HMR (`server/vite.ts`). In production the built client is served from `dist/public` (see `serveStatic`).
- API routes should be registered under `/api` via `registerRoutes(app)` in `server/routes.ts`. The server contains a logging middleware that captures JSON responses for `/api` endpoints (see `server/index.ts`) — preserve that behaviour when changing response flow.
- Data model: `shared/schema.ts` contains Drizzle/`zod` types and is imported with the alias `@shared` from client and server.

Project-specific conventions & patterns
- Path aliases (Vite + TS): `@` -> `client/src`, `@shared` -> `shared`, `@assets` -> `attached_assets`. See `vite.config.ts` and `tsconfig.json`. Use those aliases when adding imports.
- API prefix: All endpoints are expected under `/api`. Avoid adding top-level catch-all routes that run before `registerRoutes` — the server loads Vite middleware after registering routes to prevent interference.
- Storage abstraction: `server/storage.ts` exposes an `IStorage` interface and a `MemStorage` implementation. Use `storage` to perform CRUD within routes so swapping to DB later remains simple.
- Static assets: Excel and other assets live in `attached_assets/`. Example route: `GET /api/portfolio/excel` serves a file from `attached_assets` (see `server/routes.ts`) — follow the pattern for Content-Type and Content-Disposition headers.
- Nesting logic: heavy computation lives in `client/src/lib` (`nesting.ts`, `advanced-nesting.ts`, `geometry/`). When changing algorithms, prefer small, well-covered modifications and mirror helper functions used by the UI.

How to change/add API routes (concrete)
- Edit `server/routes.ts`. Add routes using `app.get|post|put|delete(...)`. Keep paths prefixed with `/api`.
- Use the `storage` instance for user persistence (`storage.createUser`, `getUserByUsername`) rather than adding ad-hoc in-memory maps.
- If the route should be available in dev with HMR, make the change and run `npm run dev`; Vite middleware will update the client automatically.

Dev / debug checklist
- Run dependencies install: `npm install`.
- Start dev: `npm run dev` (ts-node-like runner `tsx` executes server; ensure Node >= 18/20 is available). Set `PORT` if needed: `PORT=5010 npm run dev` (Windows PowerShell: `$env:PORT=5010; npm run dev`).
- Build and test production flow: `npm run build` then `npm start`.
- Typecheck: `npm run check`.
- Quick tests: `npx vitest` is available but not wired into `package.json`; inspect `client/src/lib/__tests__/` for unit tests.

Important files to reference
- `server/index.ts` — server bootstrap, logging middleware, error handler, dev vs prod setup.
- `server/vite.ts` — Vite middleware setup and production static serve logic.
- `server/routes.ts` — canonical place to add API endpoints; example of serving `attached_assets`.
- `server/storage.ts` — `IStorage` interface + `MemStorage` implementation.
- `shared/schema.ts` — Drizzle table definitions and `zod` insert/select types used across server and client.
- `vite.config.ts` + `tsconfig.json` — path alias and client root configuration.
- `client/src/lib/*` — core algorithms (nesting, geometry, units) used by UI components.

When making changes, follow these rules
- Preserve API prefix `/api` and the existing logging middleware semantics for `/api` endpoints.
- Keep server-side changes TypeScript-first and ensure `npm run check` passes.
- When adding imports use the repository aliases (`@`, `@shared`, `@assets`) for consistency with Vite and TS paths.
- Do not add server routes that conflict with Vite's dev catch-all — register routes before enabling Vite middleware and avoid file-system based catch-alls at top-level.

If you need more info
- Ask for build output logs or a failing test case to debug locally.
- Point to a file you want changed and specify desired behaviour; include expected input/output and whether changes affect client, server, or shared code.

Feedback requested: Are there any unclear areas you want the AI to expand (examples, test-run commands, Node version, or security notes)?
