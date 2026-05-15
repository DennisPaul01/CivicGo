import { motion } from 'motion/react'
import { useEffect, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Flag,
  Gift,
  LoaderCircle,
  Plus,
  Star,
  TriangleAlert,
  Users,
} from '@/components/icons/hugeicons'
import bottomCtaBannerImage from '@/assets/banner/f1d9de3d-80fa-4648-8cec-cd0fe3148cad.png'
import aiStepIcon from '@/assets/icons-cum-functioneaza/AI.png'
import communityStepIcon from '@/assets/icons-cum-functioneaza/comunity.png'
import photoStepIcon from '@/assets/icons-cum-functioneaza/photo.png'
import rewardStepIcon from '@/assets/icons-cum-functioneaza/reward.png'
import liveStatIcon from '@/assets/icons-banner-hero/live.png'
import missionStatIcon from '@/assets/icons-banner-hero/zona-activa.png'
import rewardStatIcon from '@/assets/icons-banner-hero/reward.png'
import zoneStatIcon from '@/assets/icons-banner-hero/location.png'
import { FloatingReportButton } from '@/components/layout/FloatingReportButton'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { CivicMap } from '@/components/map/CivicMap'
import { LiveActivityFeed } from '@/components/map/LiveActivityFeed'
import { MapFilters } from '@/components/map/MapFilters'
import { Button } from '@/components/ui/button'
import {
  filterCivicMapItemsForTimisoara,
  getCivicMapItems,
  type CivicMapItem,
} from '@/data/civicMapData'
import { fetchIssues, fetchMissions, isApiConfigured } from '@/lib/api'
import { issuesQueryKey, missionsQueryKey } from '@/lib/queryClient'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/stores/mapStore'
import cafeaImage from '@/assets/recomense/cafea.png'
import cafeaGroupImage from '@/assets/recomense/cafea-2.png'
import cofetarieNaomiImage from '@/assets/recomense/cofetarie-naomi.png'
import desertImage from '@/assets/recomense/desert.png'
import salaImage from '@/assets/recomense/sala.png'
import missionCleanupImage from '@/assets/banners-missions/banner-1.png'
import missionGreenImage from '@/assets/banners-missions/2.png'
import missionStreetImage from '@/assets/banners-missions/3.png'
import missionRewardImage from '@/assets/banners-missions/4.png'

type StatCard = {
  label: string
  value: string
  helper: string
  iconSrc: string
}

type HowItWorksStep = {
  title: string
  description: string
  iconSrc: string
}

const howItWorksSteps: HowItWorksStep[] = [
  {
    title: 'Raportează',
    description: 'Semnalează problema sau propui o idee în comunitate',
    iconSrc: photoStepIcon,
  },
  {
    title: 'Se verifică',
    description: 'Comunitatea și agenții pregătesc pașii următori',
    iconSrc: aiStepIcon,
  },
  {
    title: 'Comunitatea',
    description: 'Se implică și verifică progresul pe hartă',
    iconSrc: communityStepIcon,
  },
  {
    title: 'Primești puncte',
    description: 'Deblochezi recompense locale pentru impact real',
    iconSrc: rewardStepIcon,
  },
]

function getLandingStats(items: CivicMapItem[]): StatCard[] {
  const liveReports = items.filter(
    (item) => item.kind !== 'mission' && item.kind !== 'reward',
  ).length
  const activeMissions = items.filter(
    (item) => item.kind === 'mission' || item.kind === 'in_progress',
  ).length
  const rewards = items.filter((item) => item.kind === 'reward' || item.reward).length
  const activeZones = new Set(items.map((item) => item.zone)).size

  return [
    {
      label: 'Sesizări live',
      value: String(Math.max(128, liveReports)),
      helper: '+19% față de ieri',
      iconSrc: liveStatIcon,
    },
    {
      label: 'Misiuni active',
      value: String(Math.max(42, activeMissions)),
      helper: 'În desfășurare',
      iconSrc: missionStatIcon,
    },
    {
      label: 'Recompense',
      value: String(Math.max(18, rewards)),
      helper: 'La parteneri locali',
      iconSrc: rewardStatIcon,
    },
    {
      label: 'Zone active',
      value: String(Math.max(7, activeZones)),
      helper: 'În ultimele 7 zile',
      iconSrc: zoneStatIcon,
    },
  ]
}

function pickFeaturedMissions(items: CivicMapItem[]) {
  return items
    .filter((item) =>
      ['mission', 'in_progress', 'resolved', 'new'].includes(item.kind),
    )
    .slice(0, 4)
}

const supplementalLandingRewards: CivicMapItem[] = [
  {
    id: 'landing-reward-restaurant-desert',
    kind: 'reward',
    source: 'demo',
    createdAt: '2026-05-15T08:00:00.000Z',
    label: 'Recompensa disponibila: desert gratuit in Fabric',
    title: 'Restaurant: Desert gratuit',
    description: 'Desert local pentru cetateni care finalizeaza misiuni civice.',
    statusLabel: 'Recompensa disponibila',
    zone: 'Fabric',
    coordinates: [21.2422, 45.7603],
    meta: '1/6 inscrisi - duminica, 17 mai',
    impact: 'Oferta locala pentru misiuni finalizate',
    pointsEarned: 500,
    reward: 'Restaurant: Desert gratuit',
    duplicateCount: 42,
  },
  {
    id: 'landing-reward-cofetarie-naomi',
    kind: 'reward',
    source: 'demo',
    createdAt: '2026-05-15T08:05:00.000Z',
    label: 'Recompensa disponibila: voucher Cofetaria Naomi',
    title: 'Cofetaria Naomi: Voucher dulce',
    description: 'Oferta dulce pentru contributori activi din zona centrala.',
    statusLabel: 'Recompensa disponibila',
    zone: 'Cetate',
    coordinates: [21.2264, 45.7563],
    meta: 'Oferta pentru badge First Reporter',
    impact: 'Voucher local pentru implicare constanta',
    pointsEarned: 220,
    reward: 'Cofetaria Naomi: Voucher dulce',
    duplicateCount: 18,
  },
  {
    id: 'landing-reward-coffeelab-tray',
    kind: 'reward',
    source: 'demo',
    createdAt: '2026-05-15T08:10:00.000Z',
    label: 'Recompensa disponibila: tava CoffeeLab pentru echipa',
    title: 'CoffeeLab: Tava de cafea pentru echipa',
    description: 'Tava de cafea pentru voluntarii care finalizeaza o actiune locala.',
    statusLabel: 'Recompensa disponibila',
    zone: 'Mehala',
    coordinates: [21.1908, 45.7672],
    meta: '1/8 inscrisi - sambata, 16 mai',
    impact: 'Recompensa de grup pentru voluntari',
    pointsEarned: 500,
    reward: 'CoffeeLab: Tava de cafea pentru echipa',
    duplicateCount: 42,
  },
  {
    id: 'landing-reward-gym-pass',
    kind: 'reward',
    source: 'demo',
    createdAt: '2026-05-15T08:15:00.000Z',
    label: 'Recompensa disponibila: abonament Local Gym',
    title: 'Local Gym: Abonament gratuit pe o zi',
    description: 'Abonament de o zi pentru cetateni implicati in misiuni active.',
    statusLabel: 'Recompensa disponibila',
    zone: 'Soarelui',
    coordinates: [21.2468, 45.7366],
    meta: '5 inscrisi - sunt necesari 8 participanti',
    impact: 'Oferta sportiva pentru contributori',
    pointsEarned: 500,
    reward: 'Local Gym: Abonament gratuit pe o zi',
    duplicateCount: 42,
  },
  {
    id: 'landing-reward-cappuccino',
    kind: 'reward',
    source: 'demo',
    createdAt: '2026-05-15T08:20:00.000Z',
    label: 'Recompensa disponibila: cappuccino CoffeeLab',
    title: 'CoffeeLab: Cappuccino gratuit',
    description: 'Cafea locala pentru cetateni care strang puncte civice.',
    statusLabel: 'Recompensa disponibila',
    zone: 'Unirii',
    coordinates: [21.2289, 45.757],
    meta: 'Necesita misiune finalizata si 300 puncte',
    impact: 'Recompensa rapida de partener',
    pointsEarned: 300,
    reward: 'CoffeeLab: Cappuccino gratuit',
    duplicateCount: 24,
  },
]

function getRewardKey(item: CivicMapItem) {
  return (item.reward ?? item.title)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function pickFeaturedRewards(items: CivicMapItem[]) {
  const seenRewards = new Set<string>()
  const rewards: CivicMapItem[] = []

  for (const item of [...supplementalLandingRewards, ...items]) {
    if (item.kind !== 'reward' && !item.reward) {
      continue
    }

    const rewardKey = getRewardKey(item)

    if (seenRewards.has(rewardKey)) {
      continue
    }

    seenRewards.add(rewardKey)
    rewards.push(item)

    if (rewards.length === 4) {
      break
    }
  }

  return rewards
}

function getCardTint(item: CivicMapItem) {
  switch (item.kind) {
    case 'mission':
      return 'from-emerald-500/20 via-teal-400/14 to-white'
    case 'reward':
      return 'from-orange-400/20 via-yellow-300/16 to-white'
    case 'resolved':
      return 'from-teal-500/20 via-emerald-400/12 to-white'
    default:
      return 'from-blue-500/16 via-emerald-400/12 to-white'
  }
}

const landingRewardImages = [
  {
    matches: ['recompensa coffeelab', 'tava', 'tray', 'echipa', 'voluntar'],
    src: cafeaGroupImage,
    className: 'object-cover object-center scale-[1.06]',
  },
  {
    matches: ['coffeelab', 'cappuccino', 'cafea', 'coffee'],
    src: cafeaImage,
    className: 'object-cover object-[center_58%] scale-[1.12]',
  },
  {
    matches: ['local gym', 'abonament', 'sala', 'gym'],
    src: salaImage,
    className: 'object-cover object-[center_62%] scale-[1.12]',
  },
  {
    matches: ['restaurant', 'desert', 'dessert'],
    src: desertImage,
    className: 'object-cover object-[88%_72%] scale-[1.48]',
  },
  {
    matches: ['bookstore', 'cofetarie', 'cofetaria', 'naomi'],
    src: cofetarieNaomiImage,
    className: 'object-cover object-[center_82%] scale-[1.3]',
  },
]

const missionBannerImages = [
  missionCleanupImage,
  missionGreenImage,
  missionStreetImage,
  missionRewardImage,
]

function getLandingRewardImage(item: CivicMapItem) {
  const rewardText = [
    item.reward,
    item.title,
    item.description,
    item.meta,
    item.impact,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return landingRewardImages.find((image) =>
    image.matches.some((match) => rewardText.includes(match)),
  )
}

function selectLandingItem(
  item: CivicMapItem,
  setActiveFilter: (filter: CivicMapItem['kind']) => void,
  setSelectedItemId: (itemId: string | null) => void,
) {
  setActiveFilter(item.kind)
  setSelectedItemId(item.id)
  document.getElementById('map')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function StatusNotice({
  isMapLoading,
  hasMapError,
}: {
  isMapLoading: boolean
  hasMapError: boolean
}) {
  if (!isMapLoading && !hasMapError) {
    return null
  }

  return (
    <div className="mt-5 inline-flex max-w-full items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-800 shadow-sm">
      {isMapLoading ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <TriangleAlert className="size-4 text-amber-600" aria-hidden="true" />
      )}
      <span>
        {isMapLoading
          ? 'Se încarcă datele live ale hărții'
          : 'Afișăm ultimele date disponibile până își revine API-ul'}
      </span>
    </div>
  )
}

function StatCards({ stats }: { stats: StatCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      {stats.map((stat, index) => (
        <motion.article
          key={stat.label}
          className="group min-h-[6.5rem] min-w-0 rounded-2xl border border-slate-200/80 bg-white/94 p-4 shadow-sm shadow-slate-900/5 ring-1 ring-white/70 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-900/8 sm:min-h-[8rem] sm:p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut', delay: 0.04 * index }}
        >
          <div className="flex h-full min-w-0 items-center gap-3 sm:gap-4">
            <img
              src={stat.iconSrc}
              alt=""
              className="size-16 shrink-0 object-contain transition duration-200 group-hover:scale-105 sm:size-20"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <h2 className="text-sm font-bold leading-tight text-slate-900 sm:text-base">
                    {stat.label}
                  </h2>
                  <p className="mt-1 text-xs font-medium leading-tight text-slate-500 sm:mt-1.5 sm:text-sm">
                    {stat.helper}
                  </p>
                </div>
                <p className="shrink-0 text-3xl font-bold leading-none text-slate-950 sm:text-[2.25rem]">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        </motion.article>
      ))}
    </div>
  )
}

function HowItWorksSection() {
  return (
    <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/55 to-white p-5 shadow-sm shadow-emerald-950/5 sm:p-6">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
          Flux civic simplu
        </p>
        <h2 className="mt-1 text-xl font-bold leading-tight text-slate-950 sm:text-2xl">
          Cum funcționează CiviTm
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-[0.95rem]">
          De la sesizare la impact vizibil pe hartă, totul rămâne clar pentru
          comunitate.
        </p>
      </div>

      <div className="relative mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          className="pointer-events-none absolute left-20 right-20 top-10 hidden h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent lg:block"
          aria-hidden="true"
        />
        {howItWorksSteps.map((step, index) => (
          <article
            key={step.title}
            className="relative flex min-h-[10.5rem] min-w-0 flex-col rounded-xl border border-slate-200/75 bg-white/96 p-4 shadow-sm shadow-emerald-950/6 ring-1 ring-white/70 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-900/8 sm:p-5"
          >
            <div className="relative z-10 flex items-start justify-between gap-4">
              <span
                className="block size-16 shrink-0 sm:size-18 lg:size-20"
                aria-hidden="true"
              >
                <img
                  src={step.iconSrc}
                  alt=""
                  className="size-full object-contain"
                />
              </span>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white shadow-sm shadow-slate-900/15 sm:size-9 sm:text-sm">
                {index + 1}
              </span>
            </div>

            <div className="relative z-10 mt-4 min-w-0 flex-1">
              <h3 className="text-[1.05rem] font-bold leading-tight text-slate-950 sm:text-lg">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {step.description}
              </p>
            </div>

            {index < howItWorksSteps.length - 1 ? (
              <ArrowRight
                className="absolute -right-3 top-9 z-20 hidden size-5 rounded-full bg-white p-0.5 text-slate-300 shadow-sm shadow-slate-900/5 lg:block"
                aria-hidden="true"
              />
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}

function MissionCard({
  item,
  index,
  onSelect,
}: {
  item: CivicMapItem
  index: number
  onSelect: (item: CivicMapItem) => void
}) {
  const bannerImage = missionBannerImages[index % missionBannerImages.length]
  const progress = Math.min(
    92,
    Math.max(35, (item.participantsJoined ?? item.pointsEarned ?? 8) * 7),
  )

  return (
    <motion.button
      type="button"
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-emerald-200 bg-white text-left shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-500/25"
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(item)}
    >
      <div
        className="relative flex h-44 shrink-0 items-end overflow-hidden bg-emerald-50 p-3 sm:h-48 xl:h-44"
      >
        <img
          src={bannerImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.04]"
          loading="lazy"
        />
        <span className="relative rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-emerald-950/20">
          {item.zone}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="min-h-[2.75rem] line-clamp-2 text-base font-bold leading-snug text-slate-950">
          {item.relatedMission ?? item.title}
        </h3>
        <p className="mt-1.5 min-h-5 line-clamp-1 text-sm font-medium text-slate-500">
          {item.title}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-5 text-xs text-slate-600">
          <span className="inline-flex min-w-0 items-center gap-1">
            <Users className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{item.participantsJoined ?? 12} participanți</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 font-bold text-orange-600">
            <Star className="size-3.5" aria-hidden="true" />
            +{item.pointsEarned ?? 90} XP
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-600"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </motion.button>
  )
}

function RewardsCard({
  item,
  onSelect,
}: {
  item: CivicMapItem
  onSelect: (item: CivicMapItem) => void
}) {
  const rewardImage = getLandingRewardImage(item)

  return (
    <motion.button
      type="button"
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-orange-200 bg-white text-left shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-orange-500/20"
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(item)}
    >
      <div
        className={cn(
          'relative flex h-48 shrink-0 items-end overflow-hidden bg-gradient-to-br p-3 sm:h-52 xl:h-48',
          !rewardImage && getCardTint(item),
        )}
      >
        {rewardImage && (
          <>
            <img
              src={rewardImage.src}
              alt=""
              className={cn(
                'absolute inset-0 h-full w-full transition duration-300 group-hover:scale-[1.16]',
                rewardImage.className,
              )}
              loading="lazy"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-slate-950/48 via-slate-950/8 to-white/10" />
          </>
        )}
        <span className="relative inline-flex items-center gap-1 rounded-md bg-slate-950/82 px-2 py-1 text-xs font-bold text-white">
          <Gift className="size-3.5" aria-hidden="true" />
          {item.zone}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="min-h-[2.9rem] line-clamp-2 text-[1.05rem] font-bold leading-snug text-slate-950">
          {item.reward ?? item.title}
        </h3>
        <p className="mt-1.5 min-h-5 line-clamp-1 text-sm font-medium text-slate-500">
          {item.meta}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-5">
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
            {item.pointsEarned ?? 500} CP
          </span>
          <span className="inline-flex min-w-0 items-center gap-1 text-xs font-medium text-slate-500">
            <Users className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{item.duplicateCount ?? 42}+ revendicări</span>
          </span>
        </div>
      </div>
    </motion.button>
  )
}

function FeaturedSections({
  items,
  onSelect,
}: {
  items: CivicMapItem[]
  onSelect: (item: CivicMapItem) => void
}) {
  const missions = pickFeaturedMissions(items)
  const rewards = pickFeaturedRewards(items)

  return (
    <>
      <section className="rounded-xl border border-emerald-200 bg-emerald-50/45 p-4 shadow-sm shadow-slate-900/5 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">Misiuni active</h2>
            <p className="text-sm font-medium text-emerald-700">
              Implică-te în comunitate și fă orașul mai bun.
            </p>
          </div>
          <Button
            asChild
            variant="ghost"
            className="self-start text-emerald-700 hover:bg-white/80 hover:text-emerald-800 sm:self-auto"
          >
            <Link to="/missions">
              Vezi toate misiunile
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="mt-4 grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {missions.map((item, index) => (
            <MissionCard
              key={item.id}
              item={item}
              index={index}
              onSelect={onSelect}
            />
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-orange-200 bg-orange-50/45 p-4 shadow-sm shadow-slate-900/5 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">
              Recompense aproape de tine
            </h2>
            <p className="text-sm font-medium text-orange-700">
              Folosește punctele tale pentru oferte locale.
            </p>
          </div>
          <Button
            asChild
            variant="ghost"
            className="self-start text-orange-700 hover:bg-white/80 hover:text-orange-800 sm:self-auto"
          >
            <Link to="/rewards">
              Vezi toate recompensele
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="mt-5 grid auto-rows-fr gap-5 min-[520px]:grid-cols-2 xl:grid-cols-4">
          {rewards.map((item) => (
            <RewardsCard key={item.id} item={item} onSelect={onSelect} />
          ))}
        </div>
      </section>
    </>
  )
}

function BottomCta() {
  return (
    <section className="relative min-h-[14rem] overflow-hidden rounded-2xl border border-orange-100/90 bg-white p-6 text-slate-900 shadow-sm shadow-slate-900/8 sm:min-h-[15.5rem] sm:p-9 lg:min-h-[16rem] lg:p-11">
      <img
        src={bottomCtaBannerImage}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[58%_center]"
      />
      <span
        className="absolute inset-0 bg-gradient-to-r from-white/96 via-white/70 to-white/8"
        aria-hidden="true"
      />
      <span
        className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 via-transparent to-orange-50/20"
        aria-hidden="true"
      />
      <div className="relative max-w-2xl">
        <h2 className="max-w-xl text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
          Fă orașul mai bun, pas cu pas.
        </h2>
        <p className="mt-3 max-w-lg text-base font-medium leading-relaxed text-slate-600 sm:text-lg">
          Alătură-te comunității CiviTm și transformă Timișoara în realitate,
          nu doar în promisiuni.
        </p>
        <Button
          asChild
          size="lg"
          className="mt-6 bg-teal-500 text-white shadow-sm shadow-teal-900/16 hover:bg-teal-600"
        >
          <Link to="/register">Înregistrează-te gratuit</Link>
        </Button>
      </div>
    </section>
  )
}

export function LiveMapLandingPage() {
  const [searchParams] = useSearchParams()
  const activeFilter = useMapStore((state) => state.activeFilter)
  const activeTimeFilter = useMapStore((state) => state.activeTimeFilter)
  const selectedItemId = useMapStore((state) => state.selectedItemId)
  const setActiveFilter = useMapStore((state) => state.setActiveFilter)
  const setActiveTimeFilter = useMapStore((state) => state.setActiveTimeFilter)
  const setSelectedItemId = useMapStore((state) => state.setSelectedItemId)
  const requestedIssueId = searchParams.get('issue')
  const shouldClearStaleSelectionOnMount = useRef(!requestedIssueId)
  const issuesQuery = useQuery({
    queryKey: issuesQueryKey,
    queryFn: fetchIssues,
  })
  const missionsQuery = useQuery({
    queryKey: missionsQueryKey,
    queryFn: fetchMissions,
  })
  const mapItems = useMemo(
    () => getCivicMapItems(issuesQuery.data ?? [], missionsQuery.data ?? []),
    [issuesQuery.data, missionsQuery.data],
  )
  const timisoaraMapItems = useMemo(
    () => filterCivicMapItemsForTimisoara(mapItems, activeTimeFilter),
    [activeTimeFilter, mapItems],
  )
  const visibleMapItemCount = useMemo(
    () =>
      timisoaraMapItems.filter(
        (item) => activeFilter === 'all' || item.kind === activeFilter,
      ).length,
    [activeFilter, timisoaraMapItems],
  )
  const landingStats = useMemo(
    () => getLandingStats(timisoaraMapItems),
    [timisoaraMapItems],
  )
  const isMapLoading =
    isApiConfigured && (issuesQuery.isLoading || missionsQuery.isLoading)
  const hasMapError =
    isApiConfigured && (issuesQuery.isError || missionsQuery.isError)

  useEffect(() => {
    if (shouldClearStaleSelectionOnMount.current) {
      setSelectedItemId(null)
    }
  }, [setSelectedItemId])

  useEffect(() => {
    if (!requestedIssueId) {
      return
    }

    if (timisoaraMapItems.some((item) => item.id === requestedIssueId)) {
      setSelectedItemId(requestedIssueId)
      setActiveFilter('all')
    }
  }, [requestedIssueId, setActiveFilter, setSelectedItemId, timisoaraMapItems])

  useEffect(() => {
    if (
      selectedItemId &&
      !timisoaraMapItems.some((item) => item.id === selectedItemId)
    ) {
      setSelectedItemId(null)
    }
  }, [selectedItemId, setSelectedItemId, timisoaraMapItems])

  const handleSelectLandingItem = (item: CivicMapItem) => {
    selectLandingItem(item, setActiveFilter, setSelectedItemId)
  }

  return (
    <motion.main
      className="min-h-svh w-full overflow-x-hidden bg-[linear-gradient(180deg,#fff9ef_0%,#f5fbf6_42%,#fffaf1_100%)] px-4 py-5 text-slate-950 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="mx-auto flex w-full max-w-[calc(100vw-2rem)] flex-col gap-6 pb-24 sm:max-w-[calc(100vw-3rem)] lg:max-w-7xl">
        <TopNavigation />

        <section className="relative grid gap-8 overflow-hidden rounded-[1.65rem] border border-emerald-100/80 bg-white/78 px-4 py-6 shadow-[0_22px_58px_rgba(15,23,42,0.07)] ring-1 ring-white/80 backdrop-blur sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(34rem,1.18fr)] lg:items-center lg:px-8">
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-200/80 bg-white/82 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-sm shadow-emerald-900/8">
              <span className="relative flex size-2.5" aria-hidden="true">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
              </span>
              Hartă live pentru cartierele Timișoarei
            </div>
            <h1 className="max-w-2xl text-[2.75rem] font-bold leading-[0.98] tracking-normal text-slate-950 min-[430px]:text-5xl sm:text-6xl lg:text-7xl">
              Timișoara,
              <span className="block bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                în timp real
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-slate-600 sm:text-lg">
              Vezi ce se întâmplă în oraș, implică-te în misiuni și câștigă
              recompense locale.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {['AI verifică sesizări', 'Misiuni pe hartă', 'Rewards locale'].map(
                (label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-white/76 px-3 py-1 text-xs font-bold text-slate-700 shadow-sm shadow-slate-900/5"
                  >
                    <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden="true" />
                    {label}
                  </span>
                ),
              )}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 border border-emerald-600 bg-emerald-600 px-5 text-white shadow-md shadow-emerald-900/16 hover:bg-emerald-700"
              >
                <Link to="/report">
                  <Plus className="size-4" data-icon="inline-start" aria-hidden="true" />
                  Raportează o problemă
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-slate-200 bg-white px-5 text-slate-900 shadow-sm shadow-slate-900/5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <Link to="/missions">
                  <Flag className="size-4" data-icon="inline-start" aria-hidden="true" />
                  Vezi misiunile active
                </Link>
              </Button>
            </div>
            <StatusNotice isMapLoading={isMapLoading} hasMapError={hasMapError} />
          </div>

          <StatCards stats={landingStats} />
        </section>

        <section
          id="map"
          className="rounded-2xl border border-slate-200 bg-white/92 p-2 shadow-sm shadow-slate-900/8 sm:p-4"
        >
          <div className="relative h-[68svh] min-h-[34rem] overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50/50 sm:h-[64svh] sm:min-h-[38rem] sm:overflow-visible lg:h-[68svh] lg:min-h-[43rem]">
            <CivicMap
              items={timisoaraMapItems}
              activeFilter={activeFilter}
              selectedItemId={selectedItemId}
              onSelectedItemChange={setSelectedItemId}
            />

            <div className="absolute inset-x-3 bottom-3 z-40 sm:inset-x-auto sm:bottom-auto sm:left-4 sm:top-4">
              <MapFilters
                activeFilter={activeFilter}
                activeTimeFilter={activeTimeFilter}
                visibleCount={visibleMapItemCount}
                totalCount={mapItems.length}
                onFilterChange={setActiveFilter}
                onTimeFilterChange={setActiveTimeFilter}
              />
            </div>

            <div className="pointer-events-none absolute right-4 top-4 z-20 hidden w-[17.5rem] lg:block">
              <div className="pointer-events-auto">
                <LiveActivityFeed />
              </div>
            </div>
          </div>

          <div className="mt-3 pb-1 lg:hidden">
            <LiveActivityFeed />
          </div>
        </section>

        <HowItWorksSection />

        <FeaturedSections
          items={timisoaraMapItems}
          onSelect={handleSelectLandingItem}
        />

        <BottomCta />
      </div>
      <FloatingReportButton />
    </motion.main>
  )
}
