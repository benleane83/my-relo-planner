# Kane — History

## Context
- **User:** Ben Leane
- **Project:** my-relo-planner — Express API server serving local data files
- **API routes:** /api/config, /api/research, /api/research/:slug, /api/milestones, /api/tasks, /api/shopping
- **Data formats:** JSON (config), YAML (milestones, tasks, shopping), Markdown with frontmatter (research)

## Learnings

### 2026-03-29 — Initial Scaffold
- Scaffolded full Express API server with 5 route files serving local YAML/JSON/Markdown data
- Created seed data for all categories (config, milestones, tasks, shopping, 6 research topics)
- Used gray-matter for markdown frontmatter parsing, js-yaml for YAML, marked for HTML rendering
- Set up chokidar file-watching so API reflects data file edits without server restart
- Added shared TypeScript types consumed by both server and frontend

### 2026-03-29 — Write API Endpoints
- Added write endpoints (PUT, POST, DELETE) to all 5 route files for full CRUD support
- Implemented input validation on all write endpoints to reject malformed payloads
- Added path-traversal protection on slug/id-based routes to prevent directory escape attacks
- Research write endpoints generate markdown files with YAML frontmatter from structured input
- Shopping routes support both item-level CRUD and budget-level updates as separate endpoints

### 2026-04-18 — Team coordination: Timeline conflicts test alignment
- Ensured shared conflict detection tests align with helper implementation behavior
- Treated `detectTimelineConflicts` utility as single source of truth
- Verified `src/lib/__tests__/timeline-conflicts.test.ts` and component tests both reflect same 5-conflict count
- Coordinated with Ripley on clarified rules and Parker on testing pattern
- Final build and test validation passed with consistent behavior: `npm run build && npm run test`
