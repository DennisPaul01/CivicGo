import { Link } from 'react-router-dom'
import { ArrowLeft, Award, Leaf, Trophy } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { roRank } from '@/lib/locale'

const rankThresholds = [
  { name: 'New Citizen', minPoints: 0 },
  { name: 'Civic Rookie', minPoints: 100 },
  { name: 'Neighborhood Helper', minPoints: 300 },
  { name: 'Community Builder', minPoints: 700 },
  { name: 'City Guardian', minPoints: 1500 },
  { name: 'Civic Hero', minPoints: 3000 },
  { name: 'Urban Legend', minPoints: 6000 },
]

function getRankProgress(points: number) {
  const currentRank =
    [...rankThresholds]
      .reverse()
      .find((rank) => points >= rank.minPoints) ?? rankThresholds[0]
  const nextRank = rankThresholds.find(
    (rank) => rank.minPoints > currentRank.minPoints,
  )
  const progressPercent = nextRank
    ? Math.min(
        100,
        Math.max(
          0,
          Math.round(
            ((points - currentRank.minPoints) /
              Math.max(1, nextRank.minPoints - currentRank.minPoints)) *
              100,
          ),
        ),
      )
    : 100

  return {
    currentRank,
    nextRank,
    progressPercent,
    pointsToNext: nextRank ? Math.max(0, nextRank.minPoints - points) : 0,
  }
}

export function ProfilePage() {
  const profile = useAuthStore((state) => state.profile)
  const points = profile?.points ?? 0
  const progress = getRankProgress(points)

  return (
    <main className="min-h-svh bg-orange-50 px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <motion.section
        className="mx-auto grid w-full max-w-5xl gap-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <div className="flex flex-col gap-4 rounded-lg border border-emerald-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <Leaf className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Profil civic
              </p>
              <h1 className="text-2xl font-semibold text-emerald-950">
                {profile?.fullName ?? 'Cetatean civic'}
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

        <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
          <section className="rounded-lg border border-emerald-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-lime-50 text-lime-700">
                <Trophy className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-lime-700">
                  Progres rank
                </p>
                <h2 className="mt-1 text-xl font-semibold text-emerald-950">
                  {roRank(profile?.rankName ?? progress.currentRank.name)}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {points} puncte civice
                  {progress.nextRank &&
                    ` · ${progress.pointsToNext} puncte pana la ${roRank(progress.nextRank.name)}`}
                </p>
              </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className="h-full rounded-full bg-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress.progressPercent}%` }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              />
            </div>
          </section>

          <aside className="rounded-lg border border-emerald-200 bg-white p-5 shadow-sm">
            <span className="flex size-10 items-center justify-center rounded-lg bg-orange-50 text-emerald-700">
              <Award className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-emerald-950">
              Badge-uri
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Primul raportor se deblocheaza dupa primul raport valid. Mai multe
              badge-uri apar in pagina dedicata de recompense.
            </p>
          </aside>
        </div>
      </motion.section>
    </main>
  )
}
