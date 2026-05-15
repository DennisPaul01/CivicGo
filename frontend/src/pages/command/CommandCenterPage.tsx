import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import type { LucideIcon } from '@/components/icons/hugeicons'
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Flag,
  LayoutDashboard,
  MapPinned,
  RadioTower,
  ShieldCheck,
  TriangleAlert,
} from '@/components/icons/hugeicons'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { Button } from '@/components/ui/button'
import { DemoSkeletonGrid, DemoState } from '@/components/ui/demo-state'
import {
  fetchIssues,
  fetchMissions,
  fetchPublicActivity,
  fetchZoneLeaderboard,
  isApiConfigured,
} from '@/lib/api'
import {
  issuesQueryKey,
  missionsQueryKey,
  publicActivityQueryKey,
  zoneLeaderboardQueryKey,
} from '@/lib/queryClient'

function isResolved(status: string) {
  return status === 'resolved' || status === 'issue_resolved'
}

export function CommandCenterPage() {
  const issuesQuery = useQuery({ queryKey: issuesQueryKey, queryFn: fetchIssues })
  const missionsQuery = useQuery({ queryKey: missionsQueryKey, queryFn: () => fetchMissions() })
  const zonesQuery = useQuery({
    queryKey: zoneLeaderboardQueryKey,
    queryFn: fetchZoneLeaderboard,
  })
  const activityQuery = useQuery({
    queryKey: publicActivityQueryKey(48, 12),
    queryFn: () => fetchPublicActivity(48, 12),
  })
  const issues = issuesQuery.data ?? []
  const missions = missionsQuery.data ?? []
  const zones = zonesQuery.data ?? []
  const activity = activityQuery.data ?? []
  const unresolvedIssues = issues.filter((issue) => !isResolved(issue.status))
  const urgentIssues = issues.filter((issue) => issue.isUrgent)
  const activeMissions = missions.filter((mission) => mission.status === 'active')
  const topZone = zones[0]
  const hasLoading =
    isApiConfigured &&
    (issuesQuery.isLoading ||
      missionsQuery.isLoading ||
      zonesQuery.isLoading ||
      activityQuery.isLoading)
  const hasError =
    isApiConfigured &&
    (issuesQuery.isError ||
      missionsQuery.isError ||
      zonesQuery.isError ||
      activityQuery.isError)

  return (
    <main className="min-h-svh overflow-x-hidden bg-orange-50 px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <motion.section
        className="mx-auto grid w-full max-w-7xl gap-5 pb-24 sm:pb-0"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <TopNavigation />

        <div className="flex flex-col gap-4 rounded-lg border border-emerald-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <RadioTower className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Command center
              </p>
              <h1 className="!m-0 !text-2xl font-semibold leading-tight text-emerald-950">
                Operatiuni live CiviTm
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
            <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700" size="sm">
              <Link to="/admin/issues">
                <ShieldCheck data-icon="inline-start" aria-hidden="true" />
                Admin issues
              </Link>
            </Button>
          </div>
        </div>

        {hasError && (
          <DemoState
            icon={TriangleAlert}
            tone="amber"
            eyebrow="Date partiale"
            title="Unele surse live nu au raspuns"
            description="Command center-ul ramane utilizabil cu datele care au fost incarcate."
          />
        )}

        <div className="grid gap-3 md:grid-cols-4">
          <Metric icon={MapPinned} label="Probleme active" value={unresolvedIssues.length} detail={`${issues.length} total`} />
          <Metric icon={TriangleAlert} label="Urgente" value={urgentIssues.length} detail="Necesita atentie rapida" />
          <Metric icon={Flag} label="Misiuni active" value={activeMissions.length} detail={`${missions.length} total`} />
          <Metric icon={BarChart3} label="Zona lider" value={topZone?.score ?? 0} detail={topZone?.name ?? 'N/A'} />
        </div>

        {hasLoading ? (
          <DemoSkeletonGrid items={6} className="md:grid-cols-3" />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <section className="grid gap-3">
              <h2 className="text-lg font-semibold text-emerald-950">
                Coada operationala
              </h2>
              {unresolvedIssues.slice(0, 8).map((issue) => (
                <Link
                  key={issue.id}
                  to={`/issues/${issue.id}`}
                  className="grid gap-3 rounded-lg border border-emerald-200 bg-white p-3 shadow-sm transition hover:border-emerald-300 hover:shadow-md sm:grid-cols-[7rem_minmax(0,1fr)_auto]"
                >
                  <img
                    src={issue.imageUrl}
                    alt=""
                    className="h-24 w-full rounded-md object-cover"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">
                        {issue.status.replaceAll('_', ' ')}
                      </span>
                      <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-700">
                        {issue.severity}
                      </span>
                    </div>
                    <h3 className="mt-2 truncate text-base font-semibold text-emerald-950">
                      {issue.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {issue.zoneName ?? 'Timisoara'} · {issue.responsibleActor.replaceAll('_', ' ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800 sm:justify-end">
                    {issue.relatedMission ? 'Misiune' : 'Triage'}
                  </div>
                </Link>
              ))}
            </section>

            <aside className="grid h-max gap-3">
              <Panel title="Zone prioritare" icon={LayoutDashboard}>
                {zones.slice(0, 5).map((zone) => (
                  <Link
                    key={zone.id}
                    to={`/zones/${zone.id}`}
                    className="flex items-center justify-between rounded-md bg-orange-50 px-3 py-2 text-sm"
                  >
                    <span className="font-semibold text-emerald-950">{zone.name}</span>
                    <span className="text-emerald-700">{zone.score}</span>
                  </Link>
                ))}
              </Panel>

              <Panel title="Activitate publica" icon={Activity}>
                {activity.length === 0 ? (
                  <p className="text-sm text-slate-600">Nu exista evenimente recente.</p>
                ) : (
                  activity.map((item) => (
                    <div key={item.id} className="rounded-md bg-lime-50 px-3 py-2 text-sm">
                      <p className="font-semibold text-emerald-950">{item.title}</p>
                      <p className="mt-1 line-clamp-2 text-slate-600">{item.message}</p>
                    </div>
                  ))
                )}
              </Panel>

              <Panel title="Actiuni rapide" icon={CheckCircle2}>
                <Button asChild variant="outline" className="justify-start">
                  <Link to="/report">Raport nou</Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link to="/missions">Misiuni</Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link to="/zones">Leaderboard zone</Link>
                </Button>
              </Panel>
            </aside>
          </div>
        )}
      </motion.section>
    </main>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon
  label: string
  value: number
  detail: string
}) {
  return (
    <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
      <Icon className="size-5 text-emerald-700" aria-hidden="true" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-emerald-700">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-emerald-950">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{detail}</p>
    </section>
  )
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: LucideIcon
  children: ReactNode
}) {
  return (
    <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="size-5 text-emerald-700" aria-hidden="true" />
        <h2 className="!m-0 !text-lg font-semibold text-emerald-950">{title}</h2>
      </div>
      <div className="grid gap-2">{children}</div>
    </section>
  )
}
