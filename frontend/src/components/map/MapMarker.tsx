import {
  Check,
  Clock3,
  Flag,
  Gift,
  MapPin,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

export type MapMarkerKind =
  | 'new'
  | 'ai_checked'
  | 'in_progress'
  | 'resolved'
  | 'mission'
  | 'reward'
  | 'urgent'

export type MapFilterKind = 'all' | MapMarkerKind

type MapMarkerProps = {
  kind: MapMarkerKind
  label: string
  isSelected?: boolean
  onSelect?: () => void
}

const markerStyles: Record<
  MapMarkerKind,
  {
    className: string
    icon: typeof MapPin
  }
> = {
  new: {
    className: 'border-emerald-200 bg-emerald-500 text-white shadow-emerald-900/20',
    icon: MapPin,
  },
  ai_checked: {
    className: 'border-purple-200 bg-purple-500 text-white shadow-purple-900/20',
    icon: Sparkles,
  },
  in_progress: {
    className: 'border-yellow-200 bg-yellow-300 text-yellow-950 shadow-yellow-900/20',
    icon: Clock3,
  },
  resolved: {
    className: 'border-emerald-200 bg-emerald-600 text-white shadow-emerald-900/20',
    icon: Check,
  },
  mission: {
    className: 'border-slate-200 bg-slate-700 text-white shadow-slate-900/20',
    icon: Flag,
  },
  reward: {
    className: 'border-yellow-200 bg-yellow-300 text-yellow-950 shadow-yellow-900/20',
    icon: Gift,
  },
  urgent: {
    className: 'border-rose-200 bg-rose-500 text-white shadow-rose-900/20',
    icon: TriangleAlert,
  },
}

export function MapMarker({
  kind,
  label,
  isSelected = false,
  onSelect,
}: MapMarkerProps) {
  const style = markerStyles[kind]
  const Icon = style.icon

  return (
    <motion.button
      type="button"
      className={cn(
        'flex size-8 items-center justify-center rounded-full border-2 border-white/90 shadow-md outline-none transition-shadow focus-visible:ring-3 focus-visible:ring-emerald-500/30',
        isSelected && 'z-10 size-10 ring-3 ring-emerald-950/15 shadow-xl',
        style.className,
      )}
      initial={{ opacity: 0, scale: 0.55 }}
      animate={{ opacity: 1, scale: isSelected ? 1.12 : 1 }}
      whileHover={{ scale: isSelected ? 1.16 : 1.1 }}
      transition={{ type: 'spring', stiffness: 360, damping: 24 }}
      aria-label={label}
      aria-pressed={isSelected}
      title={label}
      onClick={(event) => {
        event.stopPropagation()
        onSelect?.()
      }}
    >
      <Icon className="size-4" aria-hidden="true" />
    </motion.button>
  )
}
