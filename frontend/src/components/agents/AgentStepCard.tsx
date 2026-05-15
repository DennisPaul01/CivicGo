import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  Circle,
  CircleDashed,
  GitBranch,
  LoaderCircle,
  RotateCcw,
  Target,
  Wrench,
} from '@/components/icons/hugeicons'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { AgentStepResponse, AgentStepStatus } from '@/lib/api'
import { roAgentMessage, roAgentName } from '@/lib/locale'

type AgentStepCardProps = {
  step: AgentStepResponse
}

type RichAgentOutput = {
  observation?: string
  toolUsed?: string
  decision?: string
  nextAction?: string
  confidence?: number | null
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
    label: 'In asteptare',
    card: 'border-slate-200 bg-slate-50',
    iconWrap: 'bg-slate-100 text-slate-500',
    icon: Circle,
  },
  running: {
    label: 'Ruleaza',
    card: 'border-cyan-200 bg-cyan-50',
    iconWrap: 'bg-cyan-100 text-cyan-700',
    icon: LoaderCircle,
  },
  completed: {
    label: 'Finalizat',
    card: 'border-emerald-200 bg-emerald-50',
    iconWrap: 'bg-emerald-600 text-white',
    icon: Check,
  },
  failed: {
    label: 'Necesita reincercare',
    card: 'border-rose-200 bg-rose-50',
    iconWrap: 'bg-rose-100 text-rose-700',
    icon: AlertTriangle,
  },
  fallback: {
    label: 'Fallback folosit',
    card: 'border-teal-200 bg-teal-50',
    iconWrap: 'bg-teal-100 text-teal-700',
    icon: RotateCcw,
  },
  skipped: {
    label: 'Oprit din admin',
    card: 'border-slate-200 bg-white',
    iconWrap: 'bg-slate-100 text-slate-600',
    icon: CircleDashed,
  },
}

function normalizeStatus(status: string): AgentStepStatus {
  return status in statusStyles ? (status as AgentStepStatus) : 'pending'
}

function formatAgentJson(value: string) {
  if (!value) {
    return ''
  }

  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

function parseRichOutput(value: string): RichAgentOutput | null {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(value) as RichAgentOutput
    const hasRichFields =
      typeof parsed.observation === 'string' ||
      typeof parsed.toolUsed === 'string' ||
      typeof parsed.decision === 'string' ||
      typeof parsed.nextAction === 'string' ||
      typeof parsed.confidence === 'number'

    return hasRichFields ? parsed : null
  } catch {
    return null
  }
}

function formatToolName(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function AgentStepCard({ step }: AgentStepCardProps) {
  const status = normalizeStatus(step.status)
  const styles = statusStyles[status]
  const StatusIcon = styles.icon
  const isRunning = status === 'running'
  const isCompleted = status === 'completed'
  const input = formatAgentJson(step.inputJson)
  const output = formatAgentJson(step.outputJson)
  const richOutput = parseRichOutput(step.outputJson)

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
            {roAgentName(step.agentName)}
          </span>
          <span className="rounded-full bg-white/75 px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide text-slate-600">
            {styles.label}
          </span>
        </span>
        <span className="mt-1 block text-sm leading-5 text-slate-700">
          {roAgentMessage(step.message)}
        </span>

        {richOutput && status !== 'pending' && (
          <div className="mt-3 grid gap-2 text-xs leading-5 text-slate-700 sm:grid-cols-2">
            {richOutput.toolUsed && (
              <span className="min-w-0 rounded-lg border border-white/80 bg-white/70 px-3 py-2">
                <span className="mb-0.5 flex items-center gap-1.5 font-semibold text-slate-500">
                  <Wrench className="size-3.5 shrink-0" aria-hidden="true" />
                  Tool
                </span>
                <span className="block break-words font-medium text-emerald-950">
                  {formatToolName(richOutput.toolUsed)}
                </span>
              </span>
            )}
            {richOutput.confidence !== null &&
              richOutput.confidence !== undefined && (
                <span className="min-w-0 rounded-lg border border-white/80 bg-white/70 px-3 py-2">
                  <span className="mb-0.5 flex items-center gap-1.5 font-semibold text-slate-500">
                    <Target className="size-3.5 shrink-0" aria-hidden="true" />
                    Incredere
                  </span>
                  <span className="block font-medium text-emerald-950">
                    {Math.round(richOutput.confidence * 100)}%
                  </span>
                </span>
              )}
            {richOutput.observation && (
              <span className="min-w-0 rounded-lg border border-white/80 bg-white/70 px-3 py-2 sm:col-span-2">
                <span className="mb-0.5 block font-semibold text-slate-500">
                  Observatie
                </span>
                <span className="block break-words text-slate-800">
                  {richOutput.observation}
                </span>
              </span>
            )}
            {richOutput.decision && (
              <span className="min-w-0 rounded-lg border border-white/80 bg-white/70 px-3 py-2 sm:col-span-2">
                <span className="mb-0.5 flex items-center gap-1.5 font-semibold text-slate-500">
                  <GitBranch className="size-3.5 shrink-0" aria-hidden="true" />
                  Decizie
                </span>
                <span className="block break-words text-slate-800">
                  {richOutput.decision}
                </span>
              </span>
            )}
            {richOutput.nextAction && (
              <span className="min-w-0 rounded-lg border border-white/80 bg-white/70 px-3 py-2 sm:col-span-2">
                <span className="mb-0.5 block font-semibold text-slate-500">
                  Preda catre
                </span>
                <span className="block break-words text-slate-800">
                  {richOutput.nextAction}
                </span>
              </span>
            )}
          </div>
        )}

        {(input || output) && status !== 'pending' && (
          <details className="mt-3 rounded-lg border border-white/80 bg-white/70">
            <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30">
              Vezi ce a primit si ce trimite mai departe
            </summary>
            <div className="grid gap-2 border-t border-white/80 p-3 md:grid-cols-2">
              {input && (
                <div className="min-w-0">
                  <span className="mb-1 flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase text-slate-500">
                    <ArrowDownToLine className="size-3.5" aria-hidden="true" />
                    Primit
                  </span>
                  <pre className="max-h-36 overflow-auto rounded-md bg-slate-950 p-2 text-[0.68rem] leading-4 text-emerald-50">
                    {input}
                  </pre>
                </div>
              )}
              {output && (
                <div className="min-w-0">
                  <span className="mb-1 flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase text-slate-500">
                    <ArrowUpFromLine className="size-3.5" aria-hidden="true" />
                    Trimis mai departe
                  </span>
                  <pre className="max-h-36 overflow-auto rounded-md bg-slate-950 p-2 text-[0.68rem] leading-4 text-emerald-50">
                    {output}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}
      </span>

      {status === 'pending' && (
        <CircleDashed className="mt-1 size-4 shrink-0 text-slate-400" aria-hidden="true" />
      )}
    </motion.li>
  )
}
