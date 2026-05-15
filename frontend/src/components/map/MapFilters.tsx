import {
  Check,
  ChevronDown,
  Clock3,
  Flag,
  Gift,
  Layers3,
  SlidersHorizontal,
  TriangleAlert,
  type LucideIcon,
} from '@/components/icons/hugeicons'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { MapFilterKind } from '@/components/map/MapMarker'
import type { MapTimeFilterKind } from '@/data/civicMapData'
import { cn } from '@/lib/utils'

type MapFilterOption = {
  value: MapFilterKind
  label: string
  shortLabel: string
  icon: LucideIcon
  iconClassName: string
}

const mapFilters: MapFilterOption[] = [
  {
    value: 'all',
    label: 'Toate',
    shortLabel: 'Toate',
    icon: Layers3,
    iconClassName: 'text-emerald-600',
  },
  {
    value: 'new',
    label: 'Probleme',
    shortLabel: 'Probleme',
    icon: TriangleAlert,
    iconClassName: 'text-rose-500',
  },
  {
    value: 'in_progress',
    label: 'În progres',
    shortLabel: 'Progres',
    icon: Clock3,
    iconClassName: 'text-yellow-600',
  },
  {
    value: 'resolved',
    label: 'Rezolvate',
    shortLabel: 'Gata',
    icon: Check,
    iconClassName: 'text-emerald-600',
  },
  {
    value: 'mission',
    label: 'Misiuni',
    shortLabel: 'Misiuni',
    icon: Flag,
    iconClassName: 'text-blue-600',
  },
  {
    value: 'reward',
    label: 'Recompense',
    shortLabel: 'Recomp.',
    icon: Gift,
    iconClassName: 'text-orange-600',
  },
]

const timeFilters: Array<{ value: MapTimeFilterKind; label: string }> = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7 zile' },
  { value: '30d', label: '30 zile' },
  { value: 'all', label: 'Tot timpul' },
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
      ? `${visibleCount} vizibile`
      : `${visibleCount}/${totalCount} vizibile`
  const [isMobileExpanded, setIsMobileExpanded] = useState(false)
  const activeFilterOption =
    mapFilters.find((filter) => filter.value === activeFilter) ?? mapFilters[0]
  const activeTimeLabel =
    timeFilters.find((filter) => filter.value === activeTimeFilter)?.label ?? '24h'

  return (
    <div className="flex w-full flex-col-reverse rounded-lg border border-emerald-200/80 bg-white/94 p-1.5 shadow-lg shadow-slate-900/12 backdrop-blur-md sm:block sm:w-[min(14.5rem,calc(100vw-1.5rem))] sm:p-2 sm:shadow-sm">
      <Button
        type="button"
        variant="ghost"
        aria-expanded={isMobileExpanded}
        aria-controls="mobile-map-filters"
        className="h-10 w-full justify-between gap-2 rounded-md bg-white px-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 sm:hidden"
        onClick={() => setIsMobileExpanded((expanded) => !expanded)}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
            <SlidersHorizontal className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 text-left">
            <span className="block truncate text-xs font-bold leading-none">
              Filtre
            </span>
            <span className="mt-0.5 block truncate text-[0.68rem] font-medium leading-none text-slate-500">
              {activeFilterOption.shortLabel} · {activeTimeLabel}
            </span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-[0.62rem] font-bold uppercase text-emerald-700">
            {visibleCountLabel}
          </span>
          <ChevronDown
            className={cn(
              'size-4 text-slate-500 transition-transform',
              isMobileExpanded && 'rotate-180',
            )}
            aria-hidden="true"
          />
        </span>
      </Button>

      <div
        id="mobile-map-filters"
        className={cn(
          'min-w-0 flex-col gap-2 sm:flex',
          isMobileExpanded ? 'mb-2 flex sm:mb-0 sm:mt-0' : 'hidden',
        )}
      >
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="text-[0.66rem] font-bold uppercase tracking-wide text-emerald-700">
            Afișează
          </span>
          <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-1 text-[0.62rem] font-bold uppercase text-emerald-700">
            {visibleCountLabel}
          </span>
        </div>

        <div className="grid min-w-0 grid-cols-2 gap-1">
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
                    ? 'h-8 min-w-0 justify-start bg-emerald-600 px-2 text-[0.72rem] leading-none text-white hover:bg-emerald-700'
                    : 'h-8 min-w-0 justify-start bg-white px-2 text-[0.72rem] leading-none text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
                }
                onClick={() => onFilterChange(filter.value)}
              >
                <Icon
                  data-icon="inline-start"
                  className={`size-3.5 ${isActive ? 'text-white' : filter.iconClassName}`}
                  aria-hidden="true"
                />
                <span className="min-w-0 truncate">{filter.shortLabel}</span>
              </Button>
            )
          })}
        </div>

        <div className="border-t border-emerald-100 pt-2">
          <span className="text-[0.66rem] font-bold uppercase tracking-wide text-slate-500">
            Perioada
          </span>

          <div className="mt-1 grid grid-cols-2 gap-1">
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
                      ? 'h-7 min-w-0 bg-emerald-600 px-2 text-[0.68rem] text-white hover:bg-emerald-700'
                      : 'h-7 min-w-0 bg-white px-2 text-[0.68rem] text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
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
    </div>
  )
}
