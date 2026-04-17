# Project Name

## Overview
Add an alternative Board view to the Tasks page so users can switch between the current list layout and a kanban-style board grouped by task status. The new view should use existing shadcn/ui components, preserve the current list view exactly as-is, and present tasks in four status columns with clear visual hierarchy and overflow handling.

## Tasks
- [x] Review the existing Tasks page structure and identify the smallest integration point for a List/Board view toggle without changing current list behavior
- [x] Add a header toggle button group that switches between List and Board views and defaults safely to the existing list experience
- [x] Implement the Board view layout with four equal-width columns for Todo, In Progress, Blocked, and Done, including color-coded headers and task count badges
- [x] Create reusable task board cards using existing shadcn/ui Card, Badge, and Button patterns to show title, category, priority, and due date
- [x] Configure board column scrolling, responsive layout behavior, and status-based task grouping so overflow is handled cleanly while preserving usability
- [x] Verify the Tasks page behavior in both views and add or update targeted tests/documentation for the new board view interaction

## Technical Details
Use the existing Vite + React + TypeScript frontend and current shadcn/ui component set already present in the project. The Tasks page should retain its current list rendering path unchanged, with the new board view introduced as an alternative presentation layer driven by existing task data and status values. Prefer minimal, localized changes in the Tasks page and related components, and reuse existing task types, badge styling conventions, and page header patterns where possible.