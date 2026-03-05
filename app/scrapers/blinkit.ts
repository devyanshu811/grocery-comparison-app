/**
 * Blinkit scraper.
 * Grants geolocation permission so Blinkit detects location automatically,
 * then intercepts their internal search API response.
 */

import type { ScrapeContext, ScrapeResult, ScrapedProduct } from "./types"
import { newPage, getBrowser } from "./browser"

interface BlinkitProduct {
  group_name?: string
  name?: string
  price?: number
  unit?: string
  image_url?: string
  images?: Array<{ m?: string }>
  category?: string
}

interface BlinkitApiBody {
  products?: BlinkitProduct[]
}

export async function scrapeBlinkit(ctx: ScrapeContext): Promise<ScrapeResult> {
  const storeId = "blinkit"
  const { query, lat = "28.6139", lon = "77.2090" } = ctx
  const page = await newPage()

  try {
    // Grant geolocation so the site detects location without a permission prompt
    const browser = await getBrowser()
    const context = browser.defaultBrowserContext()
    await context.overridePermissions("https://blinkit.com", ["geolocation"])

    await page.setGeolocation({ latitude: parseFloat(lat), longitude: parseFloat(lon) })

    const captured: BlinkitProduct[] = []

    await page.setRequestInterception(true)
    page.on("request", (req) => {
      if (["image", "font", "media"].includes(req.resourceType())) req.abort()
      else req.continue()
    })
    page.on("response", async (res) => {
      try {
        const url = res.url()
        if (
          url.includes("blinkit.com") &&
          (url.includes("/search/products") || url.includes("search?q=")) &&
          res.headers()["content-type"]?.includes("json")
        ) {
          const body = (await res.json()) as BlinkitApiBody
          if (body?.products?.length) captured.push(...body.products)
        }
      } catch {}
    })

    // Step 1: visit homepage — gets session + triggers geolocation
    await page.goto("https://blinkit.com", { waitUntil: "domcontentloaded", timeout: 18000 })
    await new Promise((r) => setTimeout(r, 2000))

    // Step 2: click "Detect my location" / "Use current location" if visible
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"], a'))
      const btn = buttons.find((b) => {
        const t = (b as HTMLElement).innerText?.toLowerCase() || ""
        return (
          t.includes("detect") || t.includes("use my location") || t.includes("current location")
        )
      })
      if (btn) (btn as HTMLElement).click()
    })
    await new Promise((r) => setTimeout(r, 2000))

    // Step 3: navigate to search
    await page.goto(
      `https://blinkit.com/s/?q=${encodeURIComponent(query)}`,
      { waitUntil: "domcontentloaded", timeout: 18000 }
    )
    await new Promise((r) => setTimeout(r, 4000))

    // Map captured API responses
    let products: ScrapedProduct[] = captured
      .filter((p) => p.group_name || p.name)
      .map((p) => ({
        name: (p.group_name || p.name || "").trim(),
        price: typeof p.price === "number" ? p.price : 0,
        quantity: p.unit || "",
        image: p.image_url || p.images?.[0]?.m || "",
        category: p.category || "General",
        storeId,
      }))

    // DOM fallback — walk up from price elements (universal, works for any DOM structure)
    if (products.length === 0) {
      const domProducts = await page.evaluate((sid) => {
        const items: Array<{
          name: string; price: number; quantity: string; image: string; category: string; storeId: string
        }> = []
        const seen = new Set<string>()

        // Find price elements — Blinkit may use CSS ::before for ₹, so also match bare numbers
        const allEls = Array.from(document.querySelectorAll("div, span, p, strong"))
        for (const el of allEls) {
          if (el.children.length > 2) continue
          const text = (el as HTMLElement).innerText?.trim() || ""
          if (!text) continue

          // Match "₹45", "₹ 45", "45" (standalone number in price range)
          let price = 0
          if (/₹\s*\d/.test(text)) {
            price = parseFloat(text.replace(/[^0-9.]/g, "")) || 0
          } else if (/^\d{2,4}(\.\d{1,2})?$/.test(text)) {
            // Bare number like "45" or "129.90" — check if it's inside a price-context element
            const parentClass = ((el as HTMLElement).className || "") + (el.parentElement?.className || "")
            if (/price|cost|₹|rupee/i.test(parentClass)) {
              price = parseFloat(text) || 0
            }
          }
          if (price <= 0 || price > 10000) continue

          // Walk UP up to 8 levels to find a container with both an image and a name
          let card: Element = el
          for (let i = 0; i < 8; i++) {
            if (!card.parentElement) break
            card = card.parentElement
            if (card.querySelector("img")) break
          }

          const imgEl = card.querySelector("img") as HTMLImageElement | null
          const img = imgEl?.src || imgEl?.getAttribute("data-src") || ""

          // Collect all text inside the card, pick the longest non-price, non-number string as name
          const texts = Array.from(card.querySelectorAll("div, span, p, strong, h3, h4, a"))
            .map((e) => (e as HTMLElement).innerText?.trim() || "")
            .filter((t) => t.length > 3 && t.length < 120 && !/^₹/.test(t) && !/^\d+$/.test(t))
          const name = texts.sort((a, b) => b.length - a.length)[0] || ""

          if (!name || seen.has(name)) continue
          seen.add(name)
          const qty = texts.find((t) => /\d+\s*(g|kg|ml|l|pcs|piece|pack)/i.test(t)) || ""
          items.push({ name, price, quantity: qty, image: img, category: "General", storeId: sid })
        }

        return items
      }, storeId)

      products = domProducts
    }

    return { storeId, products, success: true }
  } catch (e) {
    return { storeId, products: [], success: false, error: (e as Error).message }
  } finally {
    await page.close().catch(() => {})
  }
}
