import { motion } from 'motion/react'
import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { LoaderCircle, MapPinned, TriangleAlert } from 'lucide-react'
import { FloatingReportButton } from '@/components/layout/FloatingReportButton'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { BottomRail } from '@/components/map/BottomRail'
import { CityPulsePanel } from '@/components/map/CityPulsePanel'
import { CivicMap } from '@/components/map/CivicMap'
import { LiveActivityFeed } from '@/components/map/LiveActivityFeed'
import { MapFilters } from '@/components/map/MapFilters'
import {
  filterCivicMapItemsForTimisoara,
  getCivicMapItems,
} from '@/data/civicMapData'
import { fetchIssues, fetchMissions, isApiConfigured } from '@/lib/api'
import { issuesQueryKey, missionsQueryKey } from '@/lib/queryClient'
import { useMapStore } from '@/stores/mapStore'

export function LiveMapLandingPage() {
  const [searchParams] = useSearchParams()
  const activeFilter = useMapStore((state) => state.activeFilter)
  const activeTimeFilter = useMapStore((state) => state.activeTimeFilter)
  const selectedItemId = useMapStore((state) => state.selectedItemId)
  const setActiveFilter = useMapStore((state) => state.setActiveFilter)
  const setActiveTimeFilter = useMapStore((state) => state.setActiveTimeFilter)
  const setSelectedItemId = useMapStore((state) => state.setSelectedItemId)
  const requestedIssueId = searchParams.get('issue')
  const issuesQuery = useQuery({
    queryKey: issuesQueryKey,
    queryFn: fetchIssues,
  })
  const missionsQuery = useQuery({
    queryKey: missionsQueryKey,
    queryFn: fetchMissions,
  })
  const mapItems = useMemo(
    () => getCivicMapItems(issuesQuery.data ?? [], missionsQuery.data ?? []),
    [issuesQuery.data, missionsQuery.data],
  )
  const timisoaraMapItems = useMemo(
    () => filterCivicMapItemsForTimisoara(mapItems, activeTimeFilter),
    [activeTimeFilter, mapItems],
  )
  const visibleMapItemCount = useMemo(
    () =>
      timisoaraMapItems.filter(
        (item) => activeFilter === 'all' || item.kind === activeFilter,
      ).length,
    [activeFilter, timisoaraMapItems],
  )
  const isMapLoading =
    isApiConfigured && (issuesQuery.isLoading || missionsQuery.isLoading)
  const hasMapError =
    isApiConfigured && (issuesQuery.isError || missionsQuery.isError)

  useEffect(() => {
    if (!requestedIssueId) {
      return
    }

    if (timisoaraMapItems.some((item) => item.id === requestedIssueId)) {
      setSelectedItemId(requestedIssueId)
      setActiveFilter('all')
    }
  }, [requestedIssueId, setActiveFilter, setSelectedItemId, timisoaraMapItems])

  useEffect(() => {
    if (
      selectedItemId &&
      !timisoaraMapItems.some((item) => item.id === selectedItemId)
    ) {
      setSelectedItemId(null)
    }
  }, [selectedItemId, setSelectedItemId, timisoaraMapItems])

  return (
    <motion.main
      className="min-h-svh w-full overflow-x-hidden bg-orange-50 px-4 py-5 text-slate-950 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <section className="mx-auto flex min-h-[calc(100svh-2.5rem)] w-full max-w-[calc(100vw-2rem)] flex-col gap-5 sm:max-w-[calc(100vw-3rem)] lg:max-w-7xl">
        <TopNavigation />

        <div className="flex max-w-[22rem] flex-col gap-3 sm:max-w-3xl">
          <div className="max-w-full">
            <div className="inline-flex max-w-full items-center gap-2 rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs font-bold uppercase text-emerald-800 shadow-sm">
              <MapPinned className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">Live Timisoara civic map</span>
            </div>
            <h1 className="max-w-[22rem] text-2xl font-semibold leading-tight text-emerald-950 sm:max-w-3xl sm:text-4xl lg:text-5xl">
              Care. Act. Together.
            </h1>
            <p className="mt-3 max-w-[21rem] text-base text-slate-600 sm:max-w-2xl sm:text-lg">
              Explore live civic activity in Timisoara, report what needs
              attention and help every signal become a practical community
              mission.
            </p>
            {(isMapLoading || hasMapError) && (
              <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-800 shadow-sm">
                {isMapLoading ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <TriangleAlert className="size-4 text-amber-600" aria-hidden="true" />
                )}
                <span>
                  {isMapLoading
                    ? 'Loading live map data'
                    : 'Showing seeded map data while the API recovers'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div
          id="map"
          className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_20rem]"
        >
          <div className="flex min-w-0 flex-col gap-3">
            <MapFilters
              activeFilter={activeFilter}
              activeTimeFilter={activeTimeFilter}
              visibleCount={visibleMapItemCount}
              totalCount={mapItems.length}
              onFilterChange={setActiveFilter}
              onTimeFilterChange={setActiveTimeFilter}
            />
            <div className="h-[56svh] min-h-96 rounded-lg border border-emerald-200 bg-white shadow-sm sm:h-[62svh] lg:h-[66svh]">
              <CivicMap
                items={timisoaraMapItems}
                activeFilter={activeFilter}
                selectedItemId={selectedItemId}
                onSelectedItemChange={setSelectedItemId}
              />
            </div>
          </div>

          <aside className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-1 xl:content-start">
            <CityPulsePanel items={timisoaraMapItems} />
            <LiveActivityFeed />
          </aside>
        </div>
        <BottomRail items={timisoaraMapItems} />
      </section>
      <FloatingReportButton />
    </motion.main>
  )
}
