import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Flag,
  Gift,
  LoaderCircle,
  MapPin,
  Sparkles,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { DemoSkeletonGrid, DemoState } from '@/components/ui/demo-state'
import {
  fetchMissionById,
  isApiConfigured,
  joinMission,
  type MissionResponse,
} from '@/lib/api'
import {
  issueQueryKey,
  issuesQueryKey,
  missionQueryKey,
  missionsQueryKey,
} from '@/lib/queryClient'
import { useAuthStore } from '@/stores/authStore'

function formatDate(value: string | null) {
  if (!value) {
    return 'Suggested time'
  }

  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function MissionDetailsPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const session = useAuthStore((state) => state.session)
  const missionQuery = useQuery({
    queryKey: missionQueryKey(id ?? ''),
    queryFn: () => fetchMissionById(id ?? ''),
    enabled: Boolean(id && isApiConfigured),
  })
  const joinMutation = useMutation({
    mutationFn: () => joinMission(id ?? '', session?.access_token ?? ''),
    onSuccess: (mission) => {
      queryClient.setQueryData(missionQueryKey(mission.id), mission)
      void queryClient.invalidateQueries({ queryKey: missionsQueryKey })
      void queryClient.invalidateQueries({ queryKey: issuesQueryKey })
      mission.relatedIssueIds.forEach((issueId) => {
        void queryClient.invalidateQueries({ queryKey: issueQueryKey(issueId) })
      })
    },
  })

  if (!id || !isApiConfigured) {
    return (
      <DemoStatePage
        title="Mission details need the CiviTm API"
        description="The route is ready. Connect the API to inspect a generated mission."
      />
    )
  }

  if (missionQuery.isLoading) {
    return (
      <main className="min-h-svh bg-orange-50 px-4 py-5 sm:px-6 lg:px-8">
        <section className="mx-auto w-full max-w-6xl">
          <DemoSkeletonGrid items={4} className="lg:grid-cols-2" />
        </section>
      </main>
    )
  }

  if (missionQuery.isError || !missionQuery.data) {
    return (
      <DemoStatePage
        tone="amber"
        title="Mission not available"
        description="CiviTm could not load this mission. The mission list and live map are still available."
      />
    )
  }

  return (
    <MissionDetails
      mission={missionQuery.data}
      isAuthenticated={Boolean(session?.access_token)}
      isJoining={joinMutation.isPending}
      joinError={joinMutation.error}
      onJoin={() => joinMutation.mutate()}
    />
  )
}

function MissionDetails({
  mission,
  isAuthenticated,
  isJoining,
  joinError,
  onJoin,
}: {
  mission: MissionResponse
  isAuthenticated: boolean
  isJoining: boolean
  joinError: Error | null
  onJoin: () => void
}) {
  return (
    <main className="min-h-svh overflow-x-hidden bg-orange-50 px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <motion.section
        className="mx-auto grid w-full max-w-6xl gap-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <div className="flex flex-col gap-4 rounded-lg border border-emerald-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <Flag className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Mission details
              </p>
              <h1 className="text-2xl font-semibold leading-tight text-emerald-950">
                {mission.title}
              </h1>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" size="sm">
              <Link to="/missions">
                <ArrowLeft data-icon="inline-start" aria-hidden="true" />
                Missions
              </Link>
            </Button>
            {mission.createdFromIssueId && (
              <Button asChild variant="outline" size="sm">
                <Link to={`/issues/${mission.createdFromIssueId}`}>
                  <ExternalLink data-icon="inline-start" aria-hidden="true" />
                  Issue
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="space-y-4">
            <article className="rounded-lg border border-emerald-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <Badge label={mission.status.replaceAll('_', ' ')} tone="emerald" />
                <Badge label={`${mission.impactPoints} impact points`} tone="lime" />
                {mission.createdByAi && <Badge label="AI generated" tone="teal" />}
              </div>
              <p className="mt-5 text-base leading-7 text-slate-600">
                {mission.description}
              </p>
            </article>

            <section className="grid gap-3 sm:grid-cols-3">
              <MissionStat
                icon={Users}
                label="Participants"
                value={`${mission.participantsJoined}/${mission.participantsNeeded}`}
              />
              <MissionStat
                icon={CalendarDays}
                label="Starts"
                value={formatDate(mission.startsAt)}
              />
              <MissionStat
                icon={MapPin}
                label="Zone"
                value={mission.zoneName ?? 'Timisoara'}
              />
            </section>

            <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-emerald-950">
                Linked issues
              </h2>
              <div className="mt-3 grid gap-2">
                {mission.relatedIssueIds.length === 0 ? (
                  <p className="text-sm leading-6 text-slate-600">
                    This mission was generated without additional linked issues.
                  </p>
                ) : (
                  mission.relatedIssueIds.map((issueId) => (
                    <Link
                      key={issueId}
                      to={`/issues/${issueId}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3 text-sm font-medium text-emerald-900 outline-none transition-colors hover:bg-emerald-100 focus-visible:ring-3 focus-visible:ring-emerald-500/25"
                    >
                      <span>Issue #{issueId.slice(0, 8)}</span>
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </Link>
                  ))
                )}
              </div>
            </section>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-5 lg:self-start">
            <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
              <span className="flex size-10 items-center justify-center rounded-lg bg-lime-50 text-lime-700">
                <CheckCircle2 className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-emerald-950">
                Join mission
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Joining makes the mission feel alive in the demo and updates the
                participant count from the API.
              </p>
              {isAuthenticated ? (
                <Button
                  type="button"
                  className="mt-4 w-full bg-emerald-600 text-white hover:bg-emerald-700"
                  disabled={isJoining || mission.status !== 'active'}
                  onClick={onJoin}
                >
                  {isJoining ? (
                    <LoaderCircle data-icon="inline-start" className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Users data-icon="inline-start" aria-hidden="true" />
                  )}
                  Join mission
                </Button>
              ) : (
                <Button asChild className="mt-4 w-full bg-emerald-600 text-white hover:bg-emerald-700">
                  <Link to={`/login?returnTo=${encodeURIComponent(`/missions/${mission.id}`)}`}>
                    Login to join
                  </Link>
                </Button>
              )}
              {joinError && (
                <p className="mt-3 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {joinError.message}
                </p>
              )}
            </section>

            {mission.reward && (
              <section className="rounded-lg border border-yellow-200 bg-white p-4 shadow-sm">
                <span className="flex size-10 items-center justify-center rounded-lg bg-yellow-50 text-yellow-700">
                  <Gift className="size-5" aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-emerald-950">
                  {mission.reward.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {mission.reward.partnerName ?? 'CiviTm system reward'} ·{' '}
                  {mission.reward.requiredPoints} points required
                </p>
              </section>
            )}
          </aside>
        </div>
      </motion.section>
    </main>
  )
}

function DemoStatePage({
  title,
  description,
  tone = 'slate',
}: {
  title: string
  description: string
  tone?: 'slate' | 'amber'
}) {
  return (
    <main className="min-h-svh bg-orange-50 px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-3xl items-center">
        <DemoState
          icon={tone === 'amber' ? TriangleAlert : Sparkles}
          tone={tone}
          eyebrow="Mission details"
          title={title}
          description={description}
        />
      </section>
    </main>
  )
}

function Badge({
  label,
  tone,
}: {
  label: string
  tone: 'emerald' | 'lime' | 'teal'
}) {
  const classes = {
    emerald: 'bg-orange-50 text-emerald-700 ring-emerald-200',
    lime: 'bg-lime-50 text-lime-700 ring-lime-200',
    teal: 'bg-teal-50 text-teal-700 ring-teal-200',
  }

  return (
    <span className={`rounded-md px-2 py-1 text-xs font-semibold ring-1 ${classes[tone]}`}>
      {label}
    </span>
  )
}

function MissionStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <article className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
      <span className="flex size-9 items-center justify-center rounded-lg bg-orange-50 text-emerald-700">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-6 text-emerald-950">
        {value}
      </p>
    </article>
  )
}
