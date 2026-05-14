import { Activity, CheckCircle2, Clock3, MapPinned, TrendingUp } from 'lucide-react'
import { motion } from 'motion/react'
import { civicMapItems, type CivicMapItem } from '@/data/civicMapData'

type CityPulsePanelProps = {
  items?: CivicMapItem[]
}

export function CityPulsePanel({ items = civicMapItems }: CityPulsePanelProps) {
  const pulseStats = [
    {
      label: 'Rapoarte live',
      value: String(
        items.filter((item) => item.kind !== 'mission' && item.kind !== 'reward')
          .length,
      ),
      icon: Activity,
      className: 'text-teal-600',
    },
    {
      label: 'In lucru',
      value: String(items.filter((item) => item.kind === 'in_progress').length),
      icon: Clock3,
      className: 'text-amber-600',
    },
    {
      label: 'Rezolvate',
      value: String(items.filter((item) => item.kind === 'resolved').length),
      icon: CheckCircle2,
      className: 'text-emerald-600',
    },
    {
      label: 'Zone active',
      value: String(new Set(items.map((item) => item.zone)).size),
      icon: MapPinned,
      className: 'text-lime-700',
    },
  ]

  return (
    <motion.aside
      className="rounded-lg border border-emerald-200/80 bg-white/92 p-3 text-slate-950 shadow-sm"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      aria-label="Pulsul orasului"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Pulsul orasului
          </p>
          <h2 className="mt-1 text-base font-semibold text-emerald-950">
            Snapshot Timisoara
          </h2>
        </div>
        <div className="flex items-center gap-1 rounded-md bg-orange-50 px-2 py-1 text-xs font-semibold text-emerald-700">
          <TrendingUp className="size-3.5" aria-hidden="true" />
          +18%
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {pulseStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-md border border-slate-200 bg-white/80 p-2"
          >
            <div className="flex items-center gap-1.5">
              <stat.icon className={`size-3.5 ${stat.className}`} aria-hidden="true" />
              <span className="text-[0.7rem] font-medium text-slate-500">
                {stat.label}
              </span>
            </div>
            <p className="mt-1 text-xl font-semibold leading-none text-slate-950">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </motion.aside>
  )
}
