import { QueryClient } from '@tanstack/react-query'

export const issuesQueryKey = ['issues'] as const
export const issueQueryKey = (id: string) => ['issues', id] as const
export const missionsQueryKey = ['missions'] as const
export const missionQueryKey = (id: string) => ['missions', id] as const
export const rewardClaimsQueryKey = ['reward-claims'] as const
export const rewardsQueryKey = ['rewards'] as const
export const zoneLeaderboardQueryKey = ['zones', 'leaderboard'] as const

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
