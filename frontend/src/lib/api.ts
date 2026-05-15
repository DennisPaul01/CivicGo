import type { LocalUserProfile } from '@/stores/authStore'

export const apiBaseUrl = import.meta.env.VITE_API_URL ?? ''

export const isApiConfigured = Boolean(apiBaseUrl)

export type AgentStepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'fallback'
  | 'skipped'

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

export type AdminAgentResponse = {
  id: string
  key: string
  name: string
  role: string
  description: string
  instructions: string
  model: string
  fallbackMode: string
  isEnabled: boolean
  sortOrder: number
  totalSteps: number
  completedSteps: number
  fallbackSteps: number
  failedSteps: number
  skippedSteps: number
  lastRunAt: string | null
  createdAt: string
  updatedAt: string
}

export type AdminIssueEmailDraftResponse = {
  agentName: string
  recipientName: string
  recipientEmail: string
  subject: string
  body: string
  imageUrl: string
  severityRationale: string
  generatedAt: string
}

export type UpdateAdminAgentInput = Pick<
  AdminAgentResponse,
  | 'name'
  | 'role'
  | 'description'
  | 'instructions'
  | 'model'
  | 'fallbackMode'
  | 'isEnabled'
>

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

export type PartnerDashboardResponse = {
  rewardCount: number
  claimedCount: number
  activeRewardCount: number
  rewards: RewardResponse[]
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
  isJoinedByCurrentUser: boolean
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

export type LeaderboardPeriod = '30d' | 'overall'

export type LeaderboardBadgeResponse = {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt: string
}

export type LeaderboardUserResponse = {
  id: string
  rank: number
  overallRank: number
  thirtyDayRank: number
  fullName: string
  avatarUrl: string | null
  points: number
  periodPoints: number
  rankName: string
  trustScore: number
  badgeCount: number
  reportCount: number
  missionCount: number
  badges: LeaderboardBadgeResponse[]
}

export type PublicContributionResponse = {
  type: string
  title: string
  detail: string
  createdAt: string
}

export type PublicUserProfileResponse = {
  id: string
  fullName: string
  avatarUrl: string | null
  points: number
  thirtyDayPoints: number
  rankName: string
  trustScore: number
  badgeCount: number
  reportCount: number
  missionCount: number
  overallRank: number
  thirtyDayRank: number
  badges: LeaderboardBadgeResponse[]
  recentContributions: PublicContributionResponse[]
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
  imageUrls: string[]
  afterImageUrl: string | null
  latitude: number
  longitude: number
  zoneName: string | null
  aiSummary: string | null
  aiConfidence: number | null
  isUrgent: boolean
  rewardEligible: boolean
  isValidIssue: boolean
  invalidReason: string | null
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

export type IssueResolutionVerificationResponse = {
  isResolved: boolean
  confidence: number
  summary: string
  suggestedAction: string
  usedFallback: boolean
  source: string
}

export type ResolveIssueResponse = {
  verified: boolean
  message: string
  issue: IssueResponse
  verification: IssueResolutionVerificationResponse
  gamification: GamificationAwardResponse | null
}

export type PublicActivityResponse = {
  id: string
  type: string
  title: string
  message: string
  relatedIssueId: string | null
  relatedMissionId: string | null
  relatedRewardId: string | null
  relatedZoneId: string | null
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

export type ZoneIssueSummaryResponse = {
  id: string
  title: string
  category: string
  severity: string
  status: string
  responsibleActor: string
  imageUrl: string
  duplicateCount: number
  createdAt: string
}

export type ZoneDetailResponse = {
  zone: ZoneLeaderboardItemResponse
  issues: ZoneIssueSummaryResponse[]
  missions: MissionSummaryResponse[]
}

type CreateIssueInput = {
  images: File[]
  description: string
  latitude: number
  longitude: number
  zoneName: string
  accessToken: string
}

export type AdminIssueUpdateInput = {
  accessToken: string
  issueId: string
  title: string
  description: string
  category: string
  severity: string
  status: string
  responsibleActor: string
  zoneName: string
  latitude: number
  longitude: number
}

export type RetryAgentPipelineResponse = {
  issueId: string
  status: 'queued'
}

type ResolveIssueInput = {
  issueId: string
  afterImage: File
  resolutionNote: string
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

export async function fetchAdminAgents(accessToken: string | null) {
  if (!isApiConfigured || !accessToken) {
    return [] satisfies AdminAgentResponse[]
  }

  const response = await fetch(`${apiBaseUrl}/api/admin/agents`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Unable to fetch admin agent configs.')
  }

  return (await response.json()) as AdminAgentResponse[]
}

export async function updateAdminAgent(
  agentId: string,
  input: UpdateAdminAgentInput,
  accessToken: string,
) {
  if (!isApiConfigured) {
    throw new Error('CiviTm API is not configured.')
  }

  const response = await fetch(`${apiBaseUrl}/api/admin/agents/${agentId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    let message = 'Unable to update this agent.'

    try {
      const errorBody = (await response.json()) as { message?: string }
      message = errorBody.message ?? message
    } catch {
      // Keep the friendly default when the backend returns a non-JSON error.
    }

    throw new Error(message)
  }

  return (await response.json()) as AdminAgentResponse
}

export async function createIssue(input: CreateIssueInput) {
  if (!isApiConfigured) {
    throw new Error('CiviTm API is not configured.')
  }

  const formData = new FormData()
  input.images.forEach((image, index) => {
    formData.append(index === 0 ? 'image' : 'images', image)
  })
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

export async function fetchPublicActivity(hours = 48, limit = 50) {
  if (!isApiConfigured) {
    return [] satisfies PublicActivityResponse[]
  }

  const searchParams = new URLSearchParams({
    hours: String(hours),
    limit: String(limit),
  })
  const response = await fetch(`${apiBaseUrl}/api/activity?${searchParams}`)

  if (!response.ok) {
    throw new Error('Unable to fetch CiviTm activity.')
  }

  return (await response.json()) as PublicActivityResponse[]
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

export async function resolveIssue(input: ResolveIssueInput) {
  if (!isApiConfigured) {
    throw new Error('CiviTm API is not configured.')
  }

  const formData = new FormData()
  formData.append('afterImage', input.afterImage)
  formData.append('resolutionNote', input.resolutionNote)

  const response = await fetch(`${apiBaseUrl}/api/issues/${input.issueId}/resolve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
    },
    body: formData,
  })

  if (!response.ok) {
    let message = 'Unable to mark this issue as resolved.'

    try {
      const errorBody = (await response.json()) as { message?: string }
      message = errorBody.message ?? message
    } catch {
      // Keep the friendly default when the backend returns a non-JSON error.
    }

    throw new Error(message)
  }

  return (await response.json()) as ResolveIssueResponse
}

export async function updateAdminIssue(input: AdminIssueUpdateInput) {
  if (!isApiConfigured) {
    throw new Error('CiviTm API is not configured.')
  }

  const response = await fetch(`${apiBaseUrl}/api/issues/${input.issueId}/admin`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: input.title,
      description: input.description,
      category: input.category,
      severity: input.severity,
      status: input.status,
      responsibleActor: input.responsibleActor,
      zoneName: input.zoneName,
      latitude: input.latitude,
      longitude: input.longitude,
    }),
  })

  if (!response.ok) {
    throw new Error('Unable to update this issue from admin.')
  }

  return (await response.json()) as IssueResponse
}

export async function closeAdminIssue(issueId: string, accessToken: string) {
  if (!isApiConfigured) {
    throw new Error('CiviTm API is not configured.')
  }

  const response = await fetch(`${apiBaseUrl}/api/issues/${issueId}/admin/close`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Unable to close this issue from admin.')
  }

  return (await response.json()) as IssueResponse
}

export async function reopenAdminIssue(issueId: string, accessToken: string) {
  if (!isApiConfigured) {
    throw new Error('CiviTm API is not configured.')
  }

  const response = await fetch(`${apiBaseUrl}/api/issues/${issueId}/admin/reopen`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Unable to reopen this issue from admin.')
  }

  return (await response.json()) as IssueResponse
}

export async function retryAdminIssueAgentPipeline(
  issueId: string,
  accessToken: string,
) {
  if (!isApiConfigured) {
    throw new Error('CiviTm API is not configured.')
  }

  const response = await fetch(
    `${apiBaseUrl}/api/issues/${issueId}/admin/retry-agent-pipeline`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error('Unable to retry the agent pipeline.')
  }

  return (await response.json()) as RetryAgentPipelineResponse
}

export async function createAdminIssueEmailDraft(
  issueId: string,
  accessToken: string,
) {
  if (!isApiConfigured) {
    throw new Error('CiviTm API is not configured.')
  }

  const response = await fetch(
    `${apiBaseUrl}/api/issues/${issueId}/admin/email-draft`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error('Unable to draft the authority email.')
  }

  return (await response.json()) as AdminIssueEmailDraftResponse
}

function createOptionalAuthHeaders(accessToken?: string) {
  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : undefined
}

export async function fetchMissions(accessTokenOrContext?: string | unknown) {
  if (!isApiConfigured) {
    throw new Error('API-ul CiviTm nu este configurat.')
  }

  const accessToken =
    typeof accessTokenOrContext === 'string' ? accessTokenOrContext : undefined

  const response = await fetch(`${apiBaseUrl}/api/missions`, {
    headers: createOptionalAuthHeaders(accessToken),
  })

  if (!response.ok) {
    throw new Error('Nu am putut incarca evenimentele CiviTm.')
  }

  return (await response.json()) as MissionResponse[]
}

export async function fetchMissionById(id: string, accessToken?: string) {
  if (!isApiConfigured) {
    throw new Error('API-ul CiviTm nu este configurat.')
  }

  const response = await fetch(`${apiBaseUrl}/api/missions/${id}`, {
    headers: createOptionalAuthHeaders(accessToken),
  })

  if (!response.ok) {
    throw new Error('Nu am putut incarca aceasta misiune CiviTm.')
  }

  return (await response.json()) as MissionResponse
}

export async function joinMission(missionId: string, accessToken: string) {
  if (!isApiConfigured) {
    throw new Error('API-ul CiviTm nu este configurat.')
  }

  const response = await fetch(`${apiBaseUrl}/api/missions/${missionId}/join`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    let message = 'Nu am putut face inscrierea la acest eveniment.'

    try {
      const errorBody = (await response.json()) as { message?: string }
      message = errorBody.message ?? message
    } catch {
      // Keep the friendly default when the backend returns a non-JSON error.
    }

    if (message === 'Only active missions can be joined.') {
      message = 'Te poti inscrie doar la evenimente active.'
    }

    throw new Error(message)
  }

  return (await response.json()) as MissionResponse
}

export async function leaveMission(missionId: string, accessToken: string) {
  if (!isApiConfigured) {
    throw new Error('API-ul CiviTm nu este configurat.')
  }

  const response = await fetch(`${apiBaseUrl}/api/missions/${missionId}/leave`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    let message = 'Nu am putut renunta la inscrierea pentru acest eveniment.'

    try {
      const errorBody = (await response.json()) as { message?: string }
      message = errorBody.message ?? message
    } catch {
      // Keep the friendly default when the backend returns a non-JSON error.
    }

    if (message === 'Only active missions can be left.') {
      message = 'Poti renunta doar la evenimente active.'
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

export async function fetchLeaderboard(
  period: LeaderboardPeriod,
  limit = 50,
) {
  if (!isApiConfigured) {
    return [] satisfies LeaderboardUserResponse[]
  }

  const searchParams = new URLSearchParams({
    period,
    limit: String(limit),
  })
  const response = await fetch(
    `${apiBaseUrl}/api/gamification/leaderboard?${searchParams}`,
  )

  if (!response.ok) {
    throw new Error('Unable to fetch CiviTm leaderboard.')
  }

  return (await response.json()) as LeaderboardUserResponse[]
}

export async function fetchPublicUserProfile(id: string) {
  if (!isApiConfigured) {
    throw new Error('CiviTm API is not configured.')
  }

  const response = await fetch(`${apiBaseUrl}/api/users/${id}/public-profile`)

  if (!response.ok) {
    throw new Error('Unable to fetch this public CiviTm profile.')
  }

  return (await response.json()) as PublicUserProfileResponse
}

export async function fetchZones() {
  if (!isApiConfigured) {
    return [] satisfies ZoneLeaderboardItemResponse[]
  }

  const response = await fetch(`${apiBaseUrl}/api/zones`)

  if (!response.ok) {
    throw new Error('Unable to fetch CiviTm zones.')
  }

  return (await response.json()) as ZoneLeaderboardItemResponse[]
}

export async function fetchZoneById(id: string) {
  if (!isApiConfigured) {
    throw new Error('CiviTm API is not configured.')
  }

  const response = await fetch(`${apiBaseUrl}/api/zones/${id}`)

  if (!response.ok) {
    throw new Error('Unable to fetch this CiviTm zone.')
  }

  return (await response.json()) as ZoneDetailResponse
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

export async function fetchPartnerDashboard(accessToken: string | null) {
  if (!isApiConfigured || !accessToken) {
    return null
  }

  const response = await fetch(`${apiBaseUrl}/api/partners/dashboard`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Unable to fetch partner dashboard.')
  }

  return (await response.json()) as PartnerDashboardResponse
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
