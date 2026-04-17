# Copilot instructions for my-relo-planner

## Build, test, and lint

| Task | Command | Notes |
| --- | --- | --- |
| Install dependencies | `npm install` | Required before running the app or checks. |
| Run client and API together | `npm run dev` | Starts Vite on port 5173 and the Express API on port 3001. |
| Run only the client | `npm run dev:client` | Uses the Vite dev server. |
| Run only the API | `npm run dev:server` | Runs `server\index.ts` with `tsx watch`. |
| Production build | `npm run build` | Runs `tsc -b` and then `vite build`. |
| Full test run | `npm run test` | Uses Vitest. The repo currently has no committed `*.test.*` or `*.spec.*` files, so this exits with "No test files found". |
| Watch tests | `npm run test:watch` | Starts Vitest in watch mode. |
| Run a single test file | `npm run test -- <path-to-test-file>` | Example: `npm run test -- src\lib\__tests__\utils.test.ts`. |
| Run a single named test | `npm run test -- -t "test name"` | Useful once test files exist. |
| Lint | `npm run lint` | Script exists, but currently fails because the repo does not contain an `eslint.config.*` file for ESLint 9. |

## High-level architecture

- The app is a Vite + React + TypeScript SPA in `src\`. `src\App.tsx` wires the five main routes (`/`, `/research`, `/timeline`, `/tasks`, `/shopping`) inside a shared `AppLayout`.
- The frontend talks only to the local Express API. In development, Vite proxies `/api` requests to `http://localhost:3001`; the API is mounted in `server\index.ts`.
- The API is file-backed rather than database-backed. Live data comes from `data\config.json`, `data\tasks.yaml`, `data\milestones.yaml`, `data\shopping.yaml`, and `data\research\*.md`. `data-backup\` is not part of the running app.
- `server\routes\research.ts` is the special case in the data layer: research topics are Markdown files with YAML frontmatter, and the server returns both raw Markdown and rendered HTML.
- Client data access is centralized in `src\hooks\useApi.ts` with TanStack Query. Queries and mutations are organized by domain (`config`, `research`, `milestones`, `tasks`, `shopping`) and mutations invalidate matching query keys.
- Shared client types live in `src\types\index.ts`. When a payload shape changes, update the route handler, the shared types, and the corresponding hook together.

## Key conventions

- Follow the domain split that already exists: each feature has a server route in `server\routes\`, shared types in `src\types\index.ts`, React Query hooks in `src\hooks\useApi.ts`, and a page/dialog UI in `src\pages\` and `src\components\dialogs\`.
- Keep data files in their current formats. `config` stays JSON, `tasks` / `milestones` / `shopping` stay YAML, and `research` stays Markdown with frontmatter.
- Research slugs are lowercase, hyphenated file names. The research update API expects `bodyMarkdown`; it still accepts legacy `content`, but new client work should use `bodyMarkdown`.
- The YAML-backed route handlers preserve the top-level document shape and write with `yaml.dump(..., { lineWidth: -1 })`. Match that pattern when changing file writes.
- UI code uses the `@` path alias for `src\` imports and shadcn/ui structure from `components.json` (`new-york` style, `src\components\ui`, `src\lib\utils.ts` for `cn()`).
- Theme handling is split between startup and user preference: `src\main.tsx` applies the initial system dark-mode class, while `src\hooks\useTheme.ts` persists explicit light/dark choices in `localStorage`.
- TypeScript is strict (`strict`, `noUnusedLocals`, `noUnusedParameters`), so prefer updating types first rather than patching errors with casts.
- If you edit documentation, keep the existing doc style used in `.copilot\skills\docs-standards\SKILL.md`: sentence-case headings, active voice, and second person.
