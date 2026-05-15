import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import {
  ArrowLeft,
  CheckCircle2,
  Flag,
  ImageOff,
  MapPinned,
  SearchX,
  Trophy,
  TriangleAlert,
} from '@/components/icons/hugeicons'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { Button } from '@/components/ui/button'
import { DemoSkeletonGrid, DemoState } from '@/components/ui/demo-state'
import { fetchZoneById, isApiConfigured, type ZoneDetailResponse } from '@/lib/api'
import { roActor, roCategory, roSeverity, roStatus } from '@/lib/locale'
import { zoneQueryKey } from '@/lib/queryClient'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ro-RO', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function ZoneDetailsPage() {
  const { id } = useParams()
  const zoneQuery = useQuery({
    queryKey: zoneQueryKey(id ?? ''),
    queryFn: () => fetchZoneById(id ?? ''),
    enabled: Boolean(id) && isApiConfigured,
  })

  if (zoneQuery.isLoading && isApiConfigured) {
    return (
      <main className="min-h-svh bg-orange-50 px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
        <section className="mx-auto grid w-full max-w-6xl gap-5">
          <TopNavigation />
          <DemoState
            icon={MapPinned}
            eyebrow="Se incarca zona"
            title="Sincronizam detaliile zonei"
            description="Problemele, misiunile si scorul local vin din API."
          />
          <DemoSkeletonGrid items={3} className="md:grid-cols-3" />
        </section>
      </main>
    )
  }

  if (!zoneQuery.data) {
    return (
      <main className="min-h-svh bg-orange-50 px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
        <section className="mx-auto grid w-full max-w-4xl gap-5">
          <TopNavigation />
          <DemoState
            icon={SearchX}
            tone="amber"
            eyebrow="Zona indisponibila"
            title="Nu am gasit detaliile zonei"
            description="Deschide leaderboard-ul pe zone si alege o zona disponibila."
          />
          <Button asChild className="w-fit bg-emerald-600 text-white hover:bg-emerald-700">
            <Link to="/zones">Inapoi la zone</Link>
          </Button>
        </section>
      </main>
    )
  }

  return <ZoneDetails data={zoneQuery.data} />
}

function ZoneDetails({ data }: { data: ZoneDetailResponse }) {
  const { zone, issues, missions } = data
  const activeIssues = issues.filter(
    (issue) => issue.status !== 'resolved' && issue.status !== 'issue_resolved',
  )

  return (
    <main className="min-h-svh overflow-x-hidden bg-orange-50 px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <motion.section
        className="mx-auto grid w-full max-w-6xl gap-5 pb-24 sm:pb-0"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <TopNavigation />

        <div className="flex flex-col gap-4 rounded-lg border border-emerald-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <Trophy className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Zona #{zone.rank}
              </p>
              <h1 className="!m-0 !text-2xl font-semibold leading-tight text-emerald-950">
                {zone.name}
              </h1>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" size="sm">
              <Link to="/zones">
                <ArrowLeft data-icon="inline-start" aria-hidden="true" />
                Leaderboard
              </Link>
            </Button>
            <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700" size="sm">
              <Link to={`/?zone=${zone.id}`}>
                <MapPinned data-icon="inline-start" aria-hidden="true" />
                Harta live
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <Metric label="Scor" value={zone.score} detail={`Delta ${zone.scoreDelta >= 0 ? '+' : ''}${zone.scoreDelta}`} />
          <Metric label="Probleme active" value={activeIssues.length} detail={`${zone.openIssues} deschise in scor`} />
          <Metric label="Rezolvate" value={zone.resolvedIssues} detail="Impact vizibil" />
          <Metric label="Misiuni" value={missions.length} detail={`${zone.activeMissions} active`} />
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="grid gap-3">
            <h2 className="text-lg font-semibold text-emerald-950">Probleme din zona</h2>
            {issues.length === 0 ? (
              <DemoState
                icon={CheckCircle2}
                tone="emerald"
                title="Nu exista probleme in zona"
                description="Zona nu are rapoarte active in acest moment."
              />
            ) : (
              issues.map((issue) => (
                <Link
                  key={issue.id}
                  to={`/issues/${issue.id}`}
                  className="grid gap-3 rounded-lg border border-emerald-200 bg-white p-3 shadow-sm transition hover:border-emerald-300 hover:shadow-md sm:grid-cols-[8rem_minmax(0,1fr)]"
                >
                  {issue.imageUrl ? (
                    <img
                      src={issue.imageUrl}
                      alt=""
                      className="h-28 w-full rounded-md object-cover sm:h-full"
                    />
                  ) : (
                    <div className="flex h-28 items-center justify-center rounded-md bg-orange-50 text-emerald-700">
                      <ImageOff className="size-5" aria-hidden="true" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">
                        {roStatus(issue.status)}
                      </span>
                      <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-700">
                        {roSeverity(issue.severity)}
                      </span>
                    </div>
                    <h3 className="mt-2 truncate text-base font-semibold text-emerald-950">
                      {issue.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {roCategory(issue.category)} · {roActor(issue.responsibleActor)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {formatDate(issue.createdAt)}
                      {issue.duplicateCount > 0 && ` · ${issue.duplicateCount} duplicate`}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </section>

          <aside className="grid h-max gap-3">
            <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <TriangleAlert className="size-5 text-amber-700" aria-hidden="true" />
                <h2 className="!m-0 !text-lg font-semibold text-emerald-950">
                  Scoruri
                </h2>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-600">
                <ScoreRow label="Curatenie" value={zone.cleanlinessScore} />
                <ScoreRow label="Comunitate" value={zone.communityScore} />
                <ScoreRow label="Siguranta" value={zone.safetyScore} />
                <ScoreRow label="Implicare" value={zone.engagementScore} />
              </div>
            </section>

            <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Flag className="size-5 text-emerald-700" aria-hidden="true" />
                <h2 className="!m-0 !text-lg font-semibold text-emerald-950">
                  Misiuni
                </h2>
              </div>
              <div className="mt-4 grid gap-2">
                {missions.length === 0 ? (
                  <p className="text-sm text-slate-600">Nu exista misiuni in zona.</p>
                ) : (
                  missions.map((mission) => (
                    <Link
                      key={mission.id}
                      to={`/missions/${mission.id}`}
                      className="rounded-md bg-lime-50 px-3 py-2 text-sm font-semibold text-lime-900"
                    >
                      {mission.title}
                    </Link>
                  ))
                )}
              </div>
            </section>
          </aside>
        </div>
      </motion.section>
    </main>
  )
}

function Metric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-emerald-950">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{detail}</p>
    </section>
  )
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-orange-50 px-3 py-2">
      <span>{label}</span>
      <span className="font-semibold text-emerald-800">{value}</span>
    </div>
  )
}
