import { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { Map as MapboxMap, Marker as MapboxMarker } from 'mapbox-gl'
import { MapPin } from '@/components/icons/hugeicons'
import { isMapboxConfigured, mapboxgl } from '@/lib/mapbox'
import {
  MapMarker,
  type MapFilterKind,
  type MapMarkerKind,
} from '@/components/map/MapMarker'
import { SelectedIssuePanel } from '@/components/map/SelectedIssuePanel'
import type { CivicMapItem } from '@/data/civicMapData'

const TIMISOARA_CENTER: [number, number] = [21.224, 45.7552]
const TIMISOARA_MAX_BOUNDS: [[number, number], [number, number]] = [
  [21.12, 45.68],
  [21.32, 45.81],
]
const MARKER_SPREAD_DISTANCE = 42
const MAPBOX_CANVAS_SELECTOR = '.mapboxgl-canvas'
const FALLBACK_MIN_MARKER_DISTANCE = 5.6
const DESKTOP_PANEL_WIDTH = 384
const DESKTOP_PANEL_ESTIMATED_HEIGHT = 512
const DESKTOP_PANEL_MARGIN = 20
const DESKTOP_PANEL_TOP_GAP = 24
const FALLBACK_BOUNDS = {
  minLng: TIMISOARA_MAX_BOUNDS[0][0],
  minLat: TIMISOARA_MAX_BOUNDS[0][1],
  maxLng: TIMISOARA_MAX_BOUNDS[1][0],
  maxLat: TIMISOARA_MAX_BOUNDS[1][1],
}

type MarkerRecord = {
  marker: MapboxMarker
  root: Root
  item: CivicMapItem
}

type CivicMapProps = {
  items: CivicMapItem[]
  activeFilter: MapFilterKind
  selectedItemId: string | null
  onSelectedItemChange: (itemId: string | null) => void
  highlightedItemId?: string | null
  focusItemId?: string | null
  markerRevealDelayMs?: number
  isInteractive?: boolean
}

function shouldShowMarker(kind: MapMarkerKind, activeFilter: MapFilterKind) {
  return activeFilter === 'all' || activeFilter === kind
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function projectToFallbackMap([lng, lat]: [number, number]) {
  const x =
    ((lng - FALLBACK_BOUNDS.minLng) /
      (FALLBACK_BOUNDS.maxLng - FALLBACK_BOUNDS.minLng)) *
    100
  const y =
    ((FALLBACK_BOUNDS.maxLat - lat) /
      (FALLBACK_BOUNDS.maxLat - FALLBACK_BOUNDS.minLat)) *
    100

  return {
    x: clamp(x, 5, 95),
    y: clamp(y, 7, 93),
  }
}

function getFallbackMarkerLayout(items: CivicMapItem[]) {
  const positions = items.map((item) => ({
    item,
    ...projectToFallbackMap(item.coordinates),
    offsetX: 0,
    offsetY: 0,
  }))
  const visitedIds = new Set<string>()

  positions.forEach((position) => {
    if (visitedIds.has(position.item.id)) {
      return
    }

    const nearbyPositions = positions.filter((candidate) => {
      if (visitedIds.has(candidate.item.id)) {
        return false
      }

      return (
        Math.hypot(candidate.x - position.x, candidate.y - position.y) <=
        FALLBACK_MIN_MARKER_DISTANCE
      )
    })

    nearbyPositions.forEach((candidate) => visitedIds.add(candidate.item.id))

    if (nearbyPositions.length <= 1) {
      return
    }

    const radius = Math.min(34, 16 + nearbyPositions.length * 3)
    const angleStep = (Math.PI * 2) / nearbyPositions.length

    nearbyPositions.forEach((candidate, index) => {
      const angle = -Math.PI / 2 + angleStep * index

      candidate.offsetX = Math.cos(angle) * radius
      candidate.offsetY = Math.sin(angle) * radius
    })
  })

  return positions
}

function renderMarker(
  root: Root,
  item: CivicMapItem,
  selectedItemId: string | null,
  highlightedItemId: string | null,
  markerRevealDelayMs: number,
  onSelectedItemChange: (itemId: string | null) => void,
) {
  root.render(
    <MapMarker
      kind={item.kind}
      label={item.label}
      duplicateCount={item.duplicateCount}
      isSelected={item.id === selectedItemId}
      isHighlighted={item.id === highlightedItemId}
      revealDelayMs={item.id === highlightedItemId ? markerRevealDelayMs : 0}
      onSelect={() => onSelectedItemChange(item.id)}
    />,
  )
}

function syncMarkerStacking(
  record: MarkerRecord,
  selectedItemId: string | null,
  highlightedItemId: string | null,
) {
  record.marker.getElement().style.zIndex =
    record.item.id === selectedItemId || record.item.id === highlightedItemId
      ? '10'
      : ''
}

function applyMarkerSpread(
  map: MapboxMap,
  markerRecords: MarkerRecord[],
  activeFilter: MapFilterKind,
) {
  const visibleRecords = markerRecords.filter(({ item }) =>
    shouldShowMarker(item.kind, activeFilter),
  )
  const usedIds = new Set<string>()

  visibleRecords.forEach((record) => {
    if (usedIds.has(record.item.id)) {
      return
    }

    const projectedPoint = map.project(record.item.coordinates)
    const nearbyRecords = visibleRecords.filter((candidate) => {
      if (usedIds.has(candidate.item.id)) {
        return false
      }

      const candidatePoint = map.project(candidate.item.coordinates)
      const xDistance = candidatePoint.x - projectedPoint.x
      const yDistance = candidatePoint.y - projectedPoint.y

      return Math.hypot(xDistance, yDistance) <= MARKER_SPREAD_DISTANCE
    })

    nearbyRecords.forEach((candidate) => usedIds.add(candidate.item.id))

    if (nearbyRecords.length === 1) {
      record.marker.setOffset([0, 0])
      return
    }

    const radius = Math.min(34, 18 + nearbyRecords.length * 3)
    const angleStep = (Math.PI * 2) / nearbyRecords.length

    nearbyRecords.forEach((candidate, index) => {
      const angle = -Math.PI / 2 + angleStep * index

      candidate.marker.setOffset([
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
      ])
    })
  })
}

function preventMapCanvasFocus(container: HTMLDivElement) {
  const canvas = container.querySelector<HTMLCanvasElement>(MAPBOX_CANVAS_SELECTOR)

  if (!canvas) {
    return
  }

  canvas.tabIndex = -1

  if (document.activeElement === canvas) {
    canvas.blur()
  }
}

function FallbackCivicMap({
  items,
  activeFilter,
  selectedItemId,
  onSelectedItemChange,
  highlightedItemId = null,
  focusItemId = null,
  markerRevealDelayMs = 0,
  hasMapError = false,
}: CivicMapProps & { hasMapError?: boolean }) {
  const visibleItems = useMemo(
    () => items.filter((item) => shouldShowMarker(item.kind, activeFilter)),
    [activeFilter, items],
  )
  const markerLayout = useMemo(
    () => getFallbackMarkerLayout(visibleItems),
    [visibleItems],
  )
  const selectedItem = selectedItemId
    ? visibleItems.find((item) => item.id === selectedItemId)
    : undefined
  const focusedItem =
    selectedItem ??
    (focusItemId ? visibleItems.find((item) => item.id === focusItemId) : undefined)
  const focusedPosition = focusedItem
    ? markerLayout.find(({ item }) => item.id === focusedItem.id)
    : undefined
  const selectedPosition = selectedItem
    ? markerLayout.find(({ item }) => item.id === selectedItem.id)
    : undefined

  useEffect(() => {
    if (selectedItemId && !selectedItem) {
      onSelectedItemChange(null)
    }
  }, [onSelectedItemChange, selectedItem, selectedItemId])

  return (
    <div
      className="relative h-full min-h-80 w-full overflow-hidden rounded-lg bg-[#e9f6ee]"
      aria-label="Fallback CiviTm map of Timisoara"
      onClick={() => onSelectedItemChange(null)}
    >
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.52)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.52)_1px,transparent_1px)] bg-[size:76px_76px]" />
      <div className="absolute inset-x-0 top-[18%] h-9 rotate-[-8deg] bg-white/70 shadow-sm" />
      <div className="absolute left-[-6%] top-[55%] h-8 w-[112%] rotate-[11deg] bg-white/75 shadow-sm" />
      <div className="absolute left-[48%] top-[-8%] h-[116%] w-8 rotate-[5deg] bg-white/65 shadow-sm" />
      <div className="absolute left-[10%] top-[10%] h-28 w-36 rounded-[42%] border border-emerald-200/70 bg-emerald-100/75" />
      <div className="absolute bottom-[12%] right-[9%] h-32 w-44 rounded-[44%] border border-emerald-200/70 bg-lime-100/75" />
      <div className="absolute left-[54%] top-[35%] h-20 w-28 rounded-[45%] border border-cyan-100 bg-cyan-50/85" />

      <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-md border border-emerald-200 bg-white/92 px-3 py-2 text-xs font-semibold text-emerald-900 shadow-sm">
        {hasMapError ? 'Mapbox unavailable. Harta locala activa.' : 'Mapbox token missing. Harta locala activa.'}
      </div>

      <div className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-2 rounded-md border border-emerald-200 bg-white/92 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm">
        <MapPin className="size-4 text-emerald-600" aria-hidden="true" />
        Timisoara
      </div>

      {markerLayout.map(({ item, x, y, offsetX, offsetY }) => (
        <div
          key={item.id}
          className="absolute z-20"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
            zIndex:
              item.id === selectedItemId || item.id === highlightedItemId ? 35 : 20,
          }}
        >
          <MapMarker
            kind={item.kind}
            label={item.label}
            duplicateCount={item.duplicateCount}
            isSelected={item.id === selectedItemId}
            isHighlighted={item.id === highlightedItemId}
            revealDelayMs={item.id === highlightedItemId ? markerRevealDelayMs : 0}
            onSelect={() => onSelectedItemChange(item.id)}
          />
        </div>
      ))}

      {focusedPosition && !selectedPosition && (
        <div
          className="pointer-events-none absolute z-10 size-24 rounded-full border border-emerald-400/40 bg-emerald-300/10"
          style={{
            left: `${focusedPosition.x}%`,
            top: `${focusedPosition.y}%`,
            transform: `translate(calc(-50% + ${focusedPosition.offsetX}px), calc(-50% + ${focusedPosition.offsetY}px))`,
          }}
        />
      )}

      {selectedItem && (
        <div
          className="pointer-events-auto fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-[70] sm:hidden"
          onClick={(event) => event.stopPropagation()}
        >
          <SelectedIssuePanel
            item={selectedItem}
            onClose={() => onSelectedItemChange(null)}
            className="max-h-[min(32rem,calc(100dvh-7rem))] overflow-y-auto overscroll-contain rounded-xl shadow-xl shadow-slate-900/18"
          />
        </div>
      )}

      {selectedItem && selectedPosition && (
        <div
          className="pointer-events-auto absolute z-50 hidden sm:block"
          style={{
            left: `${selectedPosition.x}%`,
            top: `${selectedPosition.y}%`,
            transform: `translate(calc(-50% + ${selectedPosition.offsetX}px), calc(1.35rem + ${selectedPosition.offsetY}px))`,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <SelectedIssuePanel
            item={selectedItem}
            onClose={() => onSelectedItemChange(null)}
            className="max-h-[min(32rem,calc(100dvh-6rem))] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain shadow-xl shadow-slate-900/14"
          />
        </div>
      )}
    </div>
  )
}

export function CivicMap({
  items,
  activeFilter,
  selectedItemId,
  onSelectedItemChange,
  highlightedItemId = null,
  focusItemId = null,
  markerRevealDelayMs = 0,
  isInteractive = true,
}: CivicMapProps) {
  const mapShellRef = useRef<HTMLDivElement | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapboxMap | null>(null)
  const markerRefs = useRef<MarkerRecord[]>([])
  const activeFilterRef = useRef(activeFilter)
  const selectedItemIdRef = useRef(selectedItemId)
  const [mapError, setMapError] = useState(false)
  const [isMapReady, setIsMapReady] = useState(false)
  const [selectedMarkerPosition, setSelectedMarkerPosition] = useState<{
    x: number
    y: number
  } | null>(null)
  const selectedItem = selectedItemId
    ? items.find((item) => item.id === selectedItemId)
    : undefined
  const focusedItem =
    selectedItem ??
    (focusItemId ? items.find((item) => item.id === focusItemId) : undefined)

  useEffect(() => {
    activeFilterRef.current = activeFilter

    markerRefs.current.forEach(({ marker, item }) => {
      marker.getElement().style.display = shouldShowMarker(item.kind, activeFilter)
        ? ''
        : 'none'
    })
    const activeMap = mapRef.current

    if (activeMap && isMapReady) {
      applyMarkerSpread(activeMap, markerRefs.current, activeFilter)
    }

    const selectedItem = items.find((item) => item.id === selectedItemIdRef.current)

    if (selectedItem && !shouldShowMarker(selectedItem.kind, activeFilter)) {
      onSelectedItemChange(null)
    }
  }, [activeFilter, isMapReady, items, onSelectedItemChange])

  useEffect(() => {
    selectedItemIdRef.current = selectedItemId

    markerRefs.current.forEach((record) => {
      const { root, item } = record
      renderMarker(
        root,
        item,
        selectedItemId,
        highlightedItemId,
        markerRevealDelayMs,
        onSelectedItemChange,
      )
      syncMarkerStacking(record, selectedItemId, highlightedItemId)
    })
  }, [highlightedItemId, markerRevealDelayMs, onSelectedItemChange, selectedItemId])

  useEffect(() => {
    const activeMap = mapRef.current

    if (
      !activeMap ||
      !isMapReady ||
      !focusedItem ||
      !shouldShowMarker(focusedItem.kind, activeFilter)
    ) {
      setSelectedMarkerPosition(null)
      return
    }

    const updateSelectedMarkerPosition = () => {
      if (!selectedItem) {
        setSelectedMarkerPosition(null)
        return
      }

      const projectedPoint = activeMap.project(selectedItem.coordinates)
      const markerOffset = markerRefs.current
        .find(({ item }) => item.id === selectedItem.id)
        ?.marker.getOffset()
      const shellWidth = mapShellRef.current?.clientWidth ?? 0
      const shellHeight = mapShellRef.current?.clientHeight ?? 0
      const panelHalfWidth = Math.min(
        DESKTOP_PANEL_WIDTH / 2,
        Math.max(0, shellWidth / 2 - DESKTOP_PANEL_MARGIN),
      )
      const projectedX = projectedPoint.x + (markerOffset?.x ?? 0)
      const projectedY = projectedPoint.y + (markerOffset?.y ?? 0)
      const nextX =
        shellWidth > 0
          ? Math.min(
              Math.max(projectedX, panelHalfWidth + DESKTOP_PANEL_MARGIN),
              shellWidth - panelHalfWidth - DESKTOP_PANEL_MARGIN,
            )
          : projectedX
      const nextY =
        shellHeight > 0
          ? Math.min(
              Math.max(projectedY + DESKTOP_PANEL_TOP_GAP, DESKTOP_PANEL_MARGIN),
              Math.max(
                DESKTOP_PANEL_MARGIN,
                shellHeight -
                  DESKTOP_PANEL_ESTIMATED_HEIGHT -
                  DESKTOP_PANEL_MARGIN,
              ),
            )
          : projectedY + DESKTOP_PANEL_TOP_GAP

      setSelectedMarkerPosition({
        x: nextX,
        y: nextY,
      })
    }

    updateSelectedMarkerPosition()
    activeMap.on('move', updateSelectedMarkerPosition)
    activeMap.on('resize', updateSelectedMarkerPosition)

    if (isInteractive) {
      activeMap.easeTo({
        center: focusedItem.coordinates,
        duration: 900,
        essential: true,
        padding: { top: 90, bottom: 190, left: 40, right: 40 },
      })
    }

    return () => {
      activeMap.off('move', updateSelectedMarkerPosition)
      activeMap.off('resize', updateSelectedMarkerPosition)
    }
  }, [activeFilter, focusedItem, isInteractive, isMapReady, selectedItem])

  useEffect(() => {
    const activeMap = mapRef.current

    if (!activeMap || !isMapReady) {
      return
    }

    const closeSelectedItem = () => onSelectedItemChange(null)

    activeMap.on('click', closeSelectedItem)

    return () => {
      activeMap.off('click', closeSelectedItem)
    }
  }, [isMapReady, onSelectedItemChange])

  useEffect(() => {
    const activeMap = mapRef.current
    const mapShell = mapShellRef.current

    if (!activeMap || !mapShell || !isMapReady) {
      return
    }

    const resizeMap = () => {
      activeMap.resize()
    }
    const resizeObserver = new ResizeObserver(resizeMap)

    resizeObserver.observe(mapShell)
    window.setTimeout(resizeMap, 0)

    return () => resizeObserver.disconnect()
  }, [isMapReady])

  useEffect(() => {
    const closeSelectedItem = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onSelectedItemChange(null)
      }
    }

    document.addEventListener('keydown', closeSelectedItem)

    return () => {
      document.removeEventListener('keydown', closeSelectedItem)
    }
  }, [onSelectedItemChange])

  useEffect(() => {
    const activeMap = mapRef.current

    if (!activeMap || !isMapReady) {
      return
    }

    const existingMarkers = new Map(
      markerRefs.current.map((markerRecord) => [
        markerRecord.item.id,
        markerRecord,
      ]),
    )
    const nextMarkers: typeof markerRefs.current = []

    items.forEach((mapItem) => {
      const existingMarker = existingMarkers.get(mapItem.id)

      if (existingMarker) {
        existingMarker.item = mapItem
        existingMarker.marker.setLngLat(mapItem.coordinates)
        existingMarker.marker.getElement().style.display = shouldShowMarker(
          mapItem.kind,
          activeFilterRef.current,
        )
          ? ''
          : 'none'
        renderMarker(
          existingMarker.root,
          mapItem,
          selectedItemIdRef.current,
          highlightedItemId,
          markerRevealDelayMs,
          onSelectedItemChange,
        )
        syncMarkerStacking(existingMarker, selectedItemIdRef.current, highlightedItemId)
        nextMarkers.push(existingMarker)
        existingMarkers.delete(mapItem.id)
        return
      }

      const markerElement = document.createElement('div')
      const root = createRoot(markerElement)

      markerElement.style.display = shouldShowMarker(
        mapItem.kind,
        activeFilterRef.current,
      )
        ? ''
        : 'none'

      renderMarker(
        root,
        mapItem,
        selectedItemIdRef.current,
        highlightedItemId,
        markerRevealDelayMs,
        onSelectedItemChange,
      )

      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: 'center',
      })
        .setLngLat(mapItem.coordinates)
        .addTo(activeMap)

      nextMarkers.push({ marker, root, item: mapItem })
    })

    existingMarkers.forEach(({ marker, root }) => {
      marker.remove()
      root.unmount()
    })

    markerRefs.current = nextMarkers
    applyMarkerSpread(activeMap, markerRefs.current, activeFilterRef.current)
  }, [highlightedItemId, isMapReady, items, markerRevealDelayMs, onSelectedItemChange])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !isMapboxConfigured()) {
      return
    }

    let isMounted = true

    try {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: TIMISOARA_CENTER,
        zoom: 12.35,
        minZoom: 11.6,
        maxZoom: 17,
        maxBounds: TIMISOARA_MAX_BOUNDS,
        interactive: isInteractive,
      })

      const spreadVisibleMarkers = () => {
        if (mapRef.current) {
          applyMarkerSpread(
            mapRef.current,
            markerRefs.current,
            activeFilterRef.current,
          )
        }
      }

      mapRef.current.on('zoomend', spreadVisibleMarkers)
      mapRef.current.on('moveend', spreadVisibleMarkers)
      mapRef.current.on('resize', spreadVisibleMarkers)

      const markMapReady = () => {
        if (isMounted && mapContainerRef.current) {
          preventMapCanvasFocus(mapContainerRef.current)
          setIsMapReady(true)
          spreadVisibleMarkers()
        }
      }

      if (mapRef.current.loaded()) {
        window.setTimeout(markMapReady, 0)
      } else {
        mapRef.current.once('load', markMapReady)
      }
    } catch {
      window.setTimeout(() => {
        if (isMounted) {
          setMapError(true)
        }
      }, 0)
    }

    return () => {
      isMounted = false
      markerRefs.current.forEach(({ marker, root }) => {
        marker.remove()
        root.unmount()
      })
      markerRefs.current = []
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [isInteractive])

  if (!isMapboxConfigured() || mapError) {
    return (
      <FallbackCivicMap
        items={items}
        activeFilter={activeFilter}
        selectedItemId={selectedItemId}
        onSelectedItemChange={onSelectedItemChange}
        highlightedItemId={highlightedItemId}
        focusItemId={focusItemId}
        markerRevealDelayMs={markerRevealDelayMs}
        hasMapError={mapError}
      />
    )
  }

  return (
    <div ref={mapShellRef} className="relative h-full min-h-80 w-full max-w-full overflow-hidden sm:overflow-visible">
      <div ref={mapContainerRef} className="h-full min-h-80 w-full max-w-full rounded-lg" />

      {selectedItem && selectedMarkerPosition && (
        <div
          className="pointer-events-auto fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-[70] sm:hidden"
          onClick={(event) => event.stopPropagation()}
        >
          <SelectedIssuePanel
            item={selectedItem}
            onClose={() => onSelectedItemChange(null)}
            className="max-h-[min(32rem,calc(100dvh-7rem))] overflow-y-auto overscroll-contain rounded-xl shadow-xl shadow-slate-900/18"
          />
        </div>
      )}

      {selectedItem && selectedMarkerPosition && (
        <div
          className="pointer-events-auto absolute z-50 hidden sm:block"
          style={{
            left: selectedMarkerPosition.x,
            top: selectedMarkerPosition.y,
            transform: 'translateX(-50%)',
          }}
        >
          <SelectedIssuePanel
            item={selectedItem}
            onClose={() => onSelectedItemChange(null)}
            className="max-h-[min(32rem,calc(100dvh-6rem))] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain shadow-xl shadow-slate-900/14"
          />
        </div>
      )}
    </div>
  )
}
