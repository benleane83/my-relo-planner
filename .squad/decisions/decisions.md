# Project Decisions

## Timeline conflicts: Final rules

- **Date:** 2026-04-18
- **By:** Ripley (Lead)
- **Status:** accepted

### Decision
1. Interpret **all linked tasks are incomplete** as every linked task having a status other than `done`, including `todo`, `in-progress`, and `blocked`.
2. Require **at least one linked task** before a milestone can raise a derived critical blocker.
3. Treat **within 14 days** as an absolute 14-day window around today, so upcoming and recently overdue milestones can alert, but stale overdue milestones do not stay flagged forever.
4. Keep dependency ordering inferred client-side by milestone-local due date order, with original task order as the tie-breaker.
5. Keep alert title as **Critical blocker** to match product prompt, but phrase description as milestone risk.

### Why
This keeps the implementation faithful to the prompt while avoiding harsher wording for milestones that are merely in progress. It stabilizes conflict counts for tests by making the overdue-window rule explicit.

### Touched paths
- `src/pages/Timeline.tsx`
- `src/lib/timeline-conflicts.ts`
- `src/lib/__tests__/timeline-conflicts.test.ts`

---

## Timeline conflicts follow-up (Dallas)

- **Date:** 2026-04-17
- **By:** Dallas (Frontend Dev)
- **Status:** accepted

### Decision
- Treat overdue milestones with all linked tasks still incomplete as critical blockers in the Timeline conflicts card, not just milestones due in the next 14 days.
- Parse `YYYY-MM-DD` values locally in the frontend and fail soft on invalid dates so timeline ordering and conflict detection remain stable.

### Why
- The timeline feature is meant to surface active relocation risks, and an overdue milestone is a stronger blocker than a merely near-due one.
- Plain `new Date('YYYY-MM-DD')` parsing can shift dates by timezone and invalid values silently poison sort/comparison logic, so the UI needs defensive parsing.

### Touched paths
- `src/pages/Timeline.tsx`

---

## Testing Pattern: Component-Specific Test Files with Suffix

- **Date:** 2026-04-17
- **By:** Parker (Tester)
- **Status:** accepted

### Decision
For complex features within a component, create dedicated test files with descriptive suffixes rather than one monolithic test file.

### Example
- `Timeline.conflicts.test.tsx` for Smart Timeline Conflicts feature
- Future: `Timeline.sorting.test.tsx`, `Timeline.filtering.test.tsx`, etc.

### Rationale
1. **Maintainability**: Each feature's tests are isolated and easy to locate
2. **Parallel development**: Multiple agents can work on tests for different features simultaneously
3. **Readability**: Test file names clearly indicate what they cover
4. **Run efficiency**: Can run specific feature tests without running all component tests

### Impact
- Test organization convention for the project
- Other agents should follow this pattern for complex component features

---

## Timeline Conflict Detection — Test-First Utility

- **Date:** 2026-04-17
- **By:** Parker (Tester)
- **Status:** accepted

### What
Created `src/lib/timeline-conflicts.ts` as a reference implementation of the conflict detection logic, alongside 26 comprehensive tests in `src/lib/__tests__/timeline-conflicts.test.ts`.

### Why
Thorough unit testing without React rendering overhead, clear separation of concerns, and easy reuse if conflicts need to appear elsewhere (e.g., Dashboard alerts).

### Key Design Choices
- `detectConflicts(milestones, tasks, now)` takes a `now` parameter for deterministic testing
- Dependency ordering inferred from dueDate sort within milestone task groups
- 7-day boundary for dependency gaps, 14-day boundary for critical milestone blockers
- Returns typed `TimelineConflict[]` with `type`, `message`, `taskId?`, `milestoneId?`

---

## Read-Only to Edit-Enabled UI

- **Date:** 2026-03-29
- **By:** Coordinator
- **Status:** accepted

### Context
Initial v1 followed read-only UI design where all data mutations were performed by agents editing files directly. The web app only displayed data. Users had no ability to create, update, or delete records through the browser.

### Decision
Transition the application from read-only to full edit support. Add write API endpoints on the backend with input validation and path-traversal protection. Add dialog-based editing on the frontend for all data types (config, milestones, tasks, shopping items, budget, research topics).

### Rationale
- Users need to manage their relocation data directly without relying on agents for every change
- In-app editing provides faster iteration on tasks, shopping lists, and research notes
- Dialog-based UI keeps the browsing experience clean while offering full edit capability on demand
- Path-traversal protection ensures write endpoints cannot be exploited to modify files outside the data directory

### Consequences
- All 5 API route files now handle both reads and writes
- 6 new dialog components and 12 mutation hooks added to the frontend
- Data files (`config.json`, `*.yaml`, `research/*.md`) are now writable from both the UI and agent-side file edits
- Chokidar file-watching ensures both mutation paths stay in sync — UI writes update files, and agent file edits trigger UI refresh via TanStack Query invalidation
