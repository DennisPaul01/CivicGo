import type { MapMarkerKind } from '@/components/map/MapMarker'
import blockedSidewalkImage from '@/assets/demo-issues/trotuar-blocat.jpg'
import brokenSidewalkImage from '@/assets/demo-issues/trotuar-spart.jpg'
import cleanupVolunteersImage from '@/assets/demo-issues/curatenie-voluntari.jpg'
import graffitiWallImage from '@/assets/demo-issues/graffiti-perete.jpg'
import overflowingBinImage from '@/assets/demo-issues/deseuri-cos-plin.jpg'
import poorLightingImage from '@/assets/demo-issues/iluminat-slab.jpg'
import type { IssueResponse, MissionResponse } from '@/lib/api'
import { roActor, roCategory, roReward, roStatus } from '@/lib/locale'

export type CivicMapItem = {
  id: string
  kind: MapMarkerKind
  source?: 'demo' | 'api'
  createdAt: string
  label: string
  title: string
  description: string
  statusLabel: string
  zone: string
  coordinates: [number, number]
  imageUrl?: string
  meta: string
  impact: string
  pointsEarned?: number
  aiSummary?: string
  missionId?: string
  participantsNeeded?: number
  participantsJoined?: number
  responsibleActor?: string
  relatedMission?: string
  reward?: string
  duplicateCount?: number
  nearestDuplicateTitle?: string
  nearestDuplicateDistanceMeters?: number
  beforeAfter?: {
    before: string
    after: string
    beforeImage?: string
    afterImage?: string
  }
}

export type MapTimeFilterKind = '24h' | '7d' | '30d' | 'all'

const TIMISOARA_BOUNDS = {
  west: 21.12,
  south: 45.68,
  east: 21.32,
  north: 45.81,
} as const

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString()
}

export const civicMapItems: CivicMapItem[] = [
  {
    id: 'issue-new-complex',
    kind: 'new',
    source: 'demo',
    createdAt: minutesAgo(18),
    label: 'Problema noua: trotuar blocat langa Complex',
    title: 'Trotuar blocat langa Complex',
    description:
      'Un segment de trotuar este blocat de obiecte abandonate langa o zona studenteasca aglomerata.',
    statusLabel: 'Nou',
    zone: 'Complex',
    coordinates: [21.2325, 45.7531],
    imageUrl: blockedSidewalkImage,
    meta: '2 cetateni au raportat un context similar',
    impact: 'Rutare civica pregatita',
    pointsEarned: 20,
    responsibleActor: 'Comunitate si primarie',
  },
  {
    id: 'issue-ai-fabric',
    kind: 'in_progress',
    source: 'demo',
    createdAt: minutesAgo(52),
    label: 'Problema activa: bec stradal defect in Fabric',
    title: 'Bec stradal defect in Fabric',
    description:
      'Raportul este pregatit pentru echipa de iluminat public.',
    statusLabel: 'Problema activa',
    zone: 'Fabric',
    coordinates: [21.2422, 45.7603],
    imageUrl: poorLightingImage,
    meta: 'Iluminat public',
    impact: 'Trimis catre primarie pentru inspectie',
    responsibleActor: 'Primarie',
  },
  {
    id: 'issue-progress-girocului',
    kind: 'in_progress',
    source: 'demo',
    createdAt: minutesAgo(140),
    label: 'In lucru: drum deteriorat in Girocului',
    title: 'Drum deteriorat in Girocului',
    description:
      'Problema este verificata si rutata catre primarie pentru interventie tehnica.',
    statusLabel: 'In lucru',
    zone: 'Girocului',
    coordinates: [21.2114, 45.7339],
    imageUrl: brokenSidewalkImage,
    meta: 'Alocat primariei - 2 duplicate in apropiere',
    impact: 'Rutare civica pregatita pentru primarie',
    responsibleActor: 'Primarie',
  },
  {
    id: 'issue-resolved-central',
    kind: 'resolved',
    source: 'demo',
    createdAt: minutesAgo(210),
    label: 'Rezolvat: deseuri abandonate langa Parcul Central',
    title: 'Deseuri abandonate langa Parcul Central',
    description:
      'O gramada de deseuri raportata a fost curatata printr-un eveniment comunitar si o recompensa de la partener.',
    statusLabel: 'Rezolvat',
    zone: 'Parcul Central',
    coordinates: [21.2201, 45.7578],
    imageUrl: overflowingBinImage,
    meta: 'Raportat de 4 cetateni - rezolvat acum 12 min',
    impact: 'Rezolvat prin actiune comunitara',
    pointsEarned: 120,
    responsibleActor: 'Comunitate si echipa de salubritate',
    relatedMission: 'Curatenie Parcul Central',
    reward: 'Recompensa CoffeeLab potrivita',
    beforeAfter: {
      before: 'Inainte: deseuri vizibile langa zona verde',
      after: 'Dupa: alee curatata si spatiu public redat comunitatii',
      beforeImage: overflowingBinImage,
      afterImage: cleanupVolunteersImage,
    },
  },
  {
    id: 'mission-soarelui',
    kind: 'mission',
    source: 'demo',
    createdAt: minutesAgo(460),
    label: 'Eveniment comunitar activ: curatenie deseuri voluminoase in Soarelui',
    title: 'Curatenie deseuri voluminoase in Soarelui',
    description:
      'Un eveniment comunitar este activ pentru documentarea si curatarea unor deseuri mari abandonate.',
    statusLabel: 'Eveniment activ',
    zone: 'Soarelui',
    coordinates: [21.2468, 45.7366],
    imageUrl: overflowingBinImage,
    meta: '5 inscrisi - sunt necesari 8 participanti',
    impact: '+95 puncte de impact pentru eveniment',
    reward: 'Abonament de o zi Local Gym disponibil',
  },
  {
    id: 'reward-unirii',
    kind: 'reward',
    source: 'demo',
    createdAt: minutesAgo(1_680),
    label: 'Recompensa disponibila: CoffeeLab langa Unirii',
    title: 'Recompensa CoffeeLab langa Unirii',
    description:
      'O recompensa de la partener este disponibila pentru cetatenii care participa la evenimente eligibile de curatenie.',
    statusLabel: 'Recompensa disponibila',
    zone: 'Unirii',
    coordinates: [21.2289, 45.757],
    imageUrl: graffitiWallImage,
    meta: 'Necesita eveniment finalizat si 300 puncte civice',
    impact: 'Recompensa de partener disponibila',
    reward: 'Cappuccino gratuit',
  },
]

export const defaultSelectedMapItemId = 'issue-resolved-central'

const issueStatusLabels: Record<string, string> = {
  new: 'Problema raportata',
  ai_analyzed: 'Problema activa',
  duplicate_detected: 'Semnale similare',
  in_review: 'Problema activa',
  in_progress: 'In lucru',
  mission_created: 'Problema activa',
  resolved: 'Rezolvat',
  issue_resolved: 'Rezolvat',
  rejected: 'Respins',
}

function getIssueKind(issue: IssueResponse): MapMarkerKind {
  if (issue.status === 'resolved' || issue.status === 'issue_resolved') {
    return 'resolved'
  }

  if (issue.status === 'in_progress') {
    return 'in_progress'
  }

  return 'new'
}

function formatApiValue(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback
  }

  return roStatus(value, fallback)
}

function isCitizenActionIssue(issue: IssueResponse) {
  return Boolean(issue.relatedMission)
}

function isCityHallIssue(issue: IssueResponse) {
  return issue.responsibleActor === 'city_hall'
}

function getAgentRoutingLabel(issue: IssueResponse) {
  if (issue.status === 'resolved') {
    return issueStatusLabels.resolved
  }

  if (issue.status === 'in_progress') {
    return issueStatusLabels.in_progress
  }

  if (issue.status === 'new') {
    return issueStatusLabels.new
  }

  return issueStatusLabels[issue.status] ?? formatApiValue(issue.status, 'Problema activa')
}

function getIssuePointsPreview(issue: IssueResponse) {
  if (!isCitizenActionIssue(issue)) {
    return undefined
  }

  if (issue.relatedMission) {
    return issue.relatedMission.impactPoints
  }

  if (issue.status === 'resolved') {
    return 50
  }

  if (issue.status === 'ai_analyzed') {
    return 30
  }

  return 20
}

function getIssueMeta(issue: IssueResponse) {
  return roCategory(issue.category, 'problema')
}

function createIssueTitle(issue: IssueResponse) {
  const zone = issue.zoneName ?? 'Timisoara'
  const title = issue.title.trim()

  if (title && !title.toLowerCase().startsWith('reported issue in')) {
    return title
  }

  switch (issue.category) {
    case 'sanitation_pest_snow':
    case 'waste':
      return `Deseuri si salubrizare in ${zone}`
    case 'streets_sidewalks':
    case 'road_damage':
    case 'blocked_sidewalk':
      return `Problema pe strada sau trotuar in ${zone}`
    case 'public_lighting':
    case 'broken_lighting':
    case 'lighting':
      return `Iluminat public defect in ${zone}`
    case 'environment_playgrounds_green_spaces':
    case 'green_space_issue':
    case 'green_space':
      return `Spatiu verde sau loc de joaca in ${zone}`
    case 'public_transport':
    case 'public_transport_issue':
      return `Transport in comun in ${zone}`
    case 'road_traffic_signs':
      return `Trafic rutier si semnalizare in ${zone}`
    case 'water_sewer_heating':
    case 'water_issue':
      return `Apa, canalizare sau termoficare in ${zone}`
    case 'animals':
      return `Problema cu animale in ${zone}`
    case 'construction_sites':
      return `Santier raportat in ${zone}`
    case 'public_order':
    case 'public_safety_concern':
      return `Ordine publica in ${zone}`
    default:
      return `${roCategory(issue.category, 'Problema')} in ${zone}`
  }
}

function getIssueImpact(issue: IssueResponse, pointsEarned?: number) {
  if (issue.duplicateCount > 0) {
    return `${issue.duplicateCount} confirmari legate de acelasi semnal`
  }

  if (issue.relatedMission) {
    return 'Eveniment comunitar conectat pe harta'
  }

  if (pointsEarned !== undefined) {
    return 'Rutare civica pregatita'
  }

  if (isCityHallIssue(issue)) {
    return 'Adaugat in dashboardul primariei'
  }

  const actor = roActor(issue.responsibleActor, '')

  return actor ? `Rutare agent: ${actor}` : 'Rutare agent pregatita'
}

export function mapIssueResponseToCivicMapItem(
  issue: IssueResponse,
  duplicateOverrideCount?: number,
): CivicMapItem {
  const kind = getIssueKind(issue)
  const duplicateCount = duplicateOverrideCount ?? issue.duplicateCount
  const statusLabel =
    duplicateCount > 0 ? issueStatusLabels.duplicate_detected : getAgentRoutingLabel(issue)
  const pointsEarned = getIssuePointsPreview(issue)
  const relatedMission = issue.relatedMission
  const title = createIssueTitle(issue)
  const description =
    issue.aiSummary ??
    issue.description ??
    'Un cetatean a raportat aceasta problema prin CiviTm.'

  return {
    id: issue.id,
    kind,
    source: 'api',
    label:
      duplicateCount > 0
        ? `${statusLabel}: ${title} cu ${duplicateCount} confirmari`
        : `${statusLabel}: ${title}`,
    createdAt: issue.createdAt,
    title,
    description,
    statusLabel,
    zone: issue.zoneName ?? 'Timisoara',
    coordinates: [issue.longitude, issue.latitude],
    imageUrl: issue.imageUrl,
    meta: getIssueMeta(issue),
    impact: getIssueImpact({ ...issue, duplicateCount }, pointsEarned),
    pointsEarned,
    aiSummary: issue.aiSummary ?? undefined,
    missionId: relatedMission?.id,
    participantsNeeded: relatedMission?.participantsNeeded,
    participantsJoined: relatedMission?.participantsJoined,
    responsibleActor: roActor(issue.responsibleActor, 'neclar'),
    relatedMission:
      relatedMission?.title ??
      (isCitizenActionIssue(issue) && !isCityHallIssue(issue)
        ? 'Eveniment comunitar conectat'
        : undefined),
    reward: issue.relatedReward
      ? formatRewardLabel(issue.relatedReward.title, issue.relatedReward.partnerName)
      : undefined,
    duplicateCount,
    nearestDuplicateTitle: issue.nearestDuplicate?.title,
    nearestDuplicateDistanceMeters: issue.nearestDuplicate?.distanceMeters,
    beforeAfter:
      issue.afterImageUrl && kind === 'resolved'
        ? {
            before: 'Inainte: fotografia cetateanului a surprins problema.',
            after: 'Dupa: starea rezolvata este documentata.',
            beforeImage: issue.imageUrl,
            afterImage: issue.afterImageUrl,
          }
        : undefined,
  }
}

function getClusteredIssueItems(apiIssues: IssueResponse[]) {
  const mapVisibleIssues = apiIssues.filter((issue) => issue.status !== 'rejected')
  const issuesById = new Map(mapVisibleIssues.map((issue) => [issue.id, issue]))
  const duplicateIdsToHide = new Set<string>()
  const hiddenDuplicateCountsByCanonicalId = new Map<string, number>()

  mapVisibleIssues.forEach((issue) => {
    const canonicalId = issue.nearestDuplicate?.issueId

    if (!canonicalId || !issuesById.has(canonicalId)) {
      return
    }

    duplicateIdsToHide.add(issue.id)
    hiddenDuplicateCountsByCanonicalId.set(
      canonicalId,
      (hiddenDuplicateCountsByCanonicalId.get(canonicalId) ?? 0) + 1,
    )
  })

  return mapVisibleIssues
    .filter((issue) => !duplicateIdsToHide.has(issue.id))
    .map((issue) =>
      mapIssueResponseToCivicMapItem(
        issue,
        Math.max(
          issue.duplicateCount,
          hiddenDuplicateCountsByCanonicalId.get(issue.id) ?? 0,
        ),
      ),
    )
}

function formatRewardLabel(title: string, partnerName: string | null) {
  const rewardTitle = roReward(title)

  return partnerName ? `${partnerName}: ${rewardTitle}` : rewardTitle
}

function formatMissionDate(value: string | null) {
  if (!value) {
    return 'Data propusa este pregatita'
  }

  return new Intl.DateTimeFormat('ro-RO', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function mapMissionResponseToCivicMapItem(
  mission: MissionResponse,
): CivicMapItem {
  return {
    id: `mission-${mission.id}`,
    kind: 'mission',
    source: 'api',
    createdAt: mission.createdAt,
    label: `Eveniment comunitar activ: ${mission.title}`,
    title: mission.title,
    description: mission.description,
    statusLabel:
      mission.status === 'active'
        ? 'Eveniment activ'
        : roStatus(mission.status, 'Eveniment'),
    zone: mission.zoneName ?? 'Timisoara',
    coordinates: [mission.longitude + 0.0012, mission.latitude + 0.0012],
    meta: `${mission.participantsJoined}/${mission.participantsNeeded} inscrisi · ${formatMissionDate(mission.startsAt)}`,
    impact: `+${mission.impactPoints} puncte de impact pentru eveniment`,
    missionId: mission.id,
    participantsNeeded: mission.participantsNeeded,
    participantsJoined: mission.participantsJoined,
    relatedMission: mission.title,
    reward: mission.reward
      ? formatRewardLabel(mission.reward.title, mission.reward.partnerName)
      : undefined,
  }
}

export function getCivicMapItems(
  apiIssues: IssueResponse[] = [],
  apiMissions: MissionResponse[] = [],
) {
  const apiItems = getClusteredIssueItems(apiIssues)
  const apiMissionItems = apiMissions.map(mapMissionResponseToCivicMapItem)
  const apiItemIds = new Set(
    [...apiItems, ...apiMissionItems].map((item) => item.id),
  )

  return [
    ...apiItems,
    ...apiMissionItems,
    ...civicMapItems.filter((item) => !apiItemIds.has(item.id)),
  ]
}

function isInsideTimisoara(item: CivicMapItem) {
  const [longitude, latitude] = item.coordinates

  return (
    longitude >= TIMISOARA_BOUNDS.west &&
    longitude <= TIMISOARA_BOUNDS.east &&
    latitude >= TIMISOARA_BOUNDS.south &&
    latitude <= TIMISOARA_BOUNDS.north
  )
}

function getTimeFilterCutoff(filter: MapTimeFilterKind) {
  const now = Date.now()

  if (filter === '24h') {
    return now - 24 * 60 * 60 * 1000
  }

  if (filter === '7d') {
    return now - 7 * 24 * 60 * 60 * 1000
  }

  if (filter === '30d') {
    return now - 30 * 24 * 60 * 60 * 1000
  }

  return null
}

export function filterCivicMapItemsForTimisoara(
  items: CivicMapItem[],
  timeFilter: MapTimeFilterKind,
) {
  const cutoff = getTimeFilterCutoff(timeFilter)

  return items.filter((item) => {
    if (!isInsideTimisoara(item)) {
      return false
    }

    const postedAt = new Date(item.createdAt).getTime()

    if (!Number.isFinite(postedAt)) {
      return false
    }

    if (!cutoff) {
      return true
    }

    return postedAt >= cutoff
  })
}

export function getCivicMapItem(
  itemId: string,
  items: CivicMapItem[] = civicMapItems,
) {
  return (
    items.find((item) => item.id === itemId) ??
    items.find((item) => item.id === defaultSelectedMapItemId) ??
    items[0]
  )
}

export function getActiveMissionItems(items: CivicMapItem[] = civicMapItems) {
  return items.filter((item) => ['mission', 'in_progress'].includes(item.kind))
}

export function getResolvedIssueItems(items: CivicMapItem[] = civicMapItems) {
  return items.filter((item) => item.kind === 'resolved')
}
