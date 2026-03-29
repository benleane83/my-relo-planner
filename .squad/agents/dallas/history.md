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
