# CiviTm Brand UI Redesign

## Summary

Rebrand the public frontend from CivicGO to **CiviTm** using the provided brand vision: navy text, seafoam primary action, coral urgency, sunshine rewards, lavender accents, cream background and Poppins typography.

The redesign must keep the app map-first. The `/` route still opens directly into the live Timisoara map experience with the large primary map box visible in the first viewport.

## Checklist

- [x] Add CiviTm brand plan and README link.
- [x] Replace public UI branding with CiviTm.
- [x] Add Poppins typography and update document metadata.
- [x] Add reusable `BrandMark` and `BrandIcon` components.
- [x] Add shared CiviTm color/tone tokens.
- [x] Redesign landing map, navigation, map overlays and report CTA.
- [x] Redesign report, auth, issue, mission, rewards, zones and profile surfaces.
- [x] Redesign admin, partner, access denied, loading and fallback states.
- [x] Update favicon to CiviTm app mark.
- [x] Verify frontend build.
- [x] Verify mobile and desktop map-first layouts.

## Implementation Notes

- Keep frontend routes, backend APIs, database entities, auth roles and TypeScript response shapes unchanged.
- Use code-native brand assets and lucide-react icons.
- Keep UI copy in English.
- Backend/internal project names can remain CivicGO where renaming would create risk without user-facing value.
