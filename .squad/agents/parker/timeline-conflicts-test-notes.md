# Timeline Conflicts Test Suite — Implementation Notes

## For Dallas (Frontend Developer)

I've created a comprehensive test suite for the Smart Timeline Conflicts feature at:
`src/pages/__tests__/Timeline.conflicts.test.tsx`

### What the tests expect

The tests are **implementation-agnostic** — they only check that the UI displays appropriate text when conflicts are detected. You have full freedom in how you implement the feature.

### Required UI text patterns

The tests use flexible regex matching. Your implementation should include text that matches these patterns when appropriate:

1. **When conflicts exist:**
   - Text matching `/conflicts found|scheduling conflict|dependency gap|critical blocker/i`
   - For multiple conflicts: text matching `/\d+ conflicts/i` (e.g., "2 conflicts", "3 conflicts found")

2. **When no conflicts exist:**
   - Text matching `/no conflicts detected/i`

3. **While loading:**
   - Should NOT show conflicts section (tests check `queryByText(/conflicts/i)` returns null)

### Test coverage

✅ **Scheduling conflicts**
- Task dueDate after milestone targetDate
- Multiple scheduling conflicts
- Tasks with dueDate before/on targetDate (should NOT conflict)

✅ **Dependency gaps**
- Tasks due within 7 days with incomplete prerequisites
- Overdue tasks with incomplete prerequisites
- Tasks with completed prerequisites (should NOT conflict)
- Blocked tasks (handled separately as critical blockers)

✅ **Critical blockers**
- Tasks with `status: blocked`
- Milestones within 14 days where ALL tasks are incomplete
- Milestones with at least one done task (should NOT conflict)
- Milestones beyond 14 days (should NOT conflict)

✅ **Edge cases**
- Tasks without milestone assignment
- Milestones with no linked tasks
- Invalid date formats (should not crash)
- Empty data (should show "no conflicts")
- Mixed conflict scenarios

✅ **Loading state**
- Conflicts section hidden during loading

### Running the tests

```bash
# Run all tests
npm run test

# Run only Timeline conflicts tests
npm run test -- src\pages\__tests__\Timeline.conflicts.test.tsx

# Watch mode
npm run test:watch
```

### Notes

- Tests mock `useMilestones()` and `useTasks()` from `@/hooks/useApi`
- Tests use dynamic dates (e.g., "in 5 days") so they work regardless of when they run
- Tests don't prescribe specific UI components or styling — only that appropriate text appears
- You can add the conflicts section anywhere on the Timeline page

### Current status

✅ Tests written and ready
⏳ Awaiting your implementation of the conflicts detection logic and UI

If the implementation reveals gaps in the test coverage, let me know and I'll extend the tests. But DO NOT modify production code yourself — that's Dallas's domain.

— Parker
