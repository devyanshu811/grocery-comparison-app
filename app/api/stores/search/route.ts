/**
 * GET /api/stores/search?q=<query>&lat=<lat>&lon=<lon>&pincode=<pincode>
 *
 * Runs all 8 store scrapers in parallel and returns merged product list.
 * Used by the scraper provider as the backend for the live data flow.
 */

import { NextRequest, NextResponse } from "next/server"
import { scrapeAllStores } from "../../../scrapers/index"

export const dynamic = "force-dynamic"
// Allow plenty of time for parallel scraping (Vercel allows 60s, self-hosted has no limit)
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = (searchParams.get("q") || "").trim()
  const lat = searchParams.get("lat") || undefined
  const lon = searchParams.get("lon") || undefined
  const pincode = searchParams.get("pincode") || undefined

  if (!q) {
    return NextResponse.json({ error: "Missing query parameter q" }, { status: 400 })
  }

  try {
    const { products, results } = await scrapeAllStores({ query: q, lat, lon, pincode })

    const summary = results.map((r) => ({
      storeId: r.storeId,
      count: r.products.length,
      success: r.success,
      error: r.error,
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
