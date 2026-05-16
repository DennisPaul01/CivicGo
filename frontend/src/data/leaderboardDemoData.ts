import type {
  LeaderboardUserResponse,
  PublicUserProfileResponse,
} from '@/lib/api'

const now = new Date().toISOString()

export const demoLeaderboardUsers: LeaderboardUserResponse[] = [
  createDemoUser('demo-ana-popescu', 1, 'Ana Popescu', 1840, 430, 'City Guardian', 4, 8, 3),
  createDemoUser('demo-andrei-ionescu', 2, 'Andrei Ionescu', 1515, 510, 'City Guardian', 3, 7, 4),
  createDemoUser('demo-mara-dumitrescu', 3, 'Mara Dumitrescu', 980, 280, 'Community Builder', 3, 6, 2),
  createDemoUser('demo-vlad-stoica', 4, 'Vlad Stoica', 760, 190, 'Community Builder', 2, 5, 2),
  createDemoUser('demo-irina-matei', 5, 'Irina Matei', 620, 340, 'Neighborhood Helper', 3, 5, 3),
  createDemoUser('demo-razvan-munteanu', 6, 'Razvan Munteanu', 440, 145, 'Neighborhood Helper', 2, 4, 1),
  createDemoUser('demo-elena-radu', 7, 'Elena Radu', 365, 210, 'Neighborhood Helper', 2, 4, 2),
  createDemoUser('demo-bianca-marin', 8, 'Bianca Marin', 230, 230, 'Civic Rookie', 2, 3, 1),
]

export function createDemoPublicProfile(id: string): PublicUserProfileResponse {
  const user = demoLeaderboardUsers.find((item) => item.id === id) ?? demoLeaderboardUsers[0]

  return {
    id: user.id,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    points: user.points,
    thirtyDayPoints: user.periodPoints,
    rankName: user.rankName,
    trustScore: user.trustScore,
    badgeCount: user.badgeCount,
    reportCount: user.reportCount,
    missionCount: user.missionCount,
    overallRank: user.overallRank,
    thirtyDayRank: user.thirtyDayRank,
    badges: user.badges,
    recentContributions: [
      {
        type: 'issue',
        title: 'Raport civic validat pe harta CiviTm',
        detail: 'ai_analyzed',
        createdAt: now,
      },
      {
        type: 'mission',
        title: 'Misiune comunitara activa',
        detail: 'joined',
        createdAt: now,
      },
    ],
  }
}

function createDemoUser(
  id: string,
  rank: number,
  fullName: string,
  points: number,
  periodPoints: number,
  rankName: string,
  badgeCount: number,
  reportCount: number,
  missionCount: number,
): LeaderboardUserResponse {
  return {
    id,
    rank,
    overallRank: rank,
    thirtyDayRank: rank,
    fullName,
    avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(fullName)}&backgroundColor=d1fae5,fef3c7,ccfbf1&fontFamily=Arial`,
    points,
    periodPoints,
    rankName,
    trustScore: Math.max(60, 98 - rank * 3),
    badgeCount,
    reportCount,
    missionCount,
    badges: Array.from({ length: Math.min(3, badgeCount) }, (_, index) => ({
      id: `${id}-badge-${index}`,
      name: ['First Reporter', 'AI Scout', 'Clean-up Hero'][index] ?? 'Civic Badge',
      description: 'Badge civic public',
      icon: 'trophy',
      unlockedAt: now,
    })),
  }
}
