import { create } from 'zustand'
import type { MapFilterKind } from '@/components/map/MapMarker'
import type { MapTimeFilterKind } from '@/data/civicMapData'

type MapStore = {
  activeFilter: MapFilterKind
  activeTimeFilter: MapTimeFilterKind
  selectedItemId: string | null
  setActiveFilter: (filter: MapFilterKind) => void
  setActiveTimeFilter: (filter: MapTimeFilterKind) => void
  setSelectedItemId: (itemId: string | null) => void
}

export const useMapStore = create<MapStore>((set) => ({
  activeFilter: 'all',
  activeTimeFilter: '7d',
  selectedItemId: null,
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setActiveTimeFilter: (filter) => set({ activeTimeFilter: filter }),
  setSelectedItemId: (itemId) => set({ selectedItemId: itemId }),
}))
