import {
  AlertTriangle,
  Check,
  Circle,
  CircleDashed,
  LoaderCircle,
  RotateCcw,
} from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { AgentStepResponse, AgentStepStatus } from '@/lib/api'

type AgentStepCardProps = {
  step: AgentStepResponse
}

const statusStyles: Record<
  AgentStepStatus,
  {
    label: string
    card: string
    iconWrap: string
    icon: typeof Check
  }
> = {
  pending: {
    label: 'Pending',
    card: 'border-slate-200 bg-slate-50',
    iconWrap: 'bg-slate-100 text-slate-500',
    icon: Circle,
  },
  running: {
    label: 'Running',
    card: 'border-cyan-200 bg-cyan-50',
    iconWrap: 'bg-cyan-100 text-cyan-700',
    icon: LoaderCircle,
  },
  completed: {
    label: 'Completed',
    card: 'border-emerald-200 bg-emerald-50',
    iconWrap: 'bg-emerald-600 text-white',
    icon: Check,
  },
  failed: {
    label: 'Needs retry',
    card: 'border-rose-200 bg-rose-50',
    iconWrap: 'bg-rose-100 text-rose-700',
    icon: AlertTriangle,
  },
  fallback: {
    label: 'Fallback used',
    card: 'border-teal-200 bg-teal-50',
    iconWrap: 'bg-teal-100 text-teal-700',
    icon: RotateCcw,
  },
}

function normalizeStatus(status: string): AgentStepStatus {
  return status in statusStyles ? (status as AgentStepStatus) : 'pending'
}

export function AgentStepCard({ step }: AgentStepCardProps) {
  const status = normalizeStatus(step.status)
  const styles = statusStyles[status]
  const StatusIcon = styles.icon
  const isRunning = status === 'running'
  const isCompleted = status === 'completed'

  return (
    <motion.li
      className={cn(
        'flex min-w-0 items-start gap-3 rounded-lg border p-3',
        styles.card,
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      <motion.span
        className={cn(
          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
          styles.iconWrap,
          isRunning && 'animate-pulse',
        )}
        initial={isCompleted ? { scale: 0.72, rotate: -12 } : false}
        animate={isCompleted ? { scale: 1, rotate: 0 } : undefined}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        <StatusIcon
          className={cn('size-4', isRunning && 'animate-spin')}
          aria-hidden="true"
        />
      </motion.span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-emerald-950">
            {step.agentName}
          </span>
          <span className="rounded-full bg-white/75 px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide text-slate-600">
            {styles.label}
          </span>
        </span>
        <span className="mt-1 block text-sm leading-5 text-slate-700">
          {step.message}
        </span>
      </span>

      {status === 'pending' && (
        <CircleDashed className="mt-1 size-4 shrink-0 text-slate-400" aria-hidden="true" />
      )}
    </motion.li>
  )
}
