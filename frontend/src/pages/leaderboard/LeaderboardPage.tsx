import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import {
  ArrowRight,
  Award,
  BarChart3,
  CalendarDays,
  Medal,
  Sparkles,
  Trophy,
  UserCircle,
  Users,
} from '@/components/icons/hugeicons'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { Button } from '@/components/ui/button'
import { demoLeaderboardUsers } from '@/data/leaderboardDemoData'
import {
  fetchLeaderboard,
  isApiConfigured,
  type LeaderboardPeriod,
  type LeaderboardUserResponse,
} from '@/lib/api'
import { leaderboardQueryKey } from '@/lib/queryClient'
import { roRank } from '@/lib/locale'
import { cn } from '@/lib/utils'

const tabs: Array<{ value: LeaderboardPeriod; label: string; icon: typeof Trophy }> = [
  { value: '30d', label: '30 zile', icon: CalendarDays },
  { value: 'overall', label: 'Overall', icon: Trophy },
]

export function LeaderboardPage() {
  const [period, setPeriod] = useState<LeaderboardPeriod>('30d')
  const query = useQuery({
    queryKey: leaderboardQueryKey(period),
    queryFn: () => fetchLeaderboard(period),
  })
  const leaderboard = useMemo(() => {
    const source = query.data && query.data.length > 0 ? query.data : demoLeaderboardUsers

    return period === 'overall'
      ? [...source].sort((a, b) => a.overallRank - b.overallRank)
      : [...source].sort((a, b) => a.thirtyDayRank - b.thirtyDayRank)
  }, [period, query.data])
  const topUsers = leaderboard.slice(0, 3)
  const restUsers = leaderboard.slice(3)
  const totalPoints = leaderboard.reduce((sum, user) => sum + user.points, 0)
  const activeCitizens = leaderboard.length

  return (
    <motion.main
      className="min-h-svh w-full overflow-x-hidden bg-[linear-gradient(180deg,#fff9ef_0%,#f4fbf5_44%,#fffaf1_100%)] px-4 py-5 text-slate-950 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
    >
      <div className="mx-auto flex w-full max-w-[calc(100vw-2rem)] flex-col gap-5 pb-24 sm:max-w-[calc(100vw-3rem)] lg:max-w-7xl">
        <TopNavigation />

        <section className="mx-auto grid w-full max-w-7xl gap-4 rounded-2xl border border-emerald-100/80 bg-[linear-gradient(135deg,#ffffff_0%,#f2fbf6_62%,#fff7da_100%)] p-6 pt-7 shadow-[0_12px_30px_rgba(15,23,42,0.055)] ring-1 ring-white/80 backdrop-blur sm:p-7 sm:pt-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-center">
          <div className="min-w-0">
            <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[0.68rem] font-bold text-emerald-800 shadow-sm">
              <Sparkles className="size-3" aria-hidden="true" />
              Clasament civic public
            </div>
            <h1 className="mt-3 max-w-xl text-2xl font-bold leading-[1.08] tracking-normal text-slate-950 min-[430px]:text-[1.85rem] sm:text-[2.15rem] lg:text-[2.35rem]">
              Top cetateni activi in CiviTm
            </h1>
            <p className="mt-2 max-w-lg text-[0.8rem] font-medium leading-5 text-slate-600 sm:text-sm">
              Vezi progresul pe ultimele 30 de zile sau scorul overall. Profilurile
              publice arata doar impact civic, badge-uri si contributii vizibile.
            </p>

            <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Perioada clasament">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = period === tab.value

                return (
                  <Button
                    key={tab.value}
                    type="button"
                    size="lg"
                    variant={isActive ? 'default' : 'outline'}
                    aria-pressed={isActive}
                    className={cn(
                      'h-10 rounded-xl px-3 text-[0.78rem]',
                      isActive
                        ? 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800',
                    )}
                    onClick={() => setPeriod(tab.value)}
                  >
                    <Icon className="size-4" data-icon="inline-start" aria-hidden="true" />
                    {tab.label}
                  </Button>
                )
              })}
            </div>
          </div>

          <aside className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <SummaryTile label="Cetateni activi" value={activeCitizens.toString()} icon={Users} />
            <SummaryTile label="Puncte totale" value={totalPoints.toLocaleString('ro-RO')} icon={BarChart3} />
            <SummaryTile
              label={period === '30d' ? 'Focus curent' : 'Focus general'}
              value={period === '30d' ? '30 zile' : 'Overall'}
              icon={Award}
            />
          </aside>
        </section>

        {!isApiConfigured && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            API-ul nu este configurat, asa ca vezi date locale temporare.
          </p>
        )}

        {query.isError && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">
            Nu am putut incarca leaderboard-ul real. Afisez date locale temporare.
          </p>
        )}

        <section className="mx-auto mt-3 grid w-full max-w-7xl gap-3 sm:mt-4 lg:mt-5 lg:grid-cols-3" aria-label="Top 3 cetateni">
          {topUsers.map((user, index) => (
            <TopUserCard
              key={user.id}
              user={user}
              period={period}
              tone={index === 0 ? 'gold' : index === 1 ? 'emerald' : 'slate'}
            />
          ))}
        </section>

        <section className="mx-auto grid w-full max-w-7xl gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="rounded-2xl border border-slate-200 bg-white/94 p-4 shadow-sm shadow-slate-900/6">
            <div className="flex items-center justify-between gap-3 px-1 pb-3">
              <div>
                <p className="text-[0.68rem] font-bold uppercase text-emerald-700">
                  Lista completa
                </p>
                <h2 className="mt-0.5 text-lg font-bold text-slate-950">
                  {period === '30d' ? 'Activitate in ultimele 30 zile' : 'Scor overall'}
                </h2>
              </div>
              {query.isFetching && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[0.68rem] font-bold text-emerald-700">
                  Se actualizeaza
                </span>
              )}
            </div>

            <div className="grid gap-1.5">
              {restUsers.map((user) => (
                <LeaderboardRow key={user.id} user={user} period={period} />
              ))}
            </div>
          </div>

          <aside className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/70 to-yellow-50/60 p-5 shadow-sm shadow-emerald-950/5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-900/12">
              <Trophy className="size-4" aria-hidden="true" />
            </span>
            <h2 className="mt-3 text-lg font-bold text-slate-950">
              Zonele raman in joc
            </h2>
            <p className="mt-1.5 text-[0.8rem] leading-5 text-slate-600">
              Clasamentul de useri completeaza leaderboard-ul pe zone. Poti sari
              rapid la scorurile de cartier si impactul pe harta.
            </p>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="mt-4 h-9 w-full border-slate-200 bg-white text-slate-900 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
            >
              <Link to="/zones">
                Vezi zonele
                <ArrowRight className="size-4" data-icon="inline-end" aria-hidden="true" />
              </Link>
            </Button>
          </aside>
        </section>
      </div>
    </motion.main>
  )
}

function TopUserCard({
  user,
  period,
  tone,
}: {
  user: LeaderboardUserResponse
  period: LeaderboardPeriod
  tone: 'gold' | 'emerald' | 'slate'
}) {
  return (
    <article
      className={cn(
        'min-w-0 rounded-2xl border p-4 shadow-sm ring-1 ring-white/70',
        tone === 'gold' && 'border-amber-200 bg-[linear-gradient(145deg,#ffffff_0%,#fff8d9_100%)] shadow-amber-900/8',
        tone === 'emerald' && 'border-emerald-200 bg-[linear-gradient(145deg,#ffffff_0%,#ecfdf5_100%)] shadow-emerald-900/8',
        tone === 'slate' && 'border-teal-100 bg-[linear-gradient(145deg,#ffffff_0%,#f0fdfa_100%)] shadow-slate-900/6',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <Avatar user={user} size="lg" />
        <span className="inline-flex items-center gap-1 rounded-full bg-white/82 px-3 py-1 text-[0.68rem] font-bold text-emerald-700 ring-1 ring-emerald-200">
          <Medal className="size-3" aria-hidden="true" />
          #{period === '30d' ? user.thirtyDayRank : user.overallRank}
        </span>
      </div>
      <h2 className="mt-4 truncate text-lg font-bold text-slate-950">
        {user.fullName}
      </h2>
      <p className="mt-0.5 text-xs font-semibold text-emerald-700">
        {roRank(user.rankName)}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <MiniStat label="Perioada" value={user.periodPoints.toString()} />
        <MiniStat label="Total" value={user.points.toString()} />
        <MiniStat label="Badge" value={user.badgeCount.toString()} />
      </div>
      <Button asChild size="sm" className="mt-4 h-9 w-full bg-emerald-600 text-white hover:bg-emerald-700">
        <Link to={`/users/${user.id}`}>
          Vezi profil
          <ArrowRight className="size-4" data-icon="inline-end" aria-hidden="true" />
        </Link>
      </Button>
    </article>
  )
}

function LeaderboardRow({
  user,
  period,
}: {
  user: LeaderboardUserResponse
  period: LeaderboardPeriod
}) {
  const rank = period === '30d' ? user.thirtyDayRank : user.overallRank

  return (
    <article className="grid min-h-16 min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-900/4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
      <div className="flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
          #{rank}
        </span>
        <Avatar user={user} size="sm" />
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-bold text-slate-950">
          {user.fullName}
        </h3>
        <p className="truncate text-xs font-medium text-slate-600">
          {roRank(user.rankName)} · {user.badgeCount} badge-uri · {user.reportCount} rapoarte
        </p>
      </div>
      <div className="col-span-2 flex flex-wrap items-center justify-between gap-2 sm:col-span-1 sm:justify-end">
        <div className="text-left sm:text-right">
          <p className="text-xs font-bold text-emerald-700">
            {user.periodPoints} puncte
          </p>
          <p className="text-[0.68rem] font-semibold text-slate-500">
            {user.points} overall
          </p>
        </div>
        <Button asChild size="sm" variant="outline" className="h-8 border-slate-200 bg-white px-2 text-xs">
          <Link to={`/users/${user.id}`}>Profil</Link>
        </Button>
      </div>
    </article>
  )
}

function SummaryTile({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: typeof Trophy
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white/94 p-3 shadow-sm shadow-slate-900/5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.64rem] font-bold uppercase text-emerald-700">{label}</p>
          <p className="mt-1 truncate text-base font-bold text-slate-950">{value}</p>
        </div>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
    </article>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/70 bg-white/76 px-2 py-2 shadow-sm shadow-slate-900/4">
      <p className="text-sm font-bold text-slate-950">{value}</p>
      <p className="mt-0.5 truncate text-[0.62rem] font-bold uppercase text-slate-500">
        {label}
      </p>
    </div>
  )
}

function Avatar({
  user,
  size,
}: {
  user: Pick<LeaderboardUserResponse, 'avatarUrl' | 'fullName'>
  size: 'sm' | 'lg'
}) {
  const initials = user.fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-50 font-bold text-emerald-800 ring-1 ring-emerald-100',
        size === 'lg' ? 'size-12 text-base' : 'size-9 text-xs',
      )}
    >
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        <>
          <UserCircle className="size-5" aria-hidden="true" />
          <span className="sr-only">{initials}</span>
        </>
      )}
    </span>
  )
}
