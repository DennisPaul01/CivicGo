import {
  CheckCircle2,
  Flag,
  Gift,
  Sparkles,
  TrendingUp,
  Wrench,
} from 'lucide-react'
import { motion } from 'motion/react'

const activityItems = [
  {
    eyebrow: 'Resolved 12 min ago',
    title: 'Illegal waste cleaned near Central Park',
    icon: CheckCircle2,
    className: 'text-emerald-600 bg-emerald-50',
  },
  {
    eyebrow: 'Mission active',
    title: 'Green space check started in Soarelui',
    icon: Flag,
    className: 'text-slate-700 bg-slate-50',
  },
  {
    eyebrow: 'AI checked',
    title: 'Broken street light detected in Fabric',
    icon: Sparkles,
    className: 'text-purple-700 bg-purple-50',
  },
  {
    eyebrow: 'In progress',
    title: 'Road damage review in Girocului',
    icon: Wrench,
    className: 'text-amber-700 bg-amber-50',
  },
  {
    eyebrow: 'Reward matched',
    title: 'CoffeeLab reward available near Unirii',
    icon: Gift,
    className: 'text-yellow-700 bg-yellow-50',
  },
]

export function LiveActivityFeed() {
  return (
    <motion.aside
      className="max-h-64 overflow-hidden rounded-lg border border-emerald-200/80 bg-white/92 p-3 text-slate-950 shadow-sm"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      aria-label="Public activity feed"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Public activity
          </p>
          <h2 className="mt-1 text-base font-semibold text-emerald-950">
            City movement
          </h2>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-1 text-xs font-semibold text-emerald-700">
          <TrendingUp className="size-3.5" aria-hidden="true" />
          Live
        </span>
      </div>

      <div className="mt-3 flex max-h-40 flex-col gap-2 overflow-y-auto pr-1">
        {activityItems.map((item) => (
          <article
            key={`${item.eyebrow}-${item.title}`}
            className="flex gap-2 rounded-md border border-slate-200 bg-white/80 p-2"
          >
            <span
              className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md ${item.className}`}
            >
              <item.icon className="size-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
                {item.eyebrow}
              </p>
              <p className="mt-0.5 text-sm font-medium leading-snug text-slate-900">
                {item.title}
              </p>
            </div>
          </article>
        ))}
      </div>
    </motion.aside>
  )
}
