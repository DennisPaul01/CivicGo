import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  CheckCircle2,
  Flag,
  Gift,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  Wrench,
} from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchPublicActivity, isApiConfigured, type PublicActivityResponse } from '@/lib/api'
import { publicActivityQueryKey } from '@/lib/queryClient'
import { cn } from '@/lib/utils'

type ActivityTone = {
  icon: LucideIcon
  className: string
  eyebrow: string
}

const fallbackActivityItems: PublicActivityResponse[] = [
  {
    id: 'demo-activity-resolved',
    type: 'issue_resolved',
    title: 'Rezolvat acum 12 min',
    message: 'Deșeuri curățate lângă Parcul Central',
    relatedIssueId: null,
    relatedMissionId: null,
    relatedRewardId: null,
    relatedZoneId: null,
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-activity-mission',
    type: 'mission_created',
    title: 'Misiune activă',
    message: 'Verificare spațiu verde începută în Soarelui',
    relatedIssueId: null,
    relatedMissionId: null,
    relatedRewardId: null,
    relatedZoneId: null,
    createdAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-activity-progress',
    type: 'issue_in_progress',
    title: 'În progres',
    message: 'Bec stradal defect trimis către primărie în Fabric',
    relatedIssueId: null,
    relatedMissionId: null,
    relatedRewardId: null,
    relatedZoneId: null,
    createdAt: new Date(Date.now() - 86 * 60 * 1000).toISOString(),
  },
]

function getActivityTone(type: string): ActivityTone {
  switch (type) {
    case 'issue_created':
    case 'duplicate_detected':
      return {
        icon: TriangleAlert,
        className: 'bg-rose-50 text-rose-600',
        eyebrow: 'Problemă raportată',
      }
    case 'issue_analyzed':
    case 'issue_in_progress':
      return {
        icon: Wrench,
        className: 'bg-yellow-50 text-yellow-700',
        eyebrow: 'În progres',
      }
    case 'issue_resolved':
      return {
        icon: CheckCircle2,
        className: 'bg-emerald-50 text-emerald-600',
        eyebrow: 'Rezolvat',
      }
    case 'mission_created':
      return {
        icon: Flag,
        className: 'bg-blue-50 text-blue-700',
        eyebrow: 'Misiune activă',
      }
    case 'reward_matched':
      return {
        icon: Gift,
        className: 'bg-orange-50 text-orange-700',
        eyebrow: 'Recompensă',
      }
    default:
      return {
        icon: Sparkles,
        className: 'bg-emerald-50 text-emerald-700',
        eyebrow: 'Activitate',
      }
  }
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

  return '/activity'
}

function formatRelativeTime(value: string) {
  const diffMinutes = Math.max(
    1,
    Math.round((Date.now() - new Date(value).getTime()) / 60_000),
  )

  if (diffMinutes < 60) {
    return `acum ${diffMinutes} min`
  }

  const diffHours = Math.round(diffMinutes / 60)

  return `acum ${diffHours} h`
}

export function LiveActivityFeed() {
  const activityQuery = useQuery({
    queryKey: publicActivityQueryKey(48, 4),
    queryFn: () => fetchPublicActivity(48, 4),
  })
  const activityItems =
    !isApiConfigured || activityQuery.isError
      ? fallbackActivityItems
      : activityQuery.data ?? []

  return (
    <motion.aside
      className="rounded-lg border border-emerald-200/70 bg-white/90 p-3 text-slate-950 shadow-sm shadow-slate-900/8"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      aria-label="Flux public de activitate"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-wide text-emerald-700">
            Activitate publică
          </p>
          <div
            className="mt-0.5 text-sm font-bold leading-none text-slate-900"
            role="heading"
            aria-level={2}
          >
            Actualizări recente
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-1 text-[0.66rem] font-semibold text-emerald-700">
          <TrendingUp className="size-3" aria-hidden="true" />
          Live
        </span>
      </div>

      <div className="mt-3">
        <div className="flex flex-col gap-2">
          {activityItems.length > 0 ? (
            activityItems.slice(0, 4).map((item) => {
              const tone = getActivityTone(item.type)
              const Icon = tone.icon

              return (
                <Link
                  key={item.id}
                  to={getActivityHref(item)}
                  className="flex min-h-16 gap-2 rounded-md border border-slate-200 bg-white/82 p-2 transition hover:border-emerald-300 hover:bg-emerald-50/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-500/25"
                >
                  <span
                    className={cn(
                      'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md',
                      tone.className,
                    )}
                  >
                    <Icon className="size-3" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[0.58rem] font-bold uppercase tracking-wide text-slate-500">
                      {item.title || tone.eyebrow} · {formatRelativeTime(item.createdAt)}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-[0.76rem] font-semibold leading-snug text-slate-900">
                      {item.message}
                    </span>
                  </span>
                </Link>
              )
            })
          ) : (
            <div className="rounded-md border border-slate-200 bg-white/82 p-2 text-[0.76rem] font-medium text-slate-500">
              Nu există activitate publică în ultimele 48 de ore.
            </div>
          )}
        </div>
      </div>

      <Link
        to="/activity"
        className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-3 py-1.5 text-[0.76rem] font-bold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-500/25"
      >
        Vezi toată activitatea
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </motion.aside>
  )
}
