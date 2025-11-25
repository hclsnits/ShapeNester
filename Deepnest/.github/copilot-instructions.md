<!-- .github/copilot-instructions.md - guidance for AI coding agents -->
# Guidance for AI coding agents working on deepnest

Purpose: give AI agents the minimum, high-value knowledge to be productive in this repository.

- Big picture:
  - **Type**: Electron desktop app (main process + renderer web files) written in TypeScript/JavaScript, with performance-critical nesting code provided by native/external modules.
  - **Entry point**: `main.js` (compiled from sources in `main/`). See `package.json` `main`.
  - **Nesting engine**: native/outsourced modules such as `@deepnest/calculate-nfp` perform heavy calculations. Changes to native code require platform toolchains and rebuilding (`electron-rebuild`).

- Where to make changes:
  - Edit source TypeScript in `/main` and `nfpDb.ts` — do NOT edit `build/` artifacts directly. The `build/` directory contains compiled outputs.
  - UI logic lives in files under `main/` (e.g. `main/deepnest.js`, `main/background.js`, `main/page.js`). Use those files to trace renderer ↔ main process interactions.

- Build / test / run (exact commands):
  - Install: `npm install`
  - Build: `npm run build` (runs `tsc && electron-rebuild`).
  - Start app (dev): `npm run start` (runs `electron .`).
  - Tests: `npm run test` (Playwright). Run `npx playwright install chromium` once before test runs.
  - Package: `npm run dist` or electron-builder via `npm run build-dist`.
  - Clean: `npm run clean` and `npm run clean-all`.

- Important dev notes and prerequisites (from `BUILD.md`):
  - Node >= 20, Python 3.7+, and platform native toolchains (Visual Studio C++ on Windows) are required for some native builds.
  - After native dependency changes run `npm run build` (which runs `electron-rebuild`).

- Project-specific patterns & conventions:
  - Packaging ignores `.ts` files; the packaged app contains compiled JS (`package.json` `files` and `build.files`). Always modify `.ts` sources and then run `npm run build`.
  - Pre-commit hooks: `husky` + `lint-staged` will autoformat/lint changed files on commit.
  - Playwright tests live in `tests/`. Test code-gen helper: `helper_scripts/playwright_codegen.js`.

- Integration points / external dependencies:
  - `@deepnest/calculate-nfp` and `@deepnest/svg-preprocessor` implement core calculations and preprocessing.
  - Native modules or changes to C/C++/Rust require platform toolchains and may need `electron-rebuild` and `electron-builder` adjustments.

- Quick examples to reference when editing:
  - UI change: edit `main/deepnest.js` or `main/page.js`, run `npm run build`, then `npm run start` to verify.
  - Native change: modify native module or external package, run `npm run build` and test on target platforms; packaging changes may require updating `package.json` `build` settings.

- Debugging pointers:
  - To open the DevTools during runtime set `deepnest_debug=1` before `npm run start`.
  - Playwright failures: inspect `playwright-report/` and ensure `npx playwright install chromium` executed.
  - Build/package failures: inspect `npm run build` and `npm run dist` logs; check `package.json` `build` section.

If you want more detailed file-level call graphs, annotated examples of typical PR changes, or recommended test cases to add, tell me which area to expand and I will iterate.
