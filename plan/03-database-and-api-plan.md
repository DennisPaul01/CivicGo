# Database and API Plan

## Database schema MVP

### Users and auth

- [x] `Users`: Id, SupabaseUserId, Email, FullName, AvatarUrl, Role, Points, RankId, TrustScore, FavoriteZoneId, CreatedAt, UpdatedAt.
- [x] `Ranks`: Id, Name, MinPoints, MaxPoints, Icon, Description, Order.
- [x] `UserPointsHistory`: Id, UserId, Points, Reason, SourceType, SourceId, CreatedAt.

### Issues

- [x] `Issues`: Id, Title, Description, Category, Severity, Status, ResponsibleActor, ImageUrl, AfterImageUrl, Latitude, Longitude, LocationPoint, ZoneId, CreatedByUserId, ConfirmedCount, DuplicateCount, CreatedAt, UpdatedAt, ResolvedAt.
- [x] `IssueAiAnalyses`: Id, IssueId, Category, Severity, Summary, ResponsibleActor, SuggestedAction, Confidence, IsUrgent, RewardEligible, RawResponseJson, CreatedAt.
- [x] `AgentRuns`: Id, IssueId, Status, StartedAt, CompletedAt, CreatedAt.
- [x] `AgentSteps`: Id, AgentRunId, AgentName, Status, InputJson, OutputJson, Message, StartedAt, CompletedAt, Order.

### Missions

- [x] `Missions`: Id, Title, Description, ZoneId, Status, CreatedFromIssueId, RewardId, StartsAt, EndsAt, ParticipantsNeeded, ImpactPoints, CreatedByAi, CreatedAt, UpdatedAt, CompletedAt.
- [x] `MissionIssues`: Id, MissionId, IssueId, CreatedAt.
- [x] `MissionParticipants`: Id, MissionId, UserId, JoinedAt, Status, PointsEarned.

### Rewards and partners

- [x] `Partners`: Id, Name, LogoUrl, Description, WebsiteUrl, ContactEmail, CreatedAt, UpdatedAt.
- [x] `Rewards`: Id, Type, PartnerId, Title, Description, RequiredPoints, Quantity, ClaimedCount, ExpiresAt, Status, MissionId, ZoneId, CreatedAt, UpdatedAt.
- [x] `RewardClaims`: Id, RewardId, UserId, MissionId, ClaimedAt, Status, Code.

### Badges

- [x] `Badges`: Id, Name, Description, Icon, Category, RuleType, RuleValue, PointsBonus, CreatedAt, UpdatedAt.
- [x] `UserBadges`: Id, UserId, BadgeId, UnlockedAt, SourceEvent, SourceId.

### Zones and feed

- [x] `Zones`: Id, Name, Description, Score, Latitude, Longitude, PolygonGeoJson, CreatedAt, UpdatedAt.
- [x] `ZoneScores`: Id, ZoneId, CleanlinessScore, CommunityScore, SafetyScore, EngagementScore, TotalScore, CalculatedAt.
- [x] `PublicActivityFeedItems`: Id, Type, Title, Message, RelatedIssueId, RelatedMissionId, RelatedRewardId, RelatedZoneId, CreatedAt.

## Nice-to-have după MVP

- [ ] Embeddings pentru duplicate semantic search.
- [ ] Tabele pentru advanced moderation.
- [ ] Streaks dedicate.
- [ ] Partner campaign analytics detaliat.
- [ ] Audit log complet pentru admin actions.
- [ ] Export reports.

## Supabase/Postgres/PostGIS notes

- [x] Folosește Supabase Postgres ca database principal.
- [ ] Activează PostGIS când sunt implementate query-urile geospațiale reale.
- [x] În MVP, poți salva lat/lng numeric și folosi calcul simplificat dacă PostGIS întârzie.
- [x] Păstrează `LocationPoint` pentru migrarea ușoară la PostGIS.
- [x] Imaginile raportate se salvează în Supabase Storage, iar URL-ul se persistă pe issue.
- [x] Demo seed data trebuie să existe chiar dacă integrarea externă e incompletă.

## API endpoints MVP

### Auth and profile

- [x] `GET /api/me`.
- [ ] `POST /api/me/profile`.
- [ ] `PATCH /api/me/profile`.
- [ ] `GET /api/me/activity`.
- [ ] `GET /api/me/points`.
- [ ] `GET /api/me/badges`.
- [ ] `GET /api/me/rewards`.

### Issues

- [x] `POST /api/issues`.
- [x] `GET /api/issues`.
- [x] `GET /api/issues/{id}`.
- [ ] `PATCH /api/issues/{id}`.
- [ ] `POST /api/issues/{id}/confirm`.
- [ ] `POST /api/issues/{id}/resolve`.
- [ ] `POST /api/issues/{id}/upload-after-photo`.
- [x] `POST /api/issues/{id}/analyze`.
- [ ] `GET /api/issues/nearby`.
- [ ] `GET /api/issues/resolved`.
- [ ] `GET /api/issues/in-progress`.

### Agent runs

- [x] `GET /api/issues/{id}/agent-run`.
- [x] `GET /api/agent-runs/{id}`.
- [x] `GET /api/agent-runs/{id}/steps`.

### Missions

- [x] `GET /api/missions`.
- [x] `GET /api/missions/{id}`.
- [ ] `POST /api/missions`.
- [x] `POST /api/missions/{id}/join`.
- [ ] `POST /api/missions/{id}/leave`.
- [ ] `POST /api/missions/{id}/complete`.
- [ ] `GET /api/missions/active`.
- [ ] `GET /api/missions/completed`.

### Rewards

- [x] `GET /api/rewards`.
- [x] `GET /api/rewards/system`.
- [x] `GET /api/rewards/partner`.
- [x] `GET /api/rewards/{id}`.
- [x] `POST /api/rewards/{id}/claim`.
- [x] `GET /api/me/rewards`.

### Gamification

- [ ] `GET /api/gamification/profile`.
- [ ] `GET /api/gamification/badges`.
- [ ] `GET /api/gamification/ranks`.
- [ ] `GET /api/gamification/leaderboard`.
- [ ] `GET /api/gamification/points-history`.
- [ ] `GET /api/gamification/zone-leaderboard`.

### Partners

- [ ] `GET /api/partners`.
- [ ] `GET /api/partners/{id}`.
- [ ] `GET /api/partners/dashboard`.
- [ ] `POST /api/partners/rewards`.
- [ ] `PATCH /api/partners/rewards/{id}`.

### Zones

- [ ] `GET /api/zones`.
- [ ] `GET /api/zones/{id}`.
- [ ] `GET /api/zones/{id}/issues`.
- [ ] `GET /api/zones/{id}/missions`.
- [x] `GET /api/zones/leaderboard`.

### Dashboard

- [x] `GET /api/dashboard/overview`.
- [ ] `GET /api/dashboard/heatmap`.
- [ ] `GET /api/dashboard/activity`.
- [x] `GET /api/dashboard/ai-summary`.
- [ ] `GET /api/dashboard/top-zones`.
- [ ] `GET /api/dashboard/top-categories`.

### Public activity feed

- [ ] `GET /api/activity-feed`.
- [ ] `GET /api/activity-feed/public`.

### Admin

- [ ] `GET /api/admin/issues`.
- [ ] `PATCH /api/admin/issues/{id}/status`.
- [ ] `POST /api/admin/issues/{id}/merge`.
- [ ] `POST /api/admin/missions/{id}/approve`.
- [ ] `POST /api/admin/missions/{id}/reject`.
- [ ] `GET /api/admin/moderation`.
- [ ] `POST /api/admin/badges`.
- [ ] `PATCH /api/admin/badges/{id}`.
- [ ] `POST /api/admin/ranks`.
- [ ] `PATCH /api/admin/ranks/{id}`.

## Seed data checklist

- [x] Zone: Girocului, Complex, Fabric, Soarelui, Mehala.
- [x] Demo issues noi.
- [x] Demo issues AI checked.
- [x] Demo issues în progres.
- [x] Demo issues rezolvate cu before/after.
- [x] Demo missions active.
- [x] Demo rewards partner.
- [x] Demo system rewards.
- [x] Badges MVP.
- [x] Rank thresholds.
- [ ] Public activity feed items.
- [x] Partneri demo: CoffeeLab, Local Gym, Bookstore, Restaurant, Coworking Space.

## Backlog API post-audit

### SignalR live events

- [ ] Adaugă hub backend `/civic-hub`.
- [ ] Creează DTO-uri pentru `IssueCreated`, `IssueAnalyzed`, `AgentStepCompleted`, `MissionCreated`, `RewardMatched`, `ZoneScoreUpdated`, `BadgeUnlocked`, `RankChanged` și `PointsAwarded`.
- [ ] Emite evenimente din endpointul `POST /api/issues` și serviciile AI, mission, reward, zone score și gamification.
- [ ] Nu emite `NotificationCreated`.

### Duplicate detection MVP

- [ ] Creează `DuplicateDetectionService`.
- [ ] Adaugă query pentru issues nerezolvate la 100-300 metri pe lat/lng numeric.
- [ ] Compară categorie, status și distanță.
- [ ] Actualizează `Issues.DuplicateCount`.
- [ ] Setează status `duplicate_detected` doar pentru match-uri suficient de clare.
- [ ] Scrie pas `Duplicate Agent` în `AgentSteps`.
- [ ] Pregătește migrarea la PostGIS pentru calcul geospațial real.

### Role-protected backend

- [ ] Configurează authorization policies pentru `admin` și `partner`.
- [ ] Aplică policy `admin` pe dashboard/admin endpoints.
- [ ] Aplică policy `partner` pe partner endpoints.
- [ ] Returnează 403 clar pentru roluri insuficiente.

### Endpointuri lipsă pentru rute

- [ ] `GET /api/activity-feed/public`.
- [ ] `GET /api/issues/{id}/activity`.
- [ ] `GET /api/missions/active`.
- [ ] `POST /api/missions/{id}/leave`.
- [ ] `GET /api/zones`.
- [ ] `GET /api/zones/{id}`.
- [ ] `GET /api/zones/{id}/issues`.
- [ ] `GET /api/zones/{id}/missions`.
- [ ] `GET /api/admin/issues`.
- [ ] `PATCH /api/admin/issues/{id}/status`.
- [ ] `GET /api/partners/dashboard`.
