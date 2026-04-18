# Ripley — History

## Context
- **User:** Ben Leane
- **Project:** my-relo-planner — React/TypeScript/shadcn web app for overseas family relocation tracking
- **Spec:** spec.md contains full plan with data schemas, implementation phases, and design decisions
- **Key decisions:** YAML for structured data, Express API for real-time data refresh, read-only UI v1, dual currency support

## Learnings
- Timeline conflict detection now lives in `src\lib\timeline-conflicts.ts` as a pure helper with an injectable `now` value, while `src\pages\Timeline.tsx` only renders the returned conflicts.
- For milestone-derived critical blockers, treat every non-`done` linked task (`todo`, `in-progress`, `blocked`) as incomplete, but keep the copy milestone-focused (`is at risk`) instead of implying every in-progress task is itself blocked.
- Milestone critical blockers only apply when the milestone target date is within 14 days of today in either direction; old overdue milestones should not stay flagged forever.
- The current validation baseline remains `npm run test` and `npm run build`, while `npm run lint` is still blocked by the repo's missing ESLint 9 flat config.
- Key files for this revision: `src\lib\timeline-conflicts.ts`, `src\lib\__tests__\timeline-conflicts.test.ts`, and `src\pages\__tests__\Timeline.test.tsx`.

### 2026-04-18 — Team coordination: Timeline conflicts finalized
- Led reviewer-driven revision of Smart Timeline Conflicts feature
- Extracted shared conflict logic into `src/lib/timeline-conflicts.ts` (pure, testable utility)
- Synthesized team feedback from Parker (test-first) and Dallas (frontend implementation)
- Established 5 final rules: dependency ordering by dueDate, all-tasks-incomplete definition, 14-day absolute window, critical-blocker label with milestone-risk description
- Coordinated with Dallas, Parker, and Kane to align all agents on 5 expected conflicts per shared fixture
- Final build and test validation passed: `npm run build && npm run test`
- Feature deployment-ready
