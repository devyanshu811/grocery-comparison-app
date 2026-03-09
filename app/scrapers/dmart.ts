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

    // Step 1: Visit homepage and select a city — D'Mart gates products behind city selection
    await page.goto("https://www.dmart.in", { waitUntil: "domcontentloaded", timeout: 20000 })
    await new Promise((r) => setTimeout(r, 2000))

    // Try to click a city option (Mumbai fallback; covers most product catalog)
    await page.evaluate(() => {
      // Look for city modal / dropdown
      const cityEls = Array.from(
        document.querySelectorAll('[class*="city"], [class*="City"], [data-city], [class*="location"]')
      )
      // Try to click first available city button
      const btn = cityEls.find((el) => (el as HTMLElement).innerText?.trim())
      if (btn) (btn as HTMLElement).click()
    })
    await new Promise((r) => setTimeout(r, 1500))

    // Click "Mumbai" or first visible city option
    await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll("button, li, a, [role='option']"))
      const mumbai = all.find((el) => {
        const t = (el as HTMLElement).innerText?.trim().toLowerCase() || ""
        return t === "mumbai" || t.startsWith("mumbai")
      })
      const first = all.find((el) => {
        const t = (el as HTMLElement).innerText?.trim().toLowerCase() || ""
        return (
          t.length > 2 &&
          t.length < 30 &&
          !t.includes("select") &&
          !t.includes("city") &&
          /^[a-z]/.test(t)
        )
      })
      const target = mumbai || first
      if (target) (target as HTMLElement).click()
    })
    await new Promise((r) => setTimeout(r, 1500))

    // Step 2: Navigate to search
    await page.goto(
      `https://www.dmart.in/product/search?search_text=${encodeURIComponent(query)}&type=search`,
      { waitUntil: "domcontentloaded", timeout: 25000 }
    )

    // Wait for product cards — D'Mart uses MUI Grid + custom Tailwind classes
    await page.waitForSelector(
      [
        "[class*='MuiGrid-grid-md-3']",
        "[class*='MuiGrid-grid-md-4']",
        "[class*='product-card']",
        "[class*='ProductCard']",
        ".product-item-section",
        "[class*='ProductInfo']",
      ].join(", "),
      { timeout: 12000 }
    ).catch(() => {})
    await new Promise((r) => setTimeout(r, 4000))

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

        // D'Mart uses MUI Grid (md-3/md-4) or custom product-card class
        const containers = [
          ...Array.from(document.querySelectorAll("[class*='MuiGrid-grid-md-3']")),
          ...Array.from(document.querySelectorAll("[class*='MuiGrid-grid-md-4']")),
          ...Array.from(document.querySelectorAll("[class*='product-card'], [class*='ProductCard']")),
          ...Array.from(document.querySelectorAll(".product-item-section")),
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
