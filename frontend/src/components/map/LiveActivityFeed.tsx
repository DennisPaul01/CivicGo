import type { LucideIcon } from '@/components/icons/hugeicons'
import {
  ArrowRight,
  CheckCircle2,
  Flag,
  Gift,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  Wrench,
} from '@/components/icons/hugeicons'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
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
    title: 'Eveniment activ',
    message: 'Curatenie pentru deseuri voluminoase inceputa in Soarelui',
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

const demoPushDelay = 5_000

const demoLiveActivityTemplates = [
  {
    type: 'issue_created',
    title: 'Raport nou',
    message: 'Trotuar blocat de deseuri semnalat in zona Dacia.',
  },
  {
    type: 'issue_analyzed',
    title: 'AI a verificat',
    message: 'AI a confirmat o problema de iluminat public in Fabric.',
  },
  {
    type: 'duplicate_detected',
    title: 'Dublura gasita',
    message: 'Doua sesizari despre acelasi trotuar au fost grupate in Mehala.',
  },
  {
    type: 'mission_created',
    title: 'Eveniment generat',
    message: 'Eveniment comunitar pentru deseuri voluminoase in Soarelui.',
  },
  {
    type: 'reward_matched',
    title: 'Reward gasit',
    message: 'CoffeeLab a potrivit o recompensa pentru voluntarii din Complex.',
  },
  {
    type: 'issue_in_progress',
    title: 'Echipa in teren',
    message: 'Sesizarea de pe Calea Sagului a intrat in verificare.',
  },
  {
    type: 'issue_analyzed',
    title: 'Prioritate crescuta',
    message: 'AI a marcat ca urgenta o problema de siguranta in Lipovei.',
  },
  {
    type: 'mission_created',
    title: 'Voluntari chemati',
    message: 'Eveniment nou pentru strangere de deseuri langa Bega.',
  },
  {
    type: 'reward_matched',
    title: 'Badge deblocat',
    message: 'Un reporter a deblocat First Reporter dupa prima sesizare valida.',
  },
  {
    type: 'issue_resolved',
    title: 'Rezolvat live',
    message: 'Cos de gunoi reparat si marcat ca rezolvat langa Parcul Central.',
  },
  {
    type: 'issue_created',
    title: 'Semnal civic',
    message: 'Groapa semnalata langa Girocului a aparut pe harta publica.',
  },
  {
    type: 'issue_in_progress',
    title: 'Trimis catre oras',
    message: 'Raportul despre mobilier urban deteriorat a fost preluat.',
  },
  {
    type: 'reward_matched',
    title: 'Partener activ',
    message: 'Bookstore a potrivit un discount pentru un eveniment din centru.',
  },
  {
    type: 'issue_resolved',
    title: 'Impact pe zona',
    message: 'Score-ul zonei Fabric a crescut dupa o rezolvare confirmata.',
  },
] satisfies Array<Pick<PublicActivityResponse, 'type' | 'title' | 'message'>>

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
        eyebrow: 'Eveniment activ',
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
  const diffMs = Date.now() - new Date(value).getTime()

  if (diffMs < 45_000) {
    return 'chiar acum'
  }

  if (diffMs < 60_000) {
    return 'sub 1 min'
  }

  const diffMinutes = Math.round(diffMs / 60_000)

  if (diffMinutes < 60) {
    return `acum ${diffMinutes} min`
  }

  const diffHours = Math.round(diffMinutes / 60)

  return `acum ${diffHours} h`
}

export function LiveActivityFeed() {
  const [demoPushItems, setDemoPushItems] = useState<PublicActivityResponse[]>([])
  const [isPushing, setIsPushing] = useState(false)
  const activityQuery = useQuery({
    queryKey: publicActivityQueryKey(48, 4),
    queryFn: () => fetchPublicActivity(48, 4),
  })
  const baseActivityItems = useMemo(
    () => (!isApiConfigured || activityQuery.isError ? fallbackActivityItems : activityQuery.data ?? []),
    [activityQuery.data, activityQuery.isError],
  )
  const activityItems = useMemo(
    () => [...demoPushItems, ...baseActivityItems].slice(0, 4),
    [baseActivityItems, demoPushItems],
  )

  useEffect(() => {
    let templateIndex = 0
    let pushResetTimer: number | undefined
    let pushTimer: number | undefined

    function scheduleNextPush() {
      pushTimer = window.setTimeout(() => {
        const template = demoLiveActivityTemplates[templateIndex % demoLiveActivityTemplates.length]
        templateIndex += 1

        setDemoPushItems((currentItems) => [
          {
            id: `demo-live-${Date.now()}-${templateIndex}`,
            ...template,
            relatedIssueId: null,
            relatedMissionId: null,
            relatedRewardId: null,
            relatedZoneId: null,
            createdAt: new Date().toISOString(),
          },
          ...currentItems,
        ].slice(0, 4))
        setIsPushing(true)

        if (pushResetTimer) {
          window.clearTimeout(pushResetTimer)
        }

        pushResetTimer = window.setTimeout(() => {
          setIsPushing(false)
        }, 1_400)

        scheduleNextPush()
      }, demoPushDelay)
    }

    scheduleNextPush()

    return () => {
      if (pushTimer) {
        window.clearTimeout(pushTimer)
      }

      if (pushResetTimer) {
        window.clearTimeout(pushResetTimer)
      }
    }
  }, [])

  return (
    <motion.aside
      className={cn(
        'rounded-lg border border-emerald-200/70 bg-white/90 p-3 text-slate-950 shadow-sm shadow-slate-900/8',
        isPushing && 'ring-3 ring-emerald-400/25',
      )}
      initial={{ opacity: 0, x: 12 }}
      animate={{
        opacity: 1,
        x: 0,
        scale: isPushing ? 1.015 : 1,
      }}
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
        <motion.span
          className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-1 text-[0.66rem] font-semibold text-emerald-700"
          animate={isPushing ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <TrendingUp className="size-3" aria-hidden="true" />
          {isPushing ? 'Push live' : 'Live'}
        </motion.span>
      </div>

      <div className="mt-3">
        <div className="flex flex-col gap-2">
          {activityItems.length > 0 ? (
            <AnimatePresence initial={false} mode="popLayout">
              {activityItems.map((item, index) => {
                const tone = getActivityTone(item.type)
                const Icon = tone.icon
                const isDemoPush = item.id.startsWith('demo-live-')

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: -12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    <Link
                      to={getActivityHref(item)}
                      className={cn(
                        'flex min-h-16 gap-2 rounded-md border border-slate-200 bg-white/82 p-2 transition hover:border-emerald-300 hover:bg-emerald-50/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-500/25',
                        isDemoPush &&
                          index === 0 &&
                          'border-emerald-300 bg-emerald-50/60 shadow-sm shadow-emerald-900/10',
                      )}
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
                  </motion.div>
                )
              })}
            </AnimatePresence>
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
