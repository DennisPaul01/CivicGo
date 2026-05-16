import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Brain,
  Building2,
  CheckCircle2,
  Flag,
  Gift,
  LayoutDashboard,
  MapPinned,
  SearchX,
  Sparkles,
  Target,
  TriangleAlert,
  Trophy,
  Users,
} from '@/components/icons/hugeicons'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { DemoSkeletonGrid, DemoState } from '@/components/ui/demo-state'
import { CivicMap } from '@/components/map/CivicMap'
import { type MapFilterKind, type MapMarkerKind } from '@/components/map/MapMarker'
import {
  filterCivicMapItemsForTimisoara,
  getCivicMapItems,
  type CivicMapItem,
} from '@/data/civicMapData'
import {
  fetchIssues,
  fetchMissions,
  fetchRewards,
  isApiConfigured,
  type IssueResponse,
  type MissionResponse,
  type RewardResponse,
} from '@/lib/api'
import {
  issuesQueryKey,
  missionsQueryKey,
  rewardsQueryKey,
} from '@/lib/queryClient'
import { roActor, roCategory } from '@/lib/locale'
import { cn } from '@/lib/utils'

type DashboardMetric = {
  id: string
  label: string
  value: number
  detail: string
  icon: typeof LayoutDashboard
  tone: 'emerald' | 'lime' | 'teal' | 'sky' | 'amber' | 'rose'
}

type DashboardChartItem = {
  label: string
  value: number
  tone: DashboardMetric['tone']
}

type FilterOption = {
  value: MapFilterKind
  label: string
  icon: typeof LayoutDashboard
}

type AiCitySummary = {
  headline: string
  summary: string
  focusLabel: string
  focusValue: string
  actionLabel: string
  actionValue: string
  confidenceLabel: string
  tone: DashboardMetric['tone']
}

const demoMetrics: DashboardMetric[] = [
  {
    id: 'total-issues',
    label: 'Total probleme',
    value: 28,
    detail: 'Pe harta live si in datele orasului.',
    icon: MapPinned,
    tone: 'emerald',
  },
  {
    id: 'new-issues',
    label: 'Probleme noi',
    value: 7,
    detail: 'Rapoarte noi care asteapta triere.',
    icon: Sparkles,
    tone: 'sky',
  },
  {
    id: 'in-progress',
    label: 'In lucru',
    value: 9,
    detail: 'Probleme active, revizuite sau legate de misiuni.',
    icon: Flag,
    tone: 'amber',
  },
  {
    id: 'resolved',
    label: 'Rezolvate',
    value: 6,
    detail: 'Rezolvari civice vizibile.',
    icon: CheckCircle2,
    tone: 'lime',
  },
  {
    id: 'active-missions',
    label: 'Misiuni active',
    value: 5,
    detail: 'Actiuni comunitare deschise acum.',
    icon: Trophy,
    tone: 'teal',
  },
  {
    id: 'rewards-claimed',
    label: 'Recompense revendicate',
    value: 11,
    detail: 'Revendicari de sistem si parteneri.',
    icon: Gift,
    tone: 'rose',
  },
]

const demoStatusChart: DashboardChartItem[] = [
  { label: 'Noi', value: 7, tone: 'sky' },
  { label: 'In lucru', value: 9, tone: 'amber' },
  { label: 'Rezolvate', value: 6, tone: 'lime' },
  { label: 'Probleme active', value: 4, tone: 'teal' },
  { label: 'Misiune activa', value: 2, tone: 'emerald' },
]

const demoCategoryChart: DashboardChartItem[] = [
  { label: 'Deseuri', value: 8, tone: 'emerald' },
  { label: 'Iluminat', value: 6, tone: 'amber' },
  { label: 'Drum deteriorat', value: 5, tone: 'rose' },
  { label: 'Spatiu verde', value: 5, tone: 'lime' },
  { label: 'Trotuar blocat', value: 4, tone: 'sky' },
]

const demoMunicipalQueue: IssueResponse[] = [
  {
    id: 'demo-city-hall-lighting',
    title: 'Bec stradal defect in Fabric',
    description: 'Agentul a trimis cazul catre echipa de iluminat public.',
    category: 'public_lighting',
    severity: 'high',
    status: 'ai_analyzed',
    responsibleActor: 'city_hall',
    imageUrl: '',
    imageUrls: [],
    afterImageUrl: null,
    latitude: 45.7603,
    longitude: 21.2422,
    zoneName: 'Fabric',
    aiSummary: 'Necesita inspectie pentru iluminat public.',
    aiConfidence: 0.91,
    isUrgent: true,
    rewardEligible: false,
    isValidIssue: true,
    invalidReason: null,
    aiAnalyzedAt: new Date().toISOString(),
    duplicateCount: 0,
    nearestDuplicate: null,
    agentRun: null,
    relatedMission: null,
    relatedReward: null,
    gamification: null,
    createdByUserId: 'demo-admin-local',
    createdAt: new Date().toISOString(),
  },
]

const adminMapFilters: FilterOption[] = [
  { value: 'all', label: 'Toate', icon: MapPinned },
  { value: 'new', label: 'Noi', icon: TriangleAlert },
  { value: 'in_progress', label: 'In lucru', icon: Flag },
  { value: 'resolved', label: 'Rezolvate', icon: CheckCircle2 },
  { value: 'mission', label: 'Misiuni', icon: Trophy },
  { value: 'reward', label: 'Rewards', icon: Gift },
]

const demoAiCitySummary: AiCitySummary = {
  headline: 'Citire agent oras: Complex si Fabric au nevoie de urmatorul impuls civic.',
  summary:
    'Datele fallback ale orasului evidentiaza deseurile, iluminatul si trotuarele blocate ca tipar principal. Misiunile active si recompensele revendicate pastreaza povestea de impact vizibila fara endpointuri live.',
  focusLabel: 'Zona prioritara',
  focusValue: 'Curatenie Complex + verificari iluminat Fabric',
  actionLabel: 'Actiune sugerata',
  actionValue:
    'Transforma cele mai noi rapoarte deschise intr-o misiune vizibila de weekend si pastreaza recompensele atasate pentru voluntari.',
  confidenceLabel: 'Rezumat fallback',
  tone: 'emerald',
}

const toneClasses: Record<DashboardMetric['tone'], string> = {
  emerald: 'bg-emerald-50 text-emerald-700',
  lime: 'bg-lime-50 text-lime-700',
  teal: 'bg-teal-50 text-teal-700',
  sky: 'bg-sky-50 text-sky-700',
  amber: 'bg-amber-50 text-amber-700',
  rose: 'bg-rose-50 text-rose-700',
}

const softToneClasses: Record<DashboardMetric['tone'], string> = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  lime: 'border-lime-200 bg-lime-50 text-lime-800',
  teal: 'border-teal-200 bg-teal-50 text-teal-800',
  sky: 'border-sky-200 bg-sky-50 text-sky-800',
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
  rose: 'border-rose-200 bg-rose-50 text-rose-800',
}

const chartBarClasses: Record<DashboardMetric['tone'], string> = {
  emerald: 'bg-emerald-500',
  lime: 'bg-lime-500',
  teal: 'bg-teal-500',
  sky: 'bg-sky-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
}

const markerToneClasses: Record<MapMarkerKind, string> = {
  new: 'bg-rose-500',
  in_progress: 'bg-amber-400',
  resolved: 'bg-emerald-600',
  mission: 'bg-slate-700',
  reward: 'bg-yellow-300',
}

function isResolvedIssue(issue: IssueResponse) {
  return issue.status === 'resolved' || issue.status === 'issue_resolved'
}

function isInProgressIssue(issue: IssueResponse) {
  return [
    'ai_analyzed',
    'duplicate_detected',
    'in_review',
    'in_progress',
    'mission_created',
  ].includes(issue.status)
}

function isMunicipalIssue(issue: IssueResponse) {
  return (
    issue.responsibleActor === 'city_hall' &&
    !isResolvedIssue(issue) &&
    issue.status !== 'new'
  )
}

function formatLabel(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function getTopValue(values: string[], fallback: string) {
  const grouped = values.reduce<Record<string, number>>((accumulator, value) => {
    accumulator[value] = (accumulator[value] ?? 0) + 1

    return accumulator
  }, {})
  const topEntry = Object.entries(grouped).sort(
    ([, firstValue], [, secondValue]) => secondValue - firstValue,
  )[0]

  return topEntry?.[0] ?? fallback
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

function createMapSummary(items: CivicMapItem[]) {
  const openItems = items.filter((item) =>
    ['new', 'in_progress'].includes(item.kind),
  )
  const urgentItems = items.filter((item) => item.kind === 'new')
  const missionItems = items.filter((item) => item.kind === 'mission')
  const resolvedItems = items.filter((item) => item.kind === 'resolved')

  return {
    open: openItems.length,
    urgent: urgentItems.length,
    missions: missionItems.length,
    resolved: resolvedItems.length,
  }
}

function getDashboardHealth(metrics: DashboardMetric[]) {
  const totalIssues = metrics.find((metric) => metric.id === 'total-issues')?.value ?? 0
  const resolved = metrics.find((metric) => metric.id === 'resolved')?.value ?? 0
  const activeMissions =
    metrics.find((metric) => metric.id === 'active-missions')?.value ?? 0
  const newIssues = metrics.find((metric) => metric.id === 'new-issues')?.value ?? 0
  const resolutionRate = totalIssues > 0 ? (resolved / totalIssues) * 100 : 0

  return [
    {
      label: 'Rata rezolvare',
      value: formatPercent(resolutionRate),
      detail: `${resolved}/${totalIssues} probleme inchise`,
      tone: 'lime' as const,
      icon: CheckCircle2,
    },
    {
      label: 'Misiuni active',
      value: String(activeMissions),
      detail: 'Actiuni comunitare in teren',
      tone: 'teal' as const,
      icon: Users,
    },
    {
      label: 'Backlog nou',
      value: String(newIssues),
      detail: 'Rapoarte care cer triere',
      tone: newIssues > 0 ? ('amber' as const) : ('emerald' as const),
      icon: Activity,
    },
  ]
}

function mergeChartItems(items: DashboardChartItem[]) {
  const mergedItems = new Map<string, DashboardChartItem>()

  items.forEach((item) => {
    const existingItem = mergedItems.get(item.label)

    if (!existingItem) {
      mergedItems.set(item.label, item)
      return
    }

    mergedItems.set(item.label, {
      ...existingItem,
      value: existingItem.value + item.value,
    })
  })

  return Array.from(mergedItems.values())
}

function createStatusChart(issues: IssueResponse[]): DashboardChartItem[] {
  const order = [
    'new',
    'in_progress',
    'in_review',
    'ai_analyzed',
    'mission_created',
    'resolved',
  ]
  const tones: Record<string, DashboardMetric['tone']> = {
    new: 'sky',
    in_progress: 'amber',
    in_review: 'amber',
    ai_analyzed: 'teal',
    mission_created: 'emerald',
    resolved: 'lime',
  }
  const labels: Record<string, string> = {
    new: 'Noi',
    in_progress: 'In lucru',
    in_review: 'Probleme active',
    ai_analyzed: 'Probleme active',
    mission_created: 'Task comunitar',
    resolved: 'Rezolvate',
  }
  const grouped = issues.reduce<Record<string, number>>((accumulator, issue) => {
    accumulator[issue.status] = (accumulator[issue.status] ?? 0) + 1

    return accumulator
  }, {})
  const knownItems = order
    .filter((status) => grouped[status])
    .map((status) => ({
      label: labels[status] ?? formatLabel(status),
      value: grouped[status],
      tone: tones[status],
    }))
  const otherItems = Object.entries(grouped)
    .filter(([status]) => !order.includes(status))
    .map(([status, value]) => ({
      label: formatLabel(status),
      value,
      tone: 'emerald' as const,
    }))

  return mergeChartItems([...knownItems, ...otherItems])
}

function createCategoryChart(issues: IssueResponse[]): DashboardChartItem[] {
  const tones: DashboardMetric['tone'][] = [
    'emerald',
    'amber',
    'teal',
    'lime',
    'sky',
    'rose',
  ]
  const grouped = issues.reduce<Record<string, number>>((accumulator, issue) => {
    const category = issue.category || 'other'

    accumulator[category] = (accumulator[category] ?? 0) + 1

    return accumulator
  }, {})

  return Object.entries(grouped)
    .sort(([, firstValue], [, secondValue]) => secondValue - firstValue)
    .slice(0, 6)
    .map(([category, value], index) => ({
      label: roCategory(category, formatLabel(category)),
      value,
      tone: tones[index % tones.length],
    }))
}

function createDashboardMetrics(
  issues: IssueResponse[],
  missions: MissionResponse[],
  rewards: RewardResponse[],
): DashboardMetric[] {
  return [
    {
      id: 'total-issues',
      label: 'Total issues',
      value: issues.length,
      detail: 'Across the live CiviTm map.',
      icon: MapPinned,
      tone: 'emerald',
    },
    {
      id: 'new-issues',
      label: 'New issues',
      value: issues.filter((issue) => issue.status === 'new').length,
      detail: 'Fresh reports waiting for triage.',
      icon: Sparkles,
      tone: 'sky',
    },
    {
      id: 'in-progress',
      label: 'In progress',
      value: issues.filter(isInProgressIssue).length,
      detail: 'Agent-routed, reviewed or mission-backed.',
      icon: Flag,
      tone: 'amber',
    },
    {
      id: 'municipal-queue',
      label: 'Catre primarie',
      value: issues.filter(isMunicipalIssue).length,
      detail: 'Probleme active rutate catre controlul primariei.',
      icon: Building2,
      tone: 'sky',
    },
    {
      id: 'resolved',
      label: 'Resolved',
      value: issues.filter(isResolvedIssue).length,
      detail: 'Issues marked fixed.',
      icon: CheckCircle2,
      tone: 'lime',
    },
    {
      id: 'active-missions',
      label: 'Active missions',
      value: missions.filter((mission) => mission.status === 'active').length,
      detail: 'Community actions currently open.',
      icon: Trophy,
      tone: 'teal',
    },
    {
      id: 'rewards-claimed',
      label: 'Rewards claimed',
      value: rewards.reduce((sum, reward) => sum + reward.claimedCount, 0),
      detail: 'System and partner claims.',
      icon: Gift,
      tone: 'rose',
    },
  ]
}

function createAiCitySummary(
  issues: IssueResponse[],
  missions: MissionResponse[],
  rewards: RewardResponse[],
): AiCitySummary {
  if (issues.length === 0) {
    return demoAiCitySummary
  }

  const resolvedIssues = issues.filter(isResolvedIssue)
  const openIssues = issues.filter((issue) => !isResolvedIssue(issue))
  const urgentIssues = issues.filter((issue) => issue.isUrgent)
  const activeMissions = missions.filter((mission) => mission.status === 'active')
  const rewardClaims = rewards.reduce(
    (sum, reward) => sum + reward.claimedCount,
    0,
  )
  const topCategory = formatLabel(
    getTopValue(
      issues.map((issue) => issue.category).filter(Boolean),
      'civic care',
    ),
  )
  const topZone = getTopValue(
    issues
      .map((issue) => issue.zoneName ?? '')
      .filter((zoneName) => zoneName.length > 0),
    'Timisoara',
  )

  if (urgentIssues.length > 0) {
    return {
      headline: `Citire agent: ${urgentIssues.length} raport urgent are nevoie de review.`,
      summary: `${topCategory} is the strongest live signal around ${topZone}. The dashboard shows ${openIssues.length} open issues, ${activeMissions.length} active missions and ${rewardClaims} reward claims.`,
      focusLabel: 'Focus now',
      focusValue: `${urgentIssues.length} urgent issue${urgentIssues.length === 1 ? '' : 's'} in the current queue`,
      actionLabel: 'Suggested action',
      actionValue:
        'Prioritize triage for urgent reports, then attach eligible issues to nearby missions.',
      confidenceLabel: 'Live data summary',
      tone: 'rose',
    }
  }

  if (resolvedIssues.length >= openIssues.length && resolvedIssues.length > 0) {
    return {
      headline: 'Citire agent: rezolvarile conduc povestea orasului.',
      summary: `${resolvedIssues.length} fixed issues outweigh ${openIssues.length} open issues. ${topZone} is the clearest place to show before-after impact.`,
      focusLabel: 'Impact signal',
      focusValue: `${resolvedIssues.length} resolved issue${resolvedIssues.length === 1 ? '' : 's'} ready to review`,
      actionLabel: 'Suggested action',
      actionValue:
        'Surface the strongest resolved issue on the map and pair it with the zone leaderboard.',
      confidenceLabel: 'Live data summary',
      tone: 'lime',
    }
  }

  return {
    headline: `Citire agent: ${topCategory} este tiparul principal in ${topZone}.`,
    summary: `${openIssues.length} open issues, ${activeMissions.length} active missions and ${rewardClaims} reward claims point to a practical next move for city coordination.`,
    focusLabel: 'Pattern detected',
    focusValue: `${topCategory} reports around ${topZone}`,
    actionLabel: 'Suggested action',
    actionValue:
      activeMissions.length > 0
        ? 'Boost the active missions already attached to reported issues.'
        : 'Create a mission from the most visible open issue and attach a reward.',
    confidenceLabel: 'Live data summary',
    tone: activeMissions.length > 0 ? 'teal' : 'emerald',
  }
}

function DashboardStats({ metrics }: { metrics: DashboardMetric[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric, index) => {
        const MetricIcon = metric.icon

        return (
          <motion.article
            key={metric.id}
            className="min-h-32 rounded-lg border border-emerald-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.22, ease: 'easeOut' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  {metric.label}
                </p>
                <p className="mt-2 text-3xl font-semibold text-emerald-950">
                  {metric.value}
                </p>
              </div>
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${toneClasses[metric.tone]}`}
              >
                <MetricIcon className="size-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {metric.detail}
            </p>
          </motion.article>
        )
      })}
    </div>
  )
}

function DashboardHero({ metrics }: { metrics: DashboardMetric[] }) {
  const healthItems = getDashboardHealth(metrics)

  return (
    <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
            <LayoutDashboard className="size-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              CiviTm admin
            </p>
            <h1 className="!m-0 !text-2xl font-semibold leading-tight text-emerald-950 sm:!text-3xl">
              Dashboard operational
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Metrici, grafice si harta cu issues pentru triere rapida,
              misiuni active si impact civic vizibil.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button asChild variant="outline" size="sm" className="min-h-11">
            <Link to="/">
              <ArrowLeft data-icon="inline-start" aria-hidden="true" />
              Live map
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="min-h-11">
            <Link to="/admin/issues">
              <Target data-icon="inline-start" aria-hidden="true" />
              Issues
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="min-h-11">
            <Link to="/admin/agents">
              <Brain data-icon="inline-start" aria-hidden="true" />
              Agents
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="min-h-11">
            <Link to="/zones">
              <Trophy data-icon="inline-start" aria-hidden="true" />
              Zones
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {healthItems.map((item) => {
          const ItemIcon = item.icon

          return (
            <div
              key={item.label}
              className={cn(
                'rounded-lg border p-3',
                softToneClasses[item.tone],
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide">
                  {item.label}
                </p>
                <ItemIcon className="size-4" aria-hidden="true" />
              </div>
              <p className="mt-2 text-2xl font-semibold text-emerald-950">
                {item.value}
              </p>
              <p className="mt-1 text-sm leading-5 text-slate-600">
                {item.detail}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function DashboardBarChart({
  title,
  items,
}: {
  title: string
  items: DashboardChartItem[]
}) {
  const maxValue = Math.max(1, ...items.map((item) => item.value))

  return (
    <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-emerald-700">
          <BarChart3 className="size-4" aria-hidden="true" />
        </span>
        <h2 className="!m-0 !text-lg font-semibold text-emerald-950">
          {title}
        </h2>
      </div>

      {items.length === 0 ? (
        <div className="mt-4 flex items-start gap-2 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
          <SearchX className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden="true" />
          <span>No issue data is available yet.</span>
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {items.map((item) => {
            const width = `${Math.max(6, Math.round((item.value / maxValue) * 100))}%`

            return (
              <div key={item.label} className="grid gap-1">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-medium text-slate-700">
                    {item.label}
                  </span>
                  <span className="shrink-0 font-semibold text-emerald-950">
                    {item.value}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    className={`h-full rounded-full ${chartBarClasses[item.tone]}`}
                    initial={{ width: 0 }}
                    animate={{ width }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function DashboardCharts({
  statusItems,
  categoryItems,
}: {
  statusItems: DashboardChartItem[]
  categoryItems: DashboardChartItem[]
}) {
  return (
    <section className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Grafice rapide
          </p>
          <h2 className="!m-0 !text-xl font-semibold text-emerald-950">
            Distributie issues
          </h2>
        </div>
        <p className="text-sm leading-6 text-slate-600">
          Statusuri si categorii din datele live sau fallback local.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <DashboardBarChart title="Issues by status" items={statusItems} />
        <DashboardBarChart title="Issues by category" items={categoryItems} />
      </div>
    </section>
  )
}

function AdminIssuesMap({
  items,
  activeFilter,
  selectedItemId,
  onFilterChange,
  onSelectedItemChange,
}: {
  items: CivicMapItem[]
  activeFilter: MapFilterKind
  selectedItemId: string | null
  onFilterChange: (filter: MapFilterKind) => void
  onSelectedItemChange: (itemId: string | null) => void
}) {
  const mapSummary = createMapSummary(items)
  const selectedItem = selectedItemId
    ? items.find((item) => item.id === selectedItemId)
    : null
  const featuredItems = items
    .filter((item) => ['new', 'in_progress', 'mission'].includes(item.kind))
    .slice(0, 4)

  return (
    <section className="grid gap-3 lg:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.85fr)]">
      <div className="overflow-hidden rounded-lg border border-emerald-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-emerald-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Harta operationala
            </p>
            <h2 className="!m-0 !text-lg font-semibold text-emerald-950">
              Issues pe harta Timisoarei
            </h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:justify-end lg:overflow-visible lg:pb-0">
            {adminMapFilters.map((filter) => {
              const FilterIcon = filter.icon
              const isActive = activeFilter === filter.value

              return (
                <button
                  key={filter.value}
                  type="button"
                  className={cn(
                    'flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-500/30',
                    isActive
                      ? 'border-emerald-500 bg-emerald-600 text-white shadow-sm'
                      : 'border-emerald-200 bg-white text-emerald-800 hover:border-emerald-300 hover:bg-emerald-50',
                  )}
                  aria-pressed={isActive}
                  onClick={() => onFilterChange(filter.value)}
                >
                  <FilterIcon className="size-4" aria-hidden="true" />
                  {filter.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="h-[32rem] min-h-[28rem] p-3 sm:h-[34rem]">
          <CivicMap
            items={items}
            activeFilter={activeFilter}
            selectedItemId={selectedItemId}
            onSelectedItemChange={onSelectedItemChange}
          />
        </div>
      </div>

      <aside className="grid gap-3">
        <div className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Semnale live
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { label: 'Deschise', value: mapSummary.open, kind: 'in_progress' as const },
              { label: 'Noi', value: mapSummary.urgent, kind: 'new' as const },
              { label: 'Misiuni', value: mapSummary.missions, kind: 'mission' as const },
              { label: 'Rezolvate', value: mapSummary.resolved, kind: 'resolved' as const },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                className="min-h-20 rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-500/30"
                onClick={() => onFilterChange(item.kind)}
              >
                <span
                  className={cn(
                    'mb-2 block size-2.5 rounded-full',
                    markerToneClasses[item.kind],
                  )}
                />
                <span className="block text-2xl font-semibold text-emerald-950">
                  {item.value}
                </span>
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Prioritati pe teren
          </p>
          <div className="mt-3 grid gap-2">
            {featuredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  'rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-500/30',
                  selectedItemId === item.id
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-slate-200 bg-slate-50/70 hover:border-emerald-200 hover:bg-emerald-50/70',
                )}
                onClick={() => onSelectedItemChange(item.id)}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={cn(
                      'mt-1 size-2.5 shrink-0 rounded-full',
                      markerToneClasses[item.kind],
                    )}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-emerald-950">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {item.statusLabel} · {item.zone}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Selectie curenta
          </p>
          {selectedItem ? (
            <div className="mt-3">
              <p className="text-base font-semibold leading-tight text-emerald-950">
                {selectedItem.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {selectedItem.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  {selectedItem.statusLabel}
                </span>
                <span className="rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                  {selectedItem.zone}
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Alege un marker sau o prioritate pentru detalii rapide.
            </p>
          )}
        </div>
      </aside>
    </section>
  )
}

function MunicipalQueue({ issues }: { issues: IssueResponse[] }) {
  return (
    <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
            <Building2 className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Dashboard primarie
            </p>
            <h2 className="!m-0 !text-lg font-semibold text-emerald-950">
              Probleme active rutate catre primarie
            </h2>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="min-h-11 w-full sm:w-auto">
          <Link to="/admin/issues">Deschide lista</Link>
        </Button>
      </div>

      {issues.length === 0 ? (
        <div className="mt-4 flex items-start gap-2 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
          <SearchX className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden="true" />
          <span>Nu exista inca probleme rutate catre primarie.</span>
        </div>
      ) : (
        <div className="mt-4 grid gap-2">
          {issues.slice(0, 5).map((issue) => (
            <article
              key={issue.id}
              className="grid gap-3 rounded-md border border-slate-200 bg-slate-50/70 p-3 sm:grid-cols-[1fr_auto]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
                    Problema activa
                  </span>
                  <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                    {roCategory(issue.category)}
                  </span>
                  <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    {roActor(issue.responsibleActor)}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-semibold text-emerald-950">
                  {issue.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {issue.aiSummary ?? issue.description ?? 'Caz pregatit pentru inspectie.'}
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="min-h-11 self-start">
                <Link to={`/issues/${issue.id}`}>Detalii</Link>
              </Button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function AiCitySummaryCard({ summary }: { summary: AiCitySummary }) {
  return (
    <motion.section
      className="rounded-lg border border-emerald-200 bg-white p-5 shadow-sm"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${toneClasses[summary.tone]}`}
          >
            <Brain className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Rezumat agent oras
            </p>
            <h2 className="!m-0 mt-1 !text-xl font-semibold leading-tight text-emerald-950">
              {summary.headline}
            </h2>
          </div>
        </div>
        <span className="w-fit rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          {summary.confidenceLabel}
        </span>
      </div>

      <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-600">
        {summary.summary}
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            {summary.focusLabel}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-emerald-950">
            {summary.focusValue}
          </p>
        </div>
        <div className="rounded-lg bg-lime-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-lime-700">
            {summary.actionLabel}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-emerald-950">
            {summary.actionValue}
          </p>
        </div>
      </div>
    </motion.section>
  )
}

export function AdminDashboardPage() {
  const [activeMapFilter, setActiveMapFilter] = useState<MapFilterKind>('all')
  const [selectedMapItemId, setSelectedMapItemId] = useState<string | null>(null)
  const issuesQuery = useQuery({
    queryKey: issuesQueryKey,
    queryFn: fetchIssues,
  })
  const missionsQuery = useQuery({
    queryKey: missionsQueryKey,
    queryFn: () => fetchMissions(),
  })
  const rewardsQuery = useQuery({
    queryKey: rewardsQueryKey,
    queryFn: fetchRewards,
  })
  const hasDataError =
    issuesQuery.isError || missionsQuery.isError || rewardsQuery.isError
  const isLoading =
    isApiConfigured &&
    (issuesQuery.isLoading || missionsQuery.isLoading || rewardsQuery.isLoading)
  const metrics = useMemo(() => {
    if (!isApiConfigured || hasDataError) {
      return demoMetrics
    }

    return createDashboardMetrics(
      issuesQuery.data ?? [],
      missionsQuery.data ?? [],
      rewardsQuery.data ?? [],
    )
  }, [
    hasDataError,
    issuesQuery.data,
    missionsQuery.data,
    rewardsQuery.data,
  ])
  const charts = useMemo(() => {
    if (!isApiConfigured || hasDataError) {
      return {
        statusItems: demoStatusChart,
        categoryItems: demoCategoryChart,
      }
    }

    const issues = issuesQuery.data ?? []

    return {
      statusItems: createStatusChart(issues),
      categoryItems: createCategoryChart(issues),
    }
  }, [hasDataError, issuesQuery.data])
  const aiSummary = useMemo(() => {
    if (!isApiConfigured || hasDataError) {
      return demoAiCitySummary
    }

    return createAiCitySummary(
      issuesQuery.data ?? [],
      missionsQuery.data ?? [],
      rewardsQuery.data ?? [],
    )
  }, [
    hasDataError,
    issuesQuery.data,
    missionsQuery.data,
    rewardsQuery.data,
  ])
  const municipalQueue = useMemo(() => {
    if (!isApiConfigured || hasDataError) {
      return demoMunicipalQueue
    }

    return (issuesQuery.data ?? []).filter(isMunicipalIssue)
  }, [hasDataError, issuesQuery.data])
  const mapItems = useMemo(
    () =>
      filterCivicMapItemsForTimisoara(
        getCivicMapItems(
          !isApiConfigured || hasDataError ? [] : (issuesQuery.data ?? []),
          !isApiConfigured || hasDataError ? [] : (missionsQuery.data ?? []),
        ),
        'all',
      ),
    [hasDataError, issuesQuery.data, missionsQuery.data],
  )
  const hasEmptyLiveDashboard =
    isApiConfigured &&
    !isLoading &&
    !hasDataError &&
    metrics.every((metric) => metric.value === 0)

  return (
    <main className="min-h-svh overflow-x-hidden bg-orange-50 px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <motion.section
        className="mx-auto grid w-full max-w-7xl gap-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <TopNavigation />
        <DashboardHero metrics={metrics} />

        {hasDataError && isApiConfigured && (
          <DemoState
            icon={TriangleAlert}
            tone="amber"
            eyebrow="Temporary fallback"
            title="Using seeded dashboard overview"
            description="One of the live overview calls failed, so the admin dashboard is using seeded metrics."
          />
        )}

        {hasEmptyLiveDashboard && (
          <DemoState
            icon={SearchX}
            tone="slate"
            eyebrow="No live data"
            title="No dashboard activity yet"
            description="Issues, missions and reward claims will populate these cards after seeded or live activity is available."
          />
        )}

        <DashboardCharts
          statusItems={charts.statusItems}
          categoryItems={charts.categoryItems}
        />

        {isLoading ? (
          <DemoSkeletonGrid items={6} className="sm:grid-cols-2 xl:grid-cols-3" />
        ) : (
          <DashboardStats metrics={metrics} />
        )}

        <AdminIssuesMap
          items={mapItems}
          activeFilter={activeMapFilter}
          selectedItemId={selectedMapItemId}
          onFilterChange={setActiveMapFilter}
          onSelectedItemChange={setSelectedMapItemId}
        />

        <MunicipalQueue issues={municipalQueue} />

        <AiCitySummaryCard summary={aiSummary} />
      </motion.section>
    </main>
  )
}
