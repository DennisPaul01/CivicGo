import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { LucideIcon } from '@/components/icons/hugeicons'
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
  X,
} from '@/components/icons/hugeicons'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { DemoSkeletonGrid, DemoState } from '@/components/ui/demo-state'
import {
  fetchMissionById,
  isApiConfigured,
  joinMission,
  leaveMission,
  type MissionResponse,
} from '@/lib/api'
import {
  issueQueryKey,
  issuesQueryKey,
  missionQueryKey,
  missionsQueryKey,
} from '@/lib/queryClient'
import { roMissionText, roReward, roStatus } from '@/lib/locale'
import { useAuthStore } from '@/stores/authStore'

function formatDate(value: string | null) {
  if (!value) {
    return 'Ora propusa'
  }

  return new Intl.DateTimeFormat('ro-RO', {
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
  const accessToken = session?.access_token
  const missionOwnerKey = session?.user.id ?? 'public'
  const missionQuery = useQuery({
    queryKey: [...missionQueryKey(id ?? ''), missionOwnerKey],
    queryFn: () => fetchMissionById(id ?? '', accessToken),
    enabled: Boolean(id && isApiConfigured),
  })
  const syncMission = (mission: MissionResponse) => {
    queryClient.setQueryData([...missionQueryKey(mission.id), missionOwnerKey], mission)
    queryClient.setQueryData(missionQueryKey(mission.id), mission)
    void queryClient.invalidateQueries({ queryKey: missionsQueryKey })
    void queryClient.invalidateQueries({ queryKey: missionQueryKey(mission.id) })
    void queryClient.invalidateQueries({ queryKey: issuesQueryKey })
    mission.relatedIssueIds.forEach((issueId) => {
      void queryClient.invalidateQueries({ queryKey: issueQueryKey(issueId) })
    })
  }
  const joinMutation = useMutation({
    mutationFn: () => joinMission(id ?? '', accessToken ?? ''),
    onSuccess: syncMission,
  })
  const leaveMutation = useMutation({
    mutationFn: () => leaveMission(id ?? '', accessToken ?? ''),
    onSuccess: syncMission,
  })

  if (!id || !isApiConfigured) {
    return (
      <DemoStatePage
        title="Detaliile evenimentului au nevoie de API-ul CiviTm"
        description="Ruta este pregatita. Conecteaza API-ul ca sa inspectezi un eveniment comunitar generat."
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
        title="Evenimentul nu este disponibil"
        description="CiviTm nu a putut incarca acest eveniment. Lista de evenimente si harta live sunt inca disponibile."
      />
    )
  }

  return (
    <MissionDetails
      mission={missionQuery.data}
      isAuthenticated={Boolean(session?.access_token)}
      isJoining={joinMutation.isPending}
      isLeaving={leaveMutation.isPending}
      joinError={joinMutation.error}
      leaveError={leaveMutation.error}
      onJoin={() => joinMutation.mutate()}
      onLeave={() => leaveMutation.mutate()}
    />
  )
}

function MissionDetails({
  mission,
  isAuthenticated,
  isJoining,
  isLeaving,
  joinError,
  leaveError,
  onJoin,
  onLeave,
}: {
  mission: MissionResponse
  isAuthenticated: boolean
  isJoining: boolean
  isLeaving: boolean
  joinError: Error | null
  leaveError: Error | null
  onJoin: () => void
  onLeave: () => void
}) {
  const isActive = mission.status === 'active'
  const isBusy = isJoining || isLeaving
  const mutationError = joinError ?? leaveError

  return (
    <main className="min-h-svh overflow-x-hidden bg-orange-50 px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <motion.section
        className="mx-auto grid w-full max-w-6xl gap-5 pb-24 sm:pb-0"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <TopNavigation />
        <div className="flex flex-col gap-4 rounded-xl border border-emerald-200 bg-white p-4 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <Flag className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <Badge label="Eveniment comunitar" tone="emerald" />
                <Badge label={roStatus(mission.status)} tone="teal" />
                {mission.isJoinedByCurrentUser && <Badge label="Esti inscris" tone="lime" />}
              </div>
              <h1 className="mt-3 text-2xl font-semibold leading-tight text-emerald-950 sm:text-3xl">
                {roMissionText(mission.title)}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {roMissionText(mission.description)}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" size="sm">
              <Link to="/missions">
                <ArrowLeft data-icon="inline-start" aria-hidden="true" />
                Evenimente
              </Link>
            </Button>
            {mission.createdFromIssueId && (
              <Button asChild variant="outline" size="sm">
                <Link to={`/issues/${mission.createdFromIssueId}`}>
                  <ExternalLink data-icon="inline-start" aria-hidden="true" />
                  Problema
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="space-y-4">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MissionStat
                icon={Users}
                label="Participanti"
                value={`${mission.participantsJoined}/${mission.participantsNeeded}`}
              />
              <MissionStat
                icon={CalendarDays}
                label="Incepe"
                value={formatDate(mission.startsAt)}
              />
              <MissionStat
                icon={MapPin}
                label="Zona"
                value={mission.zoneName ?? 'Timisoara'}
              />
              <MissionStat
                icon={Sparkles}
                label="Impact"
                value={`${mission.impactPoints} puncte`}
              />
            </section>

            <article className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <Badge label={`${mission.impactPoints} puncte de impact`} tone="lime" />
                {mission.createdByAi && <Badge label="Generat de AI" tone="teal" />}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Inscrierile arata comunitatii ca evenimentul are tractiune, iar harta live
                ramane conectata la problema care a pornit actiunea.
              </p>
            </article>

            <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-emerald-950">
                Probleme conectate
              </h2>
              <div className="mt-3 grid gap-2">
                {mission.relatedIssueIds.length === 0 ? (
                  <p className="text-sm leading-6 text-slate-600">
                    Acest eveniment a fost generat fara alte probleme conectate.
                  </p>
                ) : (
                  mission.relatedIssueIds.map((issueId) => (
                    <Link
                      key={issueId}
                      to={`/issues/${issueId}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3 text-sm font-medium text-emerald-900 outline-none transition-colors hover:bg-emerald-100 focus-visible:ring-3 focus-visible:ring-emerald-500/25"
                    >
                      <span>Problema #{issueId.slice(0, 8)}</span>
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </Link>
                  ))
                )}
              </div>
            </section>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-5 lg:self-start">
            <section className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
              <span className="flex size-10 items-center justify-center rounded-lg bg-lime-50 text-lime-700">
                <CheckCircle2 className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-emerald-950">
                {mission.isJoinedByCurrentUser ? 'Esti inscris' : 'Inscrie-te la eveniment'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {mission.isJoinedByCurrentUser
                  ? 'Locul tau este rezervat pentru aceasta actiune comunitara. Poti renunta daca nu mai poti participa.'
                  : 'Inscrierea confirma ca vrei sa ajuti si creste numarul de participanti vizibil pentru comunitate.'}
              </p>
              {isAuthenticated ? (
                <div className="mt-4 grid gap-2">
                  {mission.isJoinedByCurrentUser ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 w-full border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                      disabled={isBusy || !isActive}
                      onClick={onLeave}
                    >
                      {isLeaving ? (
                        <LoaderCircle data-icon="inline-start" className="animate-spin" aria-hidden="true" />
                      ) : (
                        <X data-icon="inline-start" aria-hidden="true" />
                      )}
                      Renunta la inscriere
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="min-h-11 w-full bg-emerald-600 text-white hover:bg-emerald-700"
                      disabled={isBusy || !isActive}
                      onClick={onJoin}
                    >
                      {isJoining ? (
                        <LoaderCircle data-icon="inline-start" className="animate-spin" aria-hidden="true" />
                      ) : (
                        <Users data-icon="inline-start" aria-hidden="true" />
                      )}
                      Inscrie-te la eveniment
                    </Button>
                  )}
                  {!isActive && (
                    <p className="rounded-lg border border-yellow-100 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                      Inscrierile sunt disponibile doar pentru evenimente active.
                    </p>
                  )}
                </div>
              ) : (
                <Button asChild className="mt-4 w-full bg-emerald-600 text-white hover:bg-emerald-700">
                  <Link to={`/login?returnTo=${encodeURIComponent(`/missions/${mission.id}`)}`}>
                    Autentifica-te ca sa intri
                  </Link>
                </Button>
              )}
              {mutationError && (
                <p className="mt-3 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {mutationError.message}
                </p>
              )}
            </section>

            {mission.reward && (
              <section className="rounded-lg border border-yellow-200 bg-white p-4 shadow-sm">
                <span className="flex size-10 items-center justify-center rounded-lg bg-yellow-50 text-yellow-700">
                  <Gift className="size-5" aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-emerald-950">
                  {roReward(mission.reward.title)}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {mission.reward.partnerName ?? 'Recompensa de sistem CiviTm'} ·{' '}
                  {mission.reward.requiredPoints} puncte necesare
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
          eyebrow="Detalii eveniment"
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
