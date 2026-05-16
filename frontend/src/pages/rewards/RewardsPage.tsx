import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Gift,
  Leaf,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  Medal,
  PackageCheck,
  PackageOpen,
  Sparkles,
  Star,
  Store,
  TriangleAlert,
  Trophy,
} from '@/components/icons/hugeicons'
import { Button } from '@/components/ui/button'
import { TopNavigation } from '@/components/layout/TopNavigation'
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
import { roBadge, roRank, roReward } from '@/lib/locale'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import cafeaImage from '@/assets/recomense/cafea.png'
import cafeaGroupImage from '@/assets/recomense/cafea-2.png'
import cofetarieNaomiImage from '@/assets/recomense/cofetarie-naomi.png'
import desertImage from '@/assets/recomense/desert.png'
import salaImage from '@/assets/recomense/sala.png'
import firstReporterBadgeImage from '@/assets/badges/optimized/first-reporter.png'
import aiScoutBadgeImage from '@/assets/badges/optimized/ai-scout.png'
import cleanupHeroBadgeImage from '@/assets/badges/optimized/cleanup-hero.png'
import beforeAfterBadgeImage from '@/assets/badges/optimized/before-after-hero.png'
import problemSolverBadgeImage from '@/assets/badges/optimized/problem-solver.png'
import trustedReporterBadgeImage from '@/assets/badges/optimized/trusted-reporter.png'
import zoneChampionBadgeImage from '@/assets/badges/optimized/zone-champion.png'
import newCitizenRankImage from '@/assets/ranks/optimized/new-citizen.png'
import civicRookieRankImage from '@/assets/ranks/optimized/civic-rookie.png'
import neighborhoodHelperRankImage from '@/assets/ranks/optimized/neighborhood-helper.png'
import communityBuilderRankImage from '@/assets/ranks/optimized/community-builder.png'
import cityGuardianRankImage from '@/assets/ranks/optimized/city-guardian.png'
import civicHeroRankImage from '@/assets/ranks/optimized/civic-hero.png'
import urbanLegendRankImage from '@/assets/ranks/optimized/urban-legend.png'

type RewardsTab = 'system' | 'partner' | 'badges' | 'ranks' | 'claimed'
type RewardCardState = 'available' | 'claimed' | 'locked' | 'sold_out'

const rewardTabs: Array<{
  id: RewardsTab
  label: string
  icon: typeof Gift
}> = [
  { id: 'system', label: 'Recompense sistem', icon: Sparkles },
  { id: 'partner', label: 'Recompense parteneri', icon: Store },
  { id: 'badges', label: 'Badge-uri', icon: BadgeCheck },
  { id: 'ranks', label: 'Rankuri', icon: Trophy },
  { id: 'claimed', label: 'Revendicate', icon: CheckCircle2 },
]

const badgeItems = [
  {
    name: 'First Reporter',
    description: 'Se deblocheaza dupa primul raport valid.',
    icon: BadgeCheck,
    image: firstReporterBadgeImage,
    unlockedAtPoints: 1,
  },
  {
    name: 'AI Scout',
    description: 'Se deblocheaza dupa primul raport analizat de AI.',
    icon: Sparkles,
    image: aiScoutBadgeImage,
    unlockedAtPoints: 100,
  },
  {
    name: 'Clean-up Hero',
    description: 'Se deblocheaza dupa prima misiune de curatenie.',
    icon: Leaf,
    image: cleanupHeroBadgeImage,
    unlockedAtPoints: 300,
  },
  {
    name: 'Before/After Hero',
    description: 'Se deblocheaza dupa prima fotografie de dupa.',
    icon: Award,
    image: beforeAfterBadgeImage,
    unlockedAtPoints: 700,
  },
  {
    name: 'Problem Solver',
    description: 'Se deblocheaza dupa prima problema rezolvata cu ajutorul tau.',
    icon: CheckCircle2,
    image: problemSolverBadgeImage,
    unlockedAtPoints: 120,
  },
  {
    name: 'Trusted Reporter',
    description: 'Se deblocheaza dupa trei rapoarte valide in aceeasi zona.',
    icon: BadgeCheck,
    image: trustedReporterBadgeImage,
    unlockedAtPoints: 300,
  },
  {
    name: 'Zone Champion',
    description: 'Se deblocheaza cand conduci punctajul saptamanal intr-o zona.',
    icon: Trophy,
    image: zoneChampionBadgeImage,
    unlockedAtPoints: 700,
  },
]

const rankThresholds = [
  {
    name: 'New Citizen',
    minPoints: 0,
    icon: Leaf,
    image: newCitizenRankImage,
    description: 'Primul pas in comunitate, pentru cetateni care incep sa raporteze.',
  },
  {
    name: 'Civic Rookie',
    minPoints: 100,
    icon: Star,
    image: civicRookieRankImage,
    description: 'Ai deja ritm: rapoartele tale incep sa miste harta orasului.',
  },
  {
    name: 'Neighborhood Helper',
    minPoints: 300,
    icon: Medal,
    image: neighborhoodHelperRankImage,
    description: 'Ajuti cartierul sa transforme problemele mici in actiuni clare.',
  },
  {
    name: 'Community Builder',
    minPoints: 700,
    icon: Award,
    image: communityBuilderRankImage,
    description: 'Conectezi oameni, misiuni si solutii locale cu impact vizibil.',
  },
  {
    name: 'City Guardian',
    minPoints: 1500,
    icon: BadgeCheck,
    image: cityGuardianRankImage,
    description: 'Protejezi zonele active si tii comunitatea aproape de probleme.',
  },
  {
    name: 'Civic Hero',
    minPoints: 3000,
    icon: Trophy,
    image: civicHeroRankImage,
    description: 'Esti printre oamenii care duc misiunile civice pana la rezultat.',
  },
  {
    name: 'Urban Legend',
    minPoints: 6000,
    icon: Sparkles,
    image: urbanLegendRankImage,
    description: 'Rank maxim pentru impact civic constant, vizibil in tot orasul.',
  },
]

const partnerRewardImages = [
  {
    matches: ['coffeelab tray', 'tray', 'tava', 'volunteer groups'],
    src: cafeaGroupImage,
    alt: 'Tava cu pahare de cafea CoffeeLab pregatita pentru voluntari',
  },
  {
    matches: ['coffeelab', 'cappuccino', 'coffee', 'cafea'],
    src: cafeaImage,
    alt: 'Cafea CoffeeLab oferita ca recompensa locala',
  },
  {
    matches: ['local gym', 'gym', 'day pass', 'sala'],
    src: salaImage,
    alt: 'Sala de fitness partenera pentru abonament de o zi',
  },
  {
    matches: ['restaurant', 'dessert', 'desert'],
    src: desertImage,
    alt: 'Desert oferit de restaurantul partener',
  },
  {
    matches: ['bookstore', 'cofetarie', 'naomi'],
    src: cofetarieNaomiImage,
    alt: 'Recompensa locala de la partenerul Naomi',
  },
  {
    matches: ['coworking'],
    src: cafeaGroupImage,
    alt: 'Spatiu de lucru partener pentru cetateni activi',
  },
]

function getPartnerRewardImage(reward: RewardResponse) {
  if (reward.type !== 'partner') {
    return null
  }

  const rewardText = [
    reward.title,
    reward.description,
    reward.partner?.name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return (
    partnerRewardImages.find((image) =>
      image.matches.some((match) => rewardText.includes(match)),
    ) ?? partnerRewardImages[0]
  )
}

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
    return 'Fara expirare'
  }

  return new Intl.DateTimeFormat('ro-RO', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

function getClaimLabel(state: RewardCardState, missingPoints: number) {
  if (state === 'available') {
    return 'Disponibil'
  }

  if (state === 'claimed') {
    return 'Revendicat'
  }

  if (state === 'sold_out') {
    return 'Epuizat'
  }

  return missingPoints > 0 ? `${missingPoints} pct lipsa` : 'Blocat'
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'emerald',
}: {
  label: string
  value: string | number
  detail: string
  icon: typeof Gift
  tone?: 'emerald' | 'sunshine' | 'coral'
}) {
  return (
    <section className="rounded-xl border border-emerald-100/80 bg-white/90 p-3 shadow-sm shadow-slate-900/5 ring-1 ring-white/70 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-emerald-700">
            {label}
          </p>
          <p className="mt-1 text-xl font-semibold leading-none text-emerald-950 sm:text-2xl">
            {value}
          </p>
        </div>
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-9',
            tone === 'emerald' && 'bg-emerald-50 text-emerald-700',
            tone === 'sunshine' && 'bg-yellow-50 text-yellow-700',
            tone === 'coral' && 'bg-rose-50 text-rose-700',
          )}
        >
          <Icon className="size-4 sm:size-4.5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-xs font-medium leading-5 text-slate-600 sm:text-[0.8rem]">
        {detail}
      </p>
    </section>
  )
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
        eyebrow="Fara recompense"
        title="Nu exista recompense in acest tab"
        description="Recompensele de sistem si partener vor aparea aici cand API-ul le returneaza."
      />
    )
  }

  return (
    <div className="grid auto-rows-fr gap-5 md:grid-cols-2 xl:grid-cols-3">
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
    ? 'Nelimitat'
    : `${Math.max(0, reward.quantity - reward.claimedCount)} ramase`
  const canClaim = state === 'available' && !isClaiming
  const rewardImage = getPartnerRewardImage(reward)
  const claimLabel = getClaimLabel(state, missingPoints)

  return (
    <motion.article
      className={cn(
        'group flex min-h-80 flex-col overflow-hidden rounded-xl border bg-white shadow-sm shadow-slate-900/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/8',
        state === 'available'
          ? 'border-emerald-200 ring-1 ring-emerald-100'
          : 'border-slate-200',
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      <div
        className={cn(
          'relative overflow-hidden',
          rewardImage ? 'aspect-[16/9]' : 'min-h-28 bg-emerald-50',
        )}
      >
        {rewardImage ? (
          <img
            src={rewardImage.src}
            alt={rewardImage.alt}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full min-h-28 items-center justify-center">
            <Sparkles className="size-12 text-emerald-600" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-emerald-950/55 to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-bold ring-1 backdrop-blur',
              reward.type === 'partner'
                ? 'bg-yellow-50/95 text-yellow-800 ring-yellow-200'
                : 'bg-emerald-50/95 text-emerald-800 ring-emerald-200',
            )}
          >
            {reward.partner?.name ?? 'Sistem CiviTm'}
          </span>
        </div>
        <span
          className={cn(
            'absolute bottom-3 right-3 rounded-full px-2.5 py-1 text-xs font-bold ring-1 backdrop-blur',
            state === 'available' && 'bg-emerald-50/95 text-emerald-800 ring-emerald-200',
            state === 'claimed' && 'bg-lime-50/95 text-lime-800 ring-lime-200',
            state === 'locked' && 'bg-white/95 text-slate-700 ring-slate-200',
            state === 'sold_out' && 'bg-rose-50/95 text-rose-800 ring-rose-200',
          )}
        >
          {claimLabel}
        </span>
      </div>

      <div className="flex items-start gap-3 p-4 pb-0">
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl',
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
        <div className="min-w-0">
          <h2 className="text-lg font-bold leading-tight text-slate-950">
            {roReward(reward.title)}
          </h2>
          <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-600">
            {reward.description}
          </p>
        </div>
      </div>

      <div className="mt-4 grid flex-1 gap-2 px-4 text-sm text-slate-600">
        <div className="flex items-center justify-between gap-3 rounded-md bg-emerald-50 px-3 py-2">
          <span className="inline-flex items-center gap-2">
            <Star className="size-4 text-emerald-600" aria-hidden="true" />
            Necesare
          </span>
          <span className="shrink-0 font-semibold text-emerald-800">
            {reward.requiredPoints} pct
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
          <span className="inline-flex min-w-0 items-center gap-2">
            <MapPin className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
            <span className="truncate">{reward.zoneName ?? 'Toate zonele'}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-2">
            <CalendarDays className="size-4 text-emerald-600" aria-hidden="true" />
            {formatDate(reward.expiresAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
          <span className="inline-flex items-center gap-2">
            <PackageCheck className="size-4 text-emerald-600" aria-hidden="true" />
            Disponibilitate
          </span>
          <span className="shrink-0">{remaining}</span>
        </div>
      </div>

      <Button
        className="m-4 bg-emerald-600 text-white hover:bg-emerald-700"
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
            {isClaiming ? 'Se revendica' : 'Revendica recompensa'}
          </>
        )}
        {state === 'claimed' && (
          <>
            <CheckCircle2 data-icon="inline-start" aria-hidden="true" />
            Revendicat
          </>
        )}
        {state === 'locked' && (
          <>
            <LockKeyhole data-icon="inline-start" aria-hidden="true" />
            {missingPoints > 0 ? `${missingPoints} pct necesare` : 'Blocat'}
          </>
        )}
        {state === 'sold_out' && (
          <>
            <LockKeyhole data-icon="inline-start" aria-hidden="true" />
            Epuizat
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
        eyebrow="Recompense revendicate"
        title="Nu ai revendicat recompense inca"
        description="Prima revendicare eligibila isi va afisa codul aici."
      />
    )
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {claims.map((claim) => (
        <article
          key={claim.id}
          className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm shadow-slate-900/5 ring-1 ring-emerald-100"
        >
          <div className="flex items-start gap-3 min-w-0">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-lime-700">
                Recompensa revendicata
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">
                {roReward(claim.rewardTitle)}
              </h2>
              <p className="mt-1 break-words text-sm text-slate-600">
                {claim.partnerName ?? 'Sistem CiviTm'} · cod {claim.code}
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
  const [activeTab, setActiveTab] = useState<RewardsTab>('ranks')
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
        throw new Error('Autentifica-te din nou inainte sa revendici o recompensa.')
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
  const orderedRankThresholds = useMemo(
    () => [...rankThresholds].sort((first, second) => first.minPoints - second.minPoints),
    [],
  )

  return (
    <motion.main
      className="min-h-svh w-full overflow-x-hidden bg-[linear-gradient(180deg,#fff9ef_0%,#f5fbf6_42%,#fffaf1_100%)] px-4 py-5 text-slate-950 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <section className="mx-auto grid min-w-0 w-full max-w-[calc(100vw-2rem)] gap-4 pb-24 sm:max-w-[calc(100vw-3rem)] sm:gap-5 sm:pb-0 lg:max-w-7xl">
        <TopNavigation />

        <div className="relative grid min-w-0 w-full gap-4 overflow-hidden rounded-2xl border border-emerald-100/80 bg-white/82 p-4 shadow-[0_14px_38px_rgba(15,23,42,0.06)] ring-1 ring-white/80 backdrop-blur lg:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.75fr)] lg:p-5">
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent"
            aria-hidden="true"
          />
          <div className="flex min-w-0 flex-col justify-between gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-200/80 bg-white/82 px-3 py-1 text-xs font-bold text-emerald-800 shadow-sm shadow-emerald-900/8">
                  <span className="relative flex size-2.5" aria-hidden="true">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
                  </span>
                  <Gift className="size-4" aria-hidden="true" />
                  Recompense CiviTm
                </p>
                <h1 className="mt-3 max-w-[18rem] text-balance text-[1.5rem] font-bold leading-[1.12] tracking-normal text-slate-950 min-[380px]:text-[1.65rem] min-[430px]:max-w-2xl min-[430px]:text-[2.15rem] sm:text-[2.55rem] lg:text-[2.85rem]">
                  Puncte civice si recompense locale
                </h1>
                <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600 sm:text-[0.95rem]">
                  Foloseste punctele castigate din rapoarte, misiuni si impact pe zone
                  pentru badge-uri, rankuri si recompense locale.
                </p>
                <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
                  {['Badge-uri vizuale', 'Rank progress', 'Oferte locale'].map((label) => (
                    <span
                      key={label}
                      className="inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border border-emerald-100 bg-white/76 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm shadow-slate-900/5"
                    >
                      <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden="true" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-2 min-[440px]:flex-row sm:pt-1 lg:flex-col">
                <Button
                  asChild
                  variant="outline"
                  className="h-10 w-full border-slate-200 bg-white px-4 text-slate-900 shadow-sm shadow-slate-900/5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 min-[440px]:w-auto"
                >
                  <Link to="/">
                    <ArrowLeft data-icon="inline-start" aria-hidden="true" />
                    Harta live
                  </Link>
                </Button>
                <Button
                  asChild
                  className="h-10 w-full border border-emerald-600 bg-emerald-600 px-4 text-white shadow-md shadow-emerald-900/16 hover:bg-emerald-700 min-[440px]:w-auto"
                >
                  <Link to="/report">
                    <Leaf data-icon="inline-start" aria-hidden="true" />
                    Raporteaza
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-3">
              <MetricCard
                label="Puncte"
                value={points}
                detail="Gata de folosit pentru revendicari."
                icon={Star}
              />
              <MetricCard
                label="Revendicate"
                value={claims.length}
                detail="Coduri salvate in contul tau."
                icon={CheckCircle2}
                tone="sunshine"
              />
              <MetricCard
                label="Badge-uri"
                value={badgeItems.filter((badge) => points >= badge.unlockedAtPoints).length}
                detail={`din ${badgeItems.length} disponibile.`}
                icon={BadgeCheck}
                tone="coral"
              />
            </div>
          </div>

          <aside className="rounded-2xl border border-emerald-100 bg-slate-950 p-4 text-white shadow-sm shadow-slate-900/10 lg:self-stretch">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">
                  Rank curent
                </p>
                <p className="mt-1.5 text-lg font-semibold leading-tight sm:text-xl">
                  {roRank(profile?.rankName ?? currentRank.name)}
                </p>
              </div>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/12 text-yellow-200 ring-1 ring-white/15">
                <Trophy className="size-5" aria-hidden="true" />
              </span>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between gap-3 text-xs font-medium text-emerald-50">
                <span>{currentRank.minPoints} pct</span>
                <span>
                  {nextRank ? `${nextRank.minPoints} pct` : 'Max rank'}
                </span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/12">
                <motion.div
                  className="h-full rounded-full bg-yellow-300"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                />
              </div>
              <p className="mt-2.5 text-sm leading-6 text-emerald-50">
                {nextRank
                  ? `${nextRank.minPoints - points} puncte pana la ${roRank(nextRank.name)}.`
                  : 'Ai deblocat toate rankurile disponibile.'}
              </p>
            </div>
          </aside>
        </div>

        <div className="min-w-0 overflow-x-auto rounded-2xl border border-slate-200 bg-white/92 p-1 shadow-sm shadow-slate-900/8 backdrop-blur [-ms-overflow-style:none] [scrollbar-width:none] sm:overflow-visible sm:p-1.5 [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max min-w-full snap-x gap-0.5 pb-1 sm:grid sm:w-full sm:grid-cols-3 sm:gap-1 sm:pb-0 lg:grid-cols-5">
            {rewardTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={cn(
                  'inline-flex min-h-10 min-w-max snap-start items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-center text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-300/60 sm:min-h-11 sm:min-w-0 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-0 sm:text-sm',
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/16'
                    : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800',
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="size-3.5 sm:size-4" aria-hidden="true" />
                <span className="hidden min-[380px]:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {(rewardsQuery.isError || claimsQuery.isError || claimMutation.isError) && (
          <DemoState
            icon={TriangleAlert}
            tone="rose"
            eyebrow="Eroare recompense"
            title="Datele despre recompense trebuie reincarcate"
            description={
              claimMutation.error instanceof Error
                ? claimMutation.error.message
                : 'Datele despre recompense nu au putut fi incarcate acum.'
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
          <div className="grid min-w-0 gap-2.5 sm:gap-4 md:auto-rows-fr md:grid-cols-2 xl:grid-cols-4">
            {badgeItems.map((badge) => {
              const unlocked = points >= badge.unlockedAtPoints

              return (
                <motion.article
                  key={badge.name}
                  className={cn(
                    'group relative grid min-h-[7rem] min-w-0 grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-2 overflow-hidden rounded-lg border bg-white/94 p-2.5 shadow-sm shadow-slate-900/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/8 sm:min-h-[8.75rem] sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-3 sm:rounded-xl sm:p-4 md:flex md:min-h-full md:flex-col md:items-stretch md:gap-0 md:p-5',
                    unlocked
                      ? 'border-emerald-200 ring-1 ring-emerald-100/90'
                      : 'border-slate-200',
                  )}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.24, ease: 'easeOut' }}
                >
                  <span
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(245,251,246,0.9)_0%,rgba(255,255,255,0)_56%)]"
                    aria-hidden="true"
                  />
                  <span
                    className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent"
                    aria-hidden="true"
                  />
                  <div className="relative z-10 contents md:flex md:flex-1 md:flex-col">
                    <div className="flex items-center justify-center md:items-start md:justify-between md:gap-3">
                      <div
                        className={cn(
                          'flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white bg-white p-1 shadow-sm shadow-slate-900/5 ring-3 ring-white transition duration-300 group-hover:scale-105 sm:size-20 md:size-32 md:p-2 md:ring-4',
                          unlocked
                            ? 'outline outline-1 outline-emerald-100'
                            : 'outline outline-1 outline-slate-100',
                        )}
                      >
                        <img
                          src={badge.image}
                          alt={`Badge ${roBadge(badge.name)}`}
                          className={cn(
                            'h-full w-full object-contain',
                            unlocked
                              ? 'contrast-105 saturate-110'
                              : 'grayscale opacity-60',
                          )}
                          loading="lazy"
                        />
                      </div>
                      <badge.icon
                        className={cn(
                          'absolute right-2 top-2 size-3 shrink-0 sm:right-3 sm:top-3 sm:size-4 md:relative md:right-auto md:top-auto md:mt-1 md:size-5',
                          unlocked ? 'text-emerald-600' : 'text-slate-400',
                        )}
                        aria-hidden="true"
                      />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 pr-3 sm:gap-2 sm:pr-5 md:mt-5 md:justify-between md:gap-5 md:pr-0">
                      <span
                        className={cn(
                          'inline-flex min-h-6 w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ring-1 backdrop-blur sm:min-h-8 sm:gap-1.5 sm:px-2.5 sm:py-1',

                          unlocked
                            ? 'bg-emerald-50/90 text-emerald-800 ring-emerald-200'
                            : 'bg-white/90 text-slate-700 ring-slate-200',
                        )}
                      >
                        {unlocked ? (
                          <CheckCircle2 className="size-4" aria-hidden="true" />
                        ) : (
                          <LockKeyhole className="size-4" aria-hidden="true" />
                        )}
                        {unlocked ? 'Deblocat' : `${badge.unlockedAtPoints} pct`}
                      </span>

                      <div>
                        <h2 className="break-words text-xs font-bold leading-tight text-slate-950 sm:text-sm md:text-xl">
                          {roBadge(badge.name)}
                        </h2>
                        <p className="mt-0.5 break-words text-xs leading-4 text-slate-600 font-normal sm:mt-1 sm:text-sm sm:leading-5 md:mt-2 md:leading-6">
                          {badge.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </div>
        )}

        {activeTab === 'ranks' && (
          <div className="grid min-w-0 gap-2.5 sm:gap-4 md:auto-rows-fr md:grid-cols-2 xl:grid-cols-4">
            {orderedRankThresholds.map((rank) => {
              const unlocked = points >= rank.minPoints
              const isCurrent = currentRank.name === rank.name
              const isNext = !unlocked && nextRank?.name === rank.name
              const RankIcon = rank.icon

              return (
                <motion.article
                  key={rank.name}
                  className={cn(
                    'group relative grid min-h-[7.25rem] min-w-0 grid-cols-[4.75rem_minmax(0,1fr)] items-center gap-2 overflow-hidden rounded-lg border bg-white p-2.5 shadow-sm shadow-slate-900/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/8 sm:min-h-[9.25rem] sm:grid-cols-[5.75rem_minmax(0,1fr)] sm:gap-3 sm:rounded-xl sm:p-4 md:flex md:min-h-full md:flex-col md:items-stretch md:gap-0 md:p-5',
                    isCurrent
                      ? 'border-yellow-300 bg-[linear-gradient(135deg,#fffdf4_0%,#ffffff_46%,#f0fdfa_100%)] shadow-md shadow-yellow-900/8 ring-2 ring-yellow-200'
                      : isNext
                        ? 'border-emerald-200 bg-[linear-gradient(135deg,#f0fdfa_0%,#ffffff_58%)] ring-2 ring-emerald-100/80'
                      : unlocked
                        ? 'border-emerald-200 bg-white shadow-md shadow-emerald-900/6 ring-1 ring-emerald-100'
                        : 'border-slate-200 bg-white/82',
                  )}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.24, ease: 'easeOut' }}
                >
                  <span
                    className={cn(
                      'pointer-events-none absolute inset-0',
                      unlocked
                        ? 'bg-[linear-gradient(135deg,rgba(240,253,250,0.58)_0%,rgba(255,255,255,0)_62%)]'
                        : 'bg-[linear-gradient(135deg,rgba(248,250,252,0.8)_0%,rgba(255,255,255,0)_60%)]',
                    )}
                    aria-hidden="true"
                  />
                  <span
                    className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-yellow-300/80 to-transparent"
                    aria-hidden="true"
                  />
                  <div className="relative z-10 contents md:flex md:flex-1 md:flex-col">
                    <div className="flex items-center justify-center md:items-start md:justify-between md:gap-3">
                      <div
                        className={cn(
                          'flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white bg-white p-1 shadow-sm ring-3 ring-white transition duration-300 group-hover:scale-105 sm:size-20 sm:p-1.5 sm:ring-4 md:size-36 md:p-2',
                          isCurrent
                            ? 'shadow-yellow-900/5 outline outline-1 outline-yellow-200'
                            : unlocked
                              ? 'shadow-emerald-900/5 outline outline-1 outline-emerald-100'
                              : 'shadow-slate-900/5 outline outline-1 outline-slate-100',
                        )}
                      >
                        <img
                          src={rank.image}
                          alt={`Rank ${roRank(rank.name)}`}
                          className={cn(
                            'h-full w-full object-contain',
                            unlocked
                              ? 'contrast-105 saturate-110'
                              : 'grayscale opacity-55',
                          )}
                          loading="lazy"
                        />
                      </div>
                      <span
                        className={cn(
                          'absolute right-2 top-2 flex size-6 shrink-0 items-center justify-center rounded sm:right-3 sm:top-3 sm:size-8 md:relative md:right-auto md:top-auto md:rounded-lg md:size-9',
                          isCurrent
                            ? 'bg-yellow-100 text-yellow-800'
                            : unlocked
                            ? 'bg-yellow-50 text-yellow-700'
                            : 'bg-slate-50 text-slate-500',
                        )}
                      >
                        <RankIcon className="size-3 sm:size-4 md:size-4" aria-hidden="true" />
                      </span>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 pr-3 sm:gap-2 sm:pr-4 md:mt-5 md:justify-between md:gap-5 md:pr-0">
                      <div className="flex flex-wrap items-start justify-between gap-1.5 sm:gap-2">
                        <span
                          className={cn(
                            'inline-flex min-h-6 items-center gap-0.5 rounded-full px-1.5 py-0 text-xs font-bold ring-1 backdrop-blur sm:min-h-8 sm:gap-1.5 sm:px-2.5 sm:py-1',

                            isCurrent
                              ? 'bg-yellow-50/95 text-yellow-800 ring-yellow-200'
                              : isNext
                                ? 'bg-emerald-50/95 text-emerald-800 ring-emerald-200'
                              : unlocked
                                ? 'bg-emerald-50/95 text-emerald-800 ring-emerald-200'
                                : 'bg-white/95 text-slate-700 ring-slate-200',
                          )}
                        >
                          {isCurrent ? (
                            <Trophy className="size-4" aria-hidden="true" />
                          ) : isNext ? (
                            <Star className="size-4" aria-hidden="true" />
                          ) : unlocked ? (
                            <CheckCircle2 className="size-4" aria-hidden="true" />
                          ) : (
                            <LockKeyhole className="size-4" aria-hidden="true" />
                          )}
                          {isCurrent
                            ? 'Rank curent'
                            : isNext
                              ? 'Urmatorul'
                              : unlocked
                                ? 'Deblocat'
                                : `${rank.minPoints} pct`}
                        </span>
                      </div>

                      <div>
                        <h2
                          className={cn(
                            'break-words text-[1.05rem] font-bold leading-tight sm:text-lg md:text-xl',
                            unlocked ? 'text-slate-950' : 'text-slate-500',
                          )}
                        >
                          {roRank(rank.name)}
                        </h2>
                        <p
                          className={cn(
                            'mt-1.5 break-words text-sm font-medium leading-5 md:mt-2 md:leading-6',
                            unlocked ? 'text-slate-700' : 'text-slate-500',
                          )}
                        >
                          {rank.description}
                        </p>
                      </div>

                      <div
                        className={cn(
                          'rounded-lg px-3 py-2 text-sm ring-1',
                          unlocked
                            ? 'bg-white text-slate-700 ring-emerald-100'
                            : 'bg-slate-50 text-slate-500 ring-slate-100',
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-2 font-semibold text-emerald-800">
                            <Star className="size-4" aria-hidden="true" />
                            Prag
                          </span>
                          <span className="shrink-0 font-bold text-slate-950">
                            {rank.minPoints} pct
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.article>
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
    </motion.main>
  )
}
