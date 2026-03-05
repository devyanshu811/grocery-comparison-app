/**
 * Swiggy Instamart scraper.
 * Grants geolocation permission, visits Instamart, and intercepts
 * the search API response after location is auto-detected.
 */

import type { ScrapeContext, ScrapeResult, ScrapedProduct } from "./types"
import { newPage, getBrowser } from "./browser"

interface SwiggyVariation {
  price?: { offer_price?: number; mrp?: number }
  quantity?: string
}

interface SwiggyItem {
  display_name?: string
  name?: string
  variations?: SwiggyVariation[]
  images?: Array<{ url?: string }>
  category?: string
}

interface SwiggyWidget {
  data?: SwiggyItem[]
}

interface SwiggyApiBody {
  data?: { widgets?: SwiggyWidget[]; products?: SwiggyItem[] }
  products?: SwiggyItem[]
  statusCode?: number
}

export async function scrapeSwiggy(ctx: ScrapeContext): Promise<ScrapeResult> {
  const storeId = "swiggy"
  const { query, lat = "12.9716", lon = "77.5946" } = ctx
  const page = await newPage()

  try {
    const browser = await getBrowser()
    const context = browser.defaultBrowserContext()
    await context.overridePermissions("https://www.swiggy.com", ["geolocation"])

    await page.setGeolocation({ latitude: parseFloat(lat), longitude: parseFloat(lon) })

    const captured: SwiggyItem[] = []

    await page.setRequestInterception(true)
    page.on("request", (req) => {
      if (["image", "font", "media"].includes(req.resourceType())) req.abort()
      else req.continue()
    })
    page.on("response", async (res) => {
      try {
        const url = res.url()
        const ct = res.headers()["content-type"] || ""
        if (
          url.includes("swiggy.com") &&
          ct.includes("json") &&
          (url.includes("instamart") || url.includes("store")) &&
          url.includes("search")
        ) {
          const body = (await res.json()) as SwiggyApiBody
          const items: SwiggyItem[] =
            body?.data?.widgets?.flatMap((w) => w.data ?? []) ||
            body?.data?.products ||
            body?.products ||
            []
          captured.push(...items)
        }
      } catch {}
    })

    // Instamart homepage first — triggers geolocation + session
    await page.goto("https://www.swiggy.com/instamart", { waitUntil: "domcontentloaded", timeout: 25000 })
    await new Promise((r) => setTimeout(r, 3000))

    // Click "Detect location" / "Allow" if Swiggy shows location permission dialog
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"], p'))
      const btn = buttons.find((b) => {
        const t = (b as HTMLElement).innerText?.toLowerCase() || ""
        return t.includes("detect") || t.includes("allow") || t.includes("current location") || t.includes("use my location")
      })
      if (btn) (btn as HTMLElement).click()
    })
    await new Promise((r) => setTimeout(r, 2000))

    // Search
    await page.goto(
      `https://www.swiggy.com/instamart/search?custom_back=true&query=${encodeURIComponent(query)}`,
      { waitUntil: "domcontentloaded", timeout: 20000 }
    )
    await new Promise((r) => setTimeout(r, 5000))

    const products: ScrapedProduct[] = captured
      .filter((p) => p.display_name || p.name)
      .flatMap((p) => {
        const name = (p.display_name || p.name || "").trim()
        const img = p.images?.[0]?.url || ""
        const cat = p.category || "General"
        if (p.variations?.length) {
          return p.variations.map((v) => ({
            name,
            price: v.price?.offer_price ?? v.price?.mrp ?? 0,
            quantity: v.quantity || "",
            image: img,
            category: cat,
            storeId,
          }))
        }
        return [{ name, price: 0, quantity: "", image: img, category: cat, storeId }]
      })
      .filter((p) => p.price > 0)

    return { storeId, products, success: true }
  } catch (e) {
    return { storeId, products: [], success: false, error: (e as Error).message }
  } finally {
    await page.close().catch(() => {})
  }
}
