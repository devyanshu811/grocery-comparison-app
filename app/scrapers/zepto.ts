/**
 * Zepto scraper — uses Zepto's mobile API directly.
 * Step 1: resolve store_id for the given lat/lon.
 * Step 2: search products using that store_id.
 * No Puppeteer or address-confirmation UI needed.
 */

import type { ScrapeContext, ScrapeResult, ScrapedProduct } from "./types"

interface ZeptoStoreResponse {
  store_id?: string
  id?: string
  storeId?: string
}

interface ZeptoProduct {
  product?: { name?: string; category?: string }
  sellingPrice?: number
  mrp?: number
  productVariant?: { formattedPacksize?: string }
  imageUrl?: string
  images?: string[]
}

interface ZeptoSearchResponse {
  data?: ZeptoProduct[]
  response?: ZeptoProduct[]
  // some versions nest under sections
  sections?: Array<{
    widget_type?: string
    layout?: Array<{ data?: ZeptoProduct }>
  }>
}

const ZEPTO_HEADERS = {
  accept: "application/json, text/plain, */*",
  "accept-language": "en-IN,en-US;q=0.9",
  "x-app-version": "7.2.0",
  "x-platform": "android",
  "user-agent":
    "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
}

export async function scrapeZepto(ctx: ScrapeContext): Promise<ScrapeResult> {
  const storeId = "zepto"
  const { query, lat = "12.9716", lon = "77.5946" } = ctx

  try {
    // Step 1: resolve nearest store for the coordinates
    let zeptoStoreId = ""
    try {
      const storeRes = await fetch(
        `https://api.zeptonow.com/api/v1/store?lat=${lat}&lon=${lon}`,
        { headers: ZEPTO_HEADERS, signal: AbortSignal.timeout(8000) }
      )
      if (storeRes.ok) {
        const storeData = (await storeRes.json()) as ZeptoStoreResponse
        zeptoStoreId = storeData?.store_id || storeData?.id || storeData?.storeId || ""
      }
    } catch {
      // Non-fatal — continue without store_id
    }

    // Step 2: search products
    const searchParams = new URLSearchParams({
      query,
      page: "1",
      page_size: "20",
    })
    if (zeptoStoreId) searchParams.set("store_id", zeptoStoreId)

    const searchRes = await fetch(
      `https://api.zeptonow.com/api/v3/search?${searchParams}`,
      { headers: ZEPTO_HEADERS, signal: AbortSignal.timeout(15000) }
    )

    if (!searchRes.ok) {
      return { storeId, products: [], success: false, error: `HTTP ${searchRes.status}` }
    }

    const body = (await searchRes.json()) as ZeptoSearchResponse

    // Flatten all possible response shapes
    let raw: ZeptoProduct[] =
      body?.data ||
      body?.response ||
      body?.sections?.flatMap((s) =>
        (s.layout || []).map((l) => l.data).filter((d): d is ZeptoProduct => !!d)
      ) ||
      []

    const products: ScrapedProduct[] = raw
      .filter((p) => p.product?.name)
      .map((p) => ({
        name: (p.product!.name || "").trim(),
        // sellingPrice is in paise (1/100 rupee)
        price:
          typeof p.sellingPrice === "number"
            ? p.sellingPrice / 100
            : typeof p.mrp === "number"
            ? p.mrp
            : 0,
        quantity: p.productVariant?.formattedPacksize || "",
        image: p.imageUrl || p.images?.[0] || "",
        category: p.product?.category || "General",
        storeId,
      }))
      .filter((p) => p.price > 0)

    return { storeId, products, success: true }
  } catch (e) {
    return { storeId, products: [], success: false, error: (e as Error).message }
  }
}
