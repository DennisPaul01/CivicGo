import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Flag,
  Gift,
  MapPin,
  MapPinned,
  Sparkles,
  Target,
  Users,
} from '@/components/icons/hugeicons'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { DemoSkeletonGrid, DemoState } from '@/components/ui/demo-state'
import {
  fetchMissions,
  isApiConfigured,
  type MissionResponse,
} from '@/lib/api'
import { missionsQueryKey } from '@/lib/queryClient'
import { roMissionText, roReward, roStatus } from '@/lib/locale'
import { useAuthStore } from '@/stores/authStore'
import missionCleanupImage from '@/assets/banners-missions/banner-1.png'
import missionGreenImage from '@/assets/banners-missions/2.png'
import missionStreetImage from '@/assets/banners-missions/3.png'
import missionRewardImage from '@/assets/banners-missions/4.png'

function getJoinPercent(mission: MissionResponse) {
  return Math.min(
    100,
    Math.round(
      (mission.participantsJoined / Math.max(1, mission.participantsNeeded)) * 100,
    ),
  )
}

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

const missionImages = [
  missionCleanupImage,
  missionGreenImage,
  missionStreetImage,
  missionRewardImage,
]

function getMissionImage(mission: MissionResponse) {
  const numericHash = Array.from(mission.id).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  )

  return missionImages[numericHash % missionImages.length]
}

function getStatusTone(status: string) {
  if (status === 'completed') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  }

  if (status === 'planned') {
    return 'border-yellow-200 bg-yellow-50 text-yellow-800'
  }

  if (status === 'cancelled') {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }

  return 'border-emerald-200 bg-white/92 text-emerald-800'
}

export function MissionsPage() {
  const session = useAuthStore((state) => state.session)
  const missionsQuery = useQuery({
    queryKey: [...missionsQueryKey, session?.user.id ?? 'public'],
    queryFn: () => fetchMissions(session?.access_token),
    enabled: isApiConfigured,
    refetchOnWindowFocus: true,
  })
  const missions = missionsQuery.data ?? []
  const activeMissions = missions.filter((mission) => mission.status === 'active')
  const participants = missions.reduce(
    (sum, mission) => sum + mission.participantsJoined,
    0,
  )
  const rewardsAttached = missions.filter((mission) => mission.reward).length
  const featuredMission = missions[0] ?? null
  const missionCards = featuredMission
    ? missions.filter((mission) => mission.id !== featuredMission.id)
    : missions

  return (
    <main className="min-h-svh overflow-x-hidden bg-[#f7fbf2] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <motion.section
        className="mx-auto grid w-full max-w-7xl gap-4 pb-24 sm:gap-5 sm:pb-0"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <TopNavigation />

        <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm shadow-slate-900/6">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-800">
                    <Flag className="size-3.5" aria-hidden="true" />
                    Evenimente comunitare CiviTm
                  </p>
                  <h1 className="mt-2 max-w-3xl text-xl font-semibold leading-tight text-emerald-950 sm:text-2xl lg:text-3xl">
                    Comunitatea se inscrie acolo unde harta arata o problema reala.
                  </h1>
                  <p className="mt-1.5 hidden max-w-2xl text-sm leading-5 text-slate-600 sm:block sm:text-base">
                    Problemele mari devin evenimente locale cu voluntari, recompensa si impact
                    vizibil pe zonele din Timisoara.
                  </p>
                </div>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="min-h-11 w-full rounded-xl border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50 sm:w-auto"
                >
                  <Link to="/">
                    <ArrowLeft data-icon="inline-start" aria-hidden="true" />
                    Harta live
                  </Link>
                </Button>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2">
                <MissionSummaryCard
                  label="Active acum"
                  value={activeMissions.length}
                  detail="Pregatite pentru comunitate"
                  icon={Flag}
                />
                <MissionSummaryCard
                  label="Participanti"
                  value={participants}
                  detail="Inscrieri la evenimente"
                  icon={Users}
                />
                <MissionSummaryCard
                  label="Reward-uri"
                  value={rewardsAttached}
                  detail="Match-uri locale"
                  icon={Gift}
                />
              </div>
            </div>

            <div className="relative hidden min-h-44 overflow-hidden border-t border-emerald-100 bg-emerald-950 lg:block lg:border-l lg:border-t-0">
              <img
                src={missionRewardImage}
                alt=""
                className="absolute inset-0 size-full object-cover opacity-82"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/68 via-emerald-900/18 to-transparent" />
              <div className="relative flex h-full min-h-44 flex-col justify-between p-4 text-white sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/92 px-3 py-1 text-xs font-bold text-emerald-900 shadow-sm">
                    <MapPinned className="size-3.5" aria-hidden="true" />
                    Timisoara live
                  </span>
                  <span className="rounded-full bg-[#ffd166] px-3 py-1 text-xs font-bold text-emerald-950">
                    +500 puncte
                  </span>
                </div>

                <div className="mt-auto max-w-md rounded-xl border border-white/30 bg-white/90 p-3 text-emerald-950 shadow-lg shadow-emerald-950/18 backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                    Flux civic
                  </p>
                  <p className="mt-1 text-base font-semibold leading-tight">
                    Raportul mare devine eveniment cu oameni, recompensa si progres vizibil.
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs font-semibold text-slate-600">
                    <span className="rounded-lg bg-emerald-50 px-2 py-1.5">
                      AI checked
                    </span>
                    <span className="rounded-lg bg-yellow-50 px-2 py-1.5">
                      Reward
                    </span>
                    <span className="rounded-lg bg-white px-2 py-1.5">
                      Impact
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {!isApiConfigured ? (
          <DemoState
            icon={Flag}
            tone="amber"
            eyebrow="API neconfigurat"
            title="Evenimentele au nevoie de conexiunea la baza de date"
            description="Seteaza VITE_API_URL catre backendul CiviTm ca lista de evenimente sa fie citita din endpointul /api/missions."
          />
        ) : missionsQuery.isLoading ? (
          <DemoSkeletonGrid items={6} className="md:grid-cols-2 xl:grid-cols-3" />
        ) : missionsQuery.isError ? (
          <DemoState
            icon={Flag}
            tone="amber"
            eyebrow="Database indisponibil"
            title="Nu am putut incarca evenimentele"
            description={missionsQuery.error.message}
          />
        ) : missions.length === 0 ? (
          <DemoState
            icon={Sparkles}
            eyebrow="Niciun eveniment inca"
            title="Rapoartele mari vor deveni evenimente"
            description="Doar problemele care cer comunitatea genereaza evenimente cu participanti, recompense si puncte de impact."
          />
        ) : (
          <>
            {featuredMission && <FeaturedMission mission={featuredMission} />}
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {missionCards.map((mission) => (
                <MissionCard key={mission.id} mission={mission} />
              ))}
            </section>
          </>
        )}
      </motion.section>
    </main>
  )
}

function MissionSummaryCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: number
  detail: string
  icon: typeof Flag
}) {
  return (
    <article className="rounded-lg border border-emerald-100 bg-[#f7fbf2] p-2.5 shadow-sm sm:p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            {label}
          </p>
          <p className="mt-0.5 text-lg font-semibold text-emerald-950 sm:text-2xl">{value}</p>
        </div>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm sm:size-9 sm:rounded-xl">
          <Icon className="size-3.5 sm:size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-1.5 hidden text-xs leading-4 text-slate-600 sm:block sm:text-sm sm:leading-5">{detail}</p>
    </article>
  )
}

function FeaturedMission({ mission }: { mission: MissionResponse }) {
  const joinPercent = getJoinPercent(mission)

  return (
    <motion.article
      className="grid overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm shadow-slate-900/6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      <div className="relative min-h-40 overflow-hidden bg-emerald-950 sm:min-h-48 md:min-h-56 lg:min-h-64">
        <img
          src={getMissionImage(mission)}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/70 via-emerald-950/8 to-transparent" />
        <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-1.5 sm:inset-x-4 sm:bottom-4 sm:gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/94 px-2.5 py-1 text-xs font-bold text-emerald-900 shadow-sm sm:gap-2 sm:px-3">
            <Target className="size-3 sm:size-3.5" aria-hidden="true" />
            Eveniment recomandat
          </span>
          {mission.reward && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffd166] px-2.5 py-1 text-xs font-bold text-emerald-950 shadow-sm sm:gap-2 sm:px-3">
              <Gift className="size-3 sm:size-3.5" aria-hidden="true" />
              Reward atasat
            </span>
          )}
          {mission.isJoinedByCurrentUser && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm sm:gap-2 sm:px-3">
              <CheckCircle2 className="size-3 sm:size-3.5" aria-hidden="true" />
              Esti inscris
            </span>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-col p-3 sm:p-4 lg:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
              <MapPin className="size-3 sm:size-3.5" aria-hidden="true" />
              {mission.zoneName ?? 'Timisoara'}
            </p>
            <h2 className="mt-1.5 text-lg font-semibold leading-tight text-emerald-950 sm:text-2xl lg:text-3xl">
              {roMissionText(mission.title)}
            </h2>
          </div>
          <span
            className={`w-fit rounded-full border px-2.5 py-0.5 text-xs font-bold sm:px-3 sm:py-1 ${getStatusTone(
              mission.status,
            )}`}
          >
            {roStatus(mission.status)}
          </span>
        </div>

        <p className="mt-2 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
          {roMissionText(mission.description)}
        </p>

        <div className="mt-3 grid gap-1.5 sm:gap-2 sm:grid-cols-3">
          <MissionMetric
            icon={Users}
            label="Voluntari"
            value={`${mission.participantsJoined}/${mission.participantsNeeded}`}
          />
          <MissionMetric
            icon={CalendarDays}
            label="Start"
            value={formatDate(mission.startsAt)}
          />
          <MissionMetric
            icon={Sparkles}
            label="Impact"
            value={`${mission.impactPoints} puncte`}
          />
        </div>

        <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-2.5">
          <div className="flex items-center justify-between gap-2 text-xs font-bold text-emerald-900">
            <span>Locuri ocupate</span>
            <span>{joinPercent}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white">
            <motion.div
              className="h-full rounded-full bg-emerald-600"
              initial={{ width: 0 }}
              animate={{ width: `${joinPercent}%` }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex min-w-0 items-center gap-2 text-xs font-medium text-slate-600 sm:text-sm">
            <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 sm:size-4" aria-hidden="true" />
            {mission.reward
              ? mission.reward.partnerName
                ? `${mission.reward.partnerName}: ${roReward(mission.reward.title)}`
                : roReward(mission.reward.title)
              : 'Fara reward atasat inca'}
          </p>
          <Button asChild className="min-h-10 bg-emerald-600 text-white hover:bg-emerald-700 sm:min-h-11">
            <Link to={`/missions/${mission.id}`}>
              {mission.isJoinedByCurrentUser ? 'Vezi inscrierea' : 'Vezi evenimentul'}
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.article>
  )
}

function MissionMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Flag
  label: string
  value: string
}) {
  return (
    <div className="min-w-0 rounded-lg border border-emerald-100 bg-[#f7fbf2] p-2.5 sm:p-3">
      <span className="flex size-8 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm sm:size-9">
        <Icon className="size-3.5 sm:size-4" aria-hidden="true" />
      </span>
      <p className="mt-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700">
        {label}
      </p>
      <p className="mt-0.5 truncate text-xs font-semibold text-emerald-950 sm:text-sm">{value}</p>
    </div>
  )
}

function MissionCard({ mission }: { mission: MissionResponse }) {
  const joinPercent = getJoinPercent(mission)

  return (
    <motion.article
      className="group flex min-h-[22rem] flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm shadow-slate-900/6 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md sm:min-h-[26rem]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      <div className="relative h-32 overflow-hidden bg-emerald-950 sm:h-40">
        <img
          src={getMissionImage(mission)}
          alt=""
          className="absolute inset-0 size-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/72 via-emerald-950/8 to-transparent" />
        <span
          className={`absolute left-3 top-3 rounded-full border px-3 py-1 text-xs font-bold ${getStatusTone(
            mission.status,
          )}`}
        >
          {roStatus(mission.status)}
        </span>
        <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-white/94 px-3 py-1 text-xs font-bold text-emerald-900 shadow-sm">
          <MapPin className="size-3.5" aria-hidden="true" />
          {mission.zoneName ?? 'Timisoara'}
        </span>
        {mission.isJoinedByCurrentUser && (
          <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            Inscris
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="min-w-0 flex-1">
          <h2 className="mt-2 text-lg font-semibold leading-tight text-emerald-950">
            {roMissionText(mission.title)}
          </h2>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
            {roMissionText(mission.description)}
          </p>
        </div>

        <div className="mt-4 grid gap-2 text-sm text-slate-600">
          <span className="flex items-center gap-2">
            <Users className="size-4 text-emerald-600" aria-hidden="true" />
            {mission.participantsJoined}/{mission.participantsNeeded} inscrisi
          </span>
          <span className="flex items-center gap-2">
            <CalendarDays className="size-4 text-emerald-600" aria-hidden="true" />
            {formatDate(mission.startsAt)}
          </span>
          {mission.reward && (
            <span className="flex items-center gap-2">
              <Gift className="size-4 text-yellow-600" aria-hidden="true" />
              <span className="line-clamp-1">
                {mission.reward.partnerName
                  ? `${mission.reward.partnerName}: ${roReward(mission.reward.title)}`
                  : roReward(mission.reward.title)}
              </span>
            </span>
          )}
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-600">
            <span>Locuri ocupate</span>
            <span className="text-emerald-800">{joinPercent}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full bg-emerald-600"
              initial={{ width: 0 }}
              animate={{ width: `${joinPercent}%` }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            />
          </div>
        </div>

        <Button asChild className="mt-4 min-h-11 bg-emerald-600 text-white hover:bg-emerald-700">
          <Link to={`/missions/${mission.id}`}>
            <ExternalLink data-icon="inline-start" aria-hidden="true" />
            {mission.isJoinedByCurrentUser ? 'Vezi inscrierea' : 'Vezi evenimentul'}
          </Link>
        </Button>
      </div>
    </motion.article>
  )
}
