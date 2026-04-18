# Timeline conflicts detection

## Use when

- You need to surface timeline blockers, dependency gaps, or scheduling slips from milestone and task data.
- The UI needs deterministic conflict counts in tests.

## Pattern

1. Extract the conflict rules into a pure helper (for this repo: `src\lib\timeline-conflicts.ts`).
2. Accept `milestones`, `tasks`, and an optional `now` date so tests can pin time without mocking the whole runtime.
3. Group tasks by milestone, sort them by `dueDate`, and use original array order as the tie-breaker.
4. Keep milestone-derived blocker copy focused on milestone risk even when all linked tasks are only `in-progress`.
5. Bound milestone blocker alerts to an absolute 14-day window around today so old overdue milestones do not linger forever.

## Repo example

- Production: `src\lib\timeline-conflicts.ts`
- UI integration: `src\pages\Timeline.tsx`
- Tests: `src\lib\__tests__\timeline-conflicts.test.ts` and `src\pages\__tests__\Timeline.test.tsx`
