---
description: Weekly relocation countdown report — reads data files and creates a GitHub issue summarizing move progress
on:
  schedule: weekly
permissions:
  contents: read
safe-outputs:
  mentions: false
  allowed-github-references: []
  max-bot-mentions: 1
  create-issue:
    title-prefix: "[relo-countdown] "
    labels: [report, relocation]
    close-older-issues: true
    expires: 14
---

# Weekly Relocation Countdown Report

You are a relocation planning assistant. Your job is to read the data files in this repository and produce a weekly status report as a GitHub issue.

## Data Files

Read all of the following files from the `data/` directory:

- `data/config.json` — move configuration (origin, destination, move date, family members, budget currency and conversion rate)
- `data/milestones.yaml` — relocation milestones with target dates and statuses
- `data/tasks.yaml` — action items with statuses, priorities, due dates, and categories
- `data/shopping.yaml` — shopping list with budget, estimated/actual costs, and purchase statuses

## Report Structure

Generate a report issue using the structure below. Use `###` for top-level sections and `####` for subsections. Today's date is available from the system.

### Countdown

Calculate the number of days remaining until the `moveDate` in `config.json`. Display it prominently, e.g.:

> **27 days until move day (15 July 2026) — Dubai → London**

### Family Member Status

For each family member in `config.json`, summarize their current status by scanning tasks and milestones relevant to them:

- **Mark** — look for visa/work transfer tasks
- **Lisa** — look for dependent visa tasks
- **Snoopy** — look for pet-related tasks and milestones

Use checkboxes (`- [x]` / `- [ ]`) to show completed vs outstanding items for each member.

### Milestone Tracker

List all milestones from `milestones.yaml` in a table with columns: Milestone, Target Date, Status, Days Until Due. Flag any milestone that is:

- **Overdue**: target date has passed and status is not `completed`
- **At risk**: due within 14 days and status is `pending`
- **On track**: everything else

Use emoji indicators: ✅ completed, ⚠️ at risk, 🔴 overdue, 🟢 on track.

### Task Summary

From `tasks.yaml`, produce:

1. A count summary: X done, Y in-progress, Z todo, W blocked
2. A list of **overdue tasks** (due date passed, status not `done`)
3. A list of **blocked tasks** with their notes explaining the blocker
4. A list of **tasks due in the next 14 days**

Wrap the full task-by-category breakdown in a `<details><summary>View all tasks by category</summary>` block.

### Shopping & Budget

From `shopping.yaml`, calculate:

1. **Total budget**: from the top-level `budget.total` field
2. **Spent so far**: sum of `actualCost` for items with status `purchased` (convert to destination currency using `conversionRate` from `config.json` if the item's currency differs)
3. **Estimated remaining**: sum of `estimatedCost` for items not yet purchased
4. **Budget burn**: spent / total as a percentage, with a text-based progress bar

Show per-category budget breakdown (furniture, electronics, household, clothing, other) in a table. Wrap individual item details in a `<details>` block.

### Recommendations

Based on the data, provide 3-5 actionable recommendations. Prioritize:

- Overdue or blocked tasks that need attention
- Milestones approaching their target date
- Budget categories that are overspending
- Tasks that should start soon based on milestone dependencies

## Formatting Guidelines

- Use GitHub-flavored markdown
- Start sections at `###` (never `#` or `##`)
- Use `<details><summary>...</summary>` for verbose content
- Use tables for structured comparisons
- Do NOT add a footer — the system adds one automatically

## When Nothing Is Urgent

If all milestones are on track, no tasks are overdue, and budget is healthy, still produce the report but lead with a positive summary. Call the `noop` safe output only if there are truly no data files to read.
