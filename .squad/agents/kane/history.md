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
