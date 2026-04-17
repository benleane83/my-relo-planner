# Parker — History

## Context
- **User:** Ben Leane
- **Project:** my-relo-planner — tests for relocation tracking web app + API
- **Test areas:** API route tests, React component tests, data schema validation, edge cases

## Learnings

### 2026-04-17: Timeline Conflicts Feature Testing
**What:** Created comprehensive test suite for Smart Timeline Conflicts feature
**File:** `src\pages\__tests__\Timeline.conflicts.test.tsx`
**Coverage:**
- Scheduling conflicts: tasks with dueDate after milestone targetDate
- Dependency gaps: tasks due within 7 days or overdue with incomplete prerequisites
- Critical blockers: blocked tasks + milestones within 14 days with all tasks incomplete
- No conflicts state (including empty data)
- Mixed conflict scenarios
- Edge cases: orphan tasks, milestones without tasks, invalid dates, loading states

**Key patterns:**
- Use `vi.mock('@/hooks/useApi')` to mock data hooks
- QueryClient wrapper helper for React Query tests
- Dynamic date generation for relative date tests (in 5 days, in 10 days, etc.)
- Test assertions use flexible regex patterns for text matching
- Tests are implementation-independent — they validate behavior, not implementation details

**Dependencies:** Tests created in parallel with Dallas's implementation. Tests assume the conflicts feature will render appropriate text indicating conflict types.

### 2026-04-17: Timeline Conflicts Cleanup
**What:** Fixed the remaining Timeline conflicts test failures without touching production code.
**Files:** `src\pages\__tests__\Timeline.conflicts.test.tsx`, `vitest.config.ts`, `src\test\setup.ts`
**Learnings:**
- `Milestone.status` only accepts `pending | in-progress | completed`; tests must use `completed`, not `done`.
- Conflict title assertions should be exact when the surrounding card copy also mentions conflict categories.
- Mixed conflict fixtures can legitimately render duplicate `Milestone at risk` alerts when more than one milestone is inside the 14-day blocker window.
- Relevant validation path for this feature is `npm run build` plus `npm run test -- src\pages\__tests__\Timeline.conflicts.test.tsx` (and `npm run test` for repo-wide confirmation).

### 2026-04-17: Sync follow-up — Tightened assertions
**What:** Further refined dependency-gap test assertions to avoid broad text matches and ensure targeted validation.
**Result:** All Timeline tests now passing with focused, behavior-driven assertions. Build passing. Feature validated and production-ready.
