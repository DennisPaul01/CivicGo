# CivicGO Agent Instructions

Before making any code changes, read:

- `plan/README.md`
- `plan/01-friday-mvp-roadmap.md`
- The specific plan file related to the requested task

## Core rule

Follow the planning folder as the source of truth.

Do not implement features that contradict the plan.

## MVP priority

Optimize for the Friday HackTM demo.

Build in this order:

1. Live map landing with mock data
2. Auth
3. Report issue flow
4. Supabase image upload and issue save
5. AI analysis with fallback
6. Agent timeline with Framer Motion
7. Issue appears on map
8. Mission generated from issue
9. Points, badges and ranks
10. Rewards page
11. Zone leaderboard
12. Dashboard overview
13. Polish and demo data

## Product constraints

- Landing page must be map-led, with the live map visible immediately inside a large primary map box.
- Do not build a static marketing homepage.
- UI must be green, friendly, light, modern and map-first.
- All user-facing UI must be mobile responsive, then scale cleanly to tablet and desktop.
- Use Tailwind CSS as the styling system.
- Use shadcn/ui style components for reusable UI primitives.
- Use lucide-react for icons, especially inside buttons, filters, navigation, cards and tool actions.
- Use Framer Motion for key transitions.
- Use Zustand for shared frontend client state where it helps avoid prop drilling or duplicated local state.
- Do not build notifications in MVP.
- Use public activity feed and SignalR updates instead.

## UI implementation rules

- Prefer shadcn/ui component patterns before creating custom primitives.
- Prefer lucide-react icons over custom SVG icons when a matching icon exists.
- Use TanStack Query for server/cache state and Zustand for shared UI/client state.
- Icon-only buttons must have accessible labels.
- Keep the UI light, green, friendly and map-first.
- Check mobile layouts for every feature before marking the related checklist item complete.
- Map-first screens should use mobile bottom sheets or compact panels instead of cramped sidebars.
- Avoid horizontal scroll and text overflow on mobile.
- Do not create a generic marketing homepage; the live map box must remain the primary first-screen experience.

## Checklist discipline

Only mark an item as complete when:

- The implementation exists
- It is wired into the app
- It was manually or automatically verified
- It does not break the demo flow

Do not mark future/planned work as complete.

## Demo priority

The most important demo features are:

- Live map landing
- Report with photo
- AI agent timeline
- Issue status on map
- Mission generated
- Rewards + points + badge unlock
