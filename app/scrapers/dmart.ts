/**
 * D'Mart Ready scraper.
 * Calls D'Mart's internal API from within the page context,
 * then falls back to DOM extraction.
 */

import type { ScrapeContext, ScrapeResult, ScrapedProduct } from "./types"
import { newPage } from "./browser"

interface DmartProduct {
  name?: string
  product_name?: string
  price?: number | string
  mrp?: number | string
  selling_price?: number | string
  packagingType?: string
  unit?: string
  weight?: string
  image_url?: string
  imageUrl?: string
  image?: string
  category?: string
}

interface DmartApiResponse {
  data?: DmartProduct[]
  products?: DmartProduct[]
  items?: DmartProduct[]
  content?: DmartProduct[]
}

export async function scrapeDmart(ctx: ScrapeContext): Promise<ScrapeResult> {
  const storeId = "dmart_ready"
  const { query } = ctx
  const page = await newPage()

  try {
    await page.setRequestInterception(true)
    page.on("request", (req) => {
      if (["image", "font", "media"].includes(req.resourceType())) req.abort()
      else req.continue()
    })

    const captured: ScrapedProduct[] = []

    page.on("response", async (res) => {
      try {
        const url = res.url()
        if (
          url.includes("dmart.in") &&
          (url.includes("search") || url.includes("product") || url.includes("catalog")) &&
          res.headers()["content-type"]?.includes("json")
        ) {
          const body = (await res.json()) as DmartApiResponse
          const items = body?.data || body?.products || body?.items || body?.content || []
          items.forEach((p) => {
            const name = String(p.name || p.product_name || "").trim()
            if (!name) return
            const price =
              parseFloat(
                String(p.price || p.mrp || p.selling_price || 0).replace(/[^\d.]/g, "")
              ) || 0
            captured.push({
              name,
              price,
              quantity: String(p.packagingType || p.unit || p.weight || ""),
              image: String(p.image_url || p.imageUrl || p.image || ""),
              category: String(p.category || "General"),
              storeId,
            })
          })
        }
      } catch {}
    })

    await page.goto(
      `https://www.dmart.in/product/search?search_text=${encodeURIComponent(query)}&type=search`,
      { waitUntil: "domcontentloaded", timeout: 30000 }
    )
    await page.waitForSelector(
      "[class*='product'], .product-item-section, .col-xl-2, [class*='ProductInfo']",
      { timeout: 12000 }
    ).catch(() => {})
    await new Promise((r) => setTimeout(r, 6000))

    if (captured.length === 0) {
      // Try calling D'Mart's API from within page context
      const apiResult = await page.evaluate(
        async (q: string): Promise<DmartApiResponse> => {
          try {
            const r = await window.fetch(
              `/api/products/search?search_text=${encodeURIComponent(q)}&type=search&page_no=0&page_size=20`,
              {
                headers: { accept: "application/json" },
                credentials: "include",
              }
            )
            if (!r.ok) return {}
            return (await r.json()) as DmartApiResponse
          } catch {
            return {}
          }
        },
        query
      )

      const apiItems = apiResult?.data || apiResult?.products || apiResult?.items || apiResult?.content || []
      apiItems.forEach((p) => {
        const name = String(p.name || p.product_name || "").trim()
        if (!name) return
        const price =
          parseFloat(String(p.price || p.mrp || 0).replace(/[^\d.]/g, "")) || 0
        captured.push({ name, price, quantity: String(p.unit || ""), image: String(p.image_url || ""), category: "General", storeId })
      })
    }

    // Final DOM fallback — D'Mart uses MUI Grid + Tailwind CSS custom properties
    if (captured.length === 0) {
      const domProducts = await page.evaluate((sid) => {
        const items: Array<{
          name: string; price: number; quantity: string; image: string; category: string; storeId: string
        }> = []
        const seen = new Set<string>()

        // D'Mart uses MUI Grid with md-3 or md-4 column sizes as product card containers
        const containers = [
          ...Array.from(document.querySelectorAll("[class*='MuiGrid-grid-md-3']")),
          ...Array.from(document.querySelectorAll("[class*='MuiGrid-grid-md-4']")),
        ]

        containers.forEach((card) => {
          // Must have an image to be a real product card
          const imgEl = card.querySelector("img") as HTMLImageElement | null
          if (!imgEl) return
          const img = imgEl.src || imgEl.getAttribute("data-src") || ""

          // Get all text content from descendants
          const texts = Array.from(card.querySelectorAll("*"))
            .map((el) => {
              const t = (el as HTMLElement).innerText?.trim() || ""
              // Only leaf-like text (no children with significant text)
              return t
            })
            .filter((t) => t.length > 0)

          // Find price (contains ₹ or is a number in product context)
          let price = 0
          let priceIdx = -1
          for (let i = 0; i < texts.length; i++) {
            const t = texts[i]
            if (/₹\s*\d/.test(t)) {
              price = parseFloat(t.replace(/[^0-9.]/g, "")) || 0
              priceIdx = i
              break
            }
          }
          if (price <= 0 || price > 10000) return

          // Find name (longest text near the price that isn't a number)
          let name = ""
          for (let i = Math.max(0, priceIdx - 5); i < Math.min(texts.length, priceIdx + 2); i++) {
            const t = texts[i]
            if (t.length > 3 && t.length < 100 && !/^[₹\d]/.test(t) && !/^\s*\d+\s*(g|kg|ml|l)\s*$/.test(t)) {
              if (t.length > name.length) name = t
            }
          }
          if (!name || seen.has(name)) return

          seen.add(name)
          const qty = texts.find((t) => /^\d+\s*(g|kg|ml|l|pcs|pieces|pack)/i.test(t)) || ""
          items.push({ name, price, quantity: qty, image: img, category: "General", storeId: sid })
        })

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
