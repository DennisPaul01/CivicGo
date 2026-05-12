import type { MapMarkerKind } from '@/components/map/MapMarker'
import type { IssueResponse, MissionResponse } from '@/lib/api'

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
    label: 'New issue: blocked sidewalk near Complex',
    title: 'Blocked sidewalk near Complex',
    description:
      'A sidewalk segment is blocked by abandoned objects near a busy student area.',
    statusLabel: 'New',
    zone: 'Complex',
    coordinates: [21.2325, 45.7531],
    meta: '2 citizens reported similar context',
    impact: '+20 potential civic points',
    responsibleActor: 'Community and city hall',
    relatedMission: 'Accessibility check Complex',
  },
  {
    id: 'issue-ai-fabric',
    kind: 'ai_checked',
    source: 'demo',
    createdAt: minutesAgo(52),
    label: 'AI checked: broken street light in Fabric',
    title: 'Broken street light in Fabric',
    description:
      'AI classified the report as a public lighting issue with medium severity.',
    statusLabel: 'AI checked',
    zone: 'Fabric',
    coordinates: [21.2422, 45.7603],
    meta: 'Confidence 87% - medium severity',
    impact: '+35 zone safety score if resolved',
    responsibleActor: 'City hall',
    relatedMission: 'Safety Walk Fabric',
  },
  {
    id: 'issue-progress-girocului',
    kind: 'in_progress',
    source: 'demo',
    createdAt: minutesAgo(140),
    label: 'In progress: road damage in Girocului',
    title: 'Road damage in Girocului',
    description:
      'The issue is being reviewed and linked to a local road safety mission.',
    statusLabel: 'In progress',
    zone: 'Girocului',
    coordinates: [21.2114, 45.7339],
    meta: 'Assigned to city hall - 2 duplicates nearby',
    impact: '+80 civic impact points in progress',
    responsibleActor: 'City hall',
    relatedMission: 'Road Safety Girocului',
  },
  {
    id: 'issue-resolved-central',
    kind: 'resolved',
    source: 'demo',
    createdAt: minutesAgo(210),
    label: 'Resolved: illegal waste near Central Park',
    title: 'Illegal waste near Central Park',
    description:
      'A reported waste pile was cleaned through a community mission and partner reward.',
    statusLabel: 'Resolved',
    zone: 'Central Park',
    coordinates: [21.2201, 45.7578],
    meta: 'Reported by 4 citizens - resolved 12 min ago',
    impact: '+120 Civic Points awarded',
    responsibleActor: 'Community and sanitation team',
    relatedMission: 'Clean-up Central Park',
    reward: 'CoffeeLab reward matched',
    beforeAfter: {
      before: 'Before: visible waste pile near the green area',
      after: 'After: cleaned walkway and restored public space',
    },
  },
  {
    id: 'mission-soarelui',
    kind: 'mission',
    source: 'demo',
    createdAt: minutesAgo(460),
    label: 'Mission active: green space check in Soarelui',
    title: 'Green space check in Soarelui',
    description:
      'A community mission is active for checking damaged benches and green areas.',
    statusLabel: 'Mission active',
    zone: 'Soarelui',
    coordinates: [21.2468, 45.7366],
    meta: '5 joined - 8 participants needed',
    impact: '+95 mission impact points',
    reward: 'Local Gym day pass preview',
  },
  {
    id: 'reward-unirii',
    kind: 'reward',
    source: 'demo',
    createdAt: minutesAgo(1_680),
    label: 'Reward available: CoffeeLab near Unirii',
    title: 'CoffeeLab reward near Unirii',
    description:
      'A partner reward is available for citizens who complete eligible clean-up missions.',
    statusLabel: 'Reward available',
    zone: 'Unirii',
    coordinates: [21.2289, 45.757],
    meta: 'Requires mission completion and 300 Civic Points',
    impact: 'Partner reward ready for demo',
    reward: 'Free cappuccino',
  },
  {
    id: 'issue-urgent-mehala',
    kind: 'urgent',
    source: 'demo',
    createdAt: minutesAgo(34),
    label: 'Urgent issue: public safety concern in Mehala',
    title: 'Public safety concern in Mehala',
    description:
      'A high-priority public safety report is visible for civic follow-up.',
    statusLabel: 'Urgent',
    zone: 'Mehala',
    coordinates: [21.1947, 45.7672],
    meta: 'High severity - needs review',
    impact: '+150 potential civic priority score',
    responsibleActor: 'City organizer',
  },
]

export const defaultSelectedMapItemId = 'issue-resolved-central'

const issueStatusLabels: Record<string, string> = {
  new: 'New',
  ai_analyzed: 'AI checked',
  duplicate_detected: 'Possible duplicate',
  in_review: 'Being reviewed',
  in_progress: 'In progress',
  mission_created: 'Community mission active',
  resolved: 'Resolved',
  rejected: 'Rejected',
}

function getIssueKind(issue: IssueResponse): MapMarkerKind {
  if (issue.status === 'resolved') {
    return 'resolved'
  }

  if (issue.isUrgent) {
    return 'urgent'
  }

  if (issue.status === 'in_progress' || issue.status === 'in_review') {
    return 'in_progress'
  }

  if (issue.status === 'mission_created') {
    return 'mission'
  }

  if (
    issue.status === 'ai_analyzed' ||
    issue.status === 'duplicate_detected'
  ) {
    return 'ai_checked'
  }

  return 'new'
}

function formatApiValue(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback
  }

  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function getIssuePointsPreview(issue: IssueResponse) {
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
  const category = formatApiValue(issue.category, 'Issue')
  const severity = formatApiValue(issue.severity, 'Medium')

  if (issue.aiConfidence !== null) {
    return `${category} · ${severity} · AI confidence ${Math.round(
      issue.aiConfidence * 100,
    )}%`
  }

  return `${category} · ${severity} · reported on ${new Intl.DateTimeFormat(
    'en',
    {
      month: 'short',
      day: 'numeric',
    },
  ).format(new Date(issue.createdAt))}`
}

export function mapIssueResponseToCivicMapItem(
  issue: IssueResponse,
): CivicMapItem {
  const kind = getIssueKind(issue)
  const statusLabel =
    issueStatusLabels[issue.status] ?? formatApiValue(issue.status, 'New')
  const pointsEarned = getIssuePointsPreview(issue)
  const relatedMission = issue.relatedMission
  const description =
    issue.aiSummary ??
    issue.description ??
    'A citizen reported this issue through CiviTm.'

  return {
    id: issue.id,
    kind,
    source: 'api',
    label: `${statusLabel}: ${issue.title}`,
    createdAt: issue.createdAt,
    title: issue.title,
    description,
    statusLabel,
    zone: issue.zoneName ?? 'Timisoara',
    coordinates: [issue.longitude, issue.latitude],
    meta: getIssueMeta(issue),
    impact: relatedMission
      ? `Mission impact: +${relatedMission.impactPoints} Civic Points`
      : `Demo points preview: +${pointsEarned} Civic Points`,
    pointsEarned,
    aiSummary: issue.aiSummary ?? undefined,
    missionId: relatedMission?.id,
    participantsNeeded: relatedMission?.participantsNeeded,
    participantsJoined: relatedMission?.participantsJoined,
    responsibleActor: formatApiValue(issue.responsibleActor, 'Unknown'),
    relatedMission: relatedMission?.title,
    reward: issue.relatedReward
      ? formatRewardLabel(issue.relatedReward.title, issue.relatedReward.partnerName)
      : issue.rewardEligible && !relatedMission
        ? 'Reward eligible after mission generation'
        : undefined,
    duplicateCount: issue.duplicateCount,
    nearestDuplicateTitle: issue.nearestDuplicate?.title,
    nearestDuplicateDistanceMeters: issue.nearestDuplicate?.distanceMeters,
    beforeAfter:
      issue.afterImageUrl && kind === 'resolved'
        ? {
            before: 'Before: citizen report photo captured the issue.',
            after: 'After: resolved state documented for demo.',
            beforeImage: issue.imageUrl,
            afterImage: issue.afterImageUrl,
          }
        : undefined,
  }
}

function formatRewardLabel(title: string, partnerName: string | null) {
  return partnerName ? `${partnerName}: ${title}` : title
}

function formatMissionDate(value: string | null) {
  if (!value) {
    return 'Suggested date ready'
  }

  return new Intl.DateTimeFormat('en', {
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
    label: `Mission active: ${mission.title}`,
    title: mission.title,
    description: mission.description,
    statusLabel:
      mission.status === 'active'
        ? 'Mission active'
        : formatApiValue(mission.status, 'Mission'),
    zone: mission.zoneName ?? 'Timisoara',
    coordinates: [mission.longitude + 0.0012, mission.latitude + 0.0012],
    meta: `${mission.participantsJoined}/${mission.participantsNeeded} joined · ${formatMissionDate(mission.startsAt)}`,
    impact: `+${mission.impactPoints} mission impact points`,
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
  const apiItems = apiIssues.map(mapIssueResponseToCivicMapItem)
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
