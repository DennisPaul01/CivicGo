# Frontend Plan

## UI system

- [x] Tailwind CSS este folosit pentru layout, spacing, responsive design, culori și state-uri vizuale.
- [x] shadcn/ui style components sunt folosite ca bază pentru button, card, badge, tabs, dialog, sheet, form, input, textarea, select și table.
- [x] lucide-react este folosit pentru iconuri în navigație, butoane, filtre, marker labels, cards, dashboard stats și tool actions.
- [x] Zustand este folosit pentru shared frontend client state acolo unde ajută: filtre de hartă, selected issue, selected mission/reward, demo mode, auth/profile UI state și achievement overlays.
- [x] TanStack Query este folosit pentru server state, request cache, invalidări și sincronizare cu API-ul.
- [ ] Fiecare pagină și componentă user-facing este mobile responsive înainte să fie marcată ca finalizată.
- [x] Icon-only buttons au label accesibil.
- [x] Componentele custom păstrează stilul shadcn: light UI, border subtil, shadow soft, radius moderat și focus states clare.
- [x] Nu se folosesc SVG-uri custom când există icon potrivit în lucide-react.

## Responsive rules

- [x] Mobile-first pentru layout, apoi tabletă și desktop.
- [x] Harta rămâne utilizabilă pe mobile, fără panouri laterale înghesuite.
- [ ] Pe mobile, issue details, filters, city pulse și mission/reward previews folosesc bottom sheets, drawers sau rail-uri compacte.
- [x] Textele, butoanele, cardurile și taburile nu produc overflow orizontal.
- [x] Elementele interactive au dimensiuni potrivite pentru touch.
- [ ] Verifică cel puțin un viewport mobile și unul desktop înainte să marchezi un UI task ca done.

## Frontend state rules

- [x] Folosește Zustand pentru state partajat între componente care nu este direct server state.
- [x] Evită prop drilling pentru state folosit de mai multe panouri sau rute; creează store mic, clar și tipat.
- [x] Nu muta în Zustand date care trebuie cache-uite, invalidate sau reîncărcate din API; acestea rămân în TanStack Query.
- [ ] Store-urile Zustand trebuie să fie pe domenii mici: `mapStore`, `authUiStore`, `demoStore`, `achievementStore`.
- [x] Persistența în Zustand se folosește doar dacă este necesară pentru demo sau UX; altfel starea rămâne temporară.

## Frontend routes

- [x] `/` - live map landing page.
- [x] `/login` - login page.
- [x] `/register` - register page.
- [x] `/report` - report issue flow.
- [x] `/command-center` - advanced map and command center.
- [x] `/issues/:id` - issue details.
- [x] `/missions` - mission list.
- [x] `/missions/:id` - mission details.
- [x] `/rewards` - rewards marketplace.
- [x] `/zones` - zone leaderboard.
- [x] `/zones/:id` - zone details.
- [x] `/profile` - user profile.
- [x] `/partner` - partner dashboard.
- [x] `/admin/dashboard` - admin dashboard.
- [x] `/admin/issues` - admin issue management.

## Layout components

- [ ] `AppLayout`.
- [ ] `PublicLayout`.
- [ ] `MapFirstLayout`.
- [x] `ProtectedRoute`.
- [x] `RoleProtectedRoute`.
- [x] `TopNavigation`.
- [x] `FloatingReportButton`.
- [ ] `MobileBottomSheet`.

## Landing and map components

- [x] `LiveMapLandingPage`.
- [x] `CivicMap`.
- [x] `MapMarker`.
- [ ] `IssueMarker`.
- [ ] `MissionMarker`.
- [ ] `RewardMarker`.
- [ ] `ZoneOverlay`.
- [x] `MapFilters`.
- [x] `CityPulsePanel`.
- [x] `LiveActivityFeed`.
- [x] `SelectedIssuePanel`.
- [ ] `ResolvedIssuePreview`.
- [ ] `InProgressIssuePreview`.

Landing layout:

- [x] Mapbox map într-un box principal mare, vizibil în primul viewport.
- [x] Top navigation flotant.
- [x] Buton principal `Report an issue`.
- [x] Panel stânga pentru `City pulse`.
- [x] Panel dreapta pentru issue selectat.
- [x] Bottom rail cu active missions și resolved issues.
- [x] Filtre vizibile fără să blocheze harta.
- [ ] Responsive mobile cu bottom sheet.

Marker types:

- [x] New issue marker, teal.
- [x] AI checked marker, blue/teal.
- [x] In progress marker, amber.
- [x] Mission active marker, green flag.
- [x] Resolved marker, green check.
- [x] Urgent marker, coral/red.
- [x] Reward marker, yellow/lime.
- [ ] Rejected marker, grey.

## Auth components

- [ ] `LoginForm`.
- [ ] `RegisterForm`.
- [x] `AuthLayout`.
- [x] `UserMenu`.

Auth behavior:

- [x] Login/register folosesc Supabase client.
- [x] Session persistence este gestionată de Supabase.
- [x] Tokenul este trimis către API ca Bearer token.
- [x] Protected routes redirecționează userul neautentificat la login.
- [x] Role protected routes blochează accesul neautorizat.

## Report flow

- [x] `ReportIssuePage`.
- [x] `ImageUploader`.
- [x] `LocationPicker`.
- [x] `IssueDescriptionInput`.
- [ ] `IssueCategoryPreview`.
- [x] `SubmitIssueButton`.
- [x] `AgentTimeline`.
- [ ] `AiAnalysisCard`.
- [x] `ReportSuccessCard`.
- [ ] `PointsEarnedCard`.
- [ ] `BadgeUnlockedCard`.

Flow:

- [x] Userul apasă `Report an issue`.
- [x] Dacă nu este logat, este trimis la login/register.
- [x] Userul încarcă poză.
- [x] Userul poate încărca mai multe poze pentru același raport.
- [x] Userul adaugă descriere opțională.
- [x] Userul selectează sau confirmă locația.
- [x] Userul trimite raportul.
- [x] Backendul salvează imaginea și issue-ul.
- [x] Timeline-ul AI pornește.
- [x] Userul vede succes, puncte și badge.
- [x] Issue-ul apare pe hartă.

## Issue components

- [ ] `IssueCard`.
- [x] `IssueDetailsPage`.
- [ ] `IssueStatusBadge`.
- [ ] `IssueSeverityBadge`.
- [ ] `IssueBeforeAfter`.
- [ ] `ConfirmIssueButton`.
- [ ] `IssueActivityTimeline`.

Issue detail shows:

- [x] Photo.
- [x] Galerie de fotografii când issue-ul are mai multe imagini.
- [x] Title.
- [x] Description.
- [x] Category.
- [x] Severity.
- [x] Status.
- [x] Location.
- [x] Zone.
- [x] Responsible actor.
- [x] AI summary.
- [x] AI confidence.
- [x] Duplicate count.
- [x] Related mission.
- [x] Reward eligibility.
- [x] Before photo.
- [x] After photo.
- [ ] Activity history.

## Missions components

- [x] `MissionCard`.
- [x] `MissionDetailsPage`.
- [ ] `MissionProgress`.
- [x] `JoinMissionButton`.
- [x] `MissionParticipants`.
- [x] `MissionImpactCard`.

Missions behavior:

- [x] Listă misiuni active.
- [x] Detalii misiune.
- [x] Join mission.
- [ ] Leave mission.
- [x] Participants count.
- [x] Related issues.
- [x] Reward attached.
- [x] Impact points.

## Rewards and gamification components

- [x] `RewardsPage`.
- [x] `SystemRewardsTab`.
- [x] `PartnerRewardsTab`.
- [x] `BadgeGrid`.
- [x] `RankProgress`.
- [x] `RewardCard`.
- [x] `ClaimRewardButton`.
- [x] `AchievementCard`.
- [x] `PointsSummary`.
- [x] `RankCard`.
- [x] `BadgeCard`.
- [ ] `Leaderboard`.
- [x] `ZoneLeaderboard`.
- [ ] `UserImpactSummary`.

Rewards page tabs:

- [x] System Rewards.
- [x] Partner Rewards.
- [x] Badges.
- [x] Ranks.
- [x] Claimed.

## Partner and admin components

- [x] `PartnerDashboard`.
- [ ] `PartnerRewardForm`.
- [ ] `PartnerImpactCards`.
- [ ] `PartnerRewardClaims`.
- [x] `AdminDashboard`.
- [x] `DashboardStats`.
- [x] `DashboardCharts`.
- [x] `AiCitySummary`.
- [x] `AdminIssueTable`.
- [x] `AdminStatusSelector`.
- [x] `DuplicateClustersPanel`.

## Framer Motion checklist

- [x] Page transitions.
- [x] Map overlay cards.
- [x] Issue preview card entrance.
- [x] Agent timeline steps.
- [x] Issue marker pulse.
- [x] Mission card reveal.
- [x] Reward unlock animation.
- [x] Badge unlock animation.
- [x] Rank progress animation.
- [ ] Resolved issue transition from amber to green.
- [x] Before/after reveal.
- [x] Leaderboard rank movement.
- [x] Dashboard stat count-up.
- [ ] Mobile bottom sheet animations.

Animation rules:

- [x] Soft.
- [x] Smooth.
- [x] Friendly.
- [x] Rewarding.
- [x] Not aggressive.
- [x] Not cyberpunk.
- [x] Not overloaded.

## Mapbox and filter checklist

- [x] Map starts centered on Timișoara.
- [x] Markers are clickable.
- [x] Filters update visible markers.
- [x] Selected issue panel updates after marker click.
- [x] Resolved issues show before/after.
- [x] In-progress issues show owner and related mission.
- [x] Mission markers can open mission card.
- [x] Reward markers can open reward card.
- [ ] Public feed updates when mock or real events arrive.
- [ ] Mobile view keeps map usable.

## Backlog frontend post-audit

### SignalR client

- [x] Instalează și configurează `@microsoft/signalr`.
- [x] Creează client pentru `/civic-hub`.
- [x] Ascultă `IssueCreated`, `IssueAnalyzed`, `AgentStepCompleted`, `MissionCreated`, `RewardMatched`, `ZoneScoreUpdated`, `BadgeUnlocked`, `RankChanged` și `PointsAwarded`.
- [x] Invalidează query-urile React Query relevante la fiecare event.
- [x] Actualizează feed-ul public și selected issue panel din evenimente live.

### Duplicate Agent UI

- [x] Afișează duplicate count în selected issue panel.
- [x] Adaugă stare `Possible duplicate` în issue details.
- [x] Afișează nearest duplicate match când backendul îl returnează.

### Mapbox fallback complet

- [x] Creează fallback map panel stilizat light când tokenul lipsește.
- [x] Randază marker-ele absolute peste fallback map.
- [x] Păstrează filtrele și selectarea markerelor în fallback.
- [x] Păstrează bottom rail și selected issue panel în fallback.

### Role protected routes

- [x] Creează `RoleProtectedRoute`.
- [x] Restricționează `/admin/dashboard` și `/admin/issues` la `admin`.
- [x] Restricționează `/partner` la `partner`.
- [x] Adaugă pagină/stare de acces refuzat.

### Rute lipsă

- [x] `/issues/:id` cu issue details complet.
- [x] `/command-center` cu hartă avansată și overview.
- [x] `/zones/:id` cu detalii zonă.
- [x] `/missions` cu listă misiuni active.
- [x] `/missions/:id` cu detalii, participants, reward și join.
- [x] `/admin/issues` cu tabel, status selector și duplicate clusters.
- [x] `/partner` dashboard real cu rewards, claims și impact.
