import type { LucideIcon } from '@/components/icons/hugeicons'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  Clock3,
  Flag,
  Gift,
  MessageSquareText,
  Sparkles,
  Target,
  TriangleAlert,
  Users,
  X,
} from '@/components/icons/hugeicons'
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
    icon: TriangleAlert,
    className: 'bg-rose-50 text-rose-700',
    badgeClassName: 'bg-rose-50 text-rose-700 ring-rose-200',
  },
  in_progress: {
    icon: Clock3,
    className: 'bg-yellow-50 text-yellow-700',
    badgeClassName: 'bg-yellow-50 text-yellow-800 ring-yellow-200',
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
          'relative rounded-lg border border-emerald-200/80 bg-white/94 p-2.5 text-slate-950 shadow-sm backdrop-blur-md',
          className,
        )}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        aria-label="Element civic selectat"
      >
        <div className="grid grid-cols-[2rem_minmax(0,1fr)_1.75rem] items-start gap-2">
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-lg',
              style.className,
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center rounded-md px-2 py-0.5 text-[0.7rem] font-semibold leading-5 ring-1',
                  style.badgeClassName,
                )}
              >
                {item.statusLabel}
              </span>
              <span className="text-[0.7rem] font-medium leading-5 text-slate-500">
                {item.zone}
              </span>
            </div>

            <div
              className="mt-1 text-[0.78rem] font-semibold leading-[1.18] text-emerald-950"
              role="heading"
              aria-level={2}
            >
              {item.title}
            </div>
            <p className="mt-1 text-[0.82rem] leading-snug text-slate-600">
              {item.description}
            </p>
          </div>

          {onClose && (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="-mt-1 bg-white/80 text-slate-500 hover:bg-emerald-50 hover:text-emerald-800"
              aria-label="Inchide elementul selectat"
              onClick={onClose}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>

        {item.imageUrl && (
          <div className="mt-2 overflow-hidden rounded-md border border-emerald-100 bg-emerald-50">
            <img
              src={item.imageUrl}
              alt=""
              className="h-24 w-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        <div className="mt-2 grid gap-1.5 text-[0.78rem] leading-snug">
          <div className="flex items-start gap-1.5 rounded-md border border-slate-200 bg-slate-50/80 p-1.5">
            <Users className="mt-0.5 size-3.5 shrink-0 text-slate-500" aria-hidden="true" />
            <span className="text-slate-700">{item.meta}</span>
          </div>

          <div className="flex items-start gap-1.5 rounded-md border border-emerald-100 bg-emerald-50/80 p-1.5">
            <Target className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
            <span className="font-medium text-emerald-800">{item.impact}</span>
          </div>

          {item.pointsEarned !== undefined && (
            <div className="flex items-start gap-1.5 rounded-md border border-lime-100 bg-lime-50/80 p-1.5">
              <Sparkles className="mt-0.5 size-3.5 shrink-0 text-lime-700" aria-hidden="true" />
              <span className="font-medium text-lime-800">
                Puncte civice: +{item.pointsEarned}
              </span>
            </div>
          )}

          {item.aiSummary && (
            <div className="flex items-start gap-1.5 rounded-md border border-slate-200 bg-white p-1.5">
              <MessageSquareText className="mt-0.5 size-3.5 shrink-0 text-slate-500" aria-hidden="true" />
              <span className="text-slate-700">{item.aiSummary}</span>
            </div>
          )}

          {item.missionId && (
            <div className="flex items-start gap-1.5 rounded-md border border-lime-100 bg-lime-50/80 p-1.5">
              <Flag className="mt-0.5 size-3.5 shrink-0 text-lime-700" aria-hidden="true" />
              <span className="font-medium text-lime-900">
                Task comunitar conectat
                {item.participantsNeeded !== undefined &&
                  ` · ${item.participantsJoined ?? 0}/${item.participantsNeeded} inscrisi`}
              </span>
            </div>
          )}

          {item.duplicateCount !== undefined && item.duplicateCount > 0 && (
            <div className="flex items-start gap-1.5 rounded-md border border-amber-100 bg-amber-50/80 p-1.5">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-700" aria-hidden="true" />
              <span className="font-medium text-amber-900">
                {item.duplicateCount} semnal duplicat in apropiere
                {item.duplicateCount === 1 ? '' : 'e'}
                {item.nearestDuplicateTitle &&
                  ` · cel mai apropiat: ${item.nearestDuplicateTitle}${
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
                <span className="font-semibold text-slate-800">Responsabil:</span>{' '}
                {item.responsibleActor}
              </p>
            )}
            {item.relatedMission && (
              <p>
                <span className="font-semibold text-slate-800">Task:</span>{' '}
                {item.relatedMission}
              </p>
            )}
            {item.reward && (
              <p>
                <span className="font-semibold text-slate-800">Recompensa:</span>{' '}
                {item.reward}
              </p>
            )}
          </div>
        )}

        {detailsHref && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Button asChild size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700">
              <Link to={detailsHref}>Vezi detalii</Link>
            </Button>
            {item.missionId && item.kind !== 'mission' && (
              <Button asChild size="sm" variant="outline">
                <Link to={`/missions/${item.missionId}`}>Deschide misiunea</Link>
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
                  Inainte
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
                  Dupa
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
