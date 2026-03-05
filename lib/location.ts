/**
 * Location detection and reverse geocoding for delivery/pincode.
 * Used to show "Delivering to [place]" and pass pincode to price APIs.
 */

export interface GeoLocation {
  city: string
  pincode: string
  displayName: string
}

/** Get current position from browser; returns null if denied or unsupported */
export function getCurrentPosition(): Promise<GeolocationPosition | null> {
  if (typeof window === "undefined" || !navigator?.geolocation) return Promise.resolve(null)
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null),
      { timeout: 10000, maximumAge: 300000 }
    )
  })
}

/** Reverse geocode lat/lng to city and pincode (India-friendly via Nominatim) */
export async function reverseGeocode(lat: number, lon: number): Promise<GeoLocation | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      address?: {
        postcode?: string
        city?: string
        town?: string
        village?: string
        state_district?: string
        state?: string
      }
      display_name?: string
    }
    const addr = data.address || {}
    const pincode = addr.postcode || ""
    const city =
      addr.city || addr.town || addr.village || addr.state_district || addr.state || "Your area"
    const displayName = data.display_name || `${city}${pincode ? ` ${pincode}` : ""}`
    return { city, pincode, displayName }
  } catch {
    return null
  }
}

/** Detect location: geolocation + reverse geocode. Returns display string and pincode for store */
export async function detectLocation(): Promise<GeoLocation | null> {
  const pos = await getCurrentPosition()
  if (!pos) return null
  return reverseGeocode(pos.coords.latitude, pos.coords.longitude)
}
