# Squad Decisions

## Active Decisions

### 2026-03-29: Initial architecture decisions
**By:** Ben Leane (via planning session)
**What:**
- YAML for tasks/milestones/shopping — richer metadata than markdown checkboxes while remaining agent-friendly
- Single tasks.yaml over per-topic files to simplify querying
- Express API server over build-time bundling for real-time agent edit reflection
- Read-only UI in v1 — agents edit files directly, web app only displays
- Dual currency support — items stored in local currency, converted using fixed rate from config
- Research auto-discovery — new markdown files in data/research/ auto-appear in UI via filesystem scan
- Dashboard milestone alerts — visual alerts for approaching milestones, no push notifications

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
