import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

type DemoStateTone = 'emerald' | 'amber' | 'rose' | 'slate'

type DemoStateProps = {
  icon: LucideIcon
  title: string
  description: string
  eyebrow?: string
  tone?: DemoStateTone
  action?: ReactNode
  className?: string
}

const toneClasses: Record<
  DemoStateTone,
  {
    border: string
    background: string
    icon: string
    eyebrow: string
  }
> = {
  emerald: {
    border: 'border-emerald-200',
    background: 'bg-white',
    icon: 'bg-orange-50 text-emerald-700',
    eyebrow: 'text-emerald-700',
  },
  amber: {
    border: 'border-amber-200',
    background: 'bg-amber-50',
    icon: 'bg-white text-amber-700',
    eyebrow: 'text-amber-700',
  },
  rose: {
    border: 'border-rose-200',
    background: 'bg-rose-50',
    icon: 'bg-white text-rose-700',
    eyebrow: 'text-rose-700',
  },
  slate: {
    border: 'border-slate-200',
    background: 'bg-white',
    icon: 'bg-slate-50 text-slate-600',
    eyebrow: 'text-slate-500',
  },
}

export function DemoState({
  icon: Icon,
  title,
  description,
  eyebrow,
  tone = 'emerald',
  action,
  className,
}: DemoStateProps) {
  const classes = toneClasses[tone]

  return (
    <motion.section
      className={cn(
        'rounded-lg border p-4 shadow-sm',
        classes.border,
        classes.background,
        className,
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-lg',
              classes.icon,
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            {eyebrow && (
              <p
                className={cn(
                  'text-xs font-semibold uppercase tracking-wide',
                  classes.eyebrow,
                )}
              >
                {eyebrow}
              </p>
            )}
            <h2 className="!m-0 text-base font-semibold leading-tight text-emerald-950">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>
        </div>
        {action}
      </div>
    </motion.section>
  )
}

export function DemoSkeletonGrid({
  items = 3,
  className,
}: {
  items?: number
  className?: string
}) {
  return (
    <div className={cn('grid gap-3', className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div
          key={index}
          className="h-36 animate-pulse rounded-lg border border-emerald-100 bg-white shadow-sm"
        />
      ))}
    </div>
  )
}
