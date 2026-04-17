# My Relo Planner

An app designed to help track an overseas family relocation process, with features including:
- storing research
- managing relocation timeline and key milestones
- tracking checklists and actions
- planning shopping and purchases related to the relo

I want to use local markdown files to store research across files per topic. Initial topics I have in mind are:
- Shipping and freight
- Work and visas
- Accomodation and housing
- Furniture
- Cars
- Pet

---

## Tech Stack

- **Frontend:** React + TypeScript + Vite + shadcn/ui
- **Data layer:** Local markdown (research) + YAML (tasks, milestones, shopping) + JSON (config)
- **API:** Lightweight Express server with file-watching for real-time data refresh
- **Deployment:** Local dev server (v1), with future path to Vercel or Azure Static Web Apps

## Data Directory Structure

```
data/
  config.json
  research/
    shipping-and-freight.md
    work-and-visas.md
    accommodation-and-housing.md
    furniture.md
    cars.md
    pet.md
  milestones.yaml
  tasks.yaml
  shopping.yaml
```

## Data Schemas

### config.json

Master move configuration:
- `origin` — `{ city, country }`
- `destination` — `{ city, country }`
- `moveDate` — target move date
- `familyMembers` — array of `{ name, notes }`
- `originCurrency` — currency code (e.g., `"USD"`)
- `destinationCurrency` — currency code (e.g., `"GBP"`)
- `conversionRate` — fixed rate for converting between origin and destination currencies

### Research Markdown Files

Each file in `data/research/` uses YAML frontmatter:
- `title`, `status` (not-started | in-progress | done), `lastUpdated`, `tags`
- Body is free-form markdown for research notes
- New files added to the directory are auto-discovered by the UI

### milestones.yaml

Each milestone:
- `id`, `title`, `category`, `targetDate`, `status` (pending | in-progress | completed), `notes`

Standard milestone set:
1. Planning & decision
2. Visa / work permit application
3. Housing research
4. Pet preparation (vaccinations, microchip, quarantine rules)
5. Shipping quotes & provider selection
6. Accommodation secured
7. Shipping / freight booked
8. Vehicle arrangements (sell/buy)
9. Furniture decisions (ship/sell/buy new)
10. Pre-departure admin (banking, mail redirect, subscriptions, schools)
11. Packing & shipping day
12. Travel / flight day
13. Arrival & initial setup
14. Post-arrival admin (registration, banking, phone, utilities)

### tasks.yaml

Single file for all tasks (simplifies querying and avoids agent confusion about which file to update). Each task:
- `id`, `title`, `category` (maps to research topic), `milestone` (optional ref), `status` (todo | in-progress | done | blocked), `priority`, `dueDate`, `notes`

### shopping.yaml

Each item:
- `id`, `item`, `category` (furniture | electronics | household | clothing | other), `quantity`, `estimatedCost`, `actualCost`, `currency`, `status` (needed | researching | purchased | shipped), `store`, `notes`

Top-level `budget` field with `total` and per-category limits. Items stored in their local currency; the UI converts and displays totals using the config's `conversionRate`.

## Implementation Plan

### Phase 1: Project Scaffolding & Data Schema

1. Initialize Vite + React + TypeScript project
2. Initialize shadcn/ui
3. Create the `data/` directory structure with seed data files
4. Define TypeScript types for all data schemas

### Phase 2: API Server

5. Create lightweight Express server (`server/` directory) serving API routes at `/api/*` and proxying to Vite dev server in dev mode
6. Implement API routes:
   - `GET /api/config` — returns parsed `config.json`
   - `GET /api/research` — lists research files with frontmatter metadata
   - `GET /api/research/:slug` — returns parsed markdown (frontmatter + HTML body) for a topic
   - `GET /api/milestones` — returns parsed milestones
   - `GET /api/tasks` — returns parsed tasks (optional query param `?category=`)
   - `GET /api/shopping` — returns parsed shopping list with computed totals
7. Add file-watching (chokidar) on `data/` to invalidate cached responses on file change so the UI reflects agent edits without restart

### Phase 3: React App — Layout & Navigation

8. Install shadcn components: Sidebar, Card, Table, Badge, Tabs, Progress, Separator, Skeleton, Alert
9. Build app shell with Sidebar navigation and 5 routes:
   - Dashboard (overview)
   - Research (topic browser)
   - Timeline (milestone visualization)
   - Tasks (checklist view)
   - Shopping (purchase tracker with budget)
10. Set up React Router for client-side routing
11. Create shared data-fetching hooks (`useConfig`, `useResearch`, `useMilestones`, `useTasks`, `useShopping`) using TanStack Query for auto-refresh

### Phase 4: Feature Pages

12. **Dashboard page**
    - Move summary card (origin → destination, days until move)
    - Milestone progress bar (completed / total)
    - Upcoming tasks (next 5 by due date)
    - Budget summary card (total spent vs total budget)
    - Visual alerts for milestones approaching their target date (within 7/14 days)
13. **Research page**
    - Left panel: topic list with status badges
    - Right panel: rendered markdown content (`react-markdown` + `remark-gfm`)
14. **Timeline page**
    - Vertical timeline visualization of milestones, color-coded by status
    - Group by category or linear chronological view
15. **Tasks page**
    - Grouped by category tabs with an All view
    - Header toggle switches between the default List layout and a Board layout grouped into Todo, In Progress, Blocked, and Done columns
    - List and Board views both respect the active category tab
    - Each task shows status badge, priority, due date
    - Filter/sort controls
16. **Shopping page**
    - Table of items with status badges
    - Budget summary at top (overall + per-category using Progress bars)
    - Dual currency display (local + converted)
    - Sort by category, status, cost

### Phase 5: Polish & Static Build

17. Add responsive design — mobile-friendly sidebar collapse
18. Configure static build path for eventual Vercel/Azure deployment
19. Populate seed data to demo all features

## Key Files

| Path | Purpose |
|---|---|
| `data/config.json` | Master move configuration |
| `data/research/*.md` | Research files with YAML frontmatter |
| `data/milestones.yaml` | Relocation milestones |
| `data/tasks.yaml` | Action items and checklists |
| `data/shopping.yaml` | Purchase tracker with budget |
| `server/index.ts` | Express API server |
| `server/routes/*.ts` | API route handlers |
| `src/App.tsx` | Root component with router |
| `src/components/layout/Sidebar.tsx` | App navigation |
| `src/pages/Dashboard.tsx` | Overview page |
| `src/pages/Research.tsx` | Research topic viewer |
| `src/pages/Timeline.tsx` | Milestone timeline |
| `src/pages/Tasks.tsx` | Task/checklist view |
| `src/pages/Shopping.tsx` | Shopping tracker |
| `src/hooks/useApi.ts` | Shared data-fetching hooks |

## Verification

1. `npm run dev` loads with sidebar navigation
2. Each API endpoint returns correct data from seed files
3. Edit a data file while the server is running — UI updates without restart
4. All 5 pages render with seed data
5. Tasks page defaults to List view, Board view groups tasks into the four status columns, and category tabs keep their filter when switching views
6. Budget calculations and currency conversions are correct on the Shopping page
7. Mobile viewport — sidebar collapses, content is readable
8. `npm run build` — no TypeScript or build errors

## Design Decisions

- **YAML for tasks/milestones/shopping** — richer metadata than markdown checkboxes (priority, category, due date) while remaining agent-friendly
- **Single tasks.yaml** — over per-topic task files, to simplify querying and avoid agent confusion about which file to update
- **Express API server** — over build-time bundling, so the UI can reflect agent file edits in real-time
- **Read-only UI in v1** — all data mutations happen via agents editing files directly; the web app only displays
- **Dual currency support** — items stored in their local currency, converted using a fixed rate from config
- **Research auto-discovery** — new markdown files in `data/research/` auto-appear in the UI via filesystem scan
- **Dashboard milestone alerts** — visual alerts (shadcn Alert component) for milestones approaching their target date, no push notifications
- **Future edit mode (v2)** — Express routes extend with POST/PUT endpoints, React pages add form components