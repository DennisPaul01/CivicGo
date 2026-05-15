# AI, SignalR, Gamification and Rewards

## AI agent flow

Flow complet după `POST /api/issues`:

- [x] Creează issue cu status `new`.
- [x] Creează `AgentRun`.
- [x] Rulează Vision Agent.
- [x] Rulează Triage Agent.
- [x] Rulează Duplicate Agent.
- [x] Rulează Mission Agent.
- [x] Rulează Reward Agent.
- [ ] Rulează City Insights Agent.
- [x] Salvează fiecare pas în `AgentSteps`.
- [x] Actualizează issue status.
- [x] Creează mission dacă issue-ul este eligibil.
- [x] Potrivește reward.
- [x] Acordă puncte, badges și rank progress.
- [x] Publică item în activity feed.
- [x] Trimite evenimente SignalR.

## Agents

### Vision Agent

- [x] Primește image URL, descriere și locație.
- [x] Returnează category, severity, summary, confidence și isUrgent.
- [x] Folosește taxonomia oficială Timisoara pentru sesizări: animale, apă/canalizare/termoficare, iluminat public, mediu/spații verzi, salubrizare, străzi/trotuare, trafic, transport, urbanism, șantiere și celelalte categorii publice.
- [x] Fallback: clasifică după descriere sau folosește `Other`, `medium`, confidence `0.72`.

### Triage Agent

- [x] Decide responsible actor.
- [x] Returnează reason scurt.
- [x] Fallback: `community_and_city_hall` pentru waste, graffiti și green space; `city_hall` pentru lighting și road damage.

### Duplicate Agent

- [x] Caută issue-uri la 100-300 metri.
- [x] Compară categorie și status nerezolvat.
- [x] Returnează duplicate count și nearest distance.
- [x] Fallback: folosește query simplu pe lat/lng dacă PostGIS nu este gata.

### Mission Agent

- [x] Generează titlu, descriere, participants needed, impact points și suggested date.
- [x] Creează mission pentru issue-uri comunitare sau semi-comunitare.
- [x] Fallback: template `Clean-up {Zone}` sau `{Category} check in {Zone}`.

### Reward Agent

- [x] Potrivește system reward, partner reward, badge sau rank progress.
- [x] Preferă partner reward dacă există match în aceeași zonă sau categorie.
- [x] Fallback: system reward plus CoffeeLab demo reward.

### City Insights Agent

- [x] Actualizează score change pentru zonă.
- [x] Generează summary pentru dashboard.
- [x] Fallback: summary static bazat pe zonă și categorie.

## Agent timeline states

- [x] `pending`.
- [x] `running`.
- [x] `completed`.
- [x] `failed`.
- [x] `fallback`.

Timeline UI messages:

- [x] Vision Agent: `Spotted the issue from your photo`.
- [x] Triage Agent: `Found who can help`.
- [x] Duplicate Agent: `Checked nearby reports`.
- [x] Mission Agent: `Created a community action`.
- [x] Reward Agent: `Matched a local reward`.
- [ ] City Agent: `Updated the zone score`.

## SignalR event flow

Hub:

- [x] `/civic-hub`.

Events:

- [x] `IssueCreated`.
- [x] `IssueAnalyzed`.
- [x] `AgentStepStarted`.
- [x] `AgentStepCompleted`.
- [x] `DuplicateDetected`.
- [x] `MissionCreated`.
- [x] `RewardMatched`.
- [x] `ZoneScoreUpdated`.
- [x] `IssueStatusChanged`.
- [x] `IssueResolved`.
- [ ] `DashboardUpdated`.
- [x] `BadgeUnlocked`.
- [x] `RankChanged`.
- [x] `PointsAwarded`.

Frontend behavior:

- [x] Ascultă evenimentele SignalR.
- [x] Actualizează public activity feed.
- [x] Actualizează marker-ele de hartă.
- [x] Actualizează selected issue panel.
- [x] Invalidează cache-uri React Query relevante.
- [ ] Animează schimbările cu Framer Motion.

Nu se emite:

- [x] `NotificationCreated`.

## Points logic

Scoruri MVP:

- [x] Valid report: `+20`.
- [x] AI accepted report: `+10`.
- [x] Duplicate report: puncte reduse `+8` raportare și `+2` verificare AI.
- [ ] Confirm issue: `+5`.
- [ ] Join mission: `+30`.
- [ ] Complete mission: `+100`.
- [ ] Upload after photo: `+40`.
- [ ] Issue resolved: `+50`.
- [ ] Top contributor in zone: `+100`.

Reguli:

- [x] Orice acordare de puncte creează `UserPointsHistory`.
- [x] Totalul userului se actualizează pe `Users.Points`.
- [x] După puncte, se recalculează rank.
- [x] După puncte, se verifică badge unlock.
- [x] Frontend arată `PointsEarnedCard`.

## Badge logic

Badges MVP:

- [x] `First Reporter`: primul issue valid.
- [ ] `AI Scout`: primul raport analizat de AI.
- [ ] `Clean-up Hero`: prima misiune de cleanup la care userul participă.
- [ ] `Problem Solver`: ajută la rezolvarea a 3 issue-uri.
- [ ] `Trusted Reporter`: 10 rapoarte valide fără rejected.
- [ ] `Before/After Hero`: prima poză after încărcată.

Rules:

- [x] Badge-urile sunt idempotente.
- [x] Fiecare unlock creează `UserBadges`.
- [ ] Unlock-ul trimite `BadgeUnlocked`.
- [x] Frontend arată `AchievementCard`.

## Rank thresholds

- [x] `0`: New Citizen.
- [x] `100`: Civic Rookie.
- [x] `300`: Neighborhood Helper.
- [x] `700`: Community Builder.
- [x] `1500`: City Guardian.
- [x] `3000`: Civic Hero.
- [x] `6000`: Urban Legend.

Rules:

- [x] Rankul se calculează din puncte.
- [ ] Rank upgrade trimite `RankChanged`.
- [x] Frontend arată progress până la următorul rank.

## System rewards

System rewards funcționează fără parteneri locali:

- [x] Civic Points.
- [x] Badges.
- [x] Ranks.
- [ ] Levels.
- [ ] Zone titles.
- [x] Achievement cards.
- [x] Leaderboard positions.

MVP:

- [x] Points.
- [x] Badges.
- [x] Ranks.
- [ ] Zone titles simple.

## Partner rewards

Partner examples:

- [x] CoffeeLab: Free cappuccino.
- [x] Local Gym: Free day pass.
- [x] Bookstore: 15% discount.
- [x] Restaurant: Free dessert.
- [x] Coworking Space: Free day ticket.

Unlock conditions:

- [x] Required points.
- [ ] Mission completion.
- [ ] Specific badge.
- [ ] Specific rank.
- [ ] Specific zone.
- [x] Limited quantity.
- [x] Limited time campaign.

MVP behavior:

- [x] Rewards sunt seeded.
- [x] Claim poate fi mock.
- [x] Reward match se afișează după mission generation.
- [x] Claimed rewards pot fi simulated pentru dashboard.

## Mock fallback behavior

OpenAI missing or fails:

- [ ] Folosește templates deterministe pentru fiecare agent.
- [x] Marchează step-ul ca `fallback`, nu ca failed.
- [x] Păstrează timeline-ul complet.
- [x] Afișează mesaj friendly: `Using demo analysis for this run`.

Partner data missing:

- [x] Folosește system reward.
- [x] Folosește seeded CoffeeLab reward dacă există.
- [x] Nu bloca mission generation.

SignalR unstable:

- [x] React Query polling sau manual invalidation după submit.
- [ ] Public feed primește update local optimist.
- [x] Timeline poate rula din datele endpointurilor REST.

## Backlog AI/live post-audit

### SignalR complet

- [x] Creează hub backend `/civic-hub`.
- [x] Emite `IssueCreated` imediat după salvarea issue-ului.
- [x] Emite `IssueAnalyzed` după Vision/Triage.
- [x] Emite `AgentStepStarted` și `AgentStepCompleted` pentru pașii agenților.
- [x] Emite `MissionCreated` după Mission Agent.
- [x] Emite `RewardMatched` după Reward Agent.
- [x] Emite `ZoneScoreUpdated` după modificarea scorului zonei.
- [x] Emite `BadgeUnlocked`, `RankChanged` și `PointsAwarded` după gamification.
- [x] Frontendul ascultă evenimentele și sincronizează map, feed, selected issue, dashboard și cache.

### Duplicate Agent real

- [x] Rulează Duplicate Agent între Triage Agent și Mission Agent.
- [x] Folosește radius 100-300 metri și comparație categorie/status.
- [x] Returnează duplicate count, nearest distance și nearest issue id.
- [x] Marchează status `duplicate_detected` când este cazul.
- [x] Scrie `Duplicate Agent` în timeline.
- [x] Emite `DuplicateDetected` prin SignalR.
- [x] Păstrează fallback lat/lng până la PostGIS.

### City Agent live

- [ ] Adaugă pas `City Agent` în agent timeline când se actualizează scorul zonei.
- [ ] Emite `ZoneScoreUpdated`.
- [ ] Leagă dashboard AI summary de endpointul backend sau de evenimente live.
