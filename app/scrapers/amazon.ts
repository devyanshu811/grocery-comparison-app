/**
 * Amazon Now / Amazon Fresh India scraper.
 * Searches Amazon India grocery section and extracts product data from DOM.
 * Amazon is the most bot-tolerant of the 8 stores.
 */

import type { ScrapeContext, ScrapeResult } from "./types"
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

    // Wait for product cards to appear (up to 10s)
    await page.waitForSelector('[data-component-type="s-search-result"]', { timeout: 10000 }).catch(() => {})
    await new Promise((r) => setTimeout(r, 2000))

    const products = await page.evaluate((sid) => {
      const items: ScrapedProduct[] = []

      document.querySelectorAll('[data-component-type="s-search-result"]').forEach((el) => {
        // Name: try multiple selectors
        const nameEl =
          el.querySelector("h2 a span.a-text-normal") ||
          el.querySelector("h2 span") ||
          el.querySelector("h2 a span")
        const name = (nameEl as HTMLElement)?.innerText?.trim() || ""

        // Price: try the offscreen price first (most accurate), then individual parts
        const offscreen = el.querySelector("span.a-price span.a-offscreen") as HTMLElement | null
        let price = 0
        if (offscreen) {
          price = parseFloat(offscreen.innerText.replace(/[^\d.]/g, "")) || 0
        } else {
          const whole = (el.querySelector(".a-price-whole") as HTMLElement)?.innerText?.replace(/[^\d]/g, "") || ""
          const frac = (el.querySelector(".a-price-fraction") as HTMLElement)?.innerText?.replace(/[^\d]/g, "") || "00"
          if (whole) price = parseFloat(`${whole}.${frac}`) || 0
        }

        const img = (el.querySelector("img.s-image") as HTMLImageElement)?.src || ""

        if (name && price > 0) {
          items.push({ name, price, quantity: "", image: img, category: "General", storeId: sid })
        }
      })

      return items
    }, storeId)

    return { storeId, products, success: true }
  } catch (e) {
    return { storeId, products: [], success: false, error: (e as Error).message }
  } finally {
    await page.close().catch(() => {})
  }
}

interface ScrapedProduct {
  name: string; price: number; quantity: string; image: string; category: string; storeId: string
}
