import { useEffect } from 'react'
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { useQueryClient } from '@tanstack/react-query'
import { apiBaseUrl, isApiConfigured } from '@/lib/api'
import {
  issueQueryKey,
  issuesQueryKey,
  missionsQueryKey,
  rewardsQueryKey,
  zoneLeaderboardQueryKey,
} from '@/lib/queryClient'

type CivicLivePayload = {
  issueId?: string
}

export function CivicLiveEvents() {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isApiConfigured) {
      return
    }

    const connection = new HubConnectionBuilder()
      .withUrl(`${apiBaseUrl}/civic-hub`)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    function invalidateIssue(payload?: CivicLivePayload) {
      void queryClient.invalidateQueries({ queryKey: issuesQueryKey })

      if (payload?.issueId) {
        void queryClient.invalidateQueries({
          queryKey: issueQueryKey(payload.issueId),
        })
      }
    }

    connection.on('IssueCreated', invalidateIssue)
    connection.on('IssueAnalyzed', invalidateIssue)
    connection.on('MissionCreated', (payload?: CivicLivePayload) => {
      invalidateIssue(payload)
      void queryClient.invalidateQueries({ queryKey: missionsQueryKey })
      void queryClient.invalidateQueries({ queryKey: zoneLeaderboardQueryKey })
    })
    connection.on('RewardMatched', (payload?: CivicLivePayload) => {
      invalidateIssue(payload)
      void queryClient.invalidateQueries({ queryKey: missionsQueryKey })
      void queryClient.invalidateQueries({ queryKey: rewardsQueryKey })
    })
    connection.on('ZoneScoreUpdated', () => {
      void queryClient.invalidateQueries({ queryKey: zoneLeaderboardQueryKey })
    })

    void connection.start().catch(() => {
      // React Query invalidation after actions remains the demo fallback.
    })

    return () => {
      void connection.stop()
    }
  }, [queryClient])

  return null
}
