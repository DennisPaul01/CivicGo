# Friday MVP Roadmap

## Obiectiv

Până vineri, **15 mai 2026**, CivicGO trebuie să aibă un demo coerent: utilizatorul deschide aplicația, vede harta live a Timișoarei, inspectează probleme raportate de alții, raportează o problemă cu poză, vede analiza AI, primește puncte și badge, iar problema devine misiune cu reward și impact pe zonă.

## Faza 1: Live map landing cu mock data

Prioritate: P0

Taskuri:

- [x] Creează aplicația React + Vite + TypeScript.
- [x] Configurează Tailwind CSS.
- [x] Configurează shadcn/ui style components.
- [x] Configurează lucide-react icons.
- [x] Configurează Framer Motion.
- [x] Configurează Zustand pentru shared frontend client state.
- [x] Configurează Mapbox GL JS.
- [x] Construiește ruta `/` cu hartă live într-un box principal.
- [x] Centrează harta pe Timișoara.
- [x] Adaugă top navigation flotant.
- [x] Adaugă buton flotant `Report an issue`.
- [x] Adaugă marker-e mock pentru new, AI checked, in progress, resolved, mission, reward și urgent.
- [x] Adaugă filtre: All, New, AI checked, In progress, Resolved, Missions, Rewards, Urgent.
- [x] Adaugă panel `City pulse`.
- [x] Adaugă feed public de activitate.
- [x] Adaugă selected issue panel.
- [x] Adaugă bottom rail cu misiuni active și probleme rezolvate.

Definition of Done:

- [x] Prima încărcare a aplicației arată imediat harta live.
- [x] Userul poate selecta marker-e și vede detalii.
- [x] Cel puțin un issue rezolvat arată before/after.
- [x] Harta arată vie chiar fără backend real.

## Faza 2: Auth basic cu Supabase

Prioritate: P0

Taskuri:

- [x] Configurează Supabase client în frontend.
- [x] Creează paginile `/login` și `/register`.
- [x] Implementează register cu email și parolă.
- [x] Implementează login cu email și parolă.
- [x] Implementează logout.
- [x] Persistă sesiunea în Supabase client.
- [x] Creează `ProtectedRoute`.
- [x] Protejează `/report`, `/profile`, `/rewards`, `/partner`, `/admin/dashboard` și `/admin/issues`.
- [x] Configurează backendul să valideze Supabase JWT.
- [x] Creează endpointul `GET /api/me`.
- [x] Creează profil local la primul login.

Definition of Done:

- [x] Userul se poate înregistra.
- [x] Userul se poate autentifica.
- [x] Userul autentificat poate intra pe `/report`.
- [x] Userul neautentificat este trimis la login înainte de raportare.

## Faza 3: Report issue flow

Prioritate: P0

Taskuri:

- [x] Creează ruta `/report`.
- [x] Creează componenta `ReportIssuePage`.
- [x] Creează `ImageUploader`.
- [x] Creează `IssueDescriptionInput`.
- [x] Creează `LocationPicker` cu hartă sau selector simplificat.
- [x] Adaugă preview pentru poză.
- [x] Adaugă validare minimă: poză și locație obligatorii.
- [x] Adaugă stare de submit, success și error.

Definition of Done:

- [x] Userul autentificat poate completa raportul.
- [x] Flow-ul este scurt și vizual.
- [x] Submit-ul declanșează salvarea issue-ului în fazele următoare.

## Faza 4: Supabase image upload și issue save

Prioritate: P0

Taskuri:

- [x] Creează ASP.NET Core Web API.
- [x] Configurează Swagger/OpenAPI.
- [x] Configurează CORS pentru frontend.
- [x] Configurează EF Core cu PostgreSQL.
- [x] Creează entitățile MVP: User, Issue, Zone, PublicActivityFeedItem.
- [x] Configurează conexiunea Supabase Postgres.
- [x] Configurează Supabase Storage pentru upload imagini.
- [x] Creează endpointul `POST /api/issues`.
- [x] Salvează imaginea în Supabase Storage.
- [x] Salvează issue-ul în database.
- [x] Returnează issue-ul creat către frontend.

Definition of Done:

- [x] Raportul trimis creează un issue real.
- [x] Imaginea are URL stocat.
- [x] Issue-ul poate fi citit prin `GET /api/issues`.

## Faza 5: AI analysis cu fallback

Prioritate: P0

Taskuri:

- [x] Integrează OpenAI API în backend.
- [x] Creează serviciu `IssueAiAnalysisService`.
- [x] Implementează Vision Agent pentru categorie, severitate, summary, confidence și urgent.
- [x] Implementează Triage Agent pentru responsible actor.
- [x] Implementează fallback determinist când lipsește cheia OpenAI.
- [x] Salvează rezultatul în `IssueAiAnalyses`.
- [x] Actualizează statusul issue-ului la `ai_analyzed`.

Definition of Done:

- [x] Demo-ul funcționează cu sau fără OpenAI key.
- [x] Issue-ul primește categorie, severitate și summary.
- [x] Rezultatul este afișabil în frontend.

## Faza 6: Agent timeline animat cu Framer Motion

Prioritate: P0

Taskuri:

- [x] Creează entitățile `AgentRun` și `AgentStep`.
- [x] Creează endpointurile pentru agent run și steps.
- [x] Creează componenta `AgentTimeline`.
- [x] Creează componenta `AgentStepCard`.
- [x] Animează intrarea pașilor cu fade și slide.
- [x] Animează pasul running cu pulse subtil.
- [x] Animează completed cu check.
- [x] Adaugă stare failed și fallback.

Definition of Done:

- [x] Userul vede pașii AI ca progres clar.
- [x] Timeline-ul arată cinematic, dar nu supraîncărcat.
- [x] Fallback-ul este prezentat ca rezultat valid, nu ca eroare dură.

## Faza 7: Issue nou apare pe hartă

Prioritate: P0

Taskuri:

- [x] Configurează React Query pentru issues.
- [x] După submit, invalidează query-ul de issues.
- [x] Adaugă issue-ul nou pe hartă.
- [x] Marchează issue-ul cu statusul curent.
- [x] Selectează automat issue-ul nou creat.
- [x] Animează apariția markerului.

Definition of Done:

- [x] După raportare, userul vede problema pe hartă.
- [x] Cardul issue-ului nou arată AI summary, status și puncte obținute.

## Faza 8: Misiune generată din issue

Prioritate: P1

Taskuri:

- [x] Creează entitățile `Mission`, `MissionIssue` și `MissionParticipant`.
- [x] Creează Mission Agent cu fallback.
- [x] Generează o misiune pentru issue-uri eligibile.
- [x] Leagă mission de issue.
- [x] Creează endpointurile `GET /api/missions`, `GET /api/missions/{id}`, `POST /api/missions/{id}/join`.
- [x] Afișează misiunea în selected issue panel.
- [x] Afișează marker de misiune pe hartă.

Definition of Done:

- [x] Issue-ul raportat poate genera o misiune.
- [x] Misiunea apare în UI și poate fi inspectată.
- [x] Demo-ul poate arăta legătura problemă -> misiune.

## Faza 9: Points, badges și ranks

Prioritate: P1

Taskuri:

- [x] Creează entitățile `Badge`, `UserBadge`, `Rank`, `UserPointsHistory`.
- [x] Seed ranks: New Citizen, Civic Rookie, Neighborhood Helper, Community Builder, City Guardian, Civic Hero, Urban Legend.
- [x] Seed badges MVP: First Reporter, AI Scout, Clean-up Hero, Before/After Hero.
- [x] Acordă puncte pentru valid report.
- [x] Acordă puncte pentru AI accepted report.
- [x] Deblochează `First Reporter` după primul raport valid.
- [x] Calculează rank curent pe baza punctelor.
- [x] Afișează achievement card în frontend.

Definition of Done:

- [x] Userul primește puncte după raportare.
- [x] Userul vede badge unlock.
- [x] Rank progress este vizibil în profil sau reward UI.

## Faza 10: Rewards page cu system și partner rewards

Prioritate: P1

Taskuri:

- [x] Creează entitățile `Partner`, `Reward`, `RewardClaim`.
- [x] Seed partneri: CoffeeLab, Local Gym, Bookstore, Restaurant, Coworking Space.
- [x] Seed partner rewards.
- [x] Creează endpointurile pentru rewards.
- [x] Creează ruta `/rewards`.
- [x] Adaugă taburi: System Rewards, Partner Rewards, Badges, Ranks, Claimed.
- [x] Afișează rewards blocate și disponibile.
- [x] Match reward din misiunea generată.

Definition of Done:

- [x] Userul vede rewards interne și externe.
- [x] Demo-ul poate arăta reward match după raportare.

## Faza 11: Zone leaderboard

Prioritate: P1

Taskuri:

- [x] Creează entitățile `Zone` și `ZoneScore`.
- [x] Seed zone din Timișoara: Girocului, Complex, Fabric, Soarelui, Mehala.
- [x] Actualizează scorul zonei când apare misiune sau issue rezolvat.
- [x] Creează endpointul `GET /api/zones/leaderboard`.
- [x] Creează ruta `/zones`.
- [x] Animează rank movement și count-up pentru scoruri.

Definition of Done:

- [x] Zonele au scoruri vizibile.
- [x] Demo-ul poate arăta impactul CivicGO la nivel de oraș.

## Faza 12: Dashboard overview

Prioritate: P2

Taskuri:

- [x] Creează ruta `/admin/dashboard`.
- [x] Creează cards pentru total issues, new issues, in-progress, resolved, active missions și rewards claimed.
- [x] Creează charturi simple pentru status și categorie.
- [x] Creează AI city summary cu fallback mock.
- [x] Creează `GET /api/dashboard/overview`.
- [x] Creează `GET /api/dashboard/ai-summary`.

Definition of Done:

- [x] Dashboard-ul arată o vedere de impact.
- [x] Datele pot fi reale sau seeded, dar coerente pentru demo.

## Faza 13: Polish, demo data și backup demo

Prioritate: P0

Taskuri:

- [x] Seed demo issues pentru toate statusurile importante.
- [x] Seed before/after pentru cel puțin două issues rezolvate.
- [x] Seed misiuni active.
- [x] Seed rewards și badges.
- [ ] Verifică flow-ul complet de demo.
- [x] Pregătește fallback când OpenAI lipsește.
- [ ] Pregătește fallback când Mapbox lipsește.
- [ ] Pregătește screenshoturi sau video backup.
- [x] Optimizează loading states.
- [x] Optimizează empty states.
- [x] Optimizează error states.

Definition of Done:

- [ ] Demo-ul poate fi rulat cap-coadă fără blocaje.
- [ ] Părțile mocked sunt vizual indistinguishabile de flow-ul real.

## Faza 14: Backlog critic post-audit

Prioritate: P0/P1 după stabilizarea demo-ului de bază

### SignalR live events

- [ ] Adaugă backend SignalR hub la `/civic-hub`.
- [ ] Definește event payloads pentru `IssueCreated`, `IssueAnalyzed`, `AgentStepCompleted`, `MissionCreated`, `RewardMatched`, `ZoneScoreUpdated`, `BadgeUnlocked`, `RankChanged` și `PointsAwarded`.
- [ ] Emite evenimente din flow-ul `POST /api/issues`, AI analysis, mission generation, reward matching, zone score și gamification.
- [ ] Adaugă client SignalR în frontend.
- [ ] La evenimente live, invalidează query-urile React Query relevante și actualizează map/feed/selected issue/dashboard.
- [ ] Păstrează fallback-ul cu React Query invalidation/polling când hub-ul nu este disponibil.

### Duplicate Agent real

- [ ] Creează serviciu backend `DuplicateDetectionService`.
- [ ] Caută issues nerezolvate la 100-300 metri folosind lat/lng numeric pentru MVP.
- [ ] Compară categorie, status și proximitate.
- [ ] Actualizează `DuplicateCount` și statusul `duplicate_detected` când există match solid.
- [ ] Adaugă `Duplicate Agent` în `AgentSteps`.
- [ ] Afișează duplicate count și nearest match în selected issue/issue details.

### Mapbox fallback complet

- [ ] Înlocuiește placeholder-ul simplu cu panel hartă stilizat light când lipsește tokenul.
- [ ] Randază aceleași marker-e absolute peste fallback map.
- [ ] Păstrează filtrele, selected issue panel, bottom rail și click-ul pe marker.
- [ ] Afișează mesaj discret că Mapbox token lipsește, fără să rupă demo-ul.

### Role protected routes

- [ ] Creează `RoleProtectedRoute` în frontend.
- [ ] Protejează `/admin/dashboard` și `/admin/issues` cu rol `admin`.
- [ ] Protejează `/partner` cu rol `partner`.
- [ ] Adaugă backend authorization policies pentru `admin` și `partner`.
- [ ] Afișează stare friendly de acces neautorizat.

### Rute și feature-uri lipsă

- [ ] Creează `/issues/:id` pentru issue details public.
- [ ] Creează `/command-center` ca advanced map/overview pentru demo extins.
- [ ] Creează `/zones/:id` pentru detalii zonă.
- [ ] Creează `/missions` și `/missions/:id` cu listă, detalii, participants, reward și join.
- [ ] Creează `/admin/issues` cu issue table, status selector și duplicate clusters.
- [ ] Creează partner dashboard real pentru rewards, claims și impact.
