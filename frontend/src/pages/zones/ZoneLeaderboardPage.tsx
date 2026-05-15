import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { animate, motion } from 'motion/react'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  CheckCircle2,
  Flag,
  Layers3,
  Leaf,
  MapPinned,
  Minus,
  SearchX,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from '@/components/icons/hugeicons'
import { Button } from '@/components/ui/button'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { DemoSkeletonGrid, DemoState } from '@/components/ui/demo-state'
import {
  fetchIssues,
  fetchMissions,
  fetchZoneLeaderboard,
  isApiConfigured,
  type ZoneLeaderboardItemResponse,
} from '@/lib/api'
import {
  issuesQueryKey,
  missionsQueryKey,
  zoneLeaderboardQueryKey,
} from '@/lib/queryClient'
import { CivicMap } from '@/components/map/CivicMap'
import { LiveActivityFeed } from '@/components/map/LiveActivityFeed'
import { MapFilters } from '@/components/map/MapFilters'
import type { MapFilterKind } from '@/components/map/MapMarker'
import {
  filterCivicMapItemsForTimisoara,
  getCivicMapItems,
  type MapTimeFilterKind,
} from '@/data/civicMapData'
import { cn } from '@/lib/utils'

type ZoneOverlayFilter = 'all' | 'top' | 'issues' | 'missions' | 'rising'
type ZoneOverlayGeometry = {
  fill: string
  points: Array<[number, number]>
  label: [number, number]
}

const demoZoneLeaderboard: ZoneLeaderboardItemResponse[] = [
  {
    id: 'demo-complex',
    rank: 1,
    name: 'Complex',
    description: 'Zona studenteasca cu activitate civica ridicata si rapoarte despre trotuare.',
    score: 575,
    scoreDelta: 65,
    cleanlinessScore: 170,
    communityScore: 156,
    safetyScore: 126,
    engagementScore: 123,
    latitude: 45.7531,
    longitude: 21.2325,
    openIssues: 4,
    resolvedIssues: 11,
    activeMissions: 3,
    updatedAt: '2026-05-12T09:00:00Z',
    calculatedAt: '2026-05-12T09:00:00Z',
  },
  {
    id: 'demo-girocului',
    rank: 2,
    name: 'Girocului',
    description: 'Zona rezidentiala cu rapoarte active despre drumuri si curatenie.',
    score: 505,
    scoreDelta: 85,
    cleanlinessScore: 160,
    communityScore: 120,
    safetyScore: 116,
    engagementScore: 109,
    latitude: 45.7339,
    longitude: 21.2114,
    openIssues: 5,
    resolvedIssues: 8,
    activeMissions: 2,
    updatedAt: '2026-05-12T09:00:00Z',
    calculatedAt: '2026-05-12T09:00:00Z',
  },
  {
    id: 'demo-fabric',
    rank: 3,
    name: 'Fabric',
    description: 'Cartier istoric cu rapoarte despre iluminat public si siguranta.',
    score: 438,
    scoreDelta: 58,
    cleanlinessScore: 112,
    communityScore: 102,
    safetyScore: 142,
    engagementScore: 82,
    latitude: 45.7603,
    longitude: 21.2422,
    openIssues: 6,
    resolvedIssues: 7,
    activeMissions: 2,
    updatedAt: '2026-05-12T09:00:00Z',
    calculatedAt: '2026-05-12T09:00:00Z',
  },
  {
    id: 'demo-soarelui',
    rank: 4,
    name: 'Soarelui',
    description: 'Zona concentrata pe spatii verzi si verificari comunitare.',
    score: 410,
    scoreDelta: 50,
    cleanlinessScore: 138,
    communityScore: 112,
    safetyScore: 78,
    engagementScore: 82,
    latitude: 45.7366,
    longitude: 21.2468,
    openIssues: 3,
    resolvedIssues: 6,
    activeMissions: 1,
    updatedAt: '2026-05-12T09:00:00Z',
    calculatedAt: '2026-05-12T09:00:00Z',
  },
  {
    id: 'demo-mehala',
    rank: 5,
    name: 'Mehala',
    description: 'Zona prioritara pentru siguranta si accesibilitate.',
    score: 335,
    scoreDelta: 45,
    cleanlinessScore: 78,
    communityScore: 88,
    safetyScore: 116,
    engagementScore: 53,
    latitude: 45.7672,
    longitude: 21.1947,
    openIssues: 7,
    resolvedIssues: 4,
    activeMissions: 1,
    updatedAt: '2026-05-12T09:00:00Z',
    calculatedAt: '2026-05-12T09:00:00Z',
  },
]

const scoreBreakdown = [
  { key: 'cleanlinessScore', label: 'Curatenie', color: 'bg-lime-500', icon: Leaf },
  { key: 'communityScore', label: 'Comunitate', color: 'bg-emerald-500', icon: BadgeCheck },
  { key: 'safetyScore', label: 'Siguranta', color: 'bg-teal-500', icon: ShieldCheck },
  { key: 'engagementScore', label: 'Implicare', color: 'bg-sky-500', icon: Sparkles },
] satisfies Array<{
  key: keyof Pick<
    ZoneLeaderboardItemResponse,
    | 'cleanlinessScore'
    | 'communityScore'
    | 'safetyScore'
    | 'engagementScore'
  >
  label: string
  color: string
  icon: typeof Trophy
}>

const zoneOverlayFilters = [
  { id: 'all', label: 'Toate', icon: Layers3 },
  { id: 'top', label: 'Top scor', icon: Trophy },
  { id: 'issues', label: 'Cu probleme', icon: TriangleAlert },
  { id: 'missions', label: 'Cu misiuni', icon: Flag },
  { id: 'rising', label: 'In crestere', icon: TrendingUp },
] satisfies Array<{
  id: ZoneOverlayFilter
  label: string
  icon: typeof Trophy
}>

const timisoaraOverlayBounds = {
  west: 21.12,
  south: 45.68,
  east: 21.32,
  north: 45.81,
} as const

const zoneOverlayGeometry: Record<string, ZoneOverlayGeometry> = {
  complex: {
    fill: '#8b7cf6',
    points: [
      [21.21, 45.748],
      [21.228, 45.766],
      [21.252, 45.761],
      [21.252, 45.741],
      [21.232, 45.728],
      [21.21, 45.734],
    ],
    label: [21.2325, 45.7531],
  },
  girocului: {
    fill: '#ef6f6c',
    points: [
      [21.185, 45.711],
      [21.214, 45.734],
      [21.232, 45.728],
      [21.23, 45.704],
      [21.204, 45.69],
      [21.176, 45.694],
    ],
    label: [21.2114, 45.718],
  },
  fabric: {
    fill: '#f2bd43',
    points: [
      [21.252, 45.761],
      [21.292, 45.77],
      [21.314, 45.746],
      [21.304, 45.724],
      [21.27, 45.726],
      [21.252, 45.741],
    ],
    label: [21.28, 45.749],
  },
  soarelui: {
    fill: '#31a89b',
    points: [
      [21.23, 45.704],
      [21.266, 45.724],
      [21.304, 45.724],
      [21.32, 45.698],
      [21.29, 45.68],
      [21.244, 45.682],
    ],
    label: [21.267, 45.705],
  },
  mehala: {
    fill: '#31b9a8',
    points: [
      [21.12, 45.744],
      [21.164, 45.782],
      [21.214, 45.772],
      [21.228, 45.766],
      [21.21, 45.748],
      [21.17, 45.724],
      [21.12, 45.724],
    ],
    label: [21.177, 45.759],
  },
  bucovina: {
    fill: '#3eb6aa',
    points: [
      [21.164, 45.782],
      [21.216, 45.81],
      [21.262, 45.79],
      [21.252, 45.761],
      [21.228, 45.766],
      [21.214, 45.772],
    ],
    label: [21.216, 45.782],
  },
  circumvalatiunii: {
    fill: '#f2bd43',
    points: [
      [21.12, 45.724],
      [21.17, 45.724],
      [21.21, 45.734],
      [21.21, 45.748],
      [21.164, 45.756],
      [21.12, 45.748],
    ],
    label: [21.166, 45.738],
  },
  iosefin: {
    fill: '#9f8cec',
    points: [
      [21.17, 45.724],
      [21.21, 45.734],
      [21.232, 45.728],
      [21.214, 45.708],
      [21.185, 45.711],
      [21.15, 45.704],
    ],
    label: [21.194, 45.719],
  },
  lipovei: {
    fill: '#9f8cec',
    points: [
      [21.262, 45.79],
      [21.32, 45.808],
      [21.32, 45.748],
      [21.292, 45.77],
      [21.252, 45.761],
    ],
    label: [21.292, 45.782],
  },
}

function getTopScoreMetric(zone: ZoneLeaderboardItemResponse) {
  return scoreBreakdown
    .map((item) => ({
      ...item,
      value: zone[item.key],
    }))
    .sort((a, b) => b.value - a.value)[0]
}

function normalizeZoneName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function projectZonePoint([lng, lat]: [number, number]) {
  const x =
    ((lng - timisoaraOverlayBounds.west) /
      (timisoaraOverlayBounds.east - timisoaraOverlayBounds.west)) *
    100
  const y =
    ((timisoaraOverlayBounds.north - lat) /
      (timisoaraOverlayBounds.north - timisoaraOverlayBounds.south)) *
    100

  return [Math.min(Math.max(x, 0), 100), Math.min(Math.max(y, 0), 100)] as const
}

function matchesZoneOverlayFilter(
  zone: ZoneLeaderboardItemResponse,
  filter: ZoneOverlayFilter,
) {
  if (filter === 'top') {
    return zone.rank <= 3
  }

  if (filter === 'issues') {
    return zone.openIssues > 0
  }

  if (filter === 'missions') {
    return zone.activeMissions > 0
  }

  if (filter === 'rising') {
    return zone.scoreDelta > 0
  }

  return true
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('ro-RO').format(value)
}

function AnimatedNumber({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  const previousValue = useRef(0)
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const controls = animate(previousValue.current, value, {
      duration: 0.7,
      ease: 'easeOut',
      onUpdate: (latest) => {
        setDisplayValue(Math.round(latest))
      },
    })

    previousValue.current = value

    return () => controls.stop()
  }, [value])

  return <span className={className}>{formatNumber(displayValue)}</span>
}

function ScoreDeltaBadge({ delta }: { delta: number }) {
  const isPositive = delta > 0
  const isNegative = delta < 0
  const DeltaIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  return (
    <span
      className={cn(
        'inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-semibold ring-1',
        isPositive && 'bg-lime-50 text-lime-700 ring-lime-200',
        isNegative && 'bg-rose-50 text-rose-700 ring-rose-200',
        !isPositive && !isNegative && 'bg-slate-50 text-slate-600 ring-slate-200',
      )}
    >
      <DeltaIcon className="size-3.5" aria-hidden="true" />
      {isPositive && '+'}
      {delta}
    </span>
  )
}

function ZoneStatCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof Trophy
  label: string
  value: number | string
  detail: string
  tone: 'emerald' | 'teal' | 'lime' | 'sky'
}) {
  const toneClasses = {
    emerald: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
    teal: 'bg-teal-50 text-teal-800 ring-teal-100',
    lime: 'bg-lime-50 text-lime-800 ring-lime-100',
    sky: 'bg-sky-50 text-sky-800 ring-sky-100',
  }[tone]

  return (
    <section className="rounded-xl border border-emerald-100 bg-[#f7fbf2] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            {label}
          </p>
          {typeof value === 'number' ? (
            <AnimatedNumber
              value={value}
              className="mt-2 block text-3xl font-semibold text-emerald-950"
            />
          ) : (
            <p className="mt-2 truncate text-xl font-semibold text-emerald-950">
              {value}
            </p>
          )}
        </div>
        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl ring-1', toneClasses)}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600">{detail}</p>
    </section>
  )
}

function ZoneCard({
  zone,
  index,
}: {
  zone: ZoneLeaderboardItemResponse
  index: number
}) {
  const topMetric = getTopScoreMetric(zone)
  const TopMetricIcon = topMetric.icon

  return (
    <motion.article
      layout
      className="grid gap-3 rounded-xl border border-emerald-100 bg-white p-3 shadow-sm transition hover:border-emerald-300 hover:shadow-md sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.04,
        duration: 0.3,
        ease: 'easeOut',
        layout: { duration: 0.35, ease: 'easeOut' },
      }}
    >
      <div className="flex items-start gap-3 sm:block">
        <motion.div
          layoutId={`zone-rank-${zone.id}`}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-lg font-semibold text-white"
        >
          {zone.rank}
        </motion.div>
        <div className="min-w-0 sm:hidden">
          <Link to={`/zones/${zone.id}`} className="block hover:text-emerald-700">
            <h2 className="!m-0 !text-lg font-semibold leading-tight text-emerald-950">
              {zone.name}
            </h2>
          </Link>
        </div>
      </div>

      <div className="min-w-0">
        <div className="hidden sm:block">
          <Link to={`/zones/${zone.id}`} className="block hover:text-emerald-700">
            <h2 className="!m-0 !text-lg font-semibold leading-tight text-emerald-950">
              {zone.name}
            </h2>
          </Link>
          <p className="mt-0.5 line-clamp-1 text-sm text-slate-600">
            {zone.description}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800 ring-1 ring-emerald-100">
            <Flag className="size-4 shrink-0" aria-hidden="true" />
            {zone.activeMissions} misiuni
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-50 px-2.5 py-1 text-lime-800 ring-1 ring-lime-100">
            <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
            {zone.resolvedIssues} rezolvate
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-teal-800 ring-1 ring-teal-100">
            <MapPinned className="size-4 shrink-0" aria-hidden="true" />
            {zone.openIssues} deschise
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-violet-800 ring-1 ring-violet-100">
            <TopMetricIcon className="size-4 shrink-0" aria-hidden="true" />
            {topMetric.label}: {formatNumber(topMetric.value)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:min-w-32 sm:flex-col sm:items-end sm:justify-center">
        <ScoreDeltaBadge delta={zone.scoreDelta} />
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Scor
          </p>
          <AnimatedNumber
            value={zone.score}
            className="mt-1 block text-3xl font-semibold text-emerald-950"
          />
        </div>
        <Link
          to={`/zones/${zone.id}`}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-3 text-sm font-semibold text-emerald-800 transition hover:border-emerald-200 hover:bg-emerald-100"
        >
          Detalii
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </motion.article>
  )
}

function ZoneLeaderboard({
  zones,
}: {
  zones: ZoneLeaderboardItemResponse[]
}) {
  return (
    <motion.div layout className="grid gap-3">
      {zones.map((zone, index) => (
        <ZoneCard key={zone.id} zone={zone} index={index} />
      ))}
    </motion.div>
  )
}

function ZoneMapOverlay({
  zones,
  activeFilter,
  selectedZoneId,
  onSelectZone,
}: {
  zones: ZoneLeaderboardItemResponse[]
  activeFilter: ZoneOverlayFilter
  selectedZoneId: string | null
  onSelectZone: (zoneId: string) => void
}) {
  const overlayZones = useMemo(
    () =>
      zones
        .map((zone) => {
          const geometry = zoneOverlayGeometry[normalizeZoneName(zone.name)]

          if (!geometry) {
            return null
          }

          return {
            zone,
            geometry,
            isVisible: matchesZoneOverlayFilter(zone, activeFilter),
            polygonPoints: geometry.points
              .map((point) => projectZonePoint(point).join(','))
              .join(' '),
            labelPoint: projectZonePoint(geometry.label),
          }
        })
        .filter((zone): zone is NonNullable<typeof zone> => Boolean(zone)),
    [activeFilter, zones],
  )
  return (
    <>
      <svg
        className="pointer-events-none absolute inset-0 z-10 size-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <filter id="zone-overlay-soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1.2" stdDeviation="0.7" floodOpacity="0.18" />
          </filter>
        </defs>
        {overlayZones.map(({ zone, geometry, isVisible, polygonPoints }) => {
          const isSelected = selectedZoneId === zone.id

          return (
            <motion.polygon
              key={zone.id}
              points={polygonPoints}
              fill={geometry.fill}
              stroke={isSelected ? '#064e3b' : geometry.fill}
              strokeWidth={isSelected ? 0.55 : 0.32}
              vectorEffect="non-scaling-stroke"
              filter={isVisible ? 'url(#zone-overlay-soft-shadow)' : undefined}
              initial={false}
              animate={{
                opacity: isVisible ? (isSelected ? 0.36 : 0.18) : 0.05,
              }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            />
          )
        })}
      </svg>

      {overlayZones.map(({ zone, geometry, isVisible, labelPoint }) => {
        const isSelected = selectedZoneId === zone.id

        return (
          <button
            key={zone.id}
            type="button"
            className={cn(
              'pointer-events-auto absolute hidden -translate-x-1/2 -translate-y-1/2 rounded-full border px-2.5 py-1 text-xs font-bold shadow-md shadow-slate-900/12 transition sm:inline-flex sm:items-center sm:gap-1.5',
              'z-20',
              isSelected
                ? 'border-emerald-700 bg-emerald-700 text-white'
                : 'border-white/80 bg-white/90 text-emerald-950 hover:bg-white',
              !isVisible && 'opacity-35 grayscale',
            )}
            style={{
              left: `${labelPoint[0]}%`,
              top: `${labelPoint[1]}%`,
            }}
            onClick={() => onSelectZone(zone.id)}
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: isSelected ? '#fff' : geometry.fill }}
              aria-hidden="true"
            />
            {zone.name}
            <span className={cn('font-semibold', isSelected ? 'text-white/85' : 'text-slate-500')}>
              {formatNumber(zone.score)}
            </span>
          </button>
        )
      })}
    </>
  )
}

function ZoneOverlayControls({
  zones,
  activeFilter,
  onFilterChange,
}: {
  zones: ZoneLeaderboardItemResponse[]
  activeFilter: ZoneOverlayFilter
  onFilterChange: (filter: ZoneOverlayFilter) => void
}) {
  const overlayZoneCount = zones.filter(
    (zone) => zoneOverlayGeometry[normalizeZoneName(zone.name)],
  ).length
  const visibleZoneCount = zones.filter(
    (zone) =>
      zoneOverlayGeometry[normalizeZoneName(zone.name)] &&
      matchesZoneOverlayFilter(zone, activeFilter),
  ).length

  return (
    <div className="grid gap-2 rounded-xl border border-emerald-100 bg-white p-3 shadow-sm shadow-slate-900/8 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
      <div className="flex items-center justify-between gap-3 sm:justify-start">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-800">
          <Layers3 className="size-4" aria-hidden="true" />
          Zone pe harta
        </span>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
          {visibleZoneCount}/{overlayZoneCount}
        </span>
      </div>

      <div className="flex min-w-0 gap-1 overflow-x-auto pb-0.5 sm:justify-end">
        {zoneOverlayFilters.map((filter) => {
          const Icon = filter.icon
          const isActive = activeFilter === filter.id

          return (
            <button
              key={filter.id}
              type="button"
              className={cn(
                'inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold ring-1 transition',
                isActive
                  ? 'bg-emerald-600 text-white ring-emerald-600'
                  : 'bg-white text-emerald-900 ring-emerald-100 hover:bg-emerald-50',
              )}
              aria-pressed={isActive}
              onClick={() => onFilterChange(filter.id)}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {filter.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ZoneImpactMap({
  zones,
  mapItems,
  activeFilter,
  activeTimeFilter,
  activeZoneFilter,
  selectedItemId,
  selectedZoneId,
  visibleCount,
  totalCount,
  topZone,
  onFilterChange,
  onTimeFilterChange,
  onSelectedItemChange,
  onZoneFilterChange,
  onSelectedZoneChange,
}: {
  zones: ZoneLeaderboardItemResponse[]
  mapItems: ReturnType<typeof getCivicMapItems>
  activeFilter: MapFilterKind
  activeTimeFilter: MapTimeFilterKind
  activeZoneFilter: ZoneOverlayFilter
  selectedItemId: string | null
  selectedZoneId: string | null
  visibleCount: number
  totalCount: number
  topZone: ZoneLeaderboardItemResponse | undefined
  onFilterChange: (filter: MapFilterKind) => void
  onTimeFilterChange: (filter: MapTimeFilterKind) => void
  onSelectedItemChange: (itemId: string | null) => void
  onZoneFilterChange: (filter: ZoneOverlayFilter) => void
  onSelectedZoneChange: (zoneId: string) => void
}) {
  const selectedZone = zones.find((zone) => zone.id === selectedZoneId)
  const activeZone = selectedZone ?? topZone

  return (
    <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white p-2 shadow-sm shadow-slate-900/8 sm:p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid min-w-0 gap-3">
          <ZoneOverlayControls
            zones={zones}
            activeFilter={activeZoneFilter}
            onFilterChange={onZoneFilterChange}
          />

          <div className="relative h-[68svh] min-h-[34rem] overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50/50 sm:h-[64svh] sm:min-h-[38rem] sm:overflow-visible lg:h-[68svh] lg:min-h-[43rem]">
            <CivicMap
              items={mapItems}
              activeFilter={activeFilter}
              selectedItemId={selectedItemId}
              onSelectedItemChange={onSelectedItemChange}
              isInteractive={false}
            />

            <ZoneMapOverlay
              zones={zones}
              activeFilter={activeZoneFilter}
              selectedZoneId={selectedZoneId}
              onSelectZone={onSelectedZoneChange}
            />

            <div className="absolute inset-x-3 bottom-3 z-40 sm:inset-x-auto sm:bottom-auto sm:left-4 sm:top-4">
              <MapFilters
                activeFilter={activeFilter}
                activeTimeFilter={activeTimeFilter}
                visibleCount={visibleCount}
                totalCount={totalCount}
                onFilterChange={onFilterChange}
                onTimeFilterChange={onTimeFilterChange}
              />
            </div>

            <div className="pointer-events-none absolute right-4 top-4 z-20 hidden w-[17.5rem] xl:block">
              <div className="pointer-events-auto">
                <LiveActivityFeed />
              </div>
            </div>
          </div>
        </div>

        <aside className="grid h-max gap-3 lg:sticky lg:top-24">
          {activeZone && (
            <section className="rounded-xl border border-emerald-100 bg-[#f7fbf2] p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <Trophy className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                    {selectedZone ? 'Zona selectata' : 'Zona lider'}
                  </p>
                  <h2 className="text-xl font-semibold text-emerald-950">
                    {activeZone.name}
                  </h2>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-emerald-900 ring-1 ring-emerald-100">
                  <span className="inline-flex items-center gap-2">
                    <Award className="size-4" aria-hidden="true" />
                    Scor
                  </span>
                  <span className="font-bold">{formatNumber(activeZone.score)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-yellow-50 px-3 py-2 text-yellow-900">
                  <span className="inline-flex items-center gap-2">
                    <TrendingUp className="size-4" aria-hidden="true" />
                    Delta
                  </span>
                  <span className="font-bold">
                    {activeZone.scoreDelta >= 0 ? '+' : ''}
                    {activeZone.scoreDelta}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900">
                  <span className="inline-flex items-center gap-2">
                    <Flag className="size-4" aria-hidden="true" />
                    Misiuni
                  </span>
                  <span className="font-bold">{activeZone.activeMissions}</span>
                </div>
              </div>

              <Button asChild className="mt-4 min-h-11 w-full bg-emerald-600 text-white hover:bg-emerald-700">
                <Link to={`/zones/${activeZone.id}`}>
                  Detalii zona
                  <ArrowRight data-icon="inline-end" aria-hidden="true" />
                </Link>
              </Button>
            </section>
          )}

          <div className="lg:hidden">
            <LiveActivityFeed />
          </div>
        </aside>
      </div>
    </section>
  )
}

function LoadingZones() {
  return (
    <div className="grid gap-3">
      <DemoState
        icon={Activity}
        eyebrow="Se incarca zonele"
        title="Sincronizam leaderboard-ul live"
        description="Scorurile zonelor, misiunile si problemele rezolvate se incarca din API."
      />
      <DemoSkeletonGrid items={3} />
    </div>
  )
}

export function ZoneLeaderboardPage() {
  const [activeMapFilter, setActiveMapFilter] = useState<MapFilterKind>('all')
  const [activeZoneFilter, setActiveZoneFilter] =
    useState<ZoneOverlayFilter>('all')
  const [activeTimeFilter, setActiveTimeFilter] =
    useState<MapTimeFilterKind>('30d')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const zonesQuery = useQuery({
    queryKey: zoneLeaderboardQueryKey,
    queryFn: fetchZoneLeaderboard,
  })
  const issuesQuery = useQuery({
    queryKey: issuesQueryKey,
    queryFn: fetchIssues,
    enabled: isApiConfigured,
  })
  const missionsQuery = useQuery({
    queryKey: missionsQueryKey,
    queryFn: fetchMissions,
    enabled: isApiConfigured,
  })
  const zones = useMemo(() => {
    if (!isApiConfigured || zonesQuery.isError) {
      return demoZoneLeaderboard
    }

    return zonesQuery.data ?? []
  }, [zonesQuery.data, zonesQuery.isError])
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
        (item) => activeMapFilter === 'all' || item.kind === activeMapFilter,
      ).length,
    [activeMapFilter, timisoaraMapItems],
  )
  const topZone = zones[0]
  const filteredZones = useMemo(
    () =>
      zones.filter((zone) => matchesZoneOverlayFilter(zone, activeZoneFilter)),
    [activeZoneFilter, zones],
  )
  const cityScore = zones.reduce((sum, zone) => sum + zone.score, 0)
  const activeMissions = zones.reduce(
    (sum, zone) => sum + zone.activeMissions,
    0,
  )
  const resolvedIssues = zones.reduce(
    (sum, zone) => sum + zone.resolvedIssues,
    0,
  )
  const isLoadingZones = zonesQuery.isLoading && isApiConfigured

  return (
    <main className="min-h-svh overflow-x-hidden bg-[#f7fbf2] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-7xl gap-5 pb-24 sm:pb-0">
        <TopNavigation />

        <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm shadow-slate-900/6 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-800">
                <Trophy className="size-3.5" aria-hidden="true" />
                Zone CiviTm
              </p>
              <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight text-emerald-950 sm:text-4xl lg:text-5xl">
                Vezi cartierele care misca orasul inainte.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Harta coloreaza zonele dupa scorul civic: misiuni active, probleme
                rezolvate, siguranta, curatenie si implicare comunitara.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="min-h-11 rounded-xl border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50"
              >
                <Link to="/">
                  <ArrowLeft data-icon="inline-start" aria-hidden="true" />
                  Harta live
                </Link>
              </Button>
              <Button
                asChild
                className="min-h-11 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                size="sm"
              >
                <Link to="/report">
                  <Leaf data-icon="inline-start" aria-hidden="true" />
                  Raporteaza
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <ZoneStatCard
              icon={Trophy}
              label="Zona lider"
              value={topZone?.name ?? 'Timisoara'}
              detail={`#${topZone?.rank ?? 1} impact urban`}
              tone="emerald"
            />
            <ZoneStatCard
              icon={Award}
              label="Scor oras"
              value={cityScore}
              detail="In zonele active."
              tone="lime"
            />
            <ZoneStatCard
              icon={Flag}
              label="Misiuni active"
              value={activeMissions}
              detail="Actiuni comunitare."
              tone="teal"
            />
            <ZoneStatCard
              icon={CheckCircle2}
              label="Probleme rezolvate"
              value={resolvedIssues}
              detail="Rezolvari vizibile."
              tone="sky"
            />
          </div>
        </section>

        {zonesQuery.isError && isApiConfigured && (
          <DemoState
            icon={TriangleAlert}
            tone="amber"
            eyebrow="Fallback temporar"
            title="Folosim leaderboard-ul demo pe zone"
            description="Endpointul live pentru zone nu a putut fi accesat, asa ca pagina foloseste scoruri demo."
          />
        )}

        {isLoadingZones ? (
          <LoadingZones />
        ) : zones.length === 0 ? (
          <DemoState
            icon={SearchX}
            tone="slate"
            eyebrow="Fara scoruri de zona"
            title="Nu exista date de leaderboard inca"
            description="Scorurile apar dupa ce problemele, rezolvarile sau misiunile active sunt legate de o zona."
          />
        ) : (
          <>
            <ZoneImpactMap
              zones={zones}
              mapItems={timisoaraMapItems}
              activeFilter={activeMapFilter}
              activeTimeFilter={activeTimeFilter}
              activeZoneFilter={activeZoneFilter}
              selectedItemId={selectedItemId}
              selectedZoneId={selectedZoneId}
              visibleCount={visibleMapItemCount}
              totalCount={mapItems.length}
              topZone={topZone}
              onFilterChange={setActiveMapFilter}
              onTimeFilterChange={setActiveTimeFilter}
              onSelectedItemChange={setSelectedItemId}
              onZoneFilterChange={setActiveZoneFilter}
              onSelectedZoneChange={setSelectedZoneId}
            />
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <section className="grid h-max gap-3">
                <div className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100">
                      <Target className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                        Leaderboard
                      </p>
                      <h2 className="!m-0 !text-xl font-semibold text-emerald-950">
                        Scoruri pe zone
                      </h2>
                    </div>
                  </div>
                  <span className="inline-flex w-max items-center gap-2 rounded-full bg-lime-50 px-3 py-1 text-sm font-semibold text-lime-800 ring-1 ring-lime-100">
                    <Sparkles className="size-4" aria-hidden="true" />
                    {filteredZones.length} din {zones.length} zone
                  </span>
                </div>

                <ZoneLeaderboard zones={filteredZones} />
              </section>

              <aside className="grid h-max gap-3">
                <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                      <Activity className="size-5" aria-hidden="true" />
                    </span>
                    <h2 className="!m-0 !text-lg font-semibold text-emerald-950">
                      Pulsul orasului
                    </h2>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {zones.slice(0, 3).map((zone) => (
                      <div
                        key={zone.id}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-emerald-100 pb-3 last:border-b-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-emerald-950">
                            {zone.name}
                          </p>
                          <p className="text-xs text-slate-600">
                            {zone.activeMissions} misiuni / {zone.openIssues} deschise
                          </p>
                        </div>
                        <ScoreDeltaBadge delta={zone.scoreDelta} />
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                      <MapPinned className="size-5" aria-hidden="true" />
                    </span>
                    <h2 className="!m-0 !text-lg font-semibold text-emerald-950">
                      Acoperire
                    </h2>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between rounded-md bg-orange-50 px-3 py-2">
                      <span>Zone urmarite</span>
                      <span className="font-semibold text-emerald-800">
                        {zones.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-md bg-lime-50 px-3 py-2">
                      <span>Cel mai bun delta</span>
                      <span className="font-semibold text-lime-800">
                        +{Math.max(0, ...zones.map((zone) => zone.scoreDelta))}
                      </span>
                    </div>
                  </div>
                </section>
              </aside>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
