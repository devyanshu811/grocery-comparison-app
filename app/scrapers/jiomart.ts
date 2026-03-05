/**
 * JioMart scraper.
 * JioMart has a server-rendered Magento catalog. Products show without location.
 * We try their internal API first, then fall back to DOM extraction.
 */

import type { ScrapeContext, ScrapeResult, ScrapedProduct } from "./types"
import { newPage } from "./browser"

interface JioMartItem {
  name?: string
  price?: string | number
  special_price?: string | number
  unit?: string
  net_weight?: string
  image?: string
  thumbnail?: string
  category_name?: string
}

interface JioMartApiResponse {
  data?: JioMartItem[]
  products?: JioMartItem[]
  items?: JioMartItem[]
}

export async function scrapeJiomart(ctx: ScrapeContext): Promise<ScrapeResult> {
  const storeId = "jiomart"
  const { query } = ctx
  const page = await newPage()

  try {
    const captured: ScrapedProduct[] = []

    // Intercept JSON API responses
    await page.setRequestInterception(true)
    page.on("request", (req) => {
      if (["image", "font", "media"].includes(req.resourceType())) req.abort()
      else req.continue()
    })
    page.on("response", async (res) => {
      try {
        const url = res.url()
        if (
          url.includes("jiomart.com") &&
          res.headers()["content-type"]?.includes("json") &&
          (url.includes("search") || url.includes("catalog") || url.includes("product"))
        ) {
          const body = (await res.json()) as JioMartApiResponse
          const items = body?.data || body?.products || body?.items || []
          items.forEach((p) => {
            const name = String(p.name || "").trim()
            if (!name) return
            const rawPrice = p.special_price ?? p.price ?? 0
            const price =
              parseFloat(String(rawPrice).replace(/[^\d.]/g, "")) || 0
            captured.push({
              name,
              price,
              quantity: String(p.unit || p.net_weight || ""),
              image: String(p.image || p.thumbnail || ""),
              category: String(p.category_name || "General"),
              storeId,
            })
          })
        }
      } catch {}
    })

    // JioMart catalog search — server-rendered via Magento, no location gate
    // Use a mobile UA to avoid the 503 bot-detection some IPs get on desktop UA
    await page.setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
    )
    await page.goto(
      `https://www.jiomart.com/catalogsearch/result/?q=${encodeURIComponent(query)}`,
      { waitUntil: "domcontentloaded", timeout: 30000 }
    )

    // Wait generously — Magento loads a lot of JS before rendering cards
    await page.waitForSelector(
      "li.item.product.product-item, ol.products, .plp-card-container, [class*='plp'], [data-index]",
      { timeout: 12000 }
    ).catch(() => {})
    await new Promise((r) => setTimeout(r, 6000))

    // DOM extraction
    const domProducts = await page.evaluate((sid) => {
      const items: Array<{
        name: string
        price: number
        quantity: string
        image: string
        category: string
        storeId: string
      }> = []

      // Try multiple selectors in priority order
      const selectors = [
        "li.item.product.product-item",
        ".plp-card-container",
        "[class*='product-item']",
        "[class*='ProductCard']",
        "[data-index]",
      ]

      let parsed = false
      for (const sel of selectors) {
        const cards = document.querySelectorAll(sel)
        if (!cards.length) continue

        cards.forEach((el) => {
          const nameEl =
            el.querySelector("a.product-item-link, .product-item-name a, strong.product-item-name") ||
            el.querySelector("[class*='plp-card-title'], [class*='title'], [class*='name']")
          const name =
            (nameEl as HTMLAnchorElement)?.getAttribute("title") ||
            (nameEl as HTMLElement)?.innerText?.trim() ||
            ""

          const priceEl =
            el.querySelector(".special-price .price, .price-box .price") ||
            el.querySelector("[class*='final-price'], [class*='discounted'], [class*='price']")
          const price =
            parseFloat(((priceEl as HTMLElement)?.innerText || "0").replace(/[^\d.]/g, "")) || 0

          const qty = ((el.querySelector("[class*='unit'], [class*='weight'], [class*='qty'], [class*='pack']") as HTMLElement)?.innerText || "").trim()

          const img =
            (el.querySelector("img.product-image-photo") as HTMLImageElement)?.src ||
            (el.querySelector("img[data-src]") as HTMLImageElement)?.getAttribute("data-src") ||
            (el.querySelector("img") as HTMLImageElement)?.src || ""

          if (name && price > 0) {
            items.push({ name, price, quantity: qty, image: img, category: "General", storeId: sid })
          }
        })

        if (items.length > 0) { parsed = true; break }
      }
      void parsed

      return items
    }, storeId)

    const all = [...captured, ...domProducts]
    return { storeId, products: all, success: true }
  } catch (e) {
    return { storeId, products: [], success: false, error: (e as Error).message }
  } finally {
    await page.close().catch(() => {})
  }
}
