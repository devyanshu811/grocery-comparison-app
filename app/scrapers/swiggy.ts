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

    // DOM fallback — runs when API interception returned nothing
    if (products.length === 0) {
      const domProducts = await page.evaluate((sid: string) => {
        const items: Array<{
          name: string; price: number; quantity: string; image: string; category: string; storeId: string
        }> = []
        const seen = new Set<string>()

        // Try Swiggy's known product card selector first
        const cards = Array.from(
          document.querySelectorAll('[data-testid="product-card"], [class*="product-card"], [class*="ProductCard"]')
        )

        for (const card of cards) {
          const nameEl =
            (card.querySelector('[class*="product-name"], [class*="productName"], h3, h4, .product-name') as HTMLElement) ||
            (card.querySelector("a") as HTMLElement)
          const name = nameEl?.innerText?.trim() || nameEl?.getAttribute("title") || ""

          const priceEl = card.querySelector(
            '[class*="product-price"], [class*="price"], [class*="Price"]'
          ) as HTMLElement | null
          const priceText = priceEl?.innerText || ""
          const price = parseFloat(priceText.replace(/[^\d.]/g, "")) || 0

          const imgEl = card.querySelector("img") as HTMLImageElement | null
          const img = imgEl?.src || ""

          if (name && price > 0 && !seen.has(name)) {
            seen.add(name)
            items.push({ name, price, quantity: "", image: img, category: "General", storeId: sid })
          }
        }

        // Universal price-walk fallback if no cards matched
        if (items.length === 0) {
          const allEls = Array.from(document.querySelectorAll("div, span, p, strong"))
          for (const el of allEls) {
            if (el.children.length > 3) continue
            const text = (el as HTMLElement).innerText?.trim() || ""
            if (!/₹\s*\d/.test(text)) continue
            const price = parseFloat(text.replace(/[^\d.]/g, "")) || 0
            if (price <= 0 || price > 10000) continue

            let card: Element = el
            for (let i = 0; i < 8; i++) {
              if (!card.parentElement) break
              card = card.parentElement
              if (card.querySelector("img")) break
            }

            const imgEl = card.querySelector("img") as HTMLImageElement | null
            const img = imgEl?.src || ""
            const texts = Array.from(card.querySelectorAll("div, span, p, strong, h3, a"))
              .map((e) => (e as HTMLElement).innerText?.trim() || "")
              .filter((t) => t.length > 3 && t.length < 120 && !/^₹/.test(t) && !/^\d+$/.test(t))
            const name = texts.sort((a, b) => b.length - a.length)[0] || ""

            if (!name || seen.has(name)) continue
            seen.add(name)
            const qty = texts.find((t) => /\d+\s*(g|kg|ml|l|pcs|piece|pack)/i.test(t)) || ""
            items.push({ name, price, quantity: qty, image: img, category: "General", storeId: sid })
          }
        }

        return items
      }, storeId)

      products.push(...domProducts)
    }

    return { storeId, products, success: true }
  } catch (e) {
    return { storeId, products: [], success: false, error: (e as Error).message }
  } finally {
    await page.close().catch(() => {})
  }
}
