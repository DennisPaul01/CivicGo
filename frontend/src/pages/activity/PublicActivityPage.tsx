import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft,
  CheckCircle2,
  Flag,
  Gift,
  Sparkles,
  TriangleAlert,
  Wrench,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { fetchPublicActivity, isApiConfigured, type PublicActivityResponse } from '@/lib/api'
import { publicActivityQueryKey } from '@/lib/queryClient'
import { cn } from '@/lib/utils'

type ActivityTone = {
  icon: LucideIcon
  className: string
  label: string
}

function getActivityTone(type: string): ActivityTone {
  switch (type) {
    case 'issue_created':
    case 'duplicate_detected':
      return {
        icon: TriangleAlert,
        className: 'bg-rose-50 text-rose-600 ring-rose-100',
        label: 'Problemă',
      }
    case 'issue_analyzed':
    case 'issue_in_progress':
      return {
        icon: Wrench,
        className: 'bg-yellow-50 text-yellow-700 ring-yellow-100',
        label: 'În progres',
      }
    case 'issue_resolved':
      return {
        icon: CheckCircle2,
        className: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
        label: 'Rezolvată',
      }
    case 'mission_created':
      return {
        icon: Flag,
        className: 'bg-blue-50 text-blue-700 ring-blue-100',
        label: 'Misiune',
      }
    case 'reward_matched':
      return {
        icon: Gift,
        className: 'bg-orange-50 text-orange-700 ring-orange-100',
        label: 'Recompensă',
      }
    default:
      return {
        icon: Sparkles,
        className: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
        label: 'Activitate',
      }
  }
}

function formatActivityDate(value: string) {
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getActivityHref(item: PublicActivityResponse) {
  if (item.relatedMissionId) {
    return `/missions/${item.relatedMissionId}`
  }

  if (item.relatedIssueId) {
    return `/issues/${item.relatedIssueId}`
  }

  if (item.relatedRewardId) {
    return '/rewards'
  }

  return null
}

export function PublicActivityPage() {
  const activityQuery = useQuery({
    queryKey: publicActivityQueryKey(48, 100),
    queryFn: () => fetchPublicActivity(48, 100),
  })
  const activityItems =
    !isApiConfigured || activityQuery.isError ? [] : activityQuery.data ?? []

  return (
    <main className="min-h-svh bg-orange-50 px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-12">
        <TopNavigation />

        <section className="rounded-2xl border border-emerald-200 bg-white/94 p-4 shadow-sm shadow-slate-900/8 sm:p-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-500/25"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Înapoi la hartă
          </Link>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Ultimele 48 de ore
              </p>
              <h1 className="mt-1 text-3xl font-bold text-slate-950">
                Toată activitatea publică
              </h1>
            </div>
            <span className="self-start rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 sm:self-auto">
              {activityItems.length} actualizări
            </span>
          </div>

          <div className="mt-6 max-h-[70svh] overflow-y-auto pr-1">
            <div className="flex flex-col gap-3">
              {activityItems.length > 0 ? (
                activityItems.map((item) => {
                  const tone = getActivityTone(item.type)
                  const Icon = tone.icon
                  const href = getActivityHref(item)
                  const content = (
                    <>
                      <span
                        className={cn(
                          'flex size-10 shrink-0 items-center justify-center rounded-lg ring-1',
                          tone.className,
                        )}
                      >
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                          {tone.label} · {formatActivityDate(item.createdAt)}
                        </span>
                        <span className="mt-1 block text-base font-bold leading-snug text-slate-950">
                          {item.message}
                        </span>
                        <span className="mt-1 block text-sm font-medium text-slate-500">
                          {item.title}
                        </span>
                      </span>
                    </>
                  )

                  return href ? (
                    <Link
                      key={item.id}
                      to={href}
                      className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:bg-emerald-50/35 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-500/25"
                    >
                      {content}
                    </Link>
                  ) : (
                    <article
                      key={item.id}
                      className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4"
                    >
                      {content}
                    </article>
                  )
                })
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-500">
                  Nu există activitate publică în ultimele 48 de ore.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
