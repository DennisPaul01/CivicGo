import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  Flag,
  Gift,
  Medal,
  Sparkles,
  Trophy,
  UserCircle,
} from '@/components/icons/hugeicons'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { Button } from '@/components/ui/button'
import { createDemoPublicProfile } from '@/data/leaderboardDemoData'
import {
  fetchPublicUserProfile,
  isApiConfigured,
  type PublicContributionResponse,
  type PublicUserProfileResponse,
} from '@/lib/api'
import { publicUserProfileQueryKey } from '@/lib/queryClient'
import { roRank } from '@/lib/locale'
import { cn } from '@/lib/utils'

export function PublicUserProfilePage() {
  const { id = '' } = useParams()
  const query = useQuery({
    queryKey: publicUserProfileQueryKey(id),
    queryFn: () => fetchPublicUserProfile(id),
    enabled: Boolean(id) && isApiConfigured,
  })
  const profile = query.data ?? createDemoPublicProfile(id)

  return (
    <motion.main
      className="min-h-svh w-full overflow-x-hidden bg-[linear-gradient(180deg,#fff9ef_0%,#f5fbf6_42%,#fffaf1_100%)] px-4 py-5 text-slate-950 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
    >
      <div className="mx-auto flex w-full max-w-[calc(100vw-2rem)] flex-col gap-6 pb-24 sm:max-w-[calc(100vw-3rem)] lg:max-w-7xl">
        <TopNavigation />

        <section className="grid gap-6 rounded-[1.65rem] border border-emerald-100/80 bg-white/82 p-4 shadow-[0_22px_58px_rgba(15,23,42,0.07)] ring-1 ring-white/80 backdrop-blur sm:p-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:p-8">
          <div className="min-w-0">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="mb-5 h-9 border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
            >
              <Link to="/leaderboard">
                <ArrowLeft className="size-4" data-icon="inline-start" aria-hidden="true" />
                Inapoi la clasament
              </Link>
            </Button>

            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
              <PublicAvatar profile={profile} />
              <div className="min-w-0">
                <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-sm">
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  Profil civic public
                </div>
                <h1 className="mt-3 max-w-3xl text-[2.45rem] font-bold leading-[0.98] tracking-normal text-slate-950 min-[430px]:text-5xl sm:text-6xl">
                  {profile.fullName}
                </h1>
                <p className="mt-3 max-w-xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                  {roRank(profile.rankName)} cu {profile.points} puncte civice si{' '}
                  {profile.thirtyDayPoints} puncte in ultimele 30 de zile.
                </p>
              </div>
            </div>

            {query.isError && (
              <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">
                Profilul real nu a putut fi incarcat. Afisez fallback demo.
              </p>
            )}
          </div>

          <aside className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <ProfileMetric label="Rank overall" value={`#${profile.overallRank}`} icon={Trophy} />
            <ProfileMetric label="Rank 30 zile" value={`#${profile.thirtyDayRank}`} icon={Medal} />
            <ProfileMetric label="Trust score" value={`${profile.trustScore}%`} icon={BadgeCheck} />
          </aside>
        </section>

        <section className="grid gap-3 sm:grid-cols-3" aria-label="Rezumat public">
          <ProfileMetric label="Rapoarte publice" value={profile.reportCount.toString()} icon={Award} />
          <ProfileMetric label="Misiuni" value={profile.missionCount.toString()} icon={Flag} />
          <ProfileMetric label="Badge-uri" value={profile.badgeCount.toString()} icon={BadgeCheck} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="grid gap-4">
            <section className="rounded-2xl border border-slate-200 bg-white/94 p-5 shadow-sm shadow-slate-900/6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-emerald-700">
                    Badge-uri publice
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-950">
                    Unlock-uri vizibile
                  </h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                  {profile.badgeCount} total
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(profile.badges.length > 0 ? profile.badges : []).map((badge) => (
                  <article
                    key={badge.id}
                    className="min-h-28 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4"
                  >
                    <BadgeCheck className="size-5 text-emerald-700" aria-hidden="true" />
                    <h3 className="mt-3 text-base font-bold text-slate-950">
                      {badge.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">
                      {badge.description}
                    </p>
                  </article>
                ))}
                {profile.badges.length === 0 && (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                    Nu sunt badge-uri publice inca.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white/94 p-5 shadow-sm shadow-slate-900/6">
              <p className="text-xs font-bold uppercase text-emerald-700">
                Contributii recente
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">
                Activitate publica
              </h2>
              <div className="mt-4 grid gap-2">
                {profile.recentContributions.map((contribution, index) => (
                  <ContributionItem
                    key={`${contribution.type}-${contribution.createdAt}-${index}`}
                    contribution={contribution}
                  />
                ))}
                {profile.recentContributions.length === 0 && (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                    Nu exista contributii publice recente.
                  </p>
                )}
              </div>
            </section>
          </div>

          <aside className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/60 to-white p-5 shadow-sm shadow-emerald-950/5">
            <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Gift className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-xl font-bold text-slate-950">
              Continua flow-ul demo
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Profilul public trimite mai departe spre misiuni si recompense, fara
              sa expuna date private ale userului.
            </p>
            <div className="mt-5 grid gap-2">
              <ProfileLink to="/missions" label="Vezi misiuni" icon={Flag} />
              <ProfileLink to="/rewards" label="Vezi recompense" icon={Gift} />
              <ProfileLink to="/leaderboard" label="Clasament" icon={Trophy} />
            </div>
          </aside>
        </section>
      </div>
    </motion.main>
  )
}

function PublicAvatar({ profile }: { profile: PublicUserProfileResponse }) {
  const initials = profile.fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-600 text-2xl font-bold text-white shadow-md shadow-emerald-900/16 ring-1 ring-emerald-100">
      {profile.avatarUrl ? (
        <img src={profile.avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        <>
          <UserCircle className="size-9" aria-hidden="true" />
          <span className="sr-only">{initials}</span>
        </>
      )}
    </span>
  )
}

function ProfileMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: typeof Trophy
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white/94 p-4 shadow-sm shadow-slate-900/5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase text-emerald-700">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold text-slate-950">{value}</p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
    </article>
  )
}

function ContributionItem({ contribution }: { contribution: PublicContributionResponse }) {
  return (
    <article className="grid min-h-16 grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-900/4">
      <span
        className={cn(
          'flex size-10 items-center justify-center rounded-lg',
          contribution.type === 'mission'
            ? 'bg-amber-50 text-amber-700'
            : 'bg-emerald-50 text-emerald-700',
        )}
      >
        {contribution.type === 'mission' ? (
          <Flag className="size-5" aria-hidden="true" />
        ) : (
          <BadgeCheck className="size-5" aria-hidden="true" />
        )}
      </span>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-bold text-slate-950">
          {contribution.title}
        </h3>
        <p className="mt-1 truncate text-xs font-semibold text-slate-500">
          {contribution.detail}
        </p>
      </div>
    </article>
  )
}

function ProfileLink({
  to,
  label,
  icon: Icon,
}: {
  to: string
  label: string
  icon: typeof Trophy
}) {
  return (
    <Button
      asChild
      size="lg"
      variant="outline"
      className="h-12 justify-between border-slate-200 bg-white text-slate-900 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
    >
      <Link to={to}>
        <span className="inline-flex items-center gap-2">
          <Icon className="size-4" aria-hidden="true" />
          {label}
        </span>
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </Button>
  )
}
