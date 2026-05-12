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
                CiviTm missions
              </p>
              <h1 className="text-2xl font-semibold leading-tight text-emerald-950">
                Active community missions
              </h1>
            </div>
          </div>

          <Button asChild variant="outline" size="sm">
            <Link to="/">
              <ArrowLeft data-icon="inline-start" aria-hidden="true" />
              Live map
            </Link>
          </Button>
        </div>

        {missionsQuery.isLoading && isApiConfigured ? (
          <DemoSkeletonGrid items={6} className="md:grid-cols-2 xl:grid-cols-3" />
        ) : missionsQuery.isError && isApiConfigured ? (
          <DemoState
            icon={Flag}
            tone="amber"
            eyebrow="Mission fallback"
            title="Missions are temporarily unavailable"
            description="The live map can still show seeded mission markers while the API recovers."
          />
        ) : missions.length === 0 ? (
          <DemoState
            icon={Sparkles}
            eyebrow="No missions yet"
            title="New reports will become missions"
            description="Eligible issues generate community actions with rewards and impact points."
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
          {mission.status.replaceAll('_', ' ')}
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
          {mission.participantsJoined}/{mission.participantsNeeded} joined
        </span>
        <span className="flex items-center gap-2">
          <CalendarDays className="size-4 text-emerald-600" aria-hidden="true" />
          {formatDate(mission.startsAt)}
        </span>
        {mission.reward && (
          <span className="flex items-center gap-2">
            <Gift className="size-4 text-yellow-600" aria-hidden="true" />
            {mission.reward.partnerName
              ? `${mission.reward.partnerName}: ${mission.reward.title}`
              : mission.reward.title}
          </span>
        )}
      </div>

      <Button asChild className="mt-4 bg-emerald-600 text-white hover:bg-emerald-700">
        <Link to={`/missions/${mission.id}`}>
          <ExternalLink data-icon="inline-start" aria-hidden="true" />
          View mission
        </Link>
      </Button>
    </motion.article>
  )
}
