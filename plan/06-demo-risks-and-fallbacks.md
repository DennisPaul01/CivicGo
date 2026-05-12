# Demo, Risks and Fallbacks

## Final HackTM demo story

- [x] Deschide CivicGO.
- [x] Userul vede imediat harta live a Timișoarei.
- [x] Harta arată probleme raportate de alții.
- [x] Unele probleme sunt noi.
- [x] Unele probleme sunt în progres.
- [x] Unele probleme sunt rezolvate.
- [x] Click pe issue rezolvat și arată before/after.
- [x] Click pe issue în progres și arată misiunea asociată.
- [x] Login ca citizen.
- [x] Raportează issue nou cu poză.
- [x] Agenții AI analizează issue-ul în timeline animat.
- [x] Userul primește puncte.
- [x] Userul deblochează `First Reporter`.
- [x] Issue-ul apare pe hartă.
- [x] Misiunea este generată.
- [x] Reward este potrivit.
- [x] Zone score se actualizează.
- [x] Deschide rewards page și arată system + partner rewards.
- [x] Deschide leaderboard și arată progress pe zone/useri.
- [x] Deschide dashboard și arată city impact.

Main demo message:

```txt
CivicGO does not just report problems. It shows what is happening in the city, what people are solving and what has already been fixed. AI agents transform new reports into structured actions, missions, rewards and measurable civic impact.
```

## What must be real

- [x] Aplicația pornește local fără pași manuali complicați.
- [x] Harta live este prima pagină.
- [x] Marker-ele pot fi inspectate.
- [x] Report issue flow acceptă poză și locație.
- [x] Backendul creează issue real.
- [x] Issue-ul se poate vedea pe hartă după submit.
- [x] Agent timeline rulează complet.
- [x] Cel puțin un output AI este real sau fallback coerent.
- [x] Punctele se acordă.
- [x] Badge-ul se deblochează.
- [x] Misiunea apare în UI.
- [x] Reward match apare în UI.
- [x] Zone leaderboard arată scoruri.
- [x] Dashboard arată metrici coerente.

## What can be mocked

- [ ] Voice reporting.
- [ ] Duplicate detection avansat.
- [ ] Claim reward real.
- [ ] Partner dashboard complet.
- [ ] Admin moderation complet.
- [ ] Before/after AI validation.
- [ ] Streaks.
- [ ] Complex role management.
- [ ] Export reports.
- [ ] Advanced analytics.
- [ ] deck.gl heatmap dacă Mapbox markers sunt suficiente.

## Risks

- [ ] Mapbox key lipsește sau are restricții.
- [ ] OpenAI key lipsește sau API-ul răspunde greu.
- [ ] Supabase este indisponibil.
- [ ] Upload-ul de imagini eșuează.
- [ ] Validarea JWT Supabase în .NET durează prea mult.
- [ ] SignalR introduce instabilitate înainte de demo.
- [ ] Frontendul devine prea complex pentru deadline.
- [ ] Admin/partner features consumă timp care ar trebui să meargă în demo flow.
- [ ] Designul devine prea dashboard-like și pierde feeling-ul friendly map-first.
- [ ] Layoutul mobile este ignorat și demo-ul arată bine doar pe desktop.
- [ ] Seed data nu este suficientă și demo-ul pare gol.

## Fallback: Missing Mapbox key

- [ ] Folosește un placeholder map panel cu fundal stilizat light.
- [ ] Plasează marker-e absolute peste panel.
- [ ] Păstrează aceleași interacțiuni: filtre, selected issue panel, bottom rail.
- [ ] Marchează integrarea Mapbox ca pending pentru producție.

## Fallback: Missing OpenAI key

- [ ] Rulează fallback determinist pentru toți agenții.
- [x] Folosește categorii și severitate din descriere sau din demo fixtures.
- [x] Arată timeline complet cu status `fallback`.
- [x] Nu bloca mission generation, rewards sau points.

## Fallback: Supabase unavailable

- [ ] Folosește mock auth local pentru demo.
- [ ] Folosește in-memory sau SQLite local pentru backend demo.
- [ ] Folosește URL-uri locale/demo pentru imagini.
- [ ] Păstrează contractele API ca și cum Supabase ar fi disponibil.

## Fallback: Auth issues

- [ ] Creează demo login bypass controlat prin env `VITE_DEMO_AUTH=true`.
- [ ] Seed user demo cu rol `citizen`.
- [ ] Protejează în continuare rutele în UI, dar permite demo user automat.

## Fallback: Upload failure

- [ ] Acceptă imaginea local ca preview.
- [ ] Salvează issue-ul cu demo image URL.
- [ ] Afișează mesaj non-blocant.
- [ ] Continuă AI timeline cu imaginea demo.

## Fallback: SignalR instability

- [ ] Dezactivează live hub temporar.
- [x] Folosește React Query invalidation după acțiuni.
- [ ] Adaugă update optimist în feed și map markers.
- [x] Timeline se bazează pe polling de agent steps.

## Fallback: Not enough time for admin/partner features

- [x] Păstrează dashboard overview cu date seeded.
- [x] Păstrează partner rewards seeded.
- [x] Oprește crearea reală de rewards de către parteneri.
- [x] Oprește issue management avansat.
- [x] Concentrează demo-ul pe map, report, AI timeline, mission, rewards și points.

## Final readiness checklist

- [ ] Demo flow complet testat cap-coadă.
- [ ] Demo flow verificat pe viewport mobile.
- [ ] Demo flow verificat pe viewport desktop.
- [ ] Date demo resetabile.
- [x] Cel puțin 5 issues vizibile pe hartă.
- [x] Cel puțin 2 issues rezolvate cu before/after.
- [x] Cel puțin 2 misiuni active.
- [x] Cel puțin 3 rewards vizibile.
- [x] Cel puțin 5 activity feed items.
- [ ] Fallback OpenAI verificat.
- [ ] Fallback Mapbox verificat.
- [ ] Fallback auth verificat.
- [ ] Screenshoturi pregătite.
- [ ] Video backup pregătit.

## Backlog demo post-audit

- [ ] Verifică demo-ul cap-coadă cu Supabase, Mapbox și OpenAI configurate.
- [ ] Implementează SignalR live events sau documentează fallback-ul React Query ca alegere de demo.
- [ ] Implementează Duplicate Agent real sau marchează duplicate detection ca demo seed.
- [ ] Implementează Mapbox fallback complet cu marker-e interactive.
- [ ] Implementează `RoleProtectedRoute` înainte de demo dacă se arată admin/partner.
- [ ] Decide dacă `/issues/:id`, `/missions`, `/missions/:id`, `/zones/:id`, `/command-center`, `/admin/issues` și partner dashboard intră în demo sau rămân backlog.
