import mapboxgl from 'mapbox-gl'

const mapboxAccessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? ''

if (mapboxAccessToken) {
  mapboxgl.accessToken = mapboxAccessToken
}

export { mapboxgl }

export function isMapboxConfigured() {
  return mapboxAccessToken.length > 0
}

export type MapboxGeocodedPlace = {
  name: string
  address: string
  latitude: number
  longitude: number
}

export async function geocodeTimisoaraAddressSuggestions(
  query: string,
  limit = 5,
  signal?: AbortSignal,
) {
  const trimmedQuery = query.trim()

  if (!isMapboxConfigured() || trimmedQuery.length === 0) {
    return []
  }

  const searchParams = new URLSearchParams({
    access_token: mapboxAccessToken,
    autocomplete: 'true',
    country: 'ro',
    language: 'en',
    limit: String(limit),
    proximity: '21.2087,45.7489',
    bbox: '21.13,45.69,21.32,45.81',
  })

  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      trimmedQuery,
    )}.json?${searchParams.toString()}`,
    { signal },
  )

  if (!response.ok) {
    throw new Error('Address search is temporarily unavailable.')
  }

  const data = (await response.json()) as {
    features?: Array<{
      address?: string
      center?: [number, number]
      place_name?: string
      text?: string
    }>
  }

  return (
    data.features
      ?.filter((feature) => feature.center)
      .map((feature) => ({
        name: feature.text ?? trimmedQuery,
        address: feature.place_name ?? trimmedQuery,
        latitude: feature.center?.[1] ?? 45.7489,
        longitude: feature.center?.[0] ?? 21.2087,
      })) ?? []
  ) satisfies MapboxGeocodedPlace[]
}

export async function geocodeTimisoaraAddress(query: string) {
  const suggestions = await geocodeTimisoaraAddressSuggestions(query, 1)
  const feature = suggestions[0]

  return feature ?? null
}

export async function reverseGeocodeTimisoaraCoordinates(
  latitude: number,
  longitude: number,
) {
  if (!isMapboxConfigured()) {
    return null
  }

  const searchParams = new URLSearchParams({
    access_token: mapboxAccessToken,
    country: 'ro',
    language: 'en',
    limit: '1',
    types: 'address,poi,neighborhood,locality,place',
  })

  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?${searchParams.toString()}`,
  )

  if (!response.ok) {
    throw new Error('Current address lookup is temporarily unavailable.')
  }

  const data = (await response.json()) as {
    features?: Array<{
      address?: string
      center?: [number, number]
      place_name?: string
      text?: string
    }>
  }
  const feature = data.features?.find((item) => item.center)

  if (!feature) {
    return null
  }

  const addressLine =
    feature.text && feature.address ? `${feature.text} ${feature.address}` : ''
  const placeName = feature.place_name ?? ''

  return {
    name: feature.text ?? 'Current location',
    address:
      addressLine && placeName.startsWith(addressLine)
        ? placeName
        : addressLine
          ? `${addressLine}, ${placeName}`
          : placeName || 'Current device location',
    latitude: feature.center?.[1] ?? latitude,
    longitude: feature.center?.[0] ?? longitude,
  } satisfies MapboxGeocodedPlace
}
