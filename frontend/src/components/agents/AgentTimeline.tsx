import { Bot, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { AgentStepCard } from '@/components/agents/AgentStepCard'
import type { AgentRunResponse } from '@/lib/api'

type AgentTimelineProps = {
  run: AgentRunResponse | null
}

export function AgentTimeline({ run }: AgentTimelineProps) {
  if (!run) {
    return null
  }

  const sortedSteps = [...run.steps].sort((a, b) => a.order - b.order)
  const usedFallback =
    run.status === 'fallback' ||
    sortedSteps.some((step) => step.status === 'fallback')

  return (
    <motion.section
      className="mt-4 rounded-lg border border-emerald-200 bg-white p-4 shadow-sm"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Agent timeline
          </p>
          <h3 className="mt-1 text-base font-semibold text-emerald-950">
            CiviTm AI checked the report
          </h3>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
          {usedFallback ? (
            <Sparkles className="size-4" aria-hidden="true" />
          ) : (
            <Bot className="size-4" aria-hidden="true" />
          )}
        </span>
      </div>

      <motion.ol
        className="mt-4 grid gap-2"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: 0.08,
            },
          },
        }}
      >
        {sortedSteps.map((step) => (
          <AgentStepCard key={step.id} step={step} />
        ))}
      </motion.ol>

      {usedFallback && (
        <p className="mt-3 rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-xs leading-5 text-teal-800">
          Fallback path was used, so the demo stays stable even when the live AI
          request is unavailable.
        </p>
      )}
    </motion.section>
  )
}
