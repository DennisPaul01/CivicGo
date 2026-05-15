# CivicGO Plan

## Rezumat

CivicGO este o aplicație civic-tech verde, friendly și map-first pentru HackTM. Prima experiență nu este un landing page static, ci un landing map-led cu harta live a Timișoarei într-un box principal mare, unde se văd probleme raportate, probleme în progres, probleme rezolvate, misiuni active, scoruri pe zone și rewards.

Obiectivul pentru MVP este un demo stabil și convingător până vineri, **15 mai 2026**. Demo-ul trebuie să arate că CivicGO transformă o problemă urbană într-o misiune civică, cu analiză AI, puncte, badges, rewards și impact vizibil pe hartă.

## Status plan folder

- [x] Folder `plan/` creat.
- [x] Fișier principal `plan/README.md` creat.
- [x] Roadmap MVP de vineri creat.
- [x] Plan de arhitectură produs și tehnică creat.
- [x] Plan bază de date și API creat.
- [x] Plan frontend creat.
- [x] Plan AI, SignalR, gamification și rewards creat.
- [x] Plan demo, riscuri și fallback creat.
- [x] Plan CiviTm brand UI redesign creat.

## Fișiere de lucru

- [01-friday-mvp-roadmap.md](./01-friday-mvp-roadmap.md) - ordinea de build optimizată pentru demo.
- [02-product-and-technical-architecture.md](./02-product-and-technical-architecture.md) - arhitectura produsului și stack-ul tehnic.
- [03-database-and-api-plan.md](./03-database-and-api-plan.md) - model de date, endpointuri și seed data.
- [04-frontend-plan.md](./04-frontend-plan.md) - rute, componente, harta live și interacțiuni UI.
- [05-ai-signalr-gamification-rewards.md](./05-ai-signalr-gamification-rewards.md) - agenți AI, evenimente live, puncte, badges, ranks și rewards.
- [06-demo-risks-and-fallbacks.md](./06-demo-risks-and-fallbacks.md) - povestea demo-ului, riscuri și planuri de rezervă.
- [07-demo-critical-backlog-completion.md](./07-demo-critical-backlog-completion.md) - plan focused pentru role routes, issue details, missions, duplicate agent și SignalR minim.
- [08-civitm-brand-ui-redesign.md](./08-civitm-brand-ui-redesign.md) - plan pentru rebrandul public CiviTm și redesignul complet al UI-ului frontend.

## Status faze MVP

- [x] Faza 1: Live map landing cu mock data.
- [x] Faza 2: Auth basic cu Supabase.
- [x] Faza 3: Report issue flow.
- [x] Faza 4: Supabase image upload și issue save.
- [x] Faza 5: AI analysis cu fallback.
- [x] Faza 6: Agent timeline animat cu Framer Motion.
- [x] Faza 7: Issue nou apare pe hartă.
- [x] Faza 8: Misiune generată din issue.
- [x] Faza 9: Points, badges și ranks.
- [x] Faza 10: Rewards page cu system și partner rewards.
- [x] Faza 11: Zone leaderboard.
- [x] Faza 12: Dashboard overview.
- [ ] Faza 13: Polish, demo data și backup demo.

## Top 6 demo-critical features

- [x] Live map landing.
- [x] Report with photo.
- [x] AI agent timeline.
- [x] Issue status on map.
- [x] Mission generated.
- [x] Rewards + points + badge unlock.

## Must be real pentru HackTM

- [x] Harta live într-un box principal pe landing page.
- [x] Mapbox centrat pe Timișoara.
- [x] Probleme create de alții vizibile pe hartă.
- [x] Probleme noi, în progres și rezolvate vizibile.
- [x] Before/after pentru cel puțin un issue rezolvat.
- [x] Register, login și logout.
- [x] Rută protejată pentru raportare.
- [x] Upload imagine pentru issue.
- [x] Salvare issue în backend și database.
- [x] AI analysis sau fallback determinist dacă lipsește cheia OpenAI.
- [x] Agent timeline animat.
- [x] Issue nou adăugat pe hartă după submit.
- [x] Misiune generată din issue.
- [x] Puncte acordate userului.
- [x] Badge `First Reporter` deblocat.
- [x] Rank progress vizibil.
- [x] Reward match din date preîncărcate.
- [x] Zone leaderboard.
- [x] Dashboard overview.

## Can be mocked pentru HackTM

- [ ] Voice reporting.
- [ ] Duplicate detection avansat cu embeddings.
- [ ] PostGIS complet pentru toate query-urile geospațiale.
- [ ] Partner dashboard complet.
- [ ] Admin moderation avansat.
- [ ] Validare AI pentru before/after.
- [ ] Claim reward real cu coduri verificabile.
- [ ] Export rapoarte.
- [ ] Streaks.
- [ ] Custom badge builder.

## Reguli de produs

- [x] Landing page-ul este map-led, cu harta live într-un box principal, nu o pagină generică de marketing.
- [x] UI-ul rămâne light, verde, friendly, modern și map-first.
- [ ] Toate interfețele user-facing sunt mobile responsive și scalează curat pe tabletă și desktop.
- [x] Tailwind CSS este sistemul principal de styling.
- [x] shadcn/ui style components sunt baza pentru componente UI reutilizabile.
- [x] lucide-react este biblioteca standard pentru iconuri.
- [x] Framer Motion este folosit pentru momentele cheie: carduri, timeline, rewards, badges, rank progress.
- [x] Zustand este folosit pentru shared frontend client state acolo unde reduce prop drilling, stare duplicată sau coordonare manuală între componente.
- [x] TanStack Query rămâne sursa pentru server state, cache, invalidări și date venite din API.
- [x] Nu se construiesc notificări în MVP.
- [x] Public activity feed înlocuiește notificările.
- [x] Demo-ul are prioritate peste completitudinea producției.

## Backlog critic post-audit

- [x] SignalR live events: hub backend `/civic-hub`, client SignalR în frontend și evenimente pentru map/feed/dashboard.
- [x] Duplicate Agent real: verificare issues apropiate, incrementare duplicate count, agent step și UI pentru duplicate.
- [x] Mapbox fallback complet: hartă stilizată fără token cu marker-e absolute, filtre, selected issue panel și bottom rail funcționale.
- [x] Role protected routes: `RoleProtectedRoute`, politici backend și restricții reale pentru admin/partner.
- [x] Rute și feature-uri lipsă: `/issues/:id`, `/command-center`, `/zones/:id`, `/missions`, `/missions/:id`, `/admin/issues`, partner dashboard real.
