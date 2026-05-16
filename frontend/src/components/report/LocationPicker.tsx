import {
  Check,
  LoaderCircle,
  LocateFixed,
  MapPin,
  Navigation,
  Search,
  TriangleAlert,
} from '@/components/icons/hugeicons'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  reportLocations,
  type ReportLocation,
} from '@/data/reportLocations'
import {
  geocodeTimisoaraAddress,
  geocodeTimisoaraAddressSuggestions,
  isMapboxConfigured,
  reverseGeocodeTimisoaraCoordinates,
  type MapboxGeocodedPlace,
} from '@/lib/mapbox'

const initialAreaCount = 4

type LocationMode = 'idle' | 'address'

type LocationPickerProps = {
  selectedLocationId: string
  selectedLocation?: ReportLocation | null
  onLocationChange: (location: ReportLocation) => void
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function cleanTimisoaraAddress(address: string, keepHouseNumber = false) {
  const cleanAddress = address
    .split(',')
    .map((part) => part.trim())
    .filter((part) => {
      const normalizedPart = normalizeSearchText(part)

      return (
        normalizedPart.length > 0 &&
        !normalizedPart.startsWith('timisoara') &&
        normalizedPart !== 'timis' &&
        normalizedPart !== 'judetul timis' &&
        normalizedPart !== 'timis county' &&
        normalizedPart !== 'romania'
      )
    })
    .join(', ')
    .trim()

  if (keepHouseNumber) {
    return cleanAddress
  }

  return cleanAddress.replace(/\s+\d{1,3}[a-zA-Z]?(?:[-/]\d{1,3}[a-zA-Z]?)?$/g, '')
}

function getNearestArea(latitude: number, longitude: number) {
  return [...reportLocations].sort((first, second) => {
    const firstDistance =
      Math.abs(first.latitude - latitude) + Math.abs(first.longitude - longitude)
    const secondDistance =
      Math.abs(second.latitude - latitude) + Math.abs(second.longitude - longitude)

    return firstDistance - secondDistance
  })[0]
}

function createExactLocation(
  place: MapboxGeocodedPlace,
  source: 'address' | 'current',
): ReportLocation {
  const nearestArea = getNearestArea(place.latitude, place.longitude)
  const cleanAddress = cleanTimisoaraAddress(place.address, true)

  return {
    id: `exact-${source}`,
    name: place.name,
    address: `${cleanAddress}${nearestArea ? ` · langa ${nearestArea.name}` : ''}`,
    latitude: place.latitude,
    longitude: place.longitude,
    precision: 'exact',
    zoneName: nearestArea?.name ?? place.name,
  }
}

export function LocationPicker({
  selectedLocationId,
  selectedLocation,
  onLocationChange,
}: LocationPickerProps) {
  const locationInputId = useId()
  const areaSearchInputId = useId()
  const suggestionsListId = `${locationInputId}-suggestions`
  const addressInputRef = useRef<HTMLInputElement>(null)
  const shouldSkipNextSuggestionsRef = useRef(false)
  const [locationMode, setLocationMode] = useState<LocationMode>('idle')
  const [addressQuery, setAddressQuery] = useState('')
  const [areaQuery, setAreaQuery] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [addressSuggestions, setAddressSuggestions] = useState<
    MapboxGeocodedPlace[]
  >([])
  const [areSuggestionsOpen, setAreSuggestionsOpen] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false)
  const selectedExactLocation =
    selectedLocationId === 'exact-address' || selectedLocationId === 'exact-current'
  const selectedAreaName = selectedExactLocation
    ? selectedLocation?.zoneName
    : selectedLocation?.name
  const selectedArea = reportLocations.find(
    (location) =>
      selectedAreaName &&
      normalizeSearchText(location.name) === normalizeSearchText(selectedAreaName),
  )
  const pinnedAddress =
    selectedExactLocation && selectedLocation
      ? selectedLocation.address.split(' · langa ')[0]
      : ''
  const visibleAreas = useMemo(() => {
    const normalizedQuery = normalizeSearchText(areaQuery.trim())

    if (!normalizedQuery) {
      const initialAreas = reportLocations.slice(0, initialAreaCount)

      if (!selectedArea || initialAreas.some((location) => location.id === selectedArea.id)) {
        return initialAreas
      }

      return [
        selectedArea,
        ...initialAreas.filter((location) => location.id !== selectedArea.id),
      ].slice(0, initialAreaCount)
    }

    return reportLocations.filter((location) => {
      const searchableText = normalizeSearchText(`${location.name} ${location.address}`)

      return searchableText.includes(normalizedQuery)
    })
  }, [areaQuery, selectedArea])

  useEffect(() => {
    const trimmedQuery = addressQuery.trim()

    if (shouldSkipNextSuggestionsRef.current) {
      shouldSkipNextSuggestionsRef.current = false
      setAddressSuggestions([])
      setAreSuggestionsOpen(false)
      setIsLoadingSuggestions(false)
      return
    }

    if (!isMapboxConfigured() || trimmedQuery.length < 3) {
      return
    }

    const abortController = new AbortController()
    const timeoutId = window.setTimeout(() => {
      setIsLoadingSuggestions(true)

      geocodeTimisoaraAddressSuggestions(trimmedQuery, 5, abortController.signal)
        .then((places) => {
          setAddressSuggestions(places)
          setAreSuggestionsOpen(places.length > 0)
        })
        .catch((error) => {
          if (error instanceof DOMException && error.name === 'AbortError') {
            return
          }

          setAddressSuggestions([])
          setAreSuggestionsOpen(false)
        })
        .finally(() => {
          if (!abortController.signal.aborted) {
            setIsLoadingSuggestions(false)
          }
        })
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
      abortController.abort()
    }
  }, [addressQuery])

  useEffect(() => {
    if (locationMode !== 'address') {
      return
    }

    addressInputRef.current?.focus()
  }, [locationMode])

  function selectExactPlace(
    place: MapboxGeocodedPlace,
    source: 'address' | 'current',
  ) {
    const exactLocation = {
      ...createExactLocation(
        {
          ...place,
          address: place.address,
        },
        source,
      ),
      id: source === 'address' ? 'exact-address' : 'exact-current',
    }

    onLocationChange(exactLocation)
    if (source === 'address') {
      shouldSkipNextSuggestionsRef.current = true
      setAddressQuery(cleanTimisoaraAddress(place.address, true))
      addressInputRef.current?.blur()
    }
    setAddressSuggestions([])
    setAreSuggestionsOpen(false)
    setIsLoadingSuggestions(false)
    setStatusMessage(
      exactLocation.zoneName
        ? `Fixat automat in ${exactLocation.zoneName}.`
        : 'Locatie exacta fixata.',
    )
  }

  async function handleAddressSearch() {
    const trimmedQuery = addressQuery.trim()

    if (trimmedQuery.length === 0) {
      setStatusMessage('Scrie mai intai o adresa sau un reper.')
      return
    }

    if (!isMapboxConfigured()) {
      setStatusMessage('Cautarea dupa adresa nu este disponibila. Alege o zona apropiata.')
      return
    }

    setIsSearchingAddress(true)
    setStatusMessage('')

    try {
      const place = await geocodeTimisoaraAddress(trimmedQuery)

      if (!place) {
        setStatusMessage('Nu am gasit un loc potrivit. Incearca o strada sau un reper.')
        return
      }

      selectExactPlace(place, 'address')
      setAddressSuggestions([])
      setAreSuggestionsOpen(false)
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'Cautarea dupa adresa este indisponibila temporar.',
      )
    } finally {
      setIsSearchingAddress(false)
    }
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setStatusMessage('Locatia curenta nu este disponibila in acest browser.')
      return
    }

    setIsUsingCurrentLocation(true)
    setStatusMessage('Cautam adresa ta...')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nearestArea = getNearestArea(
          position.coords.latitude,
          position.coords.longitude,
        )
        let place: MapboxGeocodedPlace = {
          name: nearestArea ? `Locatia curenta langa ${nearestArea.name}` : 'Locatia curenta',
          address: 'Locatia curenta a dispozitivului',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }

        try {
          const reverseGeocodedPlace = await reverseGeocodeTimisoaraCoordinates(
            position.coords.latitude,
            position.coords.longitude,
          )

          if (reverseGeocodedPlace) {
            place = reverseGeocodedPlace
          }
        } catch {
          setStatusMessage('Cautarea adresei a esuat. Am fixat locatia dupa coordonate GPS.')
        }

        selectExactPlace(place, 'current')
        setAddressSuggestions([])
        setAreSuggestionsOpen(false)
        setIsUsingCurrentLocation(false)
      },
      () => {
        setStatusMessage('Permite accesul la locatie sau alege o zona apropiata.')
        setIsUsingCurrentLocation(false)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: 10_000,
      },
    )
  }

  return (
    <section className="rounded-lg border border-emerald-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
            3
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Locatie obligatorie
            </p>
            <h2 className="!mb-0 !mt-0.5 !text-base !leading-tight font-semibold text-emerald-950">
              Fixeaza locul pe harta
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              Cauta o adresa, foloseste locatia curenta sau alege o zona
              apropiata. CiviTm va pune raportul pe harta.
            </p>
          </div>
        </div>
        <span className="hidden size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:flex">
          <LocateFixed className="size-4.5" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            className={cn(
              'inline-flex h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-500/25',
              locationMode === 'address'
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'border border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50',
            )}
            aria-expanded={locationMode === 'address'}
            aria-controls={`${locationInputId}-panel`}
            onClick={() => {
              setLocationMode((currentMode) =>
                currentMode === 'address' ? 'idle' : 'address',
              )
              setStatusMessage('')
            }}
          >
            <Search className="size-4" aria-hidden="true" />
            Introdu adresa
          </button>

          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-500/25 disabled:pointer-events-none disabled:opacity-50"
            disabled={isUsingCurrentLocation}
            onClick={() => {
              setLocationMode('idle')
              handleUseCurrentLocation()
            }}
          >
            {isUsingCurrentLocation ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Navigation className="size-4" aria-hidden="true" />
            )}
            Foloseste locatia mea
          </button>
        </div>

        {locationMode === 'address' && (
          <div id={`${locationInputId}-panel`} className="mt-3 grid gap-3">
            <div className="relative grid gap-1.5">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor={locationInputId}
              >
                Adresa sau reper
              </label>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <input
                  ref={addressInputRef}
                  id={locationInputId}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/20"
                  type="text"
                  value={addressQuery}
                  onChange={(event) => {
                    const nextQuery = event.target.value

                    setAddressQuery(nextQuery)
                    setStatusMessage('')

                    if (nextQuery.trim().length < 3) {
                      setAddressSuggestions([])
                      setAreSuggestionsOpen(false)
                      setIsLoadingSuggestions(false)
                    }
                  }}
                  onFocus={() => {
                    setAreSuggestionsOpen(addressSuggestions.length > 0)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      void handleAddressSearch()
                    }

                    if (event.key === 'Escape') {
                      setAreSuggestionsOpen(false)
                    }
                  }}
                  placeholder="ex. Calea Torontalului 30"
                  aria-autocomplete="list"
                  aria-controls={suggestionsListId}
                  aria-expanded={areSuggestionsOpen}
                />

                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:pointer-events-none disabled:opacity-50"
                  disabled={isSearchingAddress}
                  onClick={handleAddressSearch}
                >
                  {isSearchingAddress ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Search className="size-4" aria-hidden="true" />
                  )}
                  Cauta
                </button>
              </div>
              {(areSuggestionsOpen || isLoadingSuggestions) && (
                <div
                  id={suggestionsListId}
                  className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-20 overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-lg"
                  role="listbox"
                >
                  {isLoadingSuggestions && addressSuggestions.length === 0 ? (
                    <div className="flex min-h-11 items-center gap-2 px-3 text-sm font-medium text-slate-500">
                      <LoaderCircle
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      Cautam adrese apropiate...
                    </div>
                  ) : (
                    addressSuggestions.map((place) => (
                      <button
                        key={`${place.address}-${place.latitude}-${place.longitude}`}
                        type="button"
                        className="flex w-full items-start gap-2 px-3 py-2 text-left transition hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none"
                        role="option"
                        onMouseDown={(event) => {
                          event.preventDefault()
                        }}
                        onClick={() => {
                          selectExactPlace(place, 'address')
                          setAddressSuggestions([])
                          setAreSuggestionsOpen(false)
                        }}
                      >
                        <MapPin
                          className="mt-0.5 size-4 shrink-0 text-emerald-600"
                          aria-hidden="true"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-emerald-950">
                            {place.name}
                          </span>
                          <span className="mt-0.5 block line-clamp-2 text-xs leading-4 text-slate-600">
                            {cleanTimisoaraAddress(place.address, true)}
                          </span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {selectedExactLocation && selectedLocation && (
          <div className="mt-3 grid gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <span className="font-medium text-slate-600">Locatie fixata</span>
              <span className="mt-0.5 block truncate font-semibold text-emerald-950">
                {pinnedAddress || 'Locatia curenta a dispozitivului'}
              </span>
            </div>
            {selectedArea && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="font-medium text-slate-600">Zona detectata</span>
                <span className="inline-flex items-center gap-2.5 rounded-md bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">
                  <Check className="size-3.5" aria-hidden="true" />
                  {selectedArea.name}
                </span>
              </div>
            )}
          </div>
        )}

        {(selectedExactLocation || statusMessage) && (
          <p
            className={cn(
              'mt-3 flex items-center gap-2 text-sm font-semibold',
              selectedExactLocation ? 'text-emerald-800' : 'text-amber-700',
            )}
          >
            {selectedExactLocation ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <TriangleAlert className="size-4" aria-hidden="true" />
            )}
            {statusMessage || 'Locatie exacta fixata.'}
          </p>
        )}
      </div>

      <div className="mt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Zone apropiate
            </p>
            <p className="mt-1 text-xs leading-4 text-slate-500">
              Afisam {visibleAreas.length} din {reportLocations.length} zone.
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <label className="sr-only" htmlFor={areaSearchInputId}>
              Cauta zone apropiate
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id={areaSearchInputId}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/20"
              type="search"
              value={areaQuery}
              onChange={(event) => {
                setAreaQuery(event.target.value)
              }}
              placeholder="Cauta zona"
            />
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {visibleAreas.map((location) => {
          const isSelected =
            selectedLocationId === location.id || selectedArea?.id === location.id

          return (
            <button
              key={location.id}
              type="button"
              className={cn(
                'flex min-h-18 items-start gap-2.5 rounded-lg border p-2.5 text-left outline-none transition focus-visible:ring-3 focus-visible:ring-emerald-500/25',
                isSelected
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/60',
              )}
              aria-pressed={isSelected}
              onClick={() => {
                setStatusMessage('')
                onLocationChange(location)
              }}
            >
              <span
                className={cn(
                  'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md',
                  isSelected
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-500',
                )}
              >
                {isSelected ? (
                  <Check className="size-3.5" aria-hidden="true" />
                ) : (
                  <MapPin className="size-3.5" aria-hidden="true" />
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-emerald-950">
                  {location.name}
                </span>
                <span className="mt-0.5 block text-xs leading-4 text-slate-600">
                  {location.address}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {visibleAreas.length === 0 && (
        <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-600">
          Nu am gasit nicio zona. Incearca Iosefin, Mehala, Aradului sau Fabric.
        </div>
      )}
    </section>
  )
}
