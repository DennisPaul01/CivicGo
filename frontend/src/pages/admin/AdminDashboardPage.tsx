import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  BarChart3,
  Brain,
  CheckCircle2,
  Flag,
  Gift,
  LayoutDashboard,
  MapPinned,
  SearchX,
  Sparkles,
  TriangleAlert,
  Trophy,
} from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { DemoSkeletonGrid, DemoState } from '@/components/ui/demo-state'
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
    label: 'Total issues',
    value: 28,
    detail: 'Across live map and demo data.',
    icon: MapPinned,
    tone: 'emerald',
  },
  {
    id: 'new-issues',
    label: 'New issues',
    value: 7,
    detail: 'Fresh reports waiting for triage.',
    icon: Sparkles,
    tone: 'sky',
  },
  {
    id: 'in-progress',
    label: 'In progress',
    value: 9,
    detail: 'AI checked, reviewed or mission-backed.',
    icon: Flag,
    tone: 'amber',
  },
  {
    id: 'resolved',
    label: 'Resolved',
    value: 6,
    detail: 'Visible civic fixes.',
    icon: CheckCircle2,
    tone: 'lime',
  },
  {
    id: 'active-missions',
    label: 'Active missions',
    value: 5,
    detail: 'Community actions currently open.',
    icon: Trophy,
    tone: 'teal',
  },
  {
    id: 'rewards-claimed',
    label: 'Rewards claimed',
    value: 11,
    detail: 'System and partner claims.',
    icon: Gift,
    tone: 'rose',
  },
]

const demoStatusChart: DashboardChartItem[] = [
  { label: 'New', value: 7, tone: 'sky' },
  { label: 'In progress', value: 9, tone: 'amber' },
  { label: 'Resolved', value: 6, tone: 'lime' },
  { label: 'AI checked', value: 4, tone: 'teal' },
  { label: 'Mission active', value: 2, tone: 'emerald' },
]

const demoCategoryChart: DashboardChartItem[] = [
  { label: 'Waste', value: 8, tone: 'emerald' },
  { label: 'Lighting', value: 6, tone: 'amber' },
  { label: 'Road damage', value: 5, tone: 'rose' },
  { label: 'Green space', value: 5, tone: 'lime' },
  { label: 'Blocked sidewalk', value: 4, tone: 'sky' },
]

const demoAiCitySummary: AiCitySummary = {
  headline: 'AI city read: Complex and Fabric need the next civic push.',
  summary:
    'Mock fallback highlights waste, lighting and blocked sidewalk reports as the clearest demo pattern. Active missions and reward claims keep the impact story visible even without live dashboard endpoints.',
  focusLabel: 'Priority area',
  focusValue: 'Complex + Fabric cleanup and lighting checks',
  actionLabel: 'Suggested action',
  actionValue:
    'Turn the newest open reports into one visible weekend mission and keep rewards attached for volunteers.',
  confidenceLabel: 'Mock fallback summary',
  tone: 'emerald',
}

const toneClasses: Record<DashboardMetric['tone'], string> = {
  emerald: 'bg-orange-50 text-emerald-700',
  lime: 'bg-lime-50 text-lime-700',
  teal: 'bg-teal-50 text-teal-700',
  sky: 'bg-sky-50 text-sky-700',
  amber: 'bg-amber-50 text-amber-700',
  rose: 'bg-rose-50 text-rose-700',
}

const chartBarClasses: Record<DashboardMetric['tone'], string> = {
  emerald: 'bg-emerald-500',
  lime: 'bg-lime-500',
  teal: 'bg-teal-500',
  sky: 'bg-sky-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
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
  const grouped = issues.reduce<Record<string, number>>((accumulator, issue) => {
    accumulator[issue.status] = (accumulator[issue.status] ?? 0) + 1

    return accumulator
  }, {})
  const knownItems = order
    .filter((status) => grouped[status])
    .map((status) => ({
      label: status === 'mission_created' ? 'Mission active' : formatLabel(status),
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

  return [...knownItems, ...otherItems]
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
      label: formatLabel(category),
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
      detail: 'AI checked, reviewed or mission-backed.',
      icon: Flag,
      tone: 'amber',
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
      headline: `AI city read: ${urgentIssues.length} urgent report${urgentIssues.length === 1 ? '' : 's'} need review.`,
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
      headline: 'AI city read: resolved work is leading the city story.',
      summary: `${resolvedIssues.length} fixed issues outweigh ${openIssues.length} open issues. ${topZone} is the clearest place to show before-after impact and keep the Friday demo concrete.`,
      focusLabel: 'Impact signal',
      focusValue: `${resolvedIssues.length} resolved issue${resolvedIssues.length === 1 ? '' : 's'} ready for demo`,
      actionLabel: 'Suggested action',
      actionValue:
        'Surface the strongest resolved issue on the map and pair it with the zone leaderboard.',
      confidenceLabel: 'Live data summary',
      tone: 'lime',
    }
  }

  return {
    headline: `AI city read: ${topCategory} is the strongest pattern in ${topZone}.`,
    summary: `${openIssues.length} open issues, ${activeMissions.length} active missions and ${rewardClaims} reward claims point to a practical next move for city coordination.`,
    focusLabel: 'Pattern detected',
    focusValue: `${topCategory} reports around ${topZone}`,
    actionLabel: 'Suggested action',
    actionValue:
      activeMissions.length > 0
        ? 'Boost the active missions already attached to reported issues.'
        : 'Create a mission from the most visible open issue and attach a demo reward.',
    confidenceLabel: 'Live data summary',
    tone: activeMissions.length > 0 ? 'teal' : 'emerald',
  }
}

function DashboardStats({ metrics }: { metrics: DashboardMetric[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric, index) => {
        const MetricIcon = metric.icon

        return (
          <motion.article
            key={metric.id}
            className="min-h-36 rounded-lg border border-emerald-200 bg-white p-4 shadow-sm"
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
    <div className="grid gap-3 lg:grid-cols-2">
      <DashboardBarChart title="Issues by status" items={statusItems} />
      <DashboardBarChart title="Issues by category" items={categoryItems} />
    </div>
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
              AI city summary
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
  const issuesQuery = useQuery({
    queryKey: issuesQueryKey,
    queryFn: fetchIssues,
  })
  const missionsQuery = useQuery({
    queryKey: missionsQueryKey,
    queryFn: fetchMissions,
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
        <div className="flex flex-col gap-4 rounded-lg border border-emerald-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <LayoutDashboard className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                CiviTm admin
              </p>
              <h1 className="!m-0 !text-2xl font-semibold leading-tight text-emerald-950">
                Dashboard overview
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
            <Button asChild variant="outline" size="sm">
              <Link to="/zones">
                <Trophy data-icon="inline-start" aria-hidden="true" />
                Zones
              </Link>
            </Button>
          </div>
        </div>

        {hasDataError && isApiConfigured && (
          <DemoState
            icon={TriangleAlert}
            tone="amber"
            eyebrow="Demo fallback"
            title="Using seeded dashboard overview"
            description="One of the live overview calls failed, so the admin dashboard keeps the demo readable with seeded metrics."
          />
        )}

        {hasEmptyLiveDashboard && (
          <DemoState
            icon={SearchX}
            tone="slate"
            eyebrow="No live data"
            title="No dashboard activity yet"
            description="Issues, missions and reward claims will populate these cards after the demo seed or live flow runs."
          />
        )}

        {isLoading ? (
          <DemoSkeletonGrid items={6} className="sm:grid-cols-2 xl:grid-cols-3" />
        ) : (
          <DashboardStats metrics={metrics} />
        )}

        <DashboardCharts
          statusItems={charts.statusItems}
          categoryItems={charts.categoryItems}
        />

        <AiCitySummaryCard summary={aiSummary} />
      </motion.section>
    </main>
  )
}
