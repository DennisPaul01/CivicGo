import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  CheckCircle2,
  Compass,
  Flag,
  Gift,
  Leaf,
  Medal,
  MapPinned,
  Sparkles,
  Target,
  Trophy,
  UserCircle,
} from '@/components/icons/hugeicons'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { useAuthStore } from '@/stores/authStore'
import { roRank } from '@/lib/locale'
import { cn } from '@/lib/utils'

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
  const displayName = profile?.fullName?.trim() || 'Cetatean civic'
  const currentRank = roRank(profile?.rankName ?? progress.currentRank.name)
  const roleLabel = getRoleLabel(profile?.role)

  return (
    <motion.main
      className="min-h-svh w-full overflow-x-hidden bg-[linear-gradient(180deg,#fff9ef_0%,#f5fbf6_42%,#fffaf1_100%)] px-4 py-5 text-slate-950 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="mx-auto flex w-full max-w-[calc(100vw-2rem)] flex-col gap-6 pb-24 sm:max-w-[calc(100vw-3rem)] lg:max-w-7xl">
        <TopNavigation />

        <section className="relative grid gap-6 overflow-hidden rounded-[1.65rem] border border-emerald-100/80 bg-white/78 px-4 py-6 shadow-[0_22px_58px_rgba(15,23,42,0.07)] ring-1 ring-white/80 backdrop-blur sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(24rem,0.78fr)] lg:items-stretch lg:px-8">
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-200/80 bg-white/82 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-sm shadow-emerald-900/8">
              <span className="relative flex size-2.5" aria-hidden="true">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
              </span>
              Profil activ pe harta CiviTm
            </div>

            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-900/16 sm:size-18">
                <UserCircle className="size-8" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h1 className="max-w-3xl text-[2.55rem] font-bold leading-[0.98] tracking-normal text-slate-950 min-[430px]:text-5xl sm:text-6xl">
                  {displayName}
                </h1>
                <p className="mt-3 max-w-xl text-base font-medium leading-relaxed text-slate-600 sm:text-lg">
                  {currentRank} cu {points} puncte civice stranse in comunitate.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {[roleLabel, `Profil: ${displayName}`, `${progress.progressPercent}% spre nivelul urmator`].map(
                (label) => (
                  <span
                    key={label}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-100 bg-white/76 px-3 py-1 text-xs font-bold text-slate-700 shadow-sm shadow-slate-900/5"
                  >
                    <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span className="truncate">{label}</span>
                  </span>
                ),
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 border border-emerald-600 bg-emerald-600 px-5 text-white shadow-md shadow-emerald-900/16 hover:bg-emerald-700"
              >
                <Link to="/report">
                  <MapPinned className="size-4" data-icon="inline-start" aria-hidden="true" />
                  Raporteaza o problema
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-slate-200 bg-white px-5 text-slate-900 shadow-sm shadow-slate-900/5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <Link to="/">
                  <ArrowLeft className="size-4" data-icon="inline-start" aria-hidden="true" />
                  Harta live
                </Link>
              </Button>
            </div>
          </div>

          <RankProgressPanel
            currentRank={currentRank}
            nextRank={progress.nextRank ? roRank(progress.nextRank.name) : null}
            points={points}
            pointsToNext={progress.pointsToNext}
            progressPercent={progress.progressPercent}
          />
        </section>

        <section
          className="grid gap-3 sm:grid-cols-3"
          aria-label="Rezumat profil civic"
        >
          <ProfileStat
            label="Puncte civice"
            value={points.toString()}
            detail="Total disponibil pentru rank si recompense"
            icon={Leaf}
            tone="seafoam"
          />
          <ProfileStat
            label="Rank curent"
            value={currentRank}
            detail={`${progress.progressPercent}% din etapa curenta`}
            icon={Trophy}
            tone="sunshine"
          />
          <ProfileStat
            label="Urmatorul unlock"
            value={progress.nextRank ? roRank(progress.nextRank.name) : 'Max rank'}
            detail={
              progress.nextRank
                ? `${progress.pointsToNext} puncte ramase`
                : 'Toate pragurile atinse'
            }
            icon={Award}
            tone="coral"
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="grid gap-4">
            <section className="rounded-2xl border border-slate-200 bg-white/92 p-4 shadow-sm shadow-slate-900/8 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-emerald-700">
                    Urmatoarele miscari
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-950">
                    Alege o actiune civica
                  </h2>
                </div>
                <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                  Actiuni rapide
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <QuickAction
                  to="/report"
                  label="Raporteaza"
                  detail="Trimite o sesizare cu poza"
                  icon={MapPinned}
                  tone="seafoam"
                />
                <QuickAction
                  to="/missions"
                  label="Misiuni"
                  detail="Vezi actiunile active"
                  icon={Flag}
                  tone="navy"
                />
                <QuickAction
                  to="/rewards"
                  label="Recompense"
                  detail="Deblocheaza beneficii locale"
                  icon={Gift}
                  tone="sunshine"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/55 to-white p-5 shadow-sm shadow-emerald-950/5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-900/12">
                  <Compass className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase text-emerald-700">
                    Traseu civic
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-950">
                    De la raport la impact vizibil
                  </h2>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <JourneyStep
                  label="Raport valid"
                  detail="AI verifica sesizarea"
                  icon={BadgeCheck}
                  complete={points > 0}
                />
                <JourneyStep
                  label="Misiune activa"
                  detail="Comunitatea poate interveni"
                  icon={Target}
                  complete={points >= 100}
                />
                <JourneyStep
                  label="Reward local"
                  detail="Punctele devin beneficii"
                  icon={Sparkles}
                  complete={points >= 300}
                />
              </div>
            </section>
          </div>

          <aside className="rounded-2xl border border-orange-200 bg-white/92 p-5 shadow-sm shadow-slate-900/8">
            <div className="flex items-start justify-between gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
                <Medal className="size-5" aria-hidden="true" />
              </span>
              <span className="rounded-full bg-lime-50 px-3 py-1 text-xs font-bold text-lime-700 ring-1 ring-lime-200">
                MVP unlock
              </span>
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-950">
              Badge-uri si rank
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Primul raport valid deblocheaza badge-ul First Reporter. Restul
              progresului ramane vizibil in zona de recompense.
            </p>
            <div className="mt-5 rounded-xl border border-orange-100 bg-orange-50/60 p-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-bold text-slate-800">First Reporter</span>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-orange-700 ring-1 ring-orange-100">
                  {points > 0 ? 'Deblocat' : 'In asteptare'}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Creeaza primul raport pentru a porni lantul de puncte, misiuni
                si reward-uri.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="mt-5 h-12 w-full border-slate-200 bg-white text-slate-900 shadow-sm shadow-slate-900/5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
            >
              <Link to="/rewards">
                Vezi badge-uri
                <ArrowRight className="size-4" data-icon="inline-end" aria-hidden="true" />
              </Link>
            </Button>
          </aside>
        </section>
      </div>
    </motion.main>
  )
}

function RankProgressPanel({
  currentRank,
  nextRank,
  points,
  pointsToNext,
  progressPercent,
}: {
  currentRank: string
  nextRank: string | null
  points: number
  pointsToNext: number
  progressPercent: number
}) {
  return (
    <aside
      className="relative flex min-h-[20rem] overflow-hidden rounded-2xl border border-slate-200 bg-white/92 p-5 shadow-sm shadow-slate-900/8 sm:p-6"
      aria-label="Progres rank"
    >
      <div
        className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-emerald-100/80 via-teal-50 to-orange-50/50"
        aria-hidden="true"
      >
      </div>
      <div className="relative flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-900/16">
              <Trophy className="size-6" aria-hidden="true" />
            </span>
            <span className="rounded-full bg-white/88 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
              {progressPercent}% complet
            </span>
          </div>
          <p className="mt-7 text-xs font-bold uppercase text-emerald-700">
            Rank curent
          </p>
          <h2 className="mt-1 text-3xl font-bold leading-tight text-slate-950">
            {currentRank}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {points} puncte civice
            {nextRank && `, cu ${pointsToNext} puncte pana la ${nextRank}.`}
          </p>
        </div>

        <div className="mt-6">
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full bg-emerald-600"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
            <span>{currentRank}</span>
            <span>{nextRank ?? 'Max rank'}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

function getRoleLabel(role: string | undefined) {
  switch (role) {
    case 'admin':
      return 'Admin'
    case 'partner':
      return 'Partener local'
    case 'trusted_citizen':
      return 'Cetatean verificat'
    default:
      return 'Cetatean'
  }
}

function ProfileStat({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  detail: string
  icon: typeof Leaf
  tone: 'seafoam' | 'sunshine' | 'coral'
}) {
  return (
    <article className="group min-h-36 min-w-0 rounded-2xl border border-slate-200/80 bg-white/94 p-4 shadow-sm shadow-slate-900/5 ring-1 ring-white/70 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-900/8 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase text-emerald-700">
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-bold text-slate-950">
            {value}
          </p>
        </div>
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg',
            tone === 'seafoam' && 'bg-emerald-50 text-emerald-700',
            tone === 'sunshine' && 'bg-yellow-50 text-yellow-800',
            tone === 'coral' && 'bg-rose-50 text-rose-700',
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
    </article>
  )
}

function QuickAction({
  to,
  label,
  detail,
  icon: Icon,
  tone,
}: {
  to: string
  label: string
  detail: string
  icon: typeof Leaf
  tone: 'seafoam' | 'sunshine' | 'navy'
}) {
  return (
    <Link
      to={to}
      className="group flex min-h-[8.25rem] min-w-0 flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm shadow-slate-900/5 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/60 hover:shadow-md focus:outline-none focus:ring-3 focus:ring-emerald-500/25"
    >
      <span
        className={cn(
          'flex size-10 items-center justify-center rounded-lg',
          tone === 'seafoam' && 'bg-emerald-50 text-emerald-700',
          tone === 'sunshine' && 'bg-yellow-50 text-yellow-800',
          tone === 'navy' && 'bg-slate-50 text-slate-700',
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="flex items-center justify-between gap-2 text-base font-bold text-slate-950">
          {label}
          <ArrowRight className="size-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-700" aria-hidden="true" />
        </span>
        <span className="mt-1 block text-sm leading-5 text-slate-600">
          {detail}
        </span>
      </span>
    </Link>
  )
}

function JourneyStep({
  label,
  detail,
  icon: Icon,
  complete,
}: {
  label: string
  detail: string
  icon: typeof Leaf
  complete: boolean
}) {
  return (
    <article className="min-h-32 rounded-xl border border-emerald-100 bg-white/88 p-4 shadow-sm shadow-emerald-950/5">
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg',
            complete ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-500',
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-bold ring-1',
            complete
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
              : 'bg-white text-slate-500 ring-slate-200',
          )}
        >
          {complete ? 'Activ' : 'Urmeaza'}
        </span>
      </div>
      <h3 className="mt-4 text-base font-bold text-slate-950">{label}</h3>
      <p className="mt-1 text-sm leading-5 text-slate-600">{detail}</p>
    </article>
  )
}
