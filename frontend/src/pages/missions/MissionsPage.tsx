import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  Flag,
  Gift,
  MapPin,
  Sparkles,
  Users,
} from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { DemoSkeletonGrid, DemoState } from '@/components/ui/demo-state'
import {
  fetchMissions,
  isApiConfigured,
  type MissionResponse,
} from '@/lib/api'
import { missionsQueryKey } from '@/lib/queryClient'
import { roReward, roStatus } from '@/lib/locale'

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

export function MissionsPage() {
  const missionsQuery = useQuery({
    queryKey: missionsQueryKey,
    queryFn: fetchMissions,
  })
  const missions = missionsQuery.data ?? []

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
              <Flag className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Misiuni CiviTm
              </p>
              <h1 className="text-2xl font-semibold leading-tight text-emerald-950">
                Misiuni comunitare active
              </h1>
            </div>
          </div>

          <Button asChild variant="outline" size="sm">
            <Link to="/">
              <ArrowLeft data-icon="inline-start" aria-hidden="true" />
              Harta live
            </Link>
          </Button>
        </div>

        {missionsQuery.isLoading && isApiConfigured ? (
          <DemoSkeletonGrid items={6} className="md:grid-cols-2 xl:grid-cols-3" />
        ) : missionsQuery.isError && isApiConfigured ? (
          <DemoState
            icon={Flag}
            tone="amber"
            eyebrow="Fallback misiuni"
            title="Misiunile sunt indisponibile temporar"
            description="Harta live poate afisa in continuare misiunile disponibile pana isi revine API-ul."
          />
        ) : missions.length === 0 ? (
          <DemoState
            icon={Sparkles}
            eyebrow="Nicio misiune inca"
            title="Rapoartele noi vor deveni misiuni"
            description="Problemele eligibile genereaza actiuni comunitare cu recompense si puncte de impact."
          />
        ) : (
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {missions.map((mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
          </section>
        )}
      </motion.section>
    </main>
  )
}

function MissionCard({ mission }: { mission: MissionResponse }) {
  return (
    <motion.article
      className="flex min-h-72 flex-col rounded-lg border border-emerald-200 bg-white p-4 shadow-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-lime-50 text-lime-700">
          <Flag className="size-5" aria-hidden="true" />
        </span>
        <span className="rounded-md bg-orange-50 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
          {roStatus(mission.status)}
        </span>
      </div>

      <div className="mt-4 min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
          <MapPin className="size-3.5" aria-hidden="true" />
          {mission.zoneName ?? 'Timisoara'}
        </p>
        <h2 className="mt-2 text-lg font-semibold leading-tight text-emerald-950">
          {mission.title}
        </h2>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
          {mission.description}
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
            {mission.reward.partnerName
              ? `${mission.reward.partnerName}: ${roReward(mission.reward.title)}`
              : roReward(mission.reward.title)}
          </span>
        )}
      </div>

      <Button asChild className="mt-4 bg-emerald-600 text-white hover:bg-emerald-700">
        <Link to={`/missions/${mission.id}`}>
          <ExternalLink data-icon="inline-start" aria-hidden="true" />
          Vezi misiunea
        </Link>
      </Button>
    </motion.article>
  )
}
