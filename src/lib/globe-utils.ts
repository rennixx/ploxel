/**
 * Utility functions for globe coordinate conversions.
 *
 * Lat/long conventions:
 * - Latitude: -90 (south) to 90 (north)
 * - Longitude: -180 (west) to 180 (east)
 */

export interface Bounds {
  north: number
  south: number
  east: number
  west: number
  center: { lat: number; long: number }
}

/**
 * Convert geographic coordinates to texture UV coordinates.
 * Latitude: -90 to 90 → V: 1 to 0
 * Longitude: -180 to 180 → U: 0 to 1
 *
 * @example
 * // Expect roughly center
 * // latLongToUV(0, 0) => { u: 0.5, v: 0.5 }
 */
export function latLongToUV(
  lat: number,
  long: number
): { u: number; v: number } {
  if (!Number.isFinite(lat) || !Number.isFinite(long)) {
    throw new Error('latLongToUV: lat and long must be finite numbers')
  }

  const clampedLat = Math.max(-90, Math.min(90, lat))
  const wrappedLong = ((long + 180) % 360 + 360) % 360 - 180

  const u = (wrappedLong + 180) / 360
  const v = 1 - (clampedLat + 90) / 180
  return { u, v }
}

/**
 * Convert texture UV coordinates to geographic coordinates.
 *
 * @example
 * // uvToLatLong(0.5, 0.5) => { lat: 0, long: 0 }
 */
export function uvToLatLong(u: number, v: number): { lat: number; long: number } {
  if (!Number.isFinite(u) || !Number.isFinite(v)) {
    throw new Error('uvToLatLong: u and v must be finite numbers')
  }

  const clampedU = Math.max(0, Math.min(1, u))
  const clampedV = Math.max(0, Math.min(1, v))

  const long = clampedU * 360 - 180
  const lat = (1 - clampedV) * 180 - 90
  return { lat, long }
}

/**
 * Convert 3D cartesian coordinates on a sphere to lat/long.
 *
 * @example
 * // cartesianToLatLong(0, 5, 0, 5) => { lat: 90, long: 0 }
 */
export function cartesianToLatLong(
  x: number,
  y: number,
  z: number,
  radius: number = 5
): { lat: number; long: number } {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
    throw new Error('cartesianToLatLong: x, y, z must be finite numbers')
  }
  if (!Number.isFinite(radius) || radius <= 0) {
    throw new Error('cartesianToLatLong: radius must be a positive number')
  }

  const lat = (Math.asin(y / radius) * 180) / Math.PI
  const long = (Math.atan2(z, x) * 180) / Math.PI
  return { lat, long }
}

/**
 * Calculate bounding box for a drawing area given center and radius in kilometers.
 *
 * @example
 * // calculateRegionBounds(0, 0, 100) => bounds around the equator
 */
export function calculateRegionBounds(
  centerLat: number,
  centerLong: number,
  radiusKm: number
): Bounds {
  if (
    !Number.isFinite(centerLat) ||
    !Number.isFinite(centerLong) ||
    !Number.isFinite(radiusKm)
  ) {
    throw new Error('calculateRegionBounds: inputs must be finite numbers')
  }
  if (radiusKm <= 0) {
    throw new Error('calculateRegionBounds: radiusKm must be positive')
  }

  const earthRadiusKm = 6371
  const latDelta = (radiusKm / earthRadiusKm) * (180 / Math.PI)
  const longDelta =
    (radiusKm / earthRadiusKm) * (180 / Math.PI) / Math.cos((centerLat * Math.PI) / 180)

  const north = Math.min(90, centerLat + latDelta)
  const south = Math.max(-90, centerLat - latDelta)
  const east = ((centerLong + longDelta + 180) % 360) - 180
  const west = ((centerLong - longDelta + 180) % 360) - 180

  return {
    north,
    south,
    east,
    west,
    center: { lat: centerLat, long: centerLong }
  }
}

/**
 * Haversine distance between two points in kilometers.
 *
 * @example
 * // haversineDistance(0, 0, 0, 1) ≈ 111.32
 */
export function haversineDistance(
  lat1: number,
  long1: number,
  lat2: number,
  long2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const r = 6371

  const dLat = toRad(lat2 - lat1)
  const dLong = toRad(long2 - long1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLong / 2) *
      Math.sin(dLong / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return r * c
}

/**
 * Convert a zoom level (1-20) to drawing radius in kilometers.
 */
export function zoomLevelToRadius(zoomLevel: number): number {
  const maxRadius = 500
  const minRadius = 10

  if (!Number.isFinite(zoomLevel)) {
    throw new Error('zoomLevelToRadius: zoomLevel must be a finite number')
  }

  const clamped = Math.max(1, Math.min(20, zoomLevel))
  const radius = maxRadius / Math.pow(2, clamped - 1)
  return Math.max(minRadius, radius)
}

/**
 * Reverse geocode a coordinate using OpenStreetMap Nominatim.
 * Note: Respect their usage policy if you use this in production.
 */
export async function getLocationName(lat: number, long: number): Promise<string> {
  if (!Number.isFinite(lat) || !Number.isFinite(long)) {
    throw new Error('getLocationName: lat and long must be finite numbers')
  }

  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(long))

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'Ploxel-3D/0.1 (contact@example.com)'
    }
  })

  if (!response.ok) {
    throw new Error(`getLocationName: request failed (${response.status})`)
  }

  const data = (await response.json()) as {
    name?: string
    display_name?: string
    address?: { city?: string; town?: string; village?: string; country?: string }
  }

  const city =
    data.address?.city || data.address?.town || data.address?.village || data.name
  const country = data.address?.country

  if (city && country) return `${city}, ${country}`
  if (data.display_name) return data.display_name
  return 'Unknown location'
}
