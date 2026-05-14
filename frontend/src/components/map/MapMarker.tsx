import {
  Check,
  Clock3,
  Flag,
  Gift,
  type LucideIcon,
  TriangleAlert,
} from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

export type MapMarkerKind =
  | 'new'
  | 'in_progress'
  | 'resolved'
  | 'mission'
  | 'reward'

export type MapFilterKind = 'all' | MapMarkerKind

type MapMarkerProps = {
  kind: MapMarkerKind
  label: string
  isSelected?: boolean
  isHighlighted?: boolean
  revealDelayMs?: number
  onSelect?: () => void
}

const markerStyles: Record<
  MapMarkerKind,
  {
    className: string
    icon: LucideIcon
  }
> = {
  new: {
    className: 'border-rose-100 bg-rose-500 text-white shadow-rose-900/25',
    icon: TriangleAlert,
  },
  in_progress: {
    className: 'border-yellow-100 bg-yellow-400 text-yellow-950 shadow-yellow-900/25',
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
}

export function MapMarker({
  kind,
  label,
  isSelected = false,
  isHighlighted = false,
  revealDelayMs = 0,
  onSelect,
}: MapMarkerProps) {
  const style = markerStyles[kind]
  const Icon = style.icon
  const isEmphasized = isSelected || isHighlighted

  return (
    <motion.button
      type="button"
      className={cn(
        'flex size-9 items-center justify-center rounded-full border-3 border-white/95 shadow-lg outline-none transition-shadow focus-visible:ring-3 focus-visible:ring-emerald-500/30',
        isEmphasized && 'z-10 size-11 ring-4 ring-rose-950/15 shadow-xl',
        style.className,
      )}
      initial={{ opacity: 0, scale: 0.55 }}
      animate={
        isHighlighted
          ? { opacity: 1, scale: [0.55, 1.38, 1.04, 1.16, 1.08] }
          : { opacity: 1, scale: isSelected ? 1.12 : 1 }
      }
      whileHover={{ scale: isSelected ? 1.16 : 1.1 }}
      transition={
        isHighlighted
          ? {
              delay: revealDelayMs / 1000,
              duration: 1.25,
              ease: [0.16, 1, 0.3, 1],
              times: [0, 0.35, 0.58, 0.78, 1],
            }
          : { type: 'spring', stiffness: 260, damping: 24 }
      }
      aria-label={label}
      aria-pressed={isSelected}
      title={label}
      onClick={(event) => {
        event.stopPropagation()
        onSelect?.()
      }}
    >
      <Icon className="size-4.5" aria-hidden="true" />
    </motion.button>
  )
}
