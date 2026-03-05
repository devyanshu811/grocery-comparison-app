/**
 * Flipkart Minutes / Flipkart Grocery scraper.
 * Uses Flipkart's grocery search section.
 * Also tries intercepting their API response.
 */

import type { ScrapeContext, ScrapeResult, ScrapedProduct } from "./types"
import { newPage } from "./browser"

interface FlipkartProductValue {
  price?: number
  title?: string
  imageUrl?: string
  unitInfo?: string
}

interface FlipkartProductItem {
  productInfo?: { value?: FlipkartProductValue }
}

interface FlipkartPageContext {
  value?: { searchResult?: { products?: FlipkartProductItem[] } }
}

interface FlipkartApiBody {
  pageContext?: FlipkartPageContext
}

export async function scrapeFlipkart(ctx: ScrapeContext): Promise<ScrapeResult> {
  const storeId = "flipkart_minutes"
  const { query } = ctx
  const page = await newPage()

  try {
    const captured: ScrapedProduct[] = []

    await page.setRequestInterception(true)
    page.on("request", (req) => {
      if (["image", "font", "media"].includes(req.resourceType())) req.abort()
      else req.continue()
    })
    page.on("response", async (res) => {
      try {
        const url = res.url()
        if (
          url.includes("flipkart.com") &&
          (url.includes("search") || url.includes("browse") || url.includes("listing") || url.includes("api")) &&
          res.headers()["content-type"]?.includes("json")
        ) {
          const body = (await res.json()) as FlipkartApiBody
          const products = body?.pageContext?.value?.searchResult?.products || []
          products.forEach((p) => {
            const info = p.productInfo?.value
            if (info?.title) {
              captured.push({
                name: info.title.trim(),
                price: info.price ?? 0,
                quantity: info.unitInfo || "",
                image: info.imageUrl || "",
                category: "General",
                storeId,
              })
            }
          })
        }
      } catch {}
    })

    // Flipkart grocery search — use the plain search + grocery SID
    await page.goto(
      `https://www.flipkart.com/search?q=${encodeURIComponent(query)}&marketplace=GROCERY&otracker=search`,
      { waitUntil: "domcontentloaded", timeout: 30000 }
    )
    await page.waitForSelector(
      "._13oc-S, [class*='_1YokD2'], [data-tkid], [class*='productCard'], [class*='_2B099V']",
      { timeout: 12000 }
    ).catch(() => {})
    await new Promise((r) => setTimeout(r, 5000))

    // DOM fallback
    if (captured.length === 0) {
      const domProducts = await page.evaluate((sid) => {
        const items: Array<{
          name: string
          price: number
          quantity: string
          image: string
          category: string
          storeId: string
        }> = []

        // Flipkart grocery card selectors (these change over time)
        const selectors = [
          "._13oc-S",
          "[class*='productInfo']",
          "[data-tkid]",
          "._2kHMtA",
          "._1fQZEK",
        ]

        for (const sel of selectors) {
          const cards = document.querySelectorAll(sel)
          if (cards.length === 0) continue

          cards.forEach((el) => {
            const nameEl =
              (el.querySelector("._4rR01T, ._2WkVRV, a[title], [class*='_3wU53n']") as HTMLElement) ||
              (el.querySelector("a") as HTMLElement)
            const name = nameEl?.getAttribute("title") || nameEl?.innerText?.trim() || ""

            const priceEl = el.querySelector(
              "._30jeq3, ._1_WHN1, [class*='_1vC4OE'], [class*='Vy3kIQ']"
            ) as HTMLElement | null
            const price =
              parseFloat((priceEl?.innerText || "0").replace(/[^\d.]/g, "")) || 0

            const qtyEl = el.querySelector("[class*='_2cLu-l'], [class*='weight']") as HTMLElement | null
            const qty = qtyEl?.innerText?.trim() || ""

            const imgEl = el.querySelector("img._396cs4, img._2r_T1I, img") as HTMLImageElement | null
            const img = imgEl?.src || ""

            if (name && price > 0) {
              items.push({ name, price, quantity: qty, image: img, category: "General", storeId: sid })
            }
          })

          if (items.length > 0) break
        }

        return items
      }, storeId)

      captured.push(...domProducts)
    }

    return { storeId, products: captured, success: true }
  } catch (e) {
    return { storeId, products: [], success: false, error: (e as Error).message }
  } finally {
    await page.close().catch(() => {})
  }
}
