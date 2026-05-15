import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  CalendarDays,
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock3,
  CopyCheck,
  ExternalLink,
  Gift,
  ImageOff,
  Loader2,
  Mail,
  MapPinned,
  Navigation,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wrench,
} from '@/components/icons/hugeicons'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { DemoSkeletonGrid, DemoState } from '@/components/ui/demo-state'
import {
  fetchIssues,
  fetchMissions,
  fetchPublicActivity,
  fetchRewards,
  fetchZoneLeaderboard,
  isApiConfigured,
  closeAdminIssue,
  createAdminIssueEmailDraft,
  reopenAdminIssue,
  resolveIssue,
  updateAdminIssue,
  type AdminIssueEmailDraftResponse,
  type IssueResponse,
  type MissionResponse,
  type PublicActivityResponse,
  type RewardResponse,
  type ZoneLeaderboardItemResponse,
} from '@/lib/api'
import { roActor, roCategory, roReward, roStatus } from '@/lib/locale'
import {
  issuesQueryKey,
  issueQueryKey,
  missionsQueryKey,
  publicActivityQueryKey,
  queryClient,
  rewardsQueryKey,
  zoneLeaderboardQueryKey,
} from '@/lib/queryClient'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

type AdminView = 'all' | 'open' | 'resolved' | 'duplicates' | 'communities' | 'events' | 'rewards'

type SummaryItem = {
  id: AdminView
  label: string
  value: number
  detail: string
  icon: typeof ClipboardList
}

type HeroMetric = {
  label: string
  value: string
  detail: string
  tone: 'emerald' | 'amber' | 'rose' | 'sky'
  icon: typeof ClipboardList
}

const viewLabels: Record<AdminView, string> = {
  all: 'Toate',
  open: 'Nerezolvate',
  resolved: 'Rezolvate',
  duplicates: 'Duplicate',
  communities: 'Comunitati',
  events: 'Evenimente',
  rewards: 'Rewards',
}

const categoryOptions = [
  'other',
  'public_lighting',
  'environment_playgrounds_green_spaces',
  'sanitation_pest_snow',
  'streets_sidewalks',
  'road_traffic_signs',
  'public_transport',
  'public_order',
  'urbanism',
  'construction_sites',
  'waste',
  'road_damage',
  'blocked_sidewalk',
  'graffiti',
  'green_space_issue',
]

const severityOptions = ['low', 'medium', 'high', 'critical', 'urgent']

const statusOptions = [
  'new',
  'ai_analyzed',
  'duplicate_detected',
  'in_review',
  'in_progress',
  'mission_created',
  'resolved',
  'rejected',
]

const actorOptions = [
  'unknown',
  'community',
  'city_hall',
  'community_and_city_hall',
  'private_company',
  'emergency',
  'citizen',
]

const inputClassName =
  'h-10 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/15'

const textareaClassName =
  'min-h-24 resize-y rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-normal text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/15'

function isResolvedIssue(issue: IssueResponse) {
  return issue.status === 'resolved' || issue.status === 'issue_resolved'
}

function isOpenIssue(issue: IssueResponse) {
  return !isResolvedIssue(issue) && issue.status !== 'rejected'
}

function isCommunityIssue(issue: IssueResponse) {
  return issue.responsibleActor.includes('community')
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Fara data'
  }

  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getIssueHref(issue: IssueResponse) {
  return `/issues/${issue.id}`
}

function getActivityHref(item: PublicActivityResponse) {
  if (item.relatedMissionId) {
    return `/missions/${item.relatedMissionId}`
  }

  if (item.relatedIssueId) {
    return `/issues/${item.relatedIssueId}`
  }

  return item.relatedRewardId ? '/rewards' : null
}

function getResolutionRate(total: number, resolved: number) {
  if (total === 0) {
    return '0%'
  }

  return `${Math.round((resolved / total) * 100)}%`
}

function getBadgeClass(tone: HeroMetric['tone']) {
  const tones: Record<HeroMetric['tone'], string> = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    rose: 'border-rose-200 bg-rose-50 text-rose-800',
    sky: 'border-sky-200 bg-sky-50 text-sky-800',
  }

  return tones[tone]
}

function getStatusBadgeClass(status: string) {
  if (status === 'resolved' || status === 'issue_resolved') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  }

  if (status === 'in_progress' || status === 'mission_created') {
    return 'border-amber-200 bg-amber-50 text-amber-800'
  }

  if (status === 'duplicate_detected') {
    return 'border-purple-200 bg-purple-50 text-purple-800'
  }

  if (status === 'rejected') {
    return 'border-slate-200 bg-slate-50 text-slate-600'
  }

  return 'border-sky-200 bg-sky-50 text-sky-800'
}

function getSeverityBadgeClass(severity: string, isUrgent: boolean) {
  if (isUrgent || severity === 'urgent' || severity === 'critical') {
    return 'border-rose-200 bg-rose-50 text-rose-800'
  }

  if (severity === 'high') {
    return 'border-amber-200 bg-amber-50 text-amber-800'
  }

  return 'border-emerald-200 bg-emerald-50 text-emerald-800'
}

export function AdminIssuesPage() {
  const [activeView, setActiveView] = useState<AdminView>('all')
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
  const zonesQuery = useQuery({
    queryKey: zoneLeaderboardQueryKey,
    queryFn: fetchZoneLeaderboard,
  })
  const activityQuery = useQuery({
    queryKey: publicActivityQueryKey(168, 80),
    queryFn: () => fetchPublicActivity(168, 80),
  })

  const hasDataError =
    issuesQuery.isError ||
    missionsQuery.isError ||
    rewardsQuery.isError ||
    zonesQuery.isError ||
    activityQuery.isError
  const isLoading =
    isApiConfigured &&
    (issuesQuery.isLoading ||
      missionsQuery.isLoading ||
      rewardsQuery.isLoading ||
      zonesQuery.isLoading ||
      activityQuery.isLoading)
  const issues = issuesQuery.data ?? []
  const missions = missionsQuery.data ?? []
  const rewards = rewardsQuery.data ?? []
  const zones = zonesQuery.data ?? []
  const activityItems = useMemo(
    () => activityQuery.data ?? [],
    [activityQuery.data],
  )
  const openIssues = issues.filter(isOpenIssue)
  const resolvedIssues = issues.filter(isResolvedIssue)
  const duplicateIssues = issues.filter(
    (issue) => issue.duplicateCount > 0 || issue.status === 'duplicate_detected',
  )
  const communityIssues = issues.filter(isCommunityIssue)
  const urgentIssues = issues.filter(
    (issue) =>
      issue.isUrgent ||
      issue.severity === 'urgent' ||
      issue.severity === 'critical',
  )
  const cityHallIssues = issues.filter(
    (issue) => issue.responsibleActor === 'city_hall' && isOpenIssue(issue),
  )
  const communityEvents = useMemo(
    () =>
      activityItems.filter((item) =>
        ['mission_created', 'reward_matched', 'issue_resolved'].includes(item.type),
      ),
    [activityItems],
  )

  const summaries: SummaryItem[] = [
    {
      id: 'all',
      label: 'Toate problemele',
      value: issues.length,
      detail: 'Rapoarte vizibile in sistem.',
      icon: ClipboardList,
    },
    {
      id: 'open',
      label: 'Nerezolvate',
      value: openIssues.length,
      detail: 'Noi, analizate, in lucru sau misiuni active.',
      icon: Wrench,
    },
    {
      id: 'resolved',
      label: 'Rezolvate',
      value: resolvedIssues.length,
      detail: 'Cazuri inchise sau marcate cu before/after.',
      icon: CheckCircle2,
    },
    {
      id: 'duplicates',
      label: 'Duplicate',
      value: duplicateIssues.length,
      detail: 'Rapoarte grupate pentru merge sau confirmare.',
      icon: CopyCheck,
    },
    {
      id: 'communities',
      label: 'Comunitati',
      value: zones.length || communityIssues.length,
      detail: 'Zone si cazuri unde comunitatea poate interveni.',
      icon: Users,
    },
    {
      id: 'events',
      label: 'Evenimente',
      value: missions.length + communityEvents.length,
      detail: 'Misiuni si activitate comunitara recenta.',
      icon: CalendarDays,
    },
    {
      id: 'rewards',
      label: 'Rewards',
      value: rewards.length,
      detail: 'Recompense de sistem si parteneri.',
      icon: Gift,
    },
  ]
  const heroMetrics: HeroMetric[] = [
    {
      label: 'Coada activa',
      value: String(openIssues.length),
      detail: 'necesita decizie',
      tone: 'emerald',
      icon: Clock3,
    },
    {
      label: 'Prioritare',
      value: String(urgentIssues.length),
      detail: 'urgent sau critic',
      tone: urgentIssues.length > 0 ? 'rose' : 'emerald',
      icon: AlertTriangle,
    },
    {
      label: 'Primarie',
      value: String(cityHallIssues.length),
      detail: 'pot fi inchise cu dovada',
      tone: 'sky',
      icon: ShieldCheck,
    },
    {
      label: 'Rata rezolvare',
      value: getResolutionRate(issues.length, resolvedIssues.length),
      detail: 'din total rapoarte',
      tone: 'amber',
      icon: Target,
    },
  ]

  return (
    <main className="min-h-svh overflow-x-hidden bg-[linear-gradient(180deg,#eef9f6_0%,#fff7df_42%,#ffffff_100%)] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <motion.section
        className="mx-auto grid w-full max-w-7xl gap-5 pb-12"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <div className="rounded-lg border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
              <ClipboardList className="size-5" aria-hidden="true" />
            </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  CiviTm admin
                </p>
                <h1 className="text-2xl font-semibold leading-tight text-emerald-950 sm:text-3xl">
                  Control probleme, comunitati si rewards
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Workbench operational pentru triere rapida, status, responsabil,
                  duplicate, email catre autoritati si dovezi before/after.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3 lg:w-auto">
              <Button asChild variant="outline" size="sm" className="h-10 bg-white">
                <Link to="/admin/dashboard">
                  <ShieldCheck data-icon="inline-start" aria-hidden="true" />
                  Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-10 bg-white">
                <Link to="/admin/agents">
                  <Bot data-icon="inline-start" aria-hidden="true" />
                  Agents
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-10 bg-white">
                <Link to="/">
                  <ArrowLeft data-icon="inline-start" aria-hidden="true" />
                  Live map
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {heroMetrics.map((metric) => {
              const Icon = metric.icon

              return (
                <div
                  key={metric.label}
                  className={cn(
                    'rounded-lg border p-3 shadow-[0_1px_0_rgba(255,255,255,0.75)_inset]',
                    getBadgeClass(metric.tone),
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {metric.label}
                    </span>
                    <Icon className="size-4" aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
                  <p className="mt-1 text-xs font-medium opacity-80">{metric.detail}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
          {summaries.map((summary) => {
            const Icon = summary.icon

            return (
              <button
                key={summary.id}
                type="button"
                onClick={() => setActiveView(summary.id)}
                className={cn(
                  'group min-h-36 rounded-lg border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-500/25',
                  activeView === summary.id
                    ? 'border-emerald-400 ring-2 ring-emerald-100'
                    : 'border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50/40',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    {summary.label}
                  </p>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-100">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-2 text-3xl font-semibold text-emerald-950">
                  {summary.value}
                </p>
                <p className="mt-2 text-sm leading-5 text-slate-600">
                  {summary.detail}
                </p>
              </button>
            )
          })}
        </div>

        <div className="flex gap-2 overflow-x-auto rounded-lg border border-emerald-200 bg-white p-2 shadow-sm">
          {(Object.keys(viewLabels) as AdminView[]).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setActiveView(view)}
              className={cn(
                'min-h-10 shrink-0 rounded-md px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-500/25',
                activeView === view
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800',
              )}
            >
              {viewLabels[view]}
            </button>
          ))}
        </div>

        {isLoading ? (
          <DemoSkeletonGrid items={6} className="md:grid-cols-2 xl:grid-cols-3" />
        ) : hasDataError && isApiConfigured ? (
          <DemoState
            icon={ClipboardList}
            tone="amber"
            eyebrow="Temporary fallback"
            title="Lista admin este temporar indisponibila"
            description="Ruta ramane pregatita; datele live revin cand API-ul raspunde."
          />
        ) : (
          <>
            {(activeView === 'all' || activeView === 'open') && (
              <IssueList
                title={activeView === 'open' ? 'Probleme nerezolvate' : 'Toate problemele'}
                description={
                  activeView === 'open'
                    ? 'Coada operationala pentru triere, lucru si misiuni.'
                    : 'Lista completa a rapoartelor recente din sistem.'
                }
                issues={activeView === 'open' ? openIssues : issues}
                emptyLabel="Nu exista probleme in acest view."
                icon={activeView === 'open' ? Wrench : MapPinned}
              />
            )}

            {activeView === 'resolved' && (
              <IssueList
                title="Probleme rezolvate"
                description="Cazuri inchise, utile pentru demo-ul de impact si before/after."
                issues={resolvedIssues}
                emptyLabel="Nu exista inca probleme rezolvate."
                icon={CheckCircle2}
              />
            )}

            {activeView === 'duplicates' && (
              <DuplicateClustersPanel issues={duplicateIssues} />
            )}

            {activeView === 'communities' && (
              <CommunitiesView
                zones={zones}
                communityIssues={communityIssues}
                missions={missions}
              />
            )}

            {activeView === 'events' && (
              <CommunityEventsView missions={missions} activityItems={communityEvents} />
            )}

            {activeView === 'rewards' && <RewardsAdminView rewards={rewards} />}
          </>
        )}
      </motion.section>
    </main>
  )
}

function IssueList({
  title,
  description,
  issues,
  emptyLabel,
  icon: Icon,
}: {
  title: string
  description: string
  issues: IssueResponse[]
  emptyLabel: string
  icon: typeof ClipboardList
}) {
  return (
    <section className="grid gap-3">
      <SectionHeader icon={Icon} title={title} description={description} count={issues.length} />

      {issues.length === 0 ? (
        <EmptyPanel label={emptyLabel} />
      ) : (
        issues.map((issue) => <IssueRow key={issue.id} issue={issue} />)
      )}
    </section>
  )
}

function DuplicateClustersPanel({ issues }: { issues: IssueResponse[] }) {
  return (
    <section className="grid gap-3">
      <SectionHeader
        icon={CopyCheck}
        title="Duplicate clusters"
        description="Rapoarte marcate ca duplicate sau cu semnale multiple in aceeasi zona."
        count={issues.length}
      />

      {issues.length === 0 ? (
        <EmptyPanel label="Nu exista duplicate detectate in acest moment." />
      ) : (
        <div className="grid gap-3">
          {issues.map((issue) => (
            <article
              key={issue.id}
              className="grid gap-3 rounded-lg border border-amber-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_auto]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                    {issue.duplicateCount} semnale
                  </span>
                  <span className="rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                    {roStatus(issue.status)}
                  </span>
                  <span className="rounded-md bg-lime-50 px-2 py-1 text-xs font-semibold text-lime-700 ring-1 ring-lime-200">
                    {issue.zoneName ?? 'Timisoara'}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-semibold text-emerald-950">
                  {issue.title}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {issue.nearestDuplicate
                    ? `Cel mai apropiat raport: ${issue.nearestDuplicate.title}, la ${issue.nearestDuplicate.distanceMeters}m.`
                    : issue.aiSummary ?? issue.description ?? 'Cluster fara detalii suplimentare.'}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                <Button asChild variant="outline" size="sm">
                  <Link to={getIssueHref(issue)}>
                    <ExternalLink data-icon="inline-start" aria-hidden="true" />
                    Detalii
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function IssueRow({ issue }: { issue: IssueResponse }) {
  const accessToken = useAuthStore((state) => state.session?.access_token)
  const [adminForm, setAdminForm] = useState({
    title: issue.title,
    description: issue.description ?? '',
    category: issue.category,
    severity: issue.severity,
    status: issue.status,
    responsibleActor: issue.responsibleActor,
    zoneName: issue.zoneName ?? '',
    latitude: String(issue.latitude),
    longitude: String(issue.longitude),
  })
  const [resolutionNote, setResolutionNote] = useState('')
  const [afterImage, setAfterImage] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [emailDraft, setEmailDraft] =
    useState<AdminIssueEmailDraftResponse | null>(null)
  const isResolved = isResolvedIssue(issue)
  const canResolve = !isResolved && issue.responsibleActor === 'city_hall'
  const invalidateAdminIssueData = (updatedIssue: IssueResponse) => {
    queryClient.setQueryData(issueQueryKey(updatedIssue.id), updatedIssue)
    queryClient.invalidateQueries({ queryKey: issuesQueryKey })
    queryClient.invalidateQueries({ queryKey: publicActivityQueryKey(168, 80) })
    queryClient.invalidateQueries({ queryKey: zoneLeaderboardQueryKey })
  }
  const updateMutation = useMutation({
    mutationFn: () => {
      if (!accessToken) {
        throw new Error('Admin session is not available.')
      }

      return updateAdminIssue({
        issueId: issue.id,
        accessToken,
        title: adminForm.title,
        description: adminForm.description,
        category: adminForm.category,
        severity: adminForm.severity,
        status: adminForm.status,
        responsibleActor: adminForm.responsibleActor,
        zoneName: adminForm.zoneName,
        latitude: Number(adminForm.latitude),
        longitude: Number(adminForm.longitude),
      })
    },
    onSuccess: invalidateAdminIssueData,
  })
  const closeMutation = useMutation({
    mutationFn: () => {
      if (!accessToken) {
        throw new Error('Admin session is not available.')
      }

      return closeAdminIssue(issue.id, accessToken)
    },
    onSuccess: (updatedIssue) => {
      setAdminForm((current) => ({ ...current, status: updatedIssue.status }))
      invalidateAdminIssueData(updatedIssue)
    },
  })
  const reopenMutation = useMutation({
    mutationFn: () => {
      if (!accessToken) {
        throw new Error('Admin session is not available.')
      }

      return reopenAdminIssue(issue.id, accessToken)
    },
    onSuccess: (updatedIssue) => {
      setAdminForm((current) => ({ ...current, status: updatedIssue.status }))
      invalidateAdminIssueData(updatedIssue)
    },
  })
  const emailDraftMutation = useMutation({
    mutationFn: () => {
      if (!accessToken) {
        throw new Error('Admin session is not available.')
      }

      return createAdminIssueEmailDraft(issue.id, accessToken)
    },
    onSuccess: (draft) => {
      setEmailDraft(draft)
      queryClient.invalidateQueries({ queryKey: issueQueryKey(issue.id) })
      queryClient.invalidateQueries({ queryKey: publicActivityQueryKey(168, 80) })
    },
  })
  const resolveMutation = useMutation({
    mutationFn: () => {
      if (!accessToken) {
        throw new Error('Admin session is not available.')
      }

      if (!afterImage) {
        throw new Error('Adauga poza dupa interventie.')
      }

      return resolveIssue({
        issueId: issue.id,
        afterImage,
        resolutionNote,
        accessToken,
      })
    },
    onSuccess: (updatedIssue) => {
      setResolutionNote('')
      setAfterImage(null)
      setImagePreviewUrl(null)
      setAdminForm((current) => ({ ...current, status: updatedIssue.status }))
      invalidateAdminIssueData(updatedIssue)
    },
  })

  function handleAdminFieldChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target
    setAdminForm((current) => ({ ...current, [name]: value }))
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setAfterImage(file)
    setImagePreviewUrl(file ? URL.createObjectURL(file) : null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    resolveMutation.mutate()
  }

  function handleAdminSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateMutation.mutate()
  }

  return (
    <article className="overflow-hidden rounded-lg border border-emerald-200 bg-white shadow-sm transition hover:border-emerald-300 hover:shadow-md">
      <div className="grid gap-4 p-4 lg:grid-cols-[8.5rem_minmax(0,1fr)_10rem]">
        <div className="relative min-h-36 overflow-hidden rounded-lg border border-emerald-100 bg-emerald-50 lg:min-h-0">
          {issue.imageUrl ? (
            <img
              src={issue.imageUrl}
              alt=""
              className="h-full min-h-36 w-full object-cover lg:absolute lg:inset-0"
            />
          ) : (
            <div className="flex h-full min-h-36 items-center justify-center text-emerald-700">
              <ImageOff className="size-7" aria-hidden="true" />
            </div>
          )}
          {issue.isUrgent && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md border border-rose-200 bg-white/95 px-2 py-1 text-xs font-semibold text-rose-700 shadow-sm">
              <AlertTriangle className="size-3.5" aria-hidden="true" />
              Urgent
            </span>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-md border px-2 py-1 text-xs font-semibold',
                getStatusBadgeClass(issue.status),
              )}
            >
              {roStatus(issue.status)}
            </span>
            <span
              className={cn(
                'rounded-md border px-2 py-1 text-xs font-semibold',
                getSeverityBadgeClass(issue.severity, issue.isUrgent),
              )}
            >
              {issue.severity}
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
              {roCategory(issue.category)}
            </span>
            <span className="rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">
              {roActor(issue.responsibleActor)}
            </span>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold leading-tight text-emerald-950">
                {issue.title}
              </h2>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Raportat {formatDate(issue.createdAt)}
              </p>
            </div>
            {issue.zoneName && (
              <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800">
                <Navigation className="size-3.5" aria-hidden="true" />
                {issue.zoneName}
              </span>
            )}
          </div>

          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
            {issue.aiSummary ?? issue.description ?? 'Fara sumar disponibil inca.'}
          </p>

          <div className="mt-4 grid gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
            <span className="rounded-md bg-slate-50 px-3 py-2">
              AI confidence: {issue.aiConfidence === null ? 'n/a' : `${Math.round(issue.aiConfidence * 100)}%`}
            </span>
            <span className="rounded-md bg-purple-50 px-3 py-2 text-purple-700">
              Duplicate: {issue.duplicateCount}
            </span>
            <span className="rounded-md bg-emerald-50 px-3 py-2 text-emerald-700">
              {issue.relatedMission ? 'Misiune generata' : 'Fara misiune'}
            </span>
            <span className="rounded-md bg-yellow-50 px-3 py-2 text-yellow-800">
              {issue.rewardEligible ? 'Reward eligibil' : 'Fara reward'}
            </span>
          </div>

        {isResolved && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Problema este bifata ca rezolvata pe harta.
          </div>
        )}

          <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50/70 p-3 open:bg-slate-50">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-emerald-950 marker:hidden">
              <span className="inline-flex items-center gap-2">
                <Sparkles className="size-4 text-emerald-700" aria-hidden="true" />
                Admin edit
              </span>
              <span className="text-xs font-medium text-slate-500">
                Status, responsabil, categorie, locatie
              </span>
            </summary>

            <form className="mt-3 grid gap-3" onSubmit={handleAdminSubmit}>
              <div className="flex flex-col gap-2 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                  Modifica datele fara sa refaci flow-ul de raportare.
                </p>
                <Button
                  type="submit"
                  size="sm"
                  className="h-9 bg-emerald-600 text-white hover:bg-emerald-700"
                  disabled={
                    updateMutation.isPending ||
                    !adminForm.title.trim() ||
                    Number.isNaN(Number(adminForm.latitude)) ||
                    Number.isNaN(Number(adminForm.longitude))
                  }
                >
                  {updateMutation.isPending ? (
                    <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Save data-icon="inline-start" aria-hidden="true" />
                  )}
                  Salveaza
                </Button>
              </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-semibold text-emerald-950">
              Titlu
              <input
                name="title"
                value={adminForm.title}
                onChange={handleAdminFieldChange}
                className={inputClassName}
              />
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-emerald-950">
              Zona
              <input
                name="zoneName"
                value={adminForm.zoneName}
                onChange={handleAdminFieldChange}
                className={inputClassName}
              />
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-emerald-950">
              Status
              <select
                name="status"
                value={adminForm.status}
                onChange={handleAdminFieldChange}
                className={inputClassName}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {roStatus(status)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-emerald-950">
              Responsabil
              <select
                name="responsibleActor"
                value={adminForm.responsibleActor}
                onChange={handleAdminFieldChange}
                className={inputClassName}
              >
                {actorOptions.map((actor) => (
                  <option key={actor} value={actor}>
                    {roActor(actor)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-emerald-950">
              Categorie
              <select
                name="category"
                value={adminForm.category}
                onChange={handleAdminFieldChange}
                className={inputClassName}
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {roCategory(category)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-emerald-950">
              Severitate
              <select
                name="severity"
                value={adminForm.severity}
                onChange={handleAdminFieldChange}
                className={inputClassName}
              >
                {severityOptions.map((severity) => (
                  <option key={severity} value={severity}>
                    {severity}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-emerald-950">
              Latitudine
              <input
                name="latitude"
                value={adminForm.latitude}
                onChange={handleAdminFieldChange}
                inputMode="decimal"
                className={inputClassName}
              />
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-emerald-950">
              Longitudine
              <input
                name="longitude"
                value={adminForm.longitude}
                onChange={handleAdminFieldChange}
                inputMode="decimal"
                className={inputClassName}
              />
            </label>
          </div>

          <label className="grid gap-1.5 text-sm font-semibold text-emerald-950">
            Descriere
            <textarea
              name="description"
              value={adminForm.description}
              onChange={handleAdminFieldChange}
              rows={3}
              className={textareaClassName}
            />
          </label>

          {updateMutation.isError && (
            <p className="text-sm font-medium text-rose-700">
              {updateMutation.error instanceof Error
                ? updateMutation.error.message
                : 'Nu am putut salva modificarile admin.'}
            </p>
          )}
            </form>
          </details>

        {emailDraft && <EmailDraftPanel draft={emailDraft} />}

        {canResolve && (
          <form
            className="mt-4 grid gap-3 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3"
            onSubmit={handleSubmit}
          >
            <label className="grid gap-1.5 text-sm font-semibold text-emerald-950">
              Mesaj interventie
              <textarea
                value={resolutionNote}
                onChange={(event) => setResolutionNote(event.target.value)}
                required
                rows={3}
                placeholder="Am rezolvat problema si am incarcat poza dupa interventie."
                className={textareaClassName}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-emerald-950">
              Poza dupa rezolvare
              <span className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-emerald-300 bg-white px-3 py-4 text-center text-slate-600 transition hover:border-emerald-500 hover:bg-emerald-50">
                {imagePreviewUrl ? (
                  <img
                    src={imagePreviewUrl}
                    alt=""
                    className="h-32 w-full rounded-md object-cover"
                  />
                ) : (
                  <>
                    <Camera className="size-5 text-emerald-700" aria-hidden="true" />
                    <span className="text-sm font-medium">Incarca poza dupa interventie</span>
                  </>
                )}
              </span>
              <input
                type="file"
                accept="image/*"
                required
                className="sr-only"
                onChange={handleImageChange}
              />
            </label>

            {resolveMutation.isError && (
              <p className="text-sm font-medium text-rose-700">
                {resolveMutation.error instanceof Error
                  ? resolveMutation.error.message
                  : 'Nu am putut marca problema drept rezolvata.'}
              </p>
            )}

            <Button
              type="submit"
              size="sm"
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-fit"
              disabled={
                resolveMutation.isPending || !afterImage || !resolutionNote.trim()
              }
            >
              {resolveMutation.isPending ? (
                <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 data-icon="inline-start" aria-hidden="true" />
              )}
              Marcheaza rezolvat
            </Button>
          </form>
        )}
      </div>

      <div className="grid content-start gap-2 self-start sm:grid-cols-3 lg:min-w-40 lg:grid-cols-1">
        <Button asChild variant="outline" size="sm" className="h-9 bg-white">
          <Link to={getIssueHref(issue)}>
            <ExternalLink data-icon="inline-start" aria-hidden="true" />
            Detalii
          </Link>
        </Button>
        {isResolved ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 bg-white"
            onClick={() => reopenMutation.mutate()}
            disabled={reopenMutation.isPending}
          >
            {reopenMutation.isPending ? (
              <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden="true" />
            ) : (
              <RotateCcw data-icon="inline-start" aria-hidden="true" />
            )}
            Redeschide
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            className="h-9 bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => closeMutation.mutate()}
            disabled={closeMutation.isPending}
          >
            {closeMutation.isPending ? (
              <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 data-icon="inline-start" aria-hidden="true" />
            )}
            Inchide
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 bg-white"
          onClick={() => emailDraftMutation.mutate()}
          disabled={emailDraftMutation.isPending}
        >
          {emailDraftMutation.isPending ? (
            <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden="true" />
          ) : (
            <Mail data-icon="inline-start" aria-hidden="true" />
          )}
          Email autoritate
        </Button>
        {emailDraftMutation.isError && (
          <p className="text-xs font-medium text-rose-700">
            Nu am putut genera emailul.
          </p>
        )}
        {(closeMutation.isError || reopenMutation.isError) && (
          <p className="text-xs font-medium text-rose-700">
            Nu am putut schimba statusul.
          </p>
        )}
      </div>
      </div>
    </article>
  )
}

function EmailDraftPanel({ draft }: { draft: AdminIssueEmailDraftResponse }) {
  const mailtoHref = `mailto:${draft.recipientEmail}?subject=${encodeURIComponent(
    draft.subject,
  )}&body=${encodeURIComponent(draft.body)}`

  async function handleCopyDraft() {
    await navigator.clipboard.writeText(
      `Catre: ${draft.recipientName} <${draft.recipientEmail}>\nSubiect: ${draft.subject}\n\n${draft.body}`,
    )
  }

  return (
    <section className="mt-4 rounded-lg border border-sky-200 bg-sky-50/70 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
            {draft.agentName}
          </p>
          <h3 className="mt-1 text-base font-semibold text-emerald-950">
            Draft email pentru {draft.recipientName}
          </h3>
          <p className="mt-1 text-sm text-slate-600">{draft.recipientEmail}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline" size="sm">
            <a href={mailtoHref}>
              <Mail data-icon="inline-start" aria-hidden="true" />
              Deschide email
            </a>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleCopyDraft}>
            Copiaza
          </Button>
        </div>
      </div>

      <div className="mt-3 grid gap-3">
        <div className="rounded-md bg-white p-3 ring-1 ring-sky-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Subiect
          </p>
          <p className="mt-1 text-sm font-semibold text-emerald-950">
            {draft.subject}
          </p>
        </div>

        <div className="rounded-md bg-white p-3 ring-1 ring-sky-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Motiv gravitate
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            {draft.severityRationale}
          </p>
        </div>

        <div className="rounded-md bg-white p-3 ring-1 ring-sky-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Corp email
          </p>
          <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
            {draft.body}
          </pre>
        </div>

        <a
          href={draft.imageUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-sky-700 ring-1 ring-sky-100 transition hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky-500/25"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          Deschide poza atasata ca link
        </a>
      </div>
    </section>
  )
}

function CommunitiesView({
  zones,
  communityIssues,
  missions,
}: {
  zones: ZoneLeaderboardItemResponse[]
  communityIssues: IssueResponse[]
  missions: MissionResponse[]
}) {
  return (
    <section className="grid gap-3">
      <SectionHeader
        icon={Users}
        title="Comunitati si zone"
        description="Zonele active, scorurile lor si problemele care pot deveni actiuni comunitare."
        count={zones.length || communityIssues.length}
      />

      <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
        <div className="grid gap-3">
          {zones.length === 0 ? (
            <EmptyPanel label="Nu exista date de leaderboard pentru comunitati." />
          ) : (
            zones.map((zone) => (
              <article
                key={zone.id}
                className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Comunitate #{zone.rank}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-emerald-950">
                      {zone.name}
                    </h3>
                  </div>
                  <span className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                    {zone.score} pct
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold text-slate-600">
                  <span className="rounded-md bg-slate-50 p-2">
                    {zone.openIssues} deschise
                  </span>
                  <span className="rounded-md bg-lime-50 p-2 text-lime-700">
                    {zone.resolvedIssues} rezolvate
                  </span>
                  <span className="rounded-md bg-emerald-50 p-2 text-emerald-700">
                    {zone.activeMissions} misiuni
                  </span>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="grid gap-3">
          <SectionHeader
            icon={ClipboardList}
            title="Probleme de comunitate"
            description={`${missions.filter((mission) => mission.status === 'active').length} misiuni active pot sustine aceste zone.`}
            count={communityIssues.length}
            compact
          />
          {communityIssues.length === 0 ? (
            <EmptyPanel label="Nu exista probleme rutate catre comunitate." />
          ) : (
            communityIssues.map((issue) => <IssueRow key={issue.id} issue={issue} />)
          )}
        </div>
      </div>
    </section>
  )
}

function CommunityEventsView({
  missions,
  activityItems,
}: {
  missions: MissionResponse[]
  activityItems: PublicActivityResponse[]
}) {
  return (
    <section className="grid gap-3">
      <SectionHeader
        icon={CalendarDays}
        title="Evenimente de comunitate"
        description="Misiuni generate si activitate publica recenta care poate fi folosita in demo."
        count={missions.length + activityItems.length}
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="grid content-start gap-3">
          <h2 className="text-lg font-semibold text-emerald-950">Misiuni</h2>
          {missions.length === 0 ? (
            <EmptyPanel label="Nu exista misiuni comunitare." />
          ) : (
            missions.map((mission) => (
              <article
                key={mission.id}
                className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    {roStatus(mission.status)}
                  </span>
                  {mission.zoneName && (
                    <span className="rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                      {mission.zoneName}
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-base font-semibold text-emerald-950">
                  {mission.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {mission.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                  <span className="rounded-md bg-orange-50 px-2 py-1">
                    {mission.participantsJoined}/{mission.participantsNeeded} participanti
                  </span>
                  <span className="rounded-md bg-lime-50 px-2 py-1 text-lime-700">
                    {mission.impactPoints} impact points
                  </span>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="grid content-start gap-3">
          <h2 className="text-lg font-semibold text-emerald-950">
            Activitate comunitara
          </h2>
          {activityItems.length === 0 ? (
            <EmptyPanel label="Nu exista activitate comunitara recenta." />
          ) : (
            activityItems.map((item) => {
              const href = getActivityHref(item)

              return (
                <article
                  key={item.id}
                  className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    {formatDate(item.createdAt)}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-emerald-950">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {item.message}
                  </p>
                  {href && (
                    <Button asChild variant="outline" size="sm" className="mt-3">
                      <Link to={href}>Deschide</Link>
                    </Button>
                  )}
                </article>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}

function RewardsAdminView({ rewards }: { rewards: RewardResponse[] }) {
  const claimedTotal = rewards.reduce((sum, reward) => sum + reward.claimedCount, 0)

  return (
    <section className="grid gap-3">
      <SectionHeader
        icon={Gift}
        title="Rewards"
        description={`${claimedTotal} revendicari in total, intre recompense de sistem si parteneri.`}
        count={rewards.length}
      />

      {rewards.length === 0 ? (
        <EmptyPanel label="Nu exista rewards configurate." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rewards.map((reward) => {
            const remaining =
              reward.quantity > 0
                ? Math.max(0, reward.quantity - reward.claimedCount)
                : null

            return (
              <article
                key={reward.id}
                className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      {reward.type === 'partner'
                        ? reward.partner?.name ?? 'Partner'
                        : 'System reward'}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-emerald-950">
                      {roReward(reward.title)}
                    </h3>
                  </div>
                  <span className="shrink-0 rounded-md bg-orange-50 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    {roStatus(reward.status)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {reward.description}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-semibold">
                  <span className="rounded-md bg-slate-50 p-2 text-slate-600">
                    {reward.requiredPoints} puncte
                  </span>
                  <span className="rounded-md bg-lime-50 p-2 text-lime-700">
                    {reward.claimedCount} revendicate
                  </span>
                  <span className="rounded-md bg-emerald-50 p-2 text-emerald-700">
                    {remaining === null ? 'Nelimitat' : `${remaining} ramase`}
                  </span>
                  <span className="rounded-md bg-sky-50 p-2 text-sky-700">
                    {reward.zoneName ?? 'Toate zonele'}
                  </span>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function SectionHeader({
  icon: Icon,
  title,
  description,
  count,
  compact = false,
}: {
  icon: typeof ClipboardList
  title: string
  description: string
  count: number
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-emerald-200 bg-white shadow-sm sm:flex-row sm:items-start sm:justify-between',
        compact ? 'p-3' : 'p-4',
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-emerald-700">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-emerald-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
      <span className="w-fit rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
        {count} iteme
      </span>
    </div>
  )
}

function EmptyPanel({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-white p-4 text-sm font-medium text-slate-600 shadow-sm">
      {label}
    </div>
  )
}
