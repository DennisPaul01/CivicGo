import { useEffect } from 'react'
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { useQueryClient } from '@tanstack/react-query'
import { apiBaseUrl, isApiConfigured } from '@/lib/api'
import {
  adminAgentsQueryKey,
  issueQueryKey,
  issuesQueryKey,
  missionQueryKey,
  missionsQueryKey,
  publicActivityQueryKey,
  rewardClaimsQueryKey,
  rewardsQueryKey,
  zoneLeaderboardQueryKey,
} from '@/lib/queryClient'
import { useAuthStore } from '@/stores/authStore'

type CivicLivePayload = {
  issueId?: string
  missionId?: string
  rewardId?: string
  zoneId?: string
  pointsAwarded?: number
  totalPoints?: number
  rankName?: string
}

export function CivicLiveEvents() {
  const queryClient = useQueryClient()
  const profile = useAuthStore((state) => state.profile)
  const setProfile = useAuthStore((state) => state.setProfile)

  useEffect(() => {
    if (!isApiConfigured) {
      return
    }

    const connection = new HubConnectionBuilder()
      .withUrl(`${apiBaseUrl}/civic-hub`)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    function invalidateActivity() {
      void queryClient.invalidateQueries({ queryKey: publicActivityQueryKey(48, 4) })
      void queryClient.invalidateQueries({ queryKey: publicActivityQueryKey(48, 100) })
      void queryClient.invalidateQueries({ queryKey: publicActivityQueryKey(168, 80) })
    }

    function invalidateIssue(payload?: CivicLivePayload) {
      void queryClient.invalidateQueries({ queryKey: issuesQueryKey })
      if (payload?.issueId) {
        void queryClient.invalidateQueries({ queryKey: issueQueryKey(payload.issueId) })
      }
      invalidateActivity()
    }

    function invalidateAgentStats(payload?: CivicLivePayload) {
      void queryClient.invalidateQueries({ queryKey: adminAgentsQueryKey })
      invalidateIssue(payload)
    }

    function invalidateMission(payload?: CivicLivePayload) {
      void queryClient.invalidateQueries({ queryKey: missionsQueryKey })
      if (payload?.missionId) {
        void queryClient.invalidateQueries({ queryKey: missionQueryKey(payload.missionId) })
      }
      invalidateActivity()
    }

    connection.on('IssueCreated', invalidateIssue)
    connection.on('IssueAnalyzed', invalidateIssue)
    connection.on('AgentStepStarted', invalidateAgentStats)
    connection.on('AgentStepCompleted', invalidateAgentStats)
    connection.on('DuplicateDetected', invalidateIssue)
    connection.on('IssueStatusChanged', invalidateIssue)
    connection.on('IssueResolved', invalidateIssue)
    connection.on('AgentPipelineFailed', invalidateIssue)
    connection.on('MissionCreated', (payload?: CivicLivePayload) => {
      invalidateIssue(payload)
      invalidateMission(payload)
      void queryClient.invalidateQueries({ queryKey: zoneLeaderboardQueryKey })
    })
    connection.on('RewardMatched', (payload?: CivicLivePayload) => {
      invalidateIssue(payload)
      invalidateMission(payload)
      void queryClient.invalidateQueries({ queryKey: rewardsQueryKey })
    })
    connection.on('PointsAwarded', (payload?: CivicLivePayload) => {
      invalidateIssue(payload)
      void queryClient.invalidateQueries({ queryKey: rewardClaimsQueryKey })
      if (profile && payload?.totalPoints !== undefined) {
        setProfile({
          ...profile,
          points: payload.totalPoints,
          rankName: payload.rankName ?? profile.rankName,
        })
      }
    })
    connection.on('BadgeUnlocked', (payload?: CivicLivePayload) => {
      invalidateIssue(payload)
      void queryClient.invalidateQueries({ queryKey: rewardsQueryKey })
    })
    connection.on('RankChanged', (payload?: CivicLivePayload) => {
      invalidateIssue(payload)
      if (profile && payload?.totalPoints !== undefined) {
        setProfile({
          ...profile,
          points: payload.totalPoints,
          rankName: payload.rankName ?? profile.rankName,
        })
      }
    })
    connection.on('ZoneScoreUpdated', () => {
      void queryClient.invalidateQueries({ queryKey: zoneLeaderboardQueryKey })
      invalidateActivity()
    })

    void connection.start().catch(() => {
      // React Query invalidation after actions remains the demo fallback.
    })

    return () => {
      void connection.stop()
    }
  }, [profile, queryClient, setProfile])

  return null
}
