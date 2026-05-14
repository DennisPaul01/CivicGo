import { useEffect, useRef, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { Map as MapboxMap, Marker as MapboxMarker } from 'mapbox-gl'
import { MapPin } from 'lucide-react'
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
}

function shouldShowMarker(kind: MapMarkerKind, activeFilter: MapFilterKind) {
  return activeFilter === 'all' || activeFilter === kind
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

export function CivicMap({
  items,
  activeFilter,
  selectedItemId,
  onSelectedItemChange,
  highlightedItemId = null,
  focusItemId = null,
  markerRevealDelayMs = 0,
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

    const selectedItem = markerRefs.current.find(
      ({ item }) => item.id === selectedItemIdRef.current,
    )?.item

    if (selectedItem && !shouldShowMarker(selectedItem.kind, activeFilter)) {
      onSelectedItemChange(null)
    }
  }, [activeFilter, isMapReady, onSelectedItemChange])

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
      const panelHalfWidth = Math.min(160, Math.max(0, shellWidth / 2 - 20))
      const projectedX = projectedPoint.x + (markerOffset?.x ?? 0)
      const nextX =
        shellWidth > 0
          ? Math.min(
              Math.max(projectedX, panelHalfWidth + 12),
              shellWidth - panelHalfWidth - 12,
            )
          : projectedX

      setSelectedMarkerPosition({
        x: nextX,
        y: projectedPoint.y + (markerOffset?.y ?? 0),
      })
    }

    updateSelectedMarkerPosition()
    activeMap.on('move', updateSelectedMarkerPosition)
    activeMap.on('resize', updateSelectedMarkerPosition)

    activeMap.easeTo({
      center: focusedItem.coordinates,
      duration: 900,
      essential: true,
      padding: { top: 90, bottom: 190, left: 40, right: 40 },
    })

    return () => {
      activeMap.off('move', updateSelectedMarkerPosition)
      activeMap.off('resize', updateSelectedMarkerPosition)
    }
  }, [activeFilter, focusedItem, isMapReady, selectedItem])

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
  }, [])

  if (!isMapboxConfigured() || mapError) {
    return (
      <div className="flex h-full min-h-80 w-full items-center justify-center bg-orange-50 text-emerald-950">
        <div className="mx-4 flex max-w-sm flex-col items-center gap-3 rounded-lg border border-emerald-200 bg-white/90 p-6 text-center shadow-sm">
          <MapPin className="size-7 text-emerald-600" aria-hidden="true" />
          <div>
            <h1 className="text-lg font-semibold">Harta CiviTm este pregatita</h1>
            <p className="mt-1 text-sm text-slate-600">
              Adauga un token Mapbox pentru a afisa harta live a orasului.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={mapShellRef} className="relative h-full min-h-80 w-full overflow-visible">
      <div ref={mapContainerRef} className="h-full min-h-80 w-full rounded-lg" />

      {selectedItem && selectedMarkerPosition && (
        <div
          className="pointer-events-auto absolute z-50"
          style={{
            left: selectedMarkerPosition.x,
            top: selectedMarkerPosition.y,
            transform: 'translate(-50%, 1.4rem)',
          }}
        >
          <SelectedIssuePanel
            item={selectedItem}
            onClose={() => onSelectedItemChange(null)}
            className="max-h-[min(23rem,calc(100svh-7rem))] w-[min(20.5rem,calc(100vw-2rem))] overflow-y-auto shadow-lg shadow-slate-900/12"
          />
        </div>
      )}
    </div>
  )
}
