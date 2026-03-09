/**
 * GET /api/stores/search?q=<query>&lat=<lat>&lon=<lon>&pincode=<pincode>
 *
 * Resolves pincode → lat/lon when coordinates are absent (Blinkit/Zepto need them).
 * Tries the dedicated scraper service (localhost:3001) first.
 * Falls back to running scrapers in-process when the service is not running.
 */

import { NextRequest, NextResponse } from "next/server"
import { scrapeAllStores } from "../../../scrapers/index"

export const dynamic = "force-dynamic"
export const maxDuration = 120

const SCRAPER_SERVICE = process.env.SCRAPER_SERVICE_URL || "http://localhost:3001"

// ─── Pincode → lat/lon ───────────────────────────────────────────────────────

/**
 * A small in-process lookup table for common Indian city pincodes.
 * This avoids an extra network round-trip to a geocoding API for the most
 * common cases.  Unknown pincodes fall through to the Nominatim API.
 */
const PINCODE_COORDS: Record<string, { lat: string; lon: string }> = {
  // Mumbai
  "400001": { lat: "18.9388", lon: "72.8354" },
  "400050": { lat: "19.0596", lon: "72.8295" },
  "400076": { lat: "19.0176", lon: "72.8562" },
  // Delhi
  "110001": { lat: "28.6139", lon: "77.2090" },
  "110044": { lat: "28.5065", lon: "77.3018" },
  // Bengaluru
  "560001": { lat: "12.9716", lon: "77.5946" },
  "560034": { lat: "12.9453", lon: "77.6602" },
  // Hyderabad
  "500001": { lat: "17.3850", lon: "78.4867" },
  // Chennai
  "600001": { lat: "13.0827", lon: "80.2707" },
  // Kolkata
  "700001": { lat: "22.5726", lon: "88.3639" },
  // Pune
  "411001": { lat: "18.5204", lon: "73.8567" },
  // Ahmedabad
  "380001": { lat: "23.0225", lon: "72.5714" },
}

/** Resolve a 6-digit Indian pincode to lat/lon.
 *  Checks the inline lookup first; falls back to Nominatim if not found.
 */
async function pincodeToLatLon(
  pincode: string
): Promise<{ lat: string; lon: string } | null> {
  const direct = PINCODE_COORDS[pincode]
  if (direct) return direct

  // Nominatim open geocoding — free, no key required, ~1 RPS rate-limit
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=IN&format=json&limit=1`,
      {
        headers: { "User-Agent": "PriceHubGroceryApp/1.0" },
        signal: AbortSignal.timeout(5000),
      }
    )
    if (!res.ok) return null
    const data = (await res.json()) as Array<{ lat: string; lon: string }>
    if (data.length > 0) return { lat: data[0].lat, lon: data[0].lon }
  } catch {
    // Non-fatal — scrapers will use their own defaults
  }

  return null
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q        = (searchParams.get("q") || "").trim()
  let   lat      = searchParams.get("lat") || undefined
  let   lon      = searchParams.get("lon") || undefined
  const pincode  = searchParams.get("pincode") || undefined

  if (!q) {
    return NextResponse.json({ error: "Missing query parameter q" }, { status: 400 })
  }

  // Resolve lat/lon from pincode when coordinates are not supplied directly.
  // Blinkit and Zepto both need real coordinates for location-accurate results.
  if ((!lat || !lon) && pincode && /^\d{6}$/.test(pincode)) {
    const coords = await pincodeToLatLon(pincode)
    if (coords) {
      lat = coords.lat
      lon = coords.lon
    }
  }

  // ── Try the dedicated scraper service first (warm browser, separate process) ─
  try {
    const params = new URLSearchParams({ q })
    if (lat)     params.set("lat", lat)
    if (lon)     params.set("lon", lon)
    if (pincode) params.set("pincode", pincode)

    const serviceRes = await fetch(`${SCRAPER_SERVICE}/scrape?${params}`, {
      signal: AbortSignal.timeout(100000),
    })

    if (serviceRes.ok) {
      const data = await serviceRes.json()
      return NextResponse.json(data)
    }
  } catch {
    // Scraper service not running — fall through to in-process invocation
  }

  // ── In-process fallback (works in local dev without the service) ──────────
  try {
    const { products, results } = await scrapeAllStores(
      { query: q, lat, lon, pincode },
      55000
    )

    const summary = results.map((r) => ({
      storeId: r.storeId,
      count:   r.products.length,
      success: r.success,
      error:   r.error ?? null,
    }))

    return NextResponse.json({
      query: q,
      total: products.length,
      products,
      summary,
    })
  } catch (e) {
    return NextResponse.json(
      { error: "Scraping failed", details: (e as Error).message },
      { status: 500 }
    )
  }
}
