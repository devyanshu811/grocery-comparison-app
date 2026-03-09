/**
 * Amazon Now / Amazon Fresh India scraper.
 * Searches Amazon India grocery section and extracts product data from DOM.
 * Amazon is the most bot-tolerant of the 8 stores.
 */

import type { ScrapeContext, ScrapeResult, ScrapedProduct } from "./types"
import { newPage } from "./browser"

export async function scrapeAmazon(ctx: ScrapeContext): Promise<ScrapeResult> {
  const storeId = "amazon_now"
  const { query } = ctx
  const page = await newPage()

  try {
    await page.goto(
      `https://www.amazon.in/s?k=${encodeURIComponent(query)}&i=grocery`,
      { waitUntil: "domcontentloaded", timeout: 30000 }
    )

    // Wait for product cards to appear (up to 10 s)
    await page.waitForSelector('[data-component-type="s-search-result"]', { timeout: 10000 }).catch(() => {})
    await new Promise((r) => setTimeout(r, 2000))

    // page.evaluate runs inside the browser; ScrapedProduct is only used here
    // for the return-type annotation so TypeScript is happy at the call-site.
    const products = await page.evaluate((sid: string) => {
      type Item = { name: string; price: number; quantity: string; image: string; category: string; storeId: string }
      const items: Item[] = []

      document.querySelectorAll('[data-component-type="s-search-result"]').forEach((el) => {
        // Name — try several selectors in priority order
        const nameEl =
          el.querySelector("h2 a span.a-text-normal") ||
          el.querySelector("h2 span") ||
          el.querySelector("h2 a span")
        const name = (nameEl as HTMLElement)?.innerText?.trim() || ""

        // Price — prefer the visually-hidden "a-offscreen" span (most reliable)
        const offscreen = el.querySelector("span.a-price span.a-offscreen") as HTMLElement | null
        let price = 0
        if (offscreen) {
          price = parseFloat(offscreen.innerText.replace(/[^\d.]/g, "")) || 0
        } else {
          const whole = (el.querySelector(".a-price-whole") as HTMLElement)?.innerText?.replace(/[^\d]/g, "") || ""
          const frac  = (el.querySelector(".a-price-fraction") as HTMLElement)?.innerText?.replace(/[^\d]/g, "") || "00"
          if (whole) price = parseFloat(`${whole}.${frac}`) || 0
        }

        const img = (el.querySelector("img.s-image") as HTMLImageElement)?.src || ""

        if (name && price > 0) {
          items.push({ name, price, quantity: "", image: img, category: "General", storeId: sid })
        }
      })

      return items
    }, storeId)

    return { storeId, products: products as ScrapedProduct[], success: true }
  } catch (e) {
    return { storeId, products: [], success: false, error: (e as Error).message }
  } finally {
    await page.close().catch(() => {})
  }
}
