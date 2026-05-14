import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { animate, motion } from 'motion/react'
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Flag,
  Leaf,
  MapPinned,
  Minus,
  SearchX,
  Trophy,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DemoSkeletonGrid, DemoState } from '@/components/ui/demo-state'
import {
  fetchZoneLeaderboard,
  isApiConfigured,
  type ZoneLeaderboardItemResponse,
} from '@/lib/api'
import { zoneLeaderboardQueryKey } from '@/lib/queryClient'
import { cn } from '@/lib/utils'

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
  { key: 'cleanlinessScore', label: 'Curatenie', color: 'bg-lime-500' },
  { key: 'communityScore', label: 'Comunitate', color: 'bg-emerald-500' },
  { key: 'safetyScore', label: 'Siguranta', color: 'bg-teal-500' },
  { key: 'engagementScore', label: 'Implicare', color: 'bg-sky-500' },
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
}>

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

function ZoneScoreBars({ zone }: { zone: ZoneLeaderboardItemResponse }) {
  const maxScore = Math.max(
    1,
    ...scoreBreakdown.map((item) => zone[item.key]),
  )

  return (
    <div className="grid gap-2">
      {scoreBreakdown.map((item) => {
        const value = zone[item.key]
        const width = `${Math.max(8, Math.round((value / maxScore) * 100))}%`

        return (
          <div key={item.key} className="grid gap-1">
            <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
              <span>{item.label}</span>
              <span className="font-semibold text-emerald-950">
                {formatNumber(value)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className={cn('h-full rounded-full', item.color)}
                initial={{ width: 0 }}
                animate={{ width }}
                transition={{ duration: 0.65, ease: 'easeOut' }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ZoneCard({
  zone,
  index,
}: {
  zone: ZoneLeaderboardItemResponse
  index: number
}) {
  return (
    <motion.article
      layout
      className="grid gap-4 rounded-lg border border-emerald-200 bg-white p-4 shadow-sm md:grid-cols-[auto_minmax(0,1fr)_auto]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.04,
        duration: 0.3,
        ease: 'easeOut',
        layout: { duration: 0.35, ease: 'easeOut' },
      }}
    >
      <div className="flex items-start gap-3 md:block">
        <motion.div
          layoutId={`zone-rank-${zone.id}`}
          className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-lg font-semibold text-white"
        >
          {zone.rank}
        </motion.div>
        <div className="min-w-0 md:hidden">
          <h2 className="!m-0 !text-xl font-semibold leading-tight text-emerald-950">
            {zone.name}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{zone.description}</p>
        </div>
      </div>

      <div className="min-w-0">
        <div className="hidden md:block">
          <h2 className="!m-0 !text-xl font-semibold leading-tight text-emerald-950">
            {zone.name}
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {zone.description}
          </p>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="flex items-center gap-2 rounded-md bg-orange-50 px-3 py-2 text-sm text-emerald-800">
            <Flag className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{zone.activeMissions} misiuni</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-lime-50 px-3 py-2 text-sm text-lime-800">
            <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{zone.resolvedIssues} rezolvate</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-800">
            <MapPinned className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{zone.openIssues} deschise</span>
          </div>
        </div>

        <div className="mt-4">
          <ZoneScoreBars zone={zone} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 md:min-w-32 md:flex-col md:items-end md:justify-start">
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
  const zonesQuery = useQuery({
    queryKey: zoneLeaderboardQueryKey,
    queryFn: fetchZoneLeaderboard,
  })
  const zones = useMemo(() => {
    if (!isApiConfigured || zonesQuery.isError) {
      return demoZoneLeaderboard
    }

    return zonesQuery.data ?? []
  }, [zonesQuery.data, zonesQuery.isError])
  const topZone = zones[0]
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
    <main className="min-h-svh overflow-x-hidden bg-orange-50 px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-7xl gap-5">
        <div className="flex flex-col gap-4 rounded-lg border border-emerald-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <Trophy className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Zone CiviTm
              </p>
              <h1 className="!m-0 !text-2xl font-semibold leading-tight text-emerald-950">
                Leaderboard pe zone
              </h1>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" size="sm">
              <Link to="/">
                <ArrowLeft data-icon="inline-start" aria-hidden="true" />
                Harta live
              </Link>
            </Button>
            <Button
              asChild
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              size="sm"
            >
              <Link to="/report">
                <Leaf data-icon="inline-start" aria-hidden="true" />
                Raporteaza
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Zona lider
            </p>
            <p className="mt-2 truncate text-xl font-semibold text-emerald-950">
              {topZone?.name ?? 'Timisoara'}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              #{topZone?.rank ?? 1} impact urban
            </p>
          </section>

          <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Scor oras
            </p>
            <AnimatedNumber
              value={cityScore}
              className="mt-2 block text-3xl font-semibold text-emerald-950"
            />
            <p className="mt-1 text-sm text-slate-600">In zonele active.</p>
          </section>

          <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Misiuni active
            </p>
            <AnimatedNumber
              value={activeMissions}
              className="mt-2 block text-3xl font-semibold text-emerald-950"
            />
            <p className="mt-1 text-sm text-slate-600">Actiuni comunitare.</p>
          </section>

          <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Probleme rezolvate
            </p>
            <AnimatedNumber
              value={resolvedIssues}
              className="mt-2 block text-3xl font-semibold text-emerald-950"
            />
            <p className="mt-1 text-sm text-slate-600">Rezolvari vizibile.</p>
          </section>
        </div>

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
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <ZoneLeaderboard zones={zones} />

            <aside className="grid h-max gap-3">
              <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Activity className="size-5 text-emerald-700" aria-hidden="true" />
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
                  <MapPinned className="size-5 text-teal-700" aria-hidden="true" />
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
        )}
      </section>
    </main>
  )
}
