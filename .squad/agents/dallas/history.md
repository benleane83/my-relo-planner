# Dallas — History

## Context
- **User:** Ben Leane
- **Project:** my-relo-planner — React/TypeScript/shadcn web app for overseas family relocation tracking
- **Pages:** Dashboard, Research, Timeline, Tasks, Shopping
- **Key patterns:** shadcn/ui components, TanStack Query hooks, React Router, responsive sidebar

## Learnings

### 2026-03-29 — Initial Frontend Build
- Built complete React UI with 5 pages, responsive sidebar, and TanStack Query data layer
- Used shadcn/ui component library (alert, badge, button, card, progress, scroll-area, separator, skeleton, table, tabs)
- Implemented data-fetching hooks via TanStack Query for auto-refresh from Express API
- Production build passes cleanly with no TypeScript or build errors
- React Router handles client-side navigation between Dashboard, Research, Timeline, Tasks, Shopping

### 2026-03-29 — Edit UI Support
- Created 6 dialog components (ConfigDialog, MilestoneDialog, TaskDialog, ShoppingItemDialog, BudgetDialog, ResearchDialog) using shadcn dialog pattern
- Added 12 mutation hooks to useApi.ts using TanStack Query's useMutation with automatic query invalidation on success
- Installed 5 new shadcn components: dialog, input, label, select, textarea
- ResearchDialog supports raw markdown editing for full-content topic updates
- All pages updated with contextual edit buttons/controls — pattern is trigger button → dialog → mutation → auto-refresh

### 2026-03-29 — Smart Timeline Conflicts View
- Implemented client-side conflict detection in Timeline.tsx using useMemo for real-time analysis
- Added three conflict types: scheduling conflicts (task due after milestone target), dependency gaps (upcoming tasks with incomplete prerequisites), and critical blockers (blocked tasks or at-risk milestones)
- Created collapsible Card section above timeline showing conflict count badge and detailed Alert components per conflict
- Used severity-based styling (destructive/amber/yellow) with appropriate lucide-react icons (XCircle, Clock, AlertTriangle, CheckCircle2)
- Added useTasks() hook to fetch task data alongside milestones for dependency analysis
- Zero-conflict state shows green success Alert with CheckCircle2 icon
- Pattern: useMemo for computed state → conditional rendering → shadcn Alert/Badge composition for visual hierarchy

### 2026-04-17 — Timeline conflicts hardening
- Hardened `src/pages/Timeline.tsx` with safe local-date parsing helpers so invalid task/milestone dates render as `Invalid date` instead of breaking comparisons or timeline ordering
- Adjusted conflict severity mapping to match the UI intent: blockers stay destructive, scheduling slips are amber, and dependency gaps are yellow
- Milestone blockers now cover both near-due and overdue milestones when every linked task is still incomplete, with wording that distinguishes `due today`, `due in N days`, and `overdue by N days`
- Kept production validation focused on `npm run build` plus `npm run test -- src\pages\__tests__\Timeline.conflicts.test.tsx`

### 2026-04-17 — Production deployment complete
- Timeline Conflicts feature finished and production-ready
- All build, test, and type validation passing
- Collaborated with Parker on test suite fixes; feature now fully integrated
- Milestone blocker coverage expanded to near-due and overdue cases
- Ready for user deployment

### 2026-04-18 — Timeline conflicts view refresh
- Timeline conflict UI lives in `src\pages\Timeline.tsx` as a collapsible card above the milestone timeline and uses existing shadcn `Card`, `Badge`, `Alert`, and `Separator` components
- Conflict detection is centralized in `src\lib\timeline-conflicts.ts`, with page rendering driven from a `useMemo` result and shared local-date formatting via `formatTimelineDate`
- Severity pattern is blocker = destructive/red, scheduling conflict = amber, dependency gap = yellow, with a green zero-conflict success state
- Regression coverage now lives in `src\lib\__tests__\timeline-conflicts.test.ts` and `src\pages\__tests__\Timeline.test.tsx`; `src\pages\__tests__\Tasks.test.tsx` needs longer per-test timeouts when the whole Vitest suite runs together

### 2026-04-18 — Team coordination: Timeline conflicts finalized
- Implemented Smart Timeline Conflicts UI with Ripley's extracted shared logic and clarified rules
- Treated overdue milestones with all linked tasks incomplete as critical blockers (absolute window, not just 14-day future)
- Coordinated with Parker (test review) and Kane (test alignment) to ensure all 6 tests pass
- Final build and test validation passed: `npm run build && npm run test`
- Feature ready for deployment
