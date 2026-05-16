import type { LucideIcon } from '@/components/icons/hugeicons'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  Clock3,
  Flag,
  Gift,
  MessageSquareText,
  Search,
  Sparkles,
  Target,
  TriangleAlert,
  Users,
  X,
} from '@/components/icons/hugeicons'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { cn, isSameDisplayText } from '@/lib/utils'
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
  const [preview, setPreview] = useState<null | {
    title: string
    images: Array<{
      label: string
      imageUrl: string
      tone: 'emerald' | 'rose'
    }>
  }>(null)
  const style = itemStyles[item.kind]
  const Icon = style.icon
  const detailsHref =
    item.source === 'api' && item.kind === 'mission' && item.missionId
      ? `/missions/${item.missionId}`
      : item.source === 'api' && item.kind !== 'reward'
        ? `/issues/${item.id}`
        : null
  const primaryImageUrl = item.imageUrl
  const shouldShowAiSummary =
    Boolean(item.aiSummary) &&
    !isSameDisplayText(item.aiSummary, item.description)

  return (
    <AnimatePresence mode="wait">
      <motion.aside
        key={item.id}
        className={cn(
          'relative rounded-xl border border-emerald-200 bg-white p-3.5 text-slate-950 shadow-sm shadow-emerald-950/8 ring-1 ring-white sm:p-4',
          className,
        )}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        aria-label="Element civic selectat"
      >
        <div className="grid grid-cols-[2.25rem_minmax(0,1fr)_2rem] items-start gap-2.5 sm:grid-cols-[2.5rem_minmax(0,1fr)_2.25rem] sm:gap-3">
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-lg sm:size-10',
              style.className,
            )}
          >
            <Icon className="size-4 sm:size-5" aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center rounded-md px-2 py-0.5 text-[0.7rem] font-semibold leading-5 ring-1 sm:text-xs',
                  style.badgeClassName,
                )}
              >
                {item.statusLabel}
              </span>
              <span className="text-[0.7rem] font-medium leading-5 text-slate-500 sm:text-xs">
                {item.zone}
              </span>
            </div>

            <div
              className="mt-1 text-sm font-bold leading-tight text-emerald-950 sm:text-[0.98rem]"
              role="heading"
              aria-level={2}
            >
              {item.title}
            </div>
            <p className="mt-1 text-sm leading-snug text-slate-600">
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

        {primaryImageUrl && (
          <button
            type="button"
            className="group mt-2 block w-full overflow-hidden rounded-md border border-emerald-100 bg-emerald-50 text-left outline-none transition hover:border-emerald-300 focus-visible:ring-3 focus-visible:ring-emerald-300/60"
            aria-label="Mareste fotografia semnalului"
            onClick={() =>
              setPreview({
                title: item.title,
                images: [
                  {
                    label: 'Fotografie',
                    imageUrl: primaryImageUrl,
                    tone: 'emerald',
                  },
                ],
              })
            }
          >
            <span className="relative flex aspect-[16/7] w-full items-center justify-center bg-slate-100">
              <img
                src={primaryImageUrl}
                alt=""
                className="h-full w-full object-contain"
                loading="lazy"
              />
              <span className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-lg bg-white/90 text-emerald-700 opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-visible:opacity-100">
                <Search className="size-4" aria-hidden="true" />
              </span>
            </span>
          </button>
        )}

        <div className="mt-3 grid gap-2 text-sm leading-snug">
          <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
            <Users className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden="true" />
            <span className="text-slate-700">{item.meta}</span>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-2">
            <Target className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
            <span className="font-medium text-emerald-800">{item.impact}</span>
          </div>

          {item.pointsEarned !== undefined && (
            <div className="flex items-start gap-2 rounded-lg border border-lime-100 bg-lime-50 p-2">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-lime-700" aria-hidden="true" />
              <span className="font-medium text-lime-800">
                Puncte civice: +{item.pointsEarned}
              </span>
            </div>
          )}

          {shouldShowAiSummary && item.aiSummary && (
            <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-2">
              <MessageSquareText className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden="true" />
              <span className="text-slate-700">{item.aiSummary}</span>
            </div>
          )}

          {item.missionId && (
            <div className="flex items-start gap-2 rounded-lg border border-lime-100 bg-lime-50 p-2">
              <Flag className="mt-0.5 size-4 shrink-0 text-lime-700" aria-hidden="true" />
              <span className="font-medium text-lime-900">
                Eveniment comunitar conectat
                {item.participantsNeeded !== undefined &&
                  ` · ${item.participantsJoined ?? 0}/${item.participantsNeeded} inscrisi`}
              </span>
            </div>
          )}

          {item.duplicateCount !== undefined && item.duplicateCount > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 p-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden="true" />
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
                <span className="font-semibold text-slate-800">Eveniment:</span>{' '}
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
                <Link to={`/missions/${item.missionId}`}>Vezi evenimentul</Link>
              </Button>
            )}
          </div>
        )}

        {item.beforeAfter && (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <BeforeAfterCard
              label="Inainte"
              description={item.beforeAfter.before}
              imageUrl={item.beforeAfter.beforeImage}
              tone="rose"
              onOpen={() =>
                setPreview({
                  title: 'Compara inainte si dupa',
                  images: [
                    ...(item.beforeAfter?.beforeImage
                      ? [
                          {
                            label: 'Inainte',
                            imageUrl: item.beforeAfter.beforeImage,
                            tone: 'rose' as const,
                          },
                        ]
                      : []),
                    ...(item.beforeAfter?.afterImage
                      ? [
                          {
                            label: 'Dupa',
                            imageUrl: item.beforeAfter.afterImage,
                            tone: 'emerald' as const,
                          },
                        ]
                      : []),
                  ],
                })
              }
            />
            <BeforeAfterCard
              label="Dupa"
              description={item.beforeAfter.after}
              imageUrl={item.beforeAfter.afterImage}
              tone="emerald"
              onOpen={() =>
                setPreview({
                  title: 'Compara inainte si dupa',
                  images: [
                    ...(item.beforeAfter?.beforeImage
                      ? [
                          {
                            label: 'Inainte',
                            imageUrl: item.beforeAfter.beforeImage,
                            tone: 'rose' as const,
                          },
                        ]
                      : []),
                    ...(item.beforeAfter?.afterImage
                      ? [
                          {
                            label: 'Dupa',
                            imageUrl: item.beforeAfter.afterImage,
                            tone: 'emerald' as const,
                          },
                        ]
                      : []),
                  ],
                })
              }
            />
          </div>
        )}

        <ImagePreviewDialog preview={preview} onClose={() => setPreview(null)} />
      </motion.aside>
    </AnimatePresence>
  )
}

function BeforeAfterCard({
  label,
  description,
  imageUrl,
  tone,
  onOpen,
}: {
  label: string
  description: string
  imageUrl?: string
  tone: 'emerald' | 'rose'
  onOpen: () => void
}) {
  const toneClass =
    tone === 'emerald'
      ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
      : 'border-rose-100 bg-rose-50 text-rose-700'

  return (
    <button
      type="button"
      className={cn(
        'group overflow-hidden rounded-md border text-left outline-none transition hover:border-emerald-300 focus-visible:ring-3 focus-visible:ring-emerald-300/60',
        toneClass,
      )}
      aria-label={`Mareste comparatia ${label.toLowerCase()}`}
      onClick={onOpen}
    >
      {imageUrl && (
        <span className="relative flex aspect-[4/3] w-full items-center justify-center bg-white">
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-contain"
            loading="lazy"
          />
          <span className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-lg bg-white/90 text-emerald-700 opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-visible:opacity-100">
            <Search className="size-3.5" aria-hidden="true" />
          </span>
        </span>
      )}
      <span className="block p-2">
        <span className="block text-[0.65rem] font-semibold uppercase tracking-wide">
          {label}
        </span>
        <span className="mt-1 block text-xs leading-snug text-slate-700">
          {description}
        </span>
      </span>
    </button>
  )
}

function ImagePreviewDialog({
  preview,
  onClose,
}: {
  preview: null | {
    title: string
    images: Array<{
      label: string
      imageUrl: string
      tone: 'emerald' | 'rose'
    }>
  }
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {preview && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={preview.title}
          onClick={onClose}
        >
          <motion.div
            className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-xl border border-white/20 bg-white shadow-2xl"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-emerald-100 px-3 py-2.5 sm:px-4">
              <h2 className="min-w-0 truncate text-sm font-semibold text-emerald-950 sm:text-base">
                {preview.title}
              </h2>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Inchide previzualizarea imaginii"
                onClick={onClose}
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>
            <div className="grid max-h-[calc(92vh-3.25rem)] gap-3 overflow-auto bg-slate-50 p-3 sm:grid-cols-2 sm:p-4">
              {preview.images.map((image) => (
                <figure
                  key={`${image.label}-${image.imageUrl}`}
                  className="overflow-hidden rounded-lg border border-emerald-100 bg-white"
                >
                  <div className="flex max-h-[72vh] min-h-60 items-center justify-center bg-slate-100">
                    <img
                      src={image.imageUrl}
                      alt=""
                      className="max-h-[72vh] w-full object-contain"
                    />
                  </div>
                  <figcaption
                    className={cn(
                      'px-3 py-2 text-xs font-semibold uppercase tracking-wide',
                      image.tone === 'emerald'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700',
                    )}
                  >
                    {image.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
