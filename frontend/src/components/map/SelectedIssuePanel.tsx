import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  Clock3,
  Flag,
  Gift,
  MapPin,
  Sparkles,
  Target,
  TriangleAlert,
  Users,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CivicMapItem } from '@/data/civicMapData'

type SelectedIssuePanelProps = {
  item: CivicMapItem
  className?: string
  onClose?: () => void
}

const itemStyles: Record<
  CivicMapItem['kind'],
  {
    icon: LucideIcon
    className: string
    badgeClassName: string
  }
> = {
  new: {
    icon: MapPin,
    className: 'bg-teal-50 text-teal-700',
    badgeClassName: 'bg-teal-50 text-teal-700 ring-teal-200',
  },
  ai_checked: {
    icon: Sparkles,
    className: 'bg-purple-50 text-purple-700',
    badgeClassName: 'bg-purple-50 text-purple-700 ring-purple-200',
  },
  in_progress: {
    icon: Clock3,
    className: 'bg-amber-50 text-amber-700',
    badgeClassName: 'bg-amber-50 text-amber-800 ring-amber-200',
  },
  resolved: {
    icon: CheckCircle2,
    className: 'bg-orange-50 text-emerald-700',
    badgeClassName: 'bg-orange-50 text-emerald-700 ring-emerald-200',
  },
  mission: {
    icon: Flag,
    className: 'bg-slate-50 text-slate-700',
    badgeClassName: 'bg-slate-50 text-slate-700 ring-slate-200',
  },
  reward: {
    icon: Gift,
    className: 'bg-yellow-50 text-yellow-700',
    badgeClassName: 'bg-yellow-50 text-yellow-800 ring-yellow-200',
  },
  urgent: {
    icon: TriangleAlert,
    className: 'bg-rose-50 text-rose-700',
    badgeClassName: 'bg-rose-50 text-rose-700 ring-rose-200',
  },
}

export function SelectedIssuePanel({
  item,
  className,
  onClose,
}: SelectedIssuePanelProps) {
  const style = itemStyles[item.kind]
  const Icon = style.icon
  const detailsHref =
    item.source === 'api' && item.kind === 'mission' && item.missionId
      ? `/missions/${item.missionId}`
      : item.source === 'api' && item.kind !== 'reward'
        ? `/issues/${item.id}`
        : null

  return (
    <AnimatePresence mode="wait">
      <motion.aside
        key={item.id}
        className={cn(
          'relative rounded-lg border border-emerald-200/80 bg-white/94 p-3 text-slate-950 shadow-sm backdrop-blur-md',
          onClose && 'pr-10',
          className,
        )}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        aria-label="Selected civic item"
      >
        {onClose && (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="absolute right-2 top-2 z-10 bg-white/80 text-slate-500 hover:bg-emerald-50 hover:text-emerald-800"
            aria-label="Close selected item"
            onClick={onClose}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        )}
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-lg',
              style.className,
            )}
          >
            <Icon className="size-4.5" aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1',
                  style.badgeClassName,
                )}
              >
                {item.statusLabel}
              </span>
              <span className="text-xs font-medium text-slate-500">
                {item.zone}
              </span>
            </div>

            <h2 className="mt-2 text-base font-semibold leading-tight text-emerald-950">
              {item.title}
            </h2>
            <p className="mt-1 text-sm leading-snug text-slate-600">
              {item.description}
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-2 text-sm">
          <div className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50/80 p-2">
            <Users className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden="true" />
            <span className="text-slate-700">{item.meta}</span>
          </div>

          <div className="flex items-start gap-2 rounded-md border border-emerald-100 bg-emerald-50/80 p-2">
            <Target className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
            <span className="font-medium text-emerald-800">{item.impact}</span>
          </div>

          {item.pointsEarned !== undefined && (
            <div className="flex items-start gap-2 rounded-md border border-lime-100 bg-lime-50/80 p-2">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-lime-700" aria-hidden="true" />
              <span className="font-medium text-lime-800">
                Points shown for map demo: +{item.pointsEarned}
              </span>
            </div>
          )}

          {item.aiSummary && (
            <div className="flex items-start gap-2 rounded-md border border-purple-100 bg-purple-50/80 p-2">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-purple-700" aria-hidden="true" />
              <span className="text-purple-900">{item.aiSummary}</span>
            </div>
          )}

          {item.missionId && (
            <div className="flex items-start gap-2 rounded-md border border-lime-100 bg-lime-50/80 p-2">
              <Flag className="mt-0.5 size-4 shrink-0 text-lime-700" aria-hidden="true" />
              <span className="font-medium text-lime-900">
                Mission linked
                {item.participantsNeeded !== undefined &&
                  ` · ${item.participantsJoined ?? 0}/${item.participantsNeeded} joined`}
              </span>
            </div>
          )}

          {item.duplicateCount !== undefined && item.duplicateCount > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-amber-100 bg-amber-50/80 p-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden="true" />
              <span className="font-medium text-amber-900">
                {item.duplicateCount} nearby duplicate signal
                {item.duplicateCount === 1 ? '' : 's'}
                {item.nearestDuplicateTitle &&
                  ` · nearest ${item.nearestDuplicateTitle}${
                    item.nearestDuplicateDistanceMeters
                      ? ` (${item.nearestDuplicateDistanceMeters}m)`
                      : ''
                  }`}
              </span>
            </div>
          )}
        </div>

        {(item.responsibleActor || item.relatedMission || item.reward) && (
          <div className="mt-3 grid gap-2 text-xs text-slate-600">
            {item.responsibleActor && (
              <p>
                <span className="font-semibold text-slate-800">Owner:</span>{' '}
                {item.responsibleActor}
              </p>
            )}
            {item.relatedMission && (
              <p>
                <span className="font-semibold text-slate-800">Mission:</span>{' '}
                {item.relatedMission}
              </p>
            )}
            {item.reward && (
              <p>
                <span className="font-semibold text-slate-800">Reward:</span>{' '}
                {item.reward}
              </p>
            )}
          </div>
        )}

        {detailsHref && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Button asChild size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700">
              <Link to={detailsHref}>View details</Link>
            </Button>
            {item.missionId && item.kind !== 'mission' && (
              <Button asChild size="sm" variant="outline">
                <Link to={`/missions/${item.missionId}`}>Open mission</Link>
              </Button>
            )}
          </div>
        )}

        {item.beforeAfter && (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="overflow-hidden rounded-md border border-rose-100 bg-rose-50">
              {item.beforeAfter.beforeImage && (
                <img
                  src={item.beforeAfter.beforeImage}
                  alt=""
                  className="h-20 w-full object-cover"
                  loading="lazy"
                />
              )}
              <div className="p-2">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-rose-700">
                  Before
                </p>
                <p className="mt-1 text-xs leading-snug text-slate-700">
                  {item.beforeAfter.before}
                </p>
              </div>
            </div>
            <div className="overflow-hidden rounded-md border border-emerald-100 bg-emerald-50">
              {item.beforeAfter.afterImage && (
                <img
                  src={item.beforeAfter.afterImage}
                  alt=""
                  className="h-20 w-full object-cover"
                  loading="lazy"
                />
              )}
              <div className="p-2">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-700">
                  After
                </p>
                <p className="mt-1 text-xs leading-snug text-slate-700">
                  {item.beforeAfter.after}
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.aside>
    </AnimatePresence>
  )
}
