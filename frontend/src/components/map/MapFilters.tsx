import {
  Check,
  Clock3,
  Flag,
  Gift,
  Layers3,
  MapPin,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MapFilterKind } from '@/components/map/MapMarker'
import type { MapTimeFilterKind } from '@/data/civicMapData'

type MapFilterOption = {
  value: MapFilterKind
  label: string
  shortLabel: string
  icon: typeof MapPin
}

const mapFilters: MapFilterOption[] = [
  { value: 'all', label: 'All', shortLabel: 'All', icon: Layers3 },
  { value: 'new', label: 'New', shortLabel: 'New', icon: MapPin },
  {
    value: 'ai_checked',
    label: 'AI checked',
    shortLabel: 'AI',
    icon: Sparkles,
  },
  {
    value: 'in_progress',
    label: 'In progress',
    shortLabel: 'Active',
    icon: Clock3,
  },
  { value: 'resolved', label: 'Resolved', shortLabel: 'Done', icon: Check },
  { value: 'mission', label: 'Missions', shortLabel: 'Missions', icon: Flag },
  { value: 'reward', label: 'Rewards', shortLabel: 'Rewards', icon: Gift },
  { value: 'urgent', label: 'Urgent', shortLabel: 'Urgent', icon: TriangleAlert },
]

const timeFilters: Array<{ value: MapTimeFilterKind; label: string }> = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'all', label: 'All time' },
]

type MapFiltersProps = {
  activeFilter: MapFilterKind
  activeTimeFilter: MapTimeFilterKind
  visibleCount: number
  totalCount: number
  onFilterChange: (filter: MapFilterKind) => void
  onTimeFilterChange: (filter: MapTimeFilterKind) => void
}

export function MapFilters({
  activeFilter,
  activeTimeFilter,
  visibleCount,
  totalCount,
  onFilterChange,
  onTimeFilterChange,
}: MapFiltersProps) {
  const visibleCountLabel =
    visibleCount === totalCount
      ? `${visibleCount} visible`
      : `${visibleCount}/${totalCount} visible`

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-emerald-200/80 bg-white/92 p-3 shadow-sm sm:p-1.5">
      <div className="flex items-center justify-between gap-3 sm:hidden">
        <div>
          <p className="text-xs font-semibold uppercase text-emerald-800">
            Map filters
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Choose what appears on the map.
          </p>
        </div>
        <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-1 text-[0.68rem] font-bold uppercase text-emerald-700">
          {visibleCountLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:items-center sm:gap-1">
        {mapFilters.map((filter) => {
          const Icon = filter.icon
          const isActive = activeFilter === filter.value

          return (
            <Button
              key={filter.value}
              type="button"
              size="sm"
              variant={isActive ? 'default' : 'ghost'}
              aria-label={filter.label}
              aria-pressed={isActive}
              className={
                isActive
                  ? 'h-10 min-w-0 justify-start bg-emerald-600 px-2.5 text-[0.78rem] leading-none text-white hover:bg-emerald-700 sm:h-7 sm:px-2 sm:text-[0.8rem]'
                  : 'h-10 min-w-0 justify-start border border-emerald-100 bg-white px-2.5 text-[0.78rem] leading-none text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 sm:h-7 sm:border-transparent sm:bg-transparent sm:px-2 sm:text-[0.8rem]'
              }
              onClick={() => onFilterChange(filter.value)}
            >
              <Icon data-icon="inline-start" className="size-3.5" aria-hidden="true" />
              <span className="min-w-0 truncate sm:hidden">
                {filter.shortLabel}
              </span>
              <span className="hidden sm:inline">{filter.label}</span>
            </Button>
          )
        })}
      </div>

      <div className="flex flex-col gap-2 border-t border-emerald-100 pt-2 sm:flex-row sm:items-center sm:justify-between sm:pt-1.5">
        <div className="hidden min-w-0 items-center gap-2 px-1 text-xs font-semibold uppercase text-emerald-800 sm:flex">
          <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-1 text-[0.68rem] text-emerald-700">
            {visibleCountLabel}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 sm:hidden">
          <span className="text-xs font-semibold uppercase text-emerald-800">
            Posted
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:flex sm:items-center sm:justify-end sm:gap-1">
          {timeFilters.map((filter) => {
            const isActive = activeTimeFilter === filter.value

            return (
              <Button
                key={filter.value}
                type="button"
                size="sm"
                variant={isActive ? 'default' : 'ghost'}
                aria-pressed={isActive}
                className={
                  isActive
                    ? 'h-9 min-w-0 bg-emerald-600 px-2 text-white hover:bg-emerald-700 sm:h-7'
                    : 'h-9 min-w-0 border border-emerald-100 bg-white px-2 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 sm:h-7 sm:border-transparent sm:bg-transparent'
                }
                onClick={() => onTimeFilterChange(filter.value)}
              >
                {filter.label}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
