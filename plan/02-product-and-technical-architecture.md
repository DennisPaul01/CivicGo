# Product and Technical Architecture

## Product architecture

CivicGO pornește cu orașul, nu cu un formular. Ruta `/` este o hartă live a Timișoarei care arată probleme, misiuni, rewards, scoruri de zonă și activitate civică.

Experiențele principale:

- [x] Anonymous user vede harta live, issue-uri publice, misiuni, rewards preview și leaderboard.
- [ ] Citizen user raportează probleme, confirmă issue-uri, intră în misiuni, primește puncte, badges și ranks.
- [ ] Trusted citizen validează și ajută la moderare într-o versiune ulterioară.
- [ ] Partner creează rewards și vede impact într-un dashboard simplificat.
- [ ] Admin vede overview, issue table, duplicate clusters și AI city summary.

Principiul MVP:

- [ ] Demo-ul trebuie să pară complet.
- [x] Funcțiile secundare pot fi mocked sau seeded.
- [ ] Fiecare experiență user-facing trebuie să fie mobile responsive.
- [x] Nu se construiesc notificări în MVP.

## Technical architecture

Stack frontend:

- [x] React.
- [x] Vite.
- [x] TypeScript.
- [x] TanStack Query.
- [x] Zustand pentru shared frontend client state.
- [x] Tailwind CSS.
- [x] shadcn/ui style components.
- [x] lucide-react icons.
- [x] Framer Motion.
- [x] Mapbox GL JS.
- [ ] deck.gl pentru heatmap și overlays dacă există timp.
- [ ] SignalR client.
- [x] Supabase JS client pentru Auth.

Stack backend:

- [x] ASP.NET Core Web API.
- [ ] .NET 8 sau .NET 9.
- [x] Entity Framework Core.
- [x] PostgreSQL provider.
- [ ] SignalR.
- [x] Swagger/OpenAPI.
- [x] OpenAI API integration.
- [x] Supabase Storage integration.
- [ ] Dockerfile pentru Railway.

Infrastructure:

- [ ] Railway pentru .NET API.
- [x] Supabase Postgres.
- [ ] Supabase PostGIS.
- [x] Supabase Auth.
- [x] Supabase Storage.
- [x] Mapbox pentru hărți.
- [x] OpenAI pentru agenți AI.
- [ ] Vercel sau Railway pentru frontend.

## Responsabilități frontend

- [x] Live map landing page.
- [ ] Mobile responsive layouts pentru toate rutele user-facing.
- [x] Auth screens.
- [x] Protected routes.
- [x] Report issue flow.
- [x] Agent timeline UI.
- [ ] Issue cards și issue details.
- [ ] Mission cards și mission details.
- [x] Rewards UI.
- [x] Profile page.
- [x] Leaderboard.
- [x] Admin dashboard.
- [ ] Partner dashboard simplificat.
- [ ] SignalR event listeners.
- [x] React Query cache invalidation.
- [x] Zustand stores pentru state partajat între componente, de exemplu filtre de hartă, selected issue, auth/profile UI state, demo mode și achievement overlays.
- [x] Separare clară: TanStack Query pentru server/cache state, Zustand pentru UI/client state.

## Responsabilități backend

- [x] REST API endpoints.
- [x] Business logic pentru issue lifecycle.
- [x] Validare JWT Supabase.
- [x] Profile creation după primul login.
- [x] AI agent orchestration.
- [ ] Duplicate detection MVP.
- [x] Mission generation.
- [x] Reward matching.
- [x] Points, badges și ranks.
- [ ] SignalR events.
- [x] Database persistence.
- [x] Supabase Storage upload.

## Supabase responsibilities

- [x] Auth pentru register, login, logout și session persistence.
- [x] Postgres database pentru datele aplicației.
- [ ] PostGIS pentru query-uri geospațiale.
- [x] Storage pentru imagini before/after și imagini raportate.

## Mapbox responsibilities

- [x] Hartă interactivă.
- [x] Markers pentru issues, missions și rewards.
- [ ] Zone overlays.
- [ ] Heatmap.
- [ ] Cluster layer dacă există timp.

## OpenAI responsibilities

- [x] Image analysis pentru Vision Agent.
- [x] Issue classification.
- [x] Triage.
- [ ] Mission generation.
- [ ] Reward suggestions.
- [x] City insights summary.
- [x] Fallback mock când cheia lipsește sau API-ul e instabil.

## Auth flow

Frontend:

- [x] Userul se înregistrează prin Supabase Auth.
- [x] Supabase returnează session.
- [x] Frontend păstrează session prin Supabase client.
- [x] Frontend trimite Bearer token către .NET API.
- [x] Frontend cere profilul local prin `GET /api/me`.
- [ ] Frontend protejează rutele pe baza rolului.

Backend:

- [x] API-ul validează Supabase JWT.
- [x] API-ul extrage Supabase user id.
- [x] API-ul caută profilul local după `SupabaseUserId`.
- [x] API-ul creează profil local dacă lipsește și flow-ul permite.
- [ ] API-ul verifică rolul pentru rute protejate.

Roluri:

- [x] `citizen`.
- [x] `trusted_citizen`.
- [x] `partner`.
- [x] `admin`.

## Rute publice

- [x] `/`.
- [x] `/login`.
- [x] `/register`.
- [ ] `/issues/:id` pentru preview public.
- [ ] `/missions`.
- [x] `/zones`.

## Rute protejate

- [x] `/report`.
- [x] `/profile`.
- [ ] `/missions/:id` pentru join/leave.
- [x] `/rewards` pentru claim.
- [x] `/partner`.
- [x] `/admin/dashboard`.
- [x] `/admin/issues`.

## No-notifications MVP rule

Nu se implementează:

- [x] In-app notification center.
- [x] Email notifications.
- [x] Push notifications.
- [x] SMS notifications.
- [x] WhatsApp notifications.
- [x] Notification table.
- [x] Notification endpoints.
- [x] `NotificationCreated` SignalR event.

Se folosește în schimb:

- [x] Public city feed.
- [ ] SignalR live map updates.
- [x] Agent timeline.
- [x] Status changes.
- [x] Activity feed.
- [ ] Dashboard updates.

## Backlog arhitectural post-audit

- [ ] SignalR: adaugă hub `/civic-hub`, contracte de evenimente, broadcast din backend și listener frontend.
- [ ] Duplicate detection: adaugă serviciu real cu radius 100-300m, comparație categorie/status și fallback lat/lng până la PostGIS.
- [ ] Mapbox fallback: păstrează marker-ele, filtrele și panourile pe o hartă stilizată când lipsește tokenul.
- [ ] Role protection: implementează `RoleProtectedRoute`, policies backend și UI de acces neautorizat.
- [ ] Rute lipsă: `/issues/:id`, `/command-center`, `/zones/:id`, `/missions`, `/missions/:id`, `/admin/issues`, partner dashboard real.
