import {
  AlertTriangle,
  Check,
  Circle,
  CircleDashed,
  LoaderCircle,
  RotateCcw,
} from '@/components/icons/hugeicons'
import visionAgentImage from '@/assets/ai-agents/01_vision_agent_square.png'
import triageAgentImage from '@/assets/ai-agents/02_triage_agent_square.png'
import duplicateAgentImage from '@/assets/ai-agents/03_duplicate_agent_square.png'
import missionAgentImage from '@/assets/ai-agents/04_mission_agent_square.png'
import rewardAgentImage from '@/assets/ai-agents/05_reward_agent_square.png'
import cityAgentImage from '@/assets/ai-agents/06_city_agent_square.png'
import authorityEmailAgentImage from '@/assets/ai-agents/07_authority_email_agent_square.png'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { AgentStepResponse, AgentStepStatus } from '@/lib/api'
import { roAgentMessage, roAgentName } from '@/lib/locale'

type AgentStepCardProps = {
  step: AgentStepResponse
}

const statusStyles: Record<
  AgentStepStatus,
  {
    label: string
    dotClass: string
    card: string
    iconWrap: string
    badgeClass: string
    icon: typeof Check
  }
> = {
  pending: {
    label: 'In asteptare',
    dotClass: 'bg-slate-400 text-white',
    card: 'border-slate-200 bg-slate-50',
    iconWrap: 'bg-white',
    badgeClass: 'bg-slate-100 text-slate-600',
    icon: Circle,
  },
  running: {
    label: 'Ruleaza',
    dotClass: 'bg-cyan-600 text-white',
    card: 'border-cyan-200 bg-cyan-50',
    iconWrap: 'bg-cyan-50',
    badgeClass: 'bg-cyan-100 text-cyan-700',
    icon: LoaderCircle,
  },
  completed: {
    label: 'Finalizat',
    dotClass: 'bg-emerald-600 text-white',
    card: 'border-emerald-200 bg-emerald-50',
    iconWrap: 'bg-emerald-50',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    icon: Check,
  },
  failed: {
    label: 'Necesita reincercare',
    dotClass: 'bg-rose-600 text-white',
    card: 'border-rose-200 bg-rose-50',
    iconWrap: 'bg-rose-50',
    badgeClass: 'bg-rose-100 text-rose-700',
    icon: AlertTriangle,
  },
  fallback: {
    label: 'Fallback folosit',
    dotClass: 'bg-teal-600 text-white',
    card: 'border-teal-200 bg-teal-50',
    iconWrap: 'bg-teal-50',
    badgeClass: 'bg-teal-100 text-teal-700',
    icon: RotateCcw,
  },
  skipped: {
    label: 'Oprit din admin',
    dotClass: 'bg-slate-500 text-white',
    card: 'border-slate-200 bg-white',
    iconWrap: 'bg-white',
    badgeClass: 'bg-slate-100 text-slate-600',
    icon: CircleDashed,
  },
}

const agentAvatarByName: Record<string, string> = {
  'Vision Agent': visionAgentImage,
  'Triage Agent': triageAgentImage,
  'Duplicate Agent': duplicateAgentImage,
  'Mission Agent': missionAgentImage,
  'Reward Agent': rewardAgentImage,
  'City Agent': cityAgentImage,
  'Authority Email Agent': authorityEmailAgentImage,
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
  const agentAvatar = agentAvatarByName[step.agentName]

  return (
    <motion.li
      className={cn(
        'flex min-w-0 items-start gap-3 rounded-xl border bg-white/75 p-3 shadow-sm',
        styles.card,
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      <motion.span
        className={cn(
          'relative flex size-16 shrink-0 items-center justify-center rounded-2xl p-1',
          styles.iconWrap,
          isRunning && 'animate-pulse',
        )}
        initial={isCompleted ? { scale: 0.72, rotate: -12 } : false}
        animate={isCompleted ? { scale: 1, rotate: 0 } : undefined}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        <span className="grid size-full place-items-center rounded-xl bg-white/80 p-0.5">
          {agentAvatar ? (
            <img
              src={agentAvatar}
              alt=""
              className="size-full rounded-xl object-cover"
            />
          ) : (
            <StatusIcon
              className={cn('size-4', isRunning && 'animate-spin')}
              aria-hidden="true"
            />
          )}
        </span>
        <span
          className={cn(
            'absolute -right-0.5 -bottom-0.5 inline-flex size-5 items-center justify-center rounded-full border-2 border-white shadow-sm',
            styles.dotClass,
          )}
          aria-hidden="true"
        >
          <StatusIcon className={cn('size-2.5', isRunning && 'animate-spin')} />
        </span>
      </motion.span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-emerald-950">
            {roAgentName(step.agentName)}
          </span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide',
              styles.badgeClass,
            )}
          >
            {styles.label}
          </span>
        </span>
        <span className="mt-1 block text-sm leading-5 text-slate-700">
          {roAgentMessage(step.message)}
        </span>
      </span>
    </motion.li>
  )
}
