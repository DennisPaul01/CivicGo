---
name: civicgo-mvp
description: Use for CivicGo/CiviTm development tasks in this repository, especially frontend, map, report, AI timeline, missions, rewards, gamification, admin, partner, responsive UI, demo polish, and checklist updates. Follow the plan folder as source of truth, preserve the Friday MVP priority order, keep the app map-first, and apply Tailwind, shadcn/ui style components, lucide-react, Framer Motion, TanStack Query, and Zustand conventions.
---

# CivicGo MVP

## Overview

Build CivicGo/CiviTm changes according to the Friday HackTM demo plan. Prefer stable demo flow, mobile-first map-led UI, and verified checklist updates over broad refactors or speculative production features.

## Required Reading

Before changing code, read:

- `plan/README.md`
- `plan/01-friday-mvp-roadmap.md`
- The plan file related to the requested task:
  - Frontend and UI: `plan/04-frontend-plan.md`
  - Brand redesign: `plan/08-civitm-brand-ui-redesign.md`
  - API/database: `plan/03-database-and-api-plan.md`
  - AI, SignalR, gamification, rewards: `plan/05-ai-signalr-gamification-rewards.md`
  - Demo risks and fallbacks: `plan/06-demo-risks-and-fallbacks.md`
  - Critical backlog routes and SignalR: `plan/07-demo-critical-backlog-completion.md`
  - Architecture or stack questions: `plan/02-product-and-technical-architecture.md`

## Build Order

Use this order when priority is unclear:

1. Live map landing with mock data
2. Auth
3. Report issue flow
4. Supabase image upload and issue save
5. AI analysis with fallback
6. Agent timeline with Framer Motion
7. Issue appears on map
8. Mission generated from issue
9. Points, badges, and ranks
10. Rewards page
11. Zone leaderboard
12. Dashboard overview
13. Polish and demo data

## Product Rules

- Keep `/` map-led. The live Timisoara map must remain visible immediately inside a large primary map box.
- Do not build a generic static marketing homepage.
- Keep the UI light, green, friendly, modern, and map-first. Public branding may use CiviTm tokens from `plan/08-civitm-brand-ui-redesign.md`.
- Keep routes, backend APIs, database entities, auth roles, and TypeScript response shapes unchanged unless the plan or task requires changing them.
- Do not build notifications for MVP. Use public activity feed and SignalR updates.
- Prioritize demo-critical flow: live map, report with photo, AI agent timeline, issue status on map, mission generated, rewards, points, and badge unlock.

## Frontend Rules

- Use Tailwind CSS for styling.
- Use shadcn/ui style component patterns before creating custom primitives.
- Use `lucide-react` icons, especially for buttons, filters, navigation, cards, and tool actions.
- Use Framer Motion for key transitions and keep motion soft, friendly, and not overloaded.
- Use TanStack Query for server/cache state.
- Use Zustand for shared client/UI state when it avoids prop drilling or duplicated local state.
- Make UI mobile-first, then scale to tablet and desktop.
- On map-first mobile screens, prefer bottom sheets, drawers, or compact rails instead of cramped sidebars.
- Avoid horizontal scroll, text overflow, and unlabeled icon-only buttons.

## UI/UX Design Skill

If `.agents/skills/ui-ux-pro-max` or `.claude/skills/ui-ux-pro-max` exists and the task is UI/UX design, responsive polish, accessibility, component styling, layout, typography, or visual review, use it as supporting guidance.

When using `ui-ux-pro-max`, keep CivicGo's plan above it. Do not adopt landing-page, palette, animation, or layout advice that weakens the map-first product constraint or contradicts the CiviTm brand plan.

## Checklist Discipline

Only mark a plan checklist item complete when:

- The implementation exists.
- It is wired into the app.
- It was manually or automatically verified.
- It does not break the demo flow.

Do not mark planned or future work as complete.

## Verification

For code changes, run the narrowest useful verification first. For UI changes, verify at least one mobile viewport and one desktop viewport before claiming responsive work is complete.
