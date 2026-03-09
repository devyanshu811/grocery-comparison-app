/**
 * Blinkit scraper — uses Blinkit's mobile API directly.
 * No Puppeteer needed: the API only requires lat/lon headers,
 * no session or address confirmation.
 */

import type { ScrapeContext, ScrapeResult, ScrapedProduct } from "./types"

interface BlinkitProduct {
  group_name?: string
  name?: string
  price?: number
  mrp?: number
  unit?: string
  image_url?: string
  images?: Array<{ m?: string }>
  category?: string
}

interface BlinkitApiBody {
  products?: BlinkitProduct[]
  // some endpoints nest under data
  data?: { products?: BlinkitProduct[] }
}

export async function scrapeBlinkit(ctx: ScrapeContext): Promise<ScrapeResult> {
  const storeId = "blinkit"
  const { query, lat = "28.6139", lon = "77.2090" } = ctx

  try {
    const url = `https://api.blinkit.com/v2/search/?q=${encodeURIComponent(query)}&start=0&size=20`

    const res = await fetch(url, {
      headers: {
        lat: String(lat),
        lon: String(lon),
        app_version: "15.4.1",
        platform: "android",
        "web-version": "1.80.0",
        accept: "application/json, text/plain, */*",
        "accept-language": "en-IN,en-US;q=0.9,en;q=0.8",
        "user-agent":
          "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      return { storeId, products: [], success: false, error: `HTTP ${res.status}` }
    }

    const body = (await res.json()) as BlinkitApiBody
    const raw = body?.products ?? body?.data?.products ?? []

    const products: ScrapedProduct[] = raw
      .filter((p) => p.group_name || p.name)
      .map((p) => ({
        name: (p.group_name || p.name || "").trim(),
        price: p.price ?? p.mrp ?? 0,
        quantity: p.unit || "",
        image: p.image_url || p.images?.[0]?.m || "",
        category: p.category || "General",
        storeId,
      }))
      .filter((p) => p.price > 0)

    return { storeId, products, success: true }
  } catch (e) {
    return { storeId, products: [], success: false, error: (e as Error).message }
  }
}
