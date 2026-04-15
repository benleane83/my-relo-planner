---
description: "Build a Smart Timeline Conflicts view that detects scheduling conflicts, dependency gaps, and blockers in the relocation timeline"
---

Add a **Smart Timeline Conflicts View** to this relocation planner app. The goal is a demo-friendly feature that analyses the timeline data and surfaces problems visually.

## What to build

A new "Conflicts" section on the existing [Timeline page](src/pages/Timeline.tsx) (not a separate route) that analyses [milestones](data/milestones.yaml) and [tasks](data/tasks.yaml) to detect and display:

1. **Scheduling conflicts** — tasks whose `dueDate` falls after their milestone's `targetDate`
2. **Dependency gaps** — tasks with status `todo` or `blocked` whose `dueDate` is in the past or within the next 7 days, where prerequisite tasks (earlier tasks in the same milestone) are not `done`
3. **Critical blockers** — any task with `status: blocked`, or milestones where all linked tasks are incomplete and the `targetDate` is within 14 days

## Architecture constraints

- **All conflict detection logic runs client-side** in a `useMemo` hook — no new API endpoints needed
- Use the existing `useMilestones()` and `useTasks()` hooks from [useApi.ts](src/hooks/useApi.ts) to get data
- Use the existing [types](src/types/index.ts): `Milestone` and `Task`
- Use shadcn/ui components already in the project: `Card`, `Badge`, `Alert`, `Separator`
- Import icons from `lucide-react` (already a dependency)

## UI design

- Add a collapsible conflicts summary **above** the timeline, showing a count badge (e.g., "3 conflicts found")
- Each conflict is an `Alert` with:
  - An icon indicating severity (red for blockers, amber for conflicts, yellow for gaps)
  - A title naming the conflict type
  - A description with the specific task/milestone names and dates involved
- If zero conflicts, show a green success alert: "No conflicts detected"
- Use the app's existing color conventions: `bg-emerald-500` for good, `bg-destructive` for problems

## Scope limits

- Do NOT add a new route or page — extend the existing Timeline page
- Do NOT add new API endpoints or modify the server
- Do NOT modify the data files
- Keep it to ~150 lines of new code maximum