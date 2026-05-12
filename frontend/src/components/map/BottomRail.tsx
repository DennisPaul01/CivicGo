import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  CheckCircle2,
  Flag,
  Gift,
  MapPinned,
  Sparkles,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { motion } from 'motion/react'
import {
  civicMapItems,
  type CivicMapItem,
} from '@/data/civicMapData'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/stores/mapStore'

type RailMoment = {
  key: string
  label: string
  title: string
  description: string
  item: CivicMapItem
  icon: LucideIcon
  className: string
  actionLabel: string
}

function pickFirst(items: CivicMapItem[], kinds: CivicMapItem['kind'][]) {
  return items.find((item) => kinds.includes(item.kind))
}

function buildRailMoments(items: CivicMapItem[]) {
  const priorityItem = pickFirst(items, ['urgent', 'new', 'ai_checked'])
  const missionItem = pickFirst(items, ['mission', 'in_progress'])
  const resolvedItem = pickFirst(items, ['resolved'])
  const rewardItem =
    items.find((item) => item.reward && item.kind !== 'resolved') ??
    pickFirst(items, ['reward'])

  return [
    priorityItem && {
      key: 'priority',
      label: priorityItem.kind === 'urgent' ? 'Needs attention' : 'Fresh signal',
      title: priorityItem.title,
      description: priorityItem.meta,
      item: priorityItem,
      icon: priorityItem.kind === 'urgent' ? TriangleAlert : Sparkles,
      className:
        priorityItem.kind === 'urgent'
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700',
      actionLabel: 'Focus report',
    },
    missionItem && {
      key: 'mission',
      label: 'Mission to join',
      title: missionItem.relatedMission ?? missionItem.title,
      description: missionItem.meta,
      item: missionItem,
      icon: Flag,
      className: 'border-slate-200 bg-slate-50 text-slate-700',
      actionLabel: 'Open mission',
    },
    resolvedItem && {
      key: 'proof',
      label: 'Proof of impact',
      title: resolvedItem.title,
      description: resolvedItem.beforeAfter?.after ?? resolvedItem.meta,
      item: resolvedItem,
      icon: CheckCircle2,
      className: 'border-teal-200 bg-teal-50 text-teal-700',
      actionLabel: 'Show result',
    },
    rewardItem && {
      key: 'reward',
      label: 'Matched reward',
      title: rewardItem.reward ?? rewardItem.title,
      description: rewardItem.impact,
      item: rewardItem,
      icon: Gift,
      className: 'border-yellow-200 bg-yellow-50 text-yellow-800',
      actionLabel: 'View reward',
    },
  ].filter(Boolean) as RailMoment[]
}

function countItems(items: CivicMapItem[], kinds: CivicMapItem['kind'][]) {
  return items.filter((item) => kinds.includes(item.kind)).length
}

type RailMomentCardProps = {
  moment: RailMoment
  onSelect: (item: CivicMapItem) => void
}

function RailMomentCard({ moment, onSelect }: RailMomentCardProps) {
  const Icon = moment.icon

  return (
    <motion.button
      type="button"
      className="group flex min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/35 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-500/25 sm:min-h-36"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(moment.item)}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg border',
            moment.className,
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {moment.label}
          </p>
          <h3 className="mt-1 text-sm font-semibold leading-tight text-emerald-950">
            {moment.title}
          </h3>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-snug text-slate-600">
        {moment.description}
      </p>

      <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-xs font-semibold">
        <span className="min-w-0 truncate rounded-md bg-slate-50 px-2 py-1 text-slate-600">
          {moment.item.zone}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 text-emerald-700 group-hover:text-emerald-800">
          {moment.actionLabel}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </span>
      </div>
    </motion.button>
  )
}

type BottomRailProps = {
  items?: CivicMapItem[]
}

export function BottomRail({ items = civicMapItems }: BottomRailProps) {
  const setActiveFilter = useMapStore((state) => state.setActiveFilter)
  const setSelectedItemId = useMapStore((state) => state.setSelectedItemId)
  const moments = buildRailMoments(items).slice(0, 4)
  const openCount = countItems(items, ['new', 'ai_checked', 'urgent'])
  const missionCount = countItems(items, ['mission', 'in_progress'])
  const resolvedCount = countItems(items, ['resolved'])

  function selectItem(item: CivicMapItem) {
    setSelectedItemId(item.id)
    setActiveFilter(item.kind)
  }

  return (
    <motion.section
      className="rounded-lg border border-emerald-200 bg-white/92 p-3 shadow-sm"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut', delay: 0.08 }}
      aria-label="City action queue"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            City action queue
          </p>
          <h2 className="text-base font-semibold text-emerald-950">
            Live signals moving from report to impact
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-slate-600 sm:flex">
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-emerald-800">
            <Sparkles className="size-3.5" aria-hidden="true" />
            {openCount} open
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-slate-700">
            <Users className="size-3.5" aria-hidden="true" />
            {missionCount} missions
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-1 text-teal-800">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            {resolvedCount} resolved
          </span>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {moments.map((moment) => (
          <RailMomentCard
            key={moment.key}
            moment={moment}
            onSelect={selectItem}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2 rounded-md border border-emerald-100 bg-emerald-50/70 p-2 text-sm text-emerald-900 sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-2 font-medium">
          <MapPinned className="size-4 shrink-0" aria-hidden="true" />
          Signal, mission, proof and reward are connected on the same map.
        </span>
        <button
          type="button"
          className="inline-flex items-center gap-1 self-start rounded-md px-2 py-1 text-xs font-bold uppercase text-emerald-800 hover:bg-white/80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-500/25 sm:self-auto"
          onClick={() => {
            setActiveFilter('all')
            setSelectedItemId(null)
          }}
        >
          Reset map
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </motion.section>
  )
}
