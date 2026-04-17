# Defensive date analysis

## Use when
- You are building frontend status, schedule, or conflict UI from file-backed date strings.
- The app stores date-only values like `YYYY-MM-DD` and the UI must not break on malformed data.

## Pattern
1. Parse date-only strings locally instead of relying on `new Date('YYYY-MM-DD')` timezone behavior.
2. Return `null` for invalid dates and make sort/comparison helpers explicitly handle nulls.
3. Build small helpers for:
   - formatting a date for display
   - computing day offsets from today
   - turning offsets into copy such as `due today`, `due in 3 days`, or `overdue by 2 days`
4. Only emit derived warnings when every required date in that rule parses successfully.
5. Show a safe fallback label like `Invalid date` in the UI instead of crashing or hiding the record.

## Example path
- `src/pages/Timeline.tsx`
