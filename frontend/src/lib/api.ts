import type { LocalUserProfile } from '@/stores/authStore'

export const apiBaseUrl = import.meta.env.VITE_API_URL ?? ''

export const isApiConfigured = Boolean(apiBaseUrl)

export type AgentStepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'fallback'

export type AgentStepResponse = {
  id: string
  agentRunId: string
  agentName: string
  status: AgentStepStatus
  message: string
  inputJson: string
  outputJson: string
  startedAt: string | null
  completedAt: string | null
  order: number
}

export type AgentRunResponse = {
  id: string
  issueId: string
  status: AgentStepStatus | 'completed'
  startedAt: string
  completedAt: string | null
  createdAt: string
  steps: AgentStepResponse[]
}

export type PartnerResponse = {
  id: string
  name: string
  logoUrl: string | null
  description: string
  websiteUrl: string | null
}

export type RewardSummaryResponse = {
  id: string
  type: 'system' | 'partner'
  title: string
  partnerName: string | null
  requiredPoints: number
  status: string
}

export type RewardResponse = {
  id: string
  type: 'system' | 'partner'
  partner: PartnerResponse | null
  title: string
  description: string
  requiredPoints: number
  quantity: number
  claimedCount: number
  expiresAt: string | null
  status: string
  missionId: string | null
  zoneId: string | null
  zoneName: string | null
  createdAt: string
}

export type RewardClaimResponse = {
  id: string
  rewardId: string
  rewardTitle: string
  partnerName: string | null
  missionId: string | null
  claimedAt: string
  status: string
  code: string
}

export type MissionSummaryResponse = {
  id: string
  title: string
  status: string
  participantsNeeded: number
  participantsJoined: number
  impactPoints: number
  reward: RewardSummaryResponse | null
}

export type MissionResponse = MissionSummaryResponse & {
  description: string
  zoneId: string | null
  zoneName: string | null
  latitude: number
  longitude: number
  createdFromIssueId: string | null
  startsAt: string | null
  endsAt: string | null
  createdByAi: boolean
  createdAt: string
  completedAt: string | null
  relatedIssueIds: string[]
}

export type PointAwardResponse = {
  points: number
  reason: string
  sourceType: string
}

export type BadgeResponse = {
  id: string
  name: string
  description: string
  icon: string
}

export type RankProgressResponse = {
  id: string
  name: string
  minPoints: number
  maxPoints: number
  icon: string
  description: string
  order: number
  progressPercent: number
  pointsToNext: number
}

export type GamificationAwardResponse = {
  pointsAwarded: number
  totalPoints: number
  currentRank: RankProgressResponse
  nextRank: RankProgressResponse | null
  unlockedBadges: BadgeResponse[]
  pointAwards: PointAwardResponse[]
}

export type NearestDuplicateIssueResponse = {
  issueId: string
  title: string
  distanceMeters: number
  status: string
}

export type IssueResponse = {
  id: string
  title: string
  description: string | null
  category: string
  severity: string
  status: string
  responsibleActor: string
  imageUrl: string
  afterImageUrl: string | null
  latitude: number
  longitude: number
  zoneName: string | null
  aiSummary: string | null
  aiConfidence: number | null
  isUrgent: boolean
  rewardEligible: boolean
  aiAnalyzedAt: string | null
  duplicateCount: number
  nearestDuplicate: NearestDuplicateIssueResponse | null
  agentRun: AgentRunResponse | null
  relatedMission: MissionSummaryResponse | null
  relatedReward: RewardSummaryResponse | null
  gamification: GamificationAwardResponse | null
  createdByUserId: string
  createdAt: string
}

export type ZoneLeaderboardItemResponse = {
  id: string
  rank: number
  name: string
  description: string
  score: number
  scoreDelta: number
  cleanlinessScore: number
  communityScore: number
  safetyScore: number
  engagementScore: number
  latitude: number
  longitude: number
  openIssues: number
  resolvedIssues: number
  activeMissions: number
  updatedAt: string
  calculatedAt: string | null
}

type CreateIssueInput = {
  image: File
  description: string
  latitude: number
  longitude: number
  zoneName: string
  accessToken: string
}

export async function fetchCurrentUserProfile(accessToken: string) {
  if (!isApiConfigured) {
    return null
  }

  const response = await fetch(`${apiBaseUrl}/api/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Unable to fetch current CiviTm profile.')
  }

  return (await response.json()) as LocalUserProfile
}

export async function createIssue(input: CreateIssueInput) {
  if (!isApiConfigured) {
    throw new Error('CiviTm API is not configured.')
  }

  const formData = new FormData()
  formData.append('image', input.image)
  formData.append('description', input.description)
  formData.append('latitude', String(input.latitude))
  formData.append('longitude', String(input.longitude))
  formData.append('zoneName', input.zoneName)

  const response = await fetch(`${apiBaseUrl}/api/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
    },
    body: formData,
  })

  if (!response.ok) {
    let message = 'Unable to save the issue.'

    try {
      const errorBody = (await response.json()) as { message?: string }
      message = errorBody.message ?? message
    } catch {
      // Keep the friendly default when the backend returns a non-JSON error.
    }

    throw new Error(message)
  }

  return (await response.json()) as IssueResponse
}

export async function fetchIssues() {
  if (!isApiConfigured) {
    return [] satisfies IssueResponse[]
  }

  const response = await fetch(`${apiBaseUrl}/api/issues`)

  if (!response.ok) {
    throw new Error('Unable to fetch CiviTm issues.')
  }

  return (await response.json()) as IssueResponse[]
}

export async function fetchIssueById(id: string) {
  if (!isApiConfigured) {
    throw new Error('CiviTm API is not configured.')
  }

  const response = await fetch(`${apiBaseUrl}/api/issues/${id}`)

  if (!response.ok) {
    throw new Error('Unable to fetch this CiviTm issue.')
  }

  return (await response.json()) as IssueResponse
}

export async function fetchMissions() {
  if (!isApiConfigured) {
    return [] satisfies MissionResponse[]
  }

  const response = await fetch(`${apiBaseUrl}/api/missions`)

  if (!response.ok) {
    throw new Error('Unable to fetch CiviTm missions.')
  }

  return (await response.json()) as MissionResponse[]
}

export async function fetchMissionById(id: string) {
  if (!isApiConfigured) {
    throw new Error('CiviTm API is not configured.')
  }

  const response = await fetch(`${apiBaseUrl}/api/missions/${id}`)

  if (!response.ok) {
    throw new Error('Unable to fetch this CiviTm mission.')
  }

  return (await response.json()) as MissionResponse
}

export async function joinMission(missionId: string, accessToken: string) {
  if (!isApiConfigured) {
    throw new Error('CiviTm API is not configured.')
  }

  const response = await fetch(`${apiBaseUrl}/api/missions/${missionId}/join`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    let message = 'Unable to join this mission.'

    try {
      const errorBody = (await response.json()) as { message?: string }
      message = errorBody.message ?? message
    } catch {
      // Keep the friendly default when the backend returns a non-JSON error.
    }

    throw new Error(message)
  }

  return (await response.json()) as MissionResponse
}

export async function fetchZoneLeaderboard() {
  if (!isApiConfigured) {
    return [] satisfies ZoneLeaderboardItemResponse[]
  }

  const response = await fetch(`${apiBaseUrl}/api/zones/leaderboard`)

  if (!response.ok) {
    throw new Error('Unable to fetch CiviTm zone leaderboard.')
  }

  return (await response.json()) as ZoneLeaderboardItemResponse[]
}

export async function fetchRewards() {
  if (!isApiConfigured) {
    return [] satisfies RewardResponse[]
  }

  const response = await fetch(`${apiBaseUrl}/api/rewards`)

  if (!response.ok) {
    throw new Error('Unable to fetch CiviTm rewards.')
  }

  return (await response.json()) as RewardResponse[]
}

export async function fetchMyRewardClaims(accessToken: string | null) {
  if (!isApiConfigured || !accessToken) {
    return [] satisfies RewardClaimResponse[]
  }

  const response = await fetch(`${apiBaseUrl}/api/me/rewards`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Unable to fetch claimed rewards.')
  }

  return (await response.json()) as RewardClaimResponse[]
}

export async function claimReward(rewardId: string, accessToken: string) {
  if (!isApiConfigured) {
    throw new Error('CiviTm API is not configured.')
  }

  const response = await fetch(`${apiBaseUrl}/api/rewards/${rewardId}/claim`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    let message = 'Unable to claim this reward.'

    try {
      const errorBody = (await response.json()) as { message?: string }
      message = errorBody.message ?? message
    } catch {
      // Keep the friendly default when the backend returns a non-JSON error.
    }

    throw new Error(message)
  }

  return (await response.json()) as RewardClaimResponse
}
