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

    // Wait for either the React PLP cards or legacy Magento items
    await page.waitForSelector(
      [
        // React rewrite (current JioMart)
        "[class*='plp-card']",
        "[class*='ProductCard']",
        "[class*='product-card']",
        "[data-product-id]",
        // Legacy Magento (fallback)
        "li.item.product.product-item",
        ".plp-card-container",
      ].join(", "),
      { timeout: 15000 }
    ).catch(() => {})
    await new Promise((r) => setTimeout(r, 4000))

    // DOM extraction — covers both JioMart's React rewrite and legacy Magento
    const domProducts = await page.evaluate((sid) => {
      const items: Array<{
        name: string
        price: number
        quantity: string
        image: string
        category: string
        storeId: string
      }> = []

      // React rewrite selectors (current JioMart as of 2025)
      const reactSelectors = [
        "[class*='plp-card']",
        "[class*='ProductCard']",
        "[class*='product-card']",
        "[data-product-id]",
      ]

      // Magento legacy selectors
      const magentoSelectors = [
        "li.item.product.product-item",
        ".plp-card-container",
        "[class*='product-item']",
      ]

      const allSelectors = [...reactSelectors, ...magentoSelectors]
      const seen = new Set<string>()

      for (const sel of allSelectors) {
        const cards = document.querySelectorAll(sel)
        if (!cards.length) continue

        cards.forEach((el) => {
          // Name: try data attrs first, then text elements
          const nameEl =
            el.querySelector("[class*='product-name'], [class*='productName'], [class*='title']") ||
            el.querySelector("a.product-item-link, strong.product-item-name") ||
            el.querySelector("h3, h4, a[title]")
          const name =
            (nameEl as HTMLAnchorElement)?.getAttribute("title") ||
            (nameEl as HTMLElement)?.innerText?.trim() ||
            ""

          // Price: prefer discounted/selling price
          const priceEl =
            el.querySelector("[class*='discounted-price'], [class*='selling-price'], [class*='final-price']") ||
            el.querySelector(".special-price .price, .price-box .price") ||
            el.querySelector("[class*='price']")
          const price =
            parseFloat(((priceEl as HTMLElement)?.innerText || "0").replace(/[^\d.]/g, "")) || 0

          const qtyEl = el.querySelector(
            "[class*='unit'], [class*='weight'], [class*='qty'], [class*='pack'], [class*='size']"
          ) as HTMLElement | null
          const qty = qtyEl?.innerText?.trim() || ""

          const imgEl =
            (el.querySelector("img.product-image-photo") as HTMLImageElement) ||
            (el.querySelector("img[data-src]") as HTMLImageElement) ||
            (el.querySelector("img") as HTMLImageElement)
          const img = imgEl?.src || imgEl?.getAttribute("data-src") || ""

          if (name && price > 0 && !seen.has(name)) {
            seen.add(name)
            items.push({ name, price, quantity: qty, image: img, category: "General", storeId: sid })
          }
        })

        if (items.length > 0) break
      }

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
