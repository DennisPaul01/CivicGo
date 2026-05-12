import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  CheckCircle2,
  Gift,
  Leaf,
  LoaderCircle,
  LockKeyhole,
  Medal,
  PackageOpen,
  Sparkles,
  Star,
  Store,
  TriangleAlert,
  Trophy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DemoSkeletonGrid, DemoState } from '@/components/ui/demo-state'
import {
  claimReward,
  fetchMyRewardClaims,
  fetchRewards,
  type RewardClaimResponse,
  type RewardResponse,
} from '@/lib/api'
import {
  rewardClaimsQueryKey,
  rewardsQueryKey,
} from '@/lib/queryClient'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

type RewardsTab = 'system' | 'partner' | 'badges' | 'ranks' | 'claimed'
type RewardCardState = 'available' | 'claimed' | 'locked' | 'sold_out'

const rewardTabs: Array<{
  id: RewardsTab
  label: string
  icon: typeof Gift
}> = [
  { id: 'system', label: 'System Rewards', icon: Sparkles },
  { id: 'partner', label: 'Partner Rewards', icon: Store },
  { id: 'badges', label: 'Badges', icon: BadgeCheck },
  { id: 'ranks', label: 'Ranks', icon: Trophy },
  { id: 'claimed', label: 'Claimed', icon: CheckCircle2 },
]

const badgeItems = [
  {
    name: 'First Reporter',
    description: 'Unlocked after the first valid report.',
    icon: BadgeCheck,
    unlockedAtPoints: 1,
  },
  {
    name: 'AI Scout',
    description: 'Unlocked after the first AI-analyzed report.',
    icon: Sparkles,
    unlockedAtPoints: 100,
  },
  {
    name: 'Clean-up Hero',
    description: 'Unlocked after joining the first clean-up mission.',
    icon: Leaf,
    unlockedAtPoints: 300,
  },
  {
    name: 'Before/After Hero',
    description: 'Unlocked after uploading the first after photo.',
    icon: Award,
    unlockedAtPoints: 700,
  },
  {
    name: 'Problem Solver',
    description: 'Unlocked after helping close the first resolved issue.',
    icon: CheckCircle2,
    unlockedAtPoints: 120,
  },
  {
    name: 'Trusted Reporter',
    description: 'Unlocked after three valid reports in the same zone.',
    icon: BadgeCheck,
    unlockedAtPoints: 300,
  },
  {
    name: 'Zone Champion',
    description: 'Unlocked after leading weekly points in one zone.',
    icon: Trophy,
    unlockedAtPoints: 700,
  },
]

const rankThresholds = [
  { name: 'New Citizen', minPoints: 0, icon: Leaf },
  { name: 'Civic Rookie', minPoints: 100, icon: Star },
  { name: 'Neighborhood Helper', minPoints: 300, icon: Medal },
  { name: 'Community Builder', minPoints: 700, icon: Award },
  { name: 'City Guardian', minPoints: 1500, icon: BadgeCheck },
  { name: 'Civic Hero', minPoints: 3000, icon: Trophy },
  { name: 'Urban Legend', minPoints: 6000, icon: Sparkles },
]

function getRewardState(
  reward: RewardResponse,
  points: number,
  claimedRewardIds: Set<string>,
): RewardCardState {
  if (claimedRewardIds.has(reward.id)) {
    return 'claimed'
  }

  if (reward.quantity > 0 && reward.claimedCount >= reward.quantity) {
    return 'sold_out'
  }

  if (points < reward.requiredPoints || reward.status !== 'available') {
    return 'locked'
  }

  return 'available'
}

function getCurrentRank(points: number) {
  return (
    [...rankThresholds]
      .reverse()
      .find((rank) => points >= rank.minPoints) ?? rankThresholds[0]
  )
}

function getNextRank(points: number) {
  return rankThresholds.find((rank) => rank.minPoints > points) ?? null
}

function formatDate(value: string | null) {
  if (!value) {
    return 'No expiry'
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

function RewardsGrid({
  rewards,
  points,
  claimedRewardIds,
  claimingRewardId,
  onClaim,
}: {
  rewards: RewardResponse[]
  points: number
  claimedRewardIds: Set<string>
  claimingRewardId: string | null
  onClaim: (rewardId: string) => void
}) {
  if (rewards.length === 0) {
    return (
      <DemoState
        icon={PackageOpen}
        eyebrow="No rewards"
        title="No rewards in this tab"
        description="Seeded system and partner rewards will appear here as soon as the API returns them."
      />
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {rewards.map((reward) => (
        <RewardCard
          key={reward.id}
          reward={reward}
          points={points}
          state={getRewardState(reward, points, claimedRewardIds)}
          isClaiming={claimingRewardId === reward.id}
          onClaim={() => onClaim(reward.id)}
        />
      ))}
    </div>
  )
}

function RewardCard({
  reward,
  points,
  state,
  isClaiming,
  onClaim,
}: {
  reward: RewardResponse
  points: number
  state: RewardCardState
  isClaiming: boolean
  onClaim: () => void
}) {
  const missingPoints = Math.max(0, reward.requiredPoints - points)
  const remaining = reward.quantity <= 0
    ? 'Unlimited'
    : `${Math.max(0, reward.quantity - reward.claimedCount)} left`
  const canClaim = state === 'available' && !isClaiming

  return (
    <motion.article
      className="flex min-h-64 flex-col rounded-lg border border-emerald-200 bg-white p-4 shadow-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg',
            reward.type === 'partner'
              ? 'bg-yellow-50 text-yellow-700'
              : 'bg-orange-50 text-emerald-700',
          )}
        >
          {reward.type === 'partner' ? (
            <Store className="size-5" aria-hidden="true" />
          ) : (
            <Sparkles className="size-5" aria-hidden="true" />
          )}
        </span>

        <span
          className={cn(
            'rounded-md px-2 py-1 text-xs font-semibold ring-1',
            state === 'available' && 'bg-orange-50 text-emerald-700 ring-emerald-200',
            state === 'claimed' && 'bg-lime-50 text-lime-700 ring-lime-200',
            state === 'locked' && 'bg-slate-50 text-slate-600 ring-slate-200',
            state === 'sold_out' && 'bg-rose-50 text-rose-700 ring-rose-200',
          )}
        >
          {state === 'available' && 'Available'}
          {state === 'claimed' && 'Claimed'}
          {state === 'locked' && 'Locked'}
          {state === 'sold_out' && 'Sold out'}
        </span>
      </div>

      <div className="mt-4 min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          {reward.partner?.name ?? 'CiviTm system'}
        </p>
        <h2 className="mt-1 text-lg font-semibold leading-tight text-emerald-950">
          {reward.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {reward.description}
        </p>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-slate-600">
        <div className="flex items-center justify-between rounded-md bg-orange-50 px-3 py-2">
          <span>Required</span>
          <span className="font-semibold text-emerald-800">
            {reward.requiredPoints} pts
          </span>
        </div>
        <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
          <span>{reward.zoneName ?? 'All zones'}</span>
          <span>{formatDate(reward.expiresAt)}</span>
        </div>
        <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
          <span>Availability</span>
          <span>{remaining}</span>
        </div>
      </div>

      <Button
        className="mt-4 bg-emerald-600 text-white hover:bg-emerald-700"
        disabled={!canClaim}
        onClick={onClaim}
      >
        {state === 'available' && (
          <>
            {isClaiming ? (
              <LoaderCircle
                data-icon="inline-start"
                className="animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Gift data-icon="inline-start" aria-hidden="true" />
            )}
            {isClaiming ? 'Claiming' : 'Claim reward'}
          </>
        )}
        {state === 'claimed' && (
          <>
            <CheckCircle2 data-icon="inline-start" aria-hidden="true" />
            Claimed
          </>
        )}
        {state === 'locked' && (
          <>
            <LockKeyhole data-icon="inline-start" aria-hidden="true" />
            {missingPoints > 0 ? `${missingPoints} pts needed` : 'Locked'}
          </>
        )}
        {state === 'sold_out' && (
          <>
            <LockKeyhole data-icon="inline-start" aria-hidden="true" />
            Sold out
          </>
        )}
      </Button>
    </motion.article>
  )
}

function ClaimedRewardsList({ claims }: { claims: RewardClaimResponse[] }) {
  if (claims.length === 0) {
    return (
      <DemoState
        icon={CheckCircle2}
        eyebrow="Claimed rewards"
        title="No claimed rewards yet"
        description="The first eligible claim will show its code here for the demo flow."
      />
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {claims.map((claim) => (
        <article
          key={claim.id}
          className="rounded-lg border border-lime-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-lime-50 text-lime-700">
              <CheckCircle2 className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-lime-700">
                Claimed reward
              </p>
              <h2 className="mt-1 text-lg font-semibold text-emerald-950">
                {claim.rewardTitle}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {claim.partnerName ?? 'CiviTm system'} · code {claim.code}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export function RewardsPage() {
  const queryClient = useQueryClient()
  const session = useAuthStore((state) => state.session)
  const profile = useAuthStore((state) => state.profile)
  const [activeTab, setActiveTab] = useState<RewardsTab>('system')
  const points = profile?.points ?? 0
  const currentRank = getCurrentRank(points)
  const nextRank = getNextRank(points)

  const rewardsQuery = useQuery({
    queryKey: rewardsQueryKey,
    queryFn: fetchRewards,
  })
  const claimsQuery = useQuery({
    queryKey: rewardClaimsQueryKey,
    queryFn: () => fetchMyRewardClaims(session?.access_token ?? null),
    enabled: Boolean(session?.access_token),
  })
  const claimMutation = useMutation({
    mutationFn: (rewardId: string) => {
      if (!session?.access_token) {
        throw new Error('Please login again before claiming a reward.')
      }

      return claimReward(rewardId, session.access_token)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rewardsQueryKey })
      void queryClient.invalidateQueries({ queryKey: rewardClaimsQueryKey })
    },
  })
  const rewards = rewardsQuery.data ?? []
  const claims = useMemo(() => claimsQuery.data ?? [], [claimsQuery.data])
  const claimedRewardIds = useMemo(
    () => new Set(claims.map((claim) => claim.rewardId)),
    [claims],
  )
  const systemRewards = rewards.filter((reward) => reward.type === 'system')
  const partnerRewards = rewards.filter((reward) => reward.type === 'partner')
  const showRewardsLoading =
    rewardsQuery.isLoading &&
    (activeTab === 'system' || activeTab === 'partner')
  const showClaimsLoading =
    claimsQuery.isLoading && activeTab === 'claimed'
  const progressPercent = nextRank
    ? Math.min(
        100,
        Math.round(
          ((points - currentRank.minPoints) /
            Math.max(1, nextRank.minPoints - currentRank.minPoints)) *
            100,
        ),
      )
    : 100

  return (
    <main className="min-h-svh bg-orange-50 px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-7xl gap-5">
        <div className="flex flex-col gap-4 rounded-lg border border-emerald-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <Gift className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                CiviTm rewards
              </p>
              <h1 className="text-2xl font-semibold text-emerald-950">
                Rewards marketplace
              </h1>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" size="sm">
              <Link to="/">
                <ArrowLeft data-icon="inline-start" aria-hidden="true" />
                Live map
              </Link>
            </Button>
            <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700" size="sm">
              <Link to="/report">
                <Leaf data-icon="inline-start" aria-hidden="true" />
                Report
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Current points
            </p>
            <p className="mt-2 text-3xl font-semibold text-emerald-950">
              {points}
            </p>
            <p className="mt-1 text-sm text-slate-600">Civic Points ready to use.</p>
          </section>

          <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Current rank
            </p>
            <p className="mt-2 text-xl font-semibold text-emerald-950">
              {profile?.rankName ?? currentRank.name}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className="h-full rounded-full bg-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              />
            </div>
          </section>

          <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Claimed
            </p>
            <p className="mt-2 text-3xl font-semibold text-emerald-950">
              {claims.length}
            </p>
            <p className="mt-1 text-sm text-slate-600">System and partner rewards.</p>
          </section>
        </div>

        <div className="overflow-x-auto rounded-lg border border-emerald-200 bg-white p-2 shadow-sm">
          <div className="flex min-w-max gap-1">
            {rewardTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={cn(
                  'inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800',
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="size-4" aria-hidden="true" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {(rewardsQuery.isError || claimsQuery.isError || claimMutation.isError) && (
          <DemoState
            icon={TriangleAlert}
            tone="rose"
            eyebrow="Rewards error"
            title="Rewards data needs a refresh"
            description={
              claimMutation.error instanceof Error
                ? claimMutation.error.message
                : 'Rewards data could not be loaded right now.'
            }
          />
        )}

        {showRewardsLoading && (
          <DemoSkeletonGrid items={6} className="md:grid-cols-2 xl:grid-cols-3" />
        )}

        {!showRewardsLoading && activeTab === 'system' && (
          <RewardsGrid
            rewards={systemRewards}
            points={points}
            claimedRewardIds={claimedRewardIds}
            claimingRewardId={claimMutation.variables ?? null}
            onClaim={(rewardId) => claimMutation.mutate(rewardId)}
          />
        )}

        {!showRewardsLoading && activeTab === 'partner' && (
          <RewardsGrid
            rewards={partnerRewards}
            points={points}
            claimedRewardIds={claimedRewardIds}
            claimingRewardId={claimMutation.variables ?? null}
            onClaim={(rewardId) => claimMutation.mutate(rewardId)}
          />
        )}

        {activeTab === 'badges' && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {badgeItems.map((badge) => {
              const unlocked = points >= badge.unlockedAtPoints
              const BadgeIcon = badge.icon

              return (
                <article
                  key={badge.name}
                  className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm"
                >
                  <span
                    className={cn(
                      'flex size-10 items-center justify-center rounded-lg',
                      unlocked
                        ? 'bg-lime-50 text-lime-700'
                        : 'bg-slate-50 text-slate-500',
                    )}
                  >
                    <BadgeIcon className="size-5" aria-hidden="true" />
                  </span>
                  <h2 className="mt-4 text-lg font-semibold text-emerald-950">
                    {badge.name}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {badge.description}
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    {unlocked ? 'Unlocked' : `${badge.unlockedAtPoints} pts`}
                  </p>
                </article>
              )
            })}
          </div>
        )}

        {activeTab === 'ranks' && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {rankThresholds.map((rank) => {
              const unlocked = points >= rank.minPoints
              const RankIcon = rank.icon

              return (
                <article
                  key={rank.name}
                  className={cn(
                    'rounded-lg border bg-white p-4 shadow-sm',
                    unlocked ? 'border-emerald-200' : 'border-slate-200',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-10 items-center justify-center rounded-lg',
                      unlocked
                        ? 'bg-orange-50 text-emerald-700'
                        : 'bg-slate-50 text-slate-500',
                    )}
                  >
                    <RankIcon className="size-5" aria-hidden="true" />
                  </span>
                  <h2 className="mt-4 text-lg font-semibold text-emerald-950">
                    {rank.name}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Starts at {rank.minPoints} Civic Points.
                  </p>
                </article>
              )
            })}
          </div>
        )}

        {showClaimsLoading && (
          <DemoSkeletonGrid items={2} className="md:grid-cols-2" />
        )}

        {!showClaimsLoading && activeTab === 'claimed' && (
          <ClaimedRewardsList claims={claims} />
        )}
      </section>
    </main>
  )
}
