import { motion } from 'motion/react'
import { useEffect, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Camera,
  Gift,
  HeartHandshake,
  LoaderCircle,
  MapPinned,
  Plus,
  Sparkles,
  Star,
  TriangleAlert,
  Users,
  type LucideIcon,
} from 'lucide-react'
import heroImage from '@/assets/hero.png'
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

type StatCard = {
  label: string
  value: string
  helper: string
  icon: LucideIcon
  className: string
}

type HowItWorksStep = {
  title: string
  description: string
  icon: LucideIcon
  className: string
}

const howItWorksSteps: HowItWorksStep[] = [
  {
    title: 'Raportează',
    description: 'Semnalează problema sau propui o idee în comunitate',
    icon: Camera,
    className: 'bg-emerald-50 text-emerald-700',
  },
  {
    title: 'Se verifică',
    description: 'Comunitatea și agenții pregătesc pașii următori',
    icon: Sparkles,
    className: 'bg-violet-50 text-violet-700',
  },
  {
    title: 'Comunitatea',
    description: 'Se implică și verifică progresul pe hartă',
    icon: Users,
    className: 'bg-blue-50 text-blue-700',
  },
  {
    title: 'Primești puncte',
    description: 'Deblochezi recompense locale pentru impact real',
    icon: Gift,
    className: 'bg-orange-50 text-orange-700',
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
      icon: Activity,
      className: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Misiuni active',
      value: String(Math.max(42, activeMissions)),
      helper: 'În desfășurare',
      icon: Users,
      className: 'bg-violet-50 text-violet-700',
    },
    {
      label: 'Recompense',
      value: String(Math.max(18, rewards)),
      helper: 'La parteneri locali',
      icon: Gift,
      className: 'bg-orange-50 text-orange-700',
    },
    {
      label: 'Zone active',
      value: String(Math.max(7, activeZones)),
      helper: 'În ultimele 7 zile',
      icon: MapPinned,
      className: 'bg-blue-50 text-blue-700',
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

function pickFeaturedRewards(items: CivicMapItem[]) {
  return items
    .filter((item) => item.kind === 'reward' || item.reward)
    .slice(0, 5)
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
    <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.article
          key={stat.label}
          className="min-w-0 rounded-lg border border-slate-200/80 bg-white p-3 shadow-sm shadow-slate-900/5 sm:p-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut', delay: 0.04 * index }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <div
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full sm:size-11',
                stat.className,
              )}
            >
              <stat.icon className="size-4 sm:size-5" aria-hidden="true" />
            </div>
            <p className="text-2xl font-bold leading-none text-slate-950 sm:text-3xl">
              {stat.value}
            </p>
          </div>
          <h2 className="mt-2 truncate text-xs font-bold text-slate-900 min-[390px]:text-sm">
            {stat.label}
          </h2>
          <p className="mt-0.5 truncate text-[0.68rem] font-medium text-slate-500 min-[390px]:text-xs">
            {stat.helper}
          </p>
        </motion.article>
      ))}
    </div>
  )
}

function HowItWorksSection() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-900/5 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold leading-tight text-slate-950 sm:text-xl">
          Cum funcționează CiviTm
        </h2>
        <span className="hidden rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 sm:inline-flex">
          4 pași
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 md:grid-cols-4">
        {howItWorksSteps.map((step, index) => (
          <article
            key={step.title}
            className="relative min-w-0 rounded-lg border border-slate-100 bg-slate-50/70 p-3"
          >
            <div className="flex min-w-0 items-center justify-between gap-2">
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-lg sm:size-11',
                  step.className,
                )}
              >
                <step.icon className="size-4.5 sm:size-5" aria-hidden="true" />
              </span>
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-sm shadow-emerald-900/12">
                {index + 1}
              </span>
            </div>
            <h3 className="mt-3 truncate text-sm font-bold text-slate-950">
              {step.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-slate-500 sm:text-sm">
              {step.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

function MissionCard({
  item,
  onSelect,
}: {
  item: CivicMapItem
  onSelect: (item: CivicMapItem) => void
}) {
  const progress = Math.min(
    92,
    Math.max(35, (item.participantsJoined ?? item.pointsEarned ?? 8) * 7),
  )

  return (
    <motion.button
      type="button"
      className="group min-w-0 rounded-xl border border-slate-200 bg-white text-left shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-500/25"
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(item)}
    >
      <div
        className={cn(
          'flex h-28 items-end rounded-t-xl bg-gradient-to-br p-3',
          getCardTint(item),
        )}
      >
        <span className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-bold text-white">
          {item.zone}
        </span>
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-950">
          {item.relatedMission ?? item.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-500">
          {item.title}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-600">
          <span className="inline-flex min-w-0 items-center gap-1">
            <Users className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{item.participantsJoined ?? 12} participanți</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 font-bold text-orange-600">
            <Star className="size-3.5" aria-hidden="true" />
            +{item.pointsEarned ?? 90} XP
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
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
  return (
    <motion.button
      type="button"
      className="group min-w-0 rounded-xl border border-orange-200 bg-white text-left shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-orange-500/20"
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(item)}
    >
      <div
        className={cn(
          'flex h-24 items-end rounded-t-xl bg-gradient-to-br p-3',
          getCardTint(item),
        )}
      >
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-950/82 px-2 py-1 text-xs font-bold text-white">
          <Gift className="size-3.5" aria-hidden="true" />
          {item.zone}
        </span>
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-950">
          {item.reward ?? item.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-500">
          {item.meta}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
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
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {missions.map((item) => (
            <MissionCard key={item.id} item={item} onSelect={onSelect} />
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
        <div className="mt-4 grid gap-3 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
    <section className="relative overflow-hidden rounded-xl bg-emerald-600 p-5 text-white shadow-sm shadow-slate-900/10 sm:p-7">
      <img
        src={heroImage}
        alt=""
        className="absolute inset-y-0 right-0 hidden h-full w-1/2 object-cover opacity-50 sm:block"
      />
      <div className="relative max-w-xl">
        <h2 className="text-2xl font-bold">Fă orașul mai bun, pas cu pas.</h2>
        <p className="mt-2 max-w-md text-sm font-medium text-emerald-50">
          Alătură-te comunității CiviTm și transformă Timișoara în realitate,
          nu doar în promisiuni.
        </p>
        <Button
          asChild
          className="mt-4 bg-white text-emerald-700 hover:bg-emerald-50"
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
      className="min-h-svh w-full overflow-x-hidden bg-orange-50 px-4 py-5 text-slate-950 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="mx-auto flex w-full max-w-[calc(100vw-2rem)] flex-col gap-6 pb-24 sm:max-w-[calc(100vw-3rem)] lg:max-w-7xl">
        <TopNavigation />

        <section className="grid gap-6 pt-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(28rem,1.1fr)] lg:items-center lg:pt-6">
          <div className="min-w-0">
            <h1 className="max-w-2xl text-5xl font-bold leading-[0.98] tracking-normal text-slate-950 sm:text-6xl lg:text-7xl">
              Timișoara,
              <span className="block text-emerald-600">în timp real</span>
            </h1>
            <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-slate-600 sm:text-lg">
              Vezi ce se întâmplă în oraș, implică-te în misiuni și câștigă
              recompense locale.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 bg-emerald-600 px-5 text-white shadow-sm shadow-emerald-900/15 hover:bg-emerald-700"
              >
                <Link to="/report">
                  <Plus data-icon="inline-start" aria-hidden="true" />
                  Raportează o problemă
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-slate-200 bg-white px-5 text-slate-900 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <Link to="/missions">
                  <HeartHandshake data-icon="inline-start" aria-hidden="true" />
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
          className="rounded-2xl border border-slate-200 bg-white/92 p-3 shadow-sm shadow-slate-900/8 sm:p-4"
        >
          <div className="relative h-[60svh] min-h-[31rem] overflow-visible rounded-xl border border-emerald-100 bg-emerald-50/50 sm:h-[64svh] sm:min-h-[38rem] lg:h-[68svh] lg:min-h-[43rem]">
            <CivicMap
              items={timisoaraMapItems}
              activeFilter={activeFilter}
              selectedItemId={selectedItemId}
              onSelectedItemChange={setSelectedItemId}
            />

            <div className="absolute left-3 top-3 z-20 sm:left-4">
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

          <div className="mt-3 lg:hidden">
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
