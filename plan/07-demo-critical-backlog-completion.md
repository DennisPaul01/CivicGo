# Demo-Critical Backlog Completion

## Summary

This plan closes the most visible post-audit gaps for the Friday HackTM demo without expanding scope into production-grade admin, partner or live event systems.

Baseline:

- Frontend and backend builds passed before implementation.
- `GET /api/issues/{id}`, `GET /api/missions`, `GET /api/missions/{id}` and `POST /api/missions/{id}/join` already exist in the backend.
- Frontend route helpers and pages for issue details and missions are missing.
- `Issues.DuplicateCount` exists in the database, but duplicate data is not yet exposed in `IssueResponse`.
- SignalR is not configured yet and remains optional after the core demo gaps are closed.

## Key Changes

- Add simple role protection with `RoleProtectedRoute`, a friendly access-denied page using the exact copy `You don't have access to this area`, admin-only `/admin/dashboard` and `/admin/issues`, partner-only `/partner`, and demo mapping for `partner@civicgo.demo`.
- Add `/missions` and `/missions/:id` in the frontend using the existing mission endpoints, with responsive mission cards, linked issues, reward details, participant counts and `Join mission`.
- Add public `/issues/:id` using the existing issue details endpoint, showing photo, status, AI summary, severity, responsible actor, timeline, duplicate information, linked mission, reward and before/after where present.
- Add `DuplicateDetectionService` after AI analysis and before mission generation, using a 300m numeric lat/lng radius, same-category matching, `duplicate_detected` status, duplicate counts and a `Duplicate Agent` timeline step.
- Add minimal SignalR only after the core work is stable: `/civic-hub` plus `IssueCreated`, `IssueAnalyzed`, `MissionCreated`, `RewardMatched` and `ZoneScoreUpdated`, with React Query invalidation as fallback.

## Public Interfaces

- Frontend routes: `/issues/:id`, `/missions`, `/missions/:id`, `/partner`, `/admin/dashboard`, `/admin/issues`.
- Frontend API helpers: `fetchIssueById(id)`, `fetchMissionById(id)`, `joinMission(id, accessToken)`.
- Backend response fields: `IssueResponse.duplicateCount` and `IssueResponse.nearestDuplicate`.

## Test Plan

- Run `npm run build` in `frontend`.
- Run `dotnet build` in `backend`.
- Verify citizen access to `/admin/dashboard`, `/admin/issues` and `/partner` shows the friendly access-denied page.
- Verify admin access to both admin routes and partner access to `/partner`.
- Verify `/missions` loads mission cards and `/missions/:id` shows linked issues, reward and join button.
- Verify joining a mission updates participants after query invalidation.
- Verify `/issues/:id` shows photo, AI summary, timeline, mission, reward and duplicate information.
- Verify a nearby same-category active report creates a `Duplicate Agent` timeline step.
- Check mobile and desktop layouts for issue details, mission list, mission details and access-denied pages.

## Assumptions

- UI copy stays in English to match the current application.
- Duplicate detection uses a fixed 300m radius for MVP.
- No embeddings, no PostGIS and no complex admin or partner backend work in this pass.
- SignalR does not block the role, mission, issue details or duplicate MVP work.
