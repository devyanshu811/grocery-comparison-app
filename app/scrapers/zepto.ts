/**
 * Zepto scraper.
 * Grants geolocation permission so Zepto detects location automatically,
 * then intercepts their search API response.
 */

import type { ScrapeContext, ScrapeResult, ScrapedProduct } from "./types"
import { newPage, getBrowser } from "./browser"

interface ZeptoProduct {
  product?: { name?: string; category?: string }
  sellingPrice?: number
  productVariant?: { formattedPacksize?: string }
  imageUrl?: string
  images?: string[]
}

interface ZeptoLayout {
  data?: ZeptoProduct
}

interface ZeptoSection {
  layout?: ZeptoLayout[]
  widget_type?: string
}

interface ZeptoApiBody {
  data?: { sections?: ZeptoSection[] }
  response?: ZeptoProduct[]
  status?: number
}

export async function scrapeZepto(ctx: ScrapeContext): Promise<ScrapeResult> {
  const storeId = "zepto"
  const { query, lat = "12.9716", lon = "77.5946" } = ctx
  const page = await newPage()

  try {
    const browser = await getBrowser()
    const context = browser.defaultBrowserContext()
    await context.overridePermissions("https://www.zeptonow.com", ["geolocation"])

    await page.setGeolocation({ latitude: parseFloat(lat), longitude: parseFloat(lon) })

    const captured: ZeptoProduct[] = []

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
          (url.includes("zeptonow.com") || url.includes("zepto")) &&
          ct.includes("json") &&
          (url.includes("search") || url.includes("store-products") || url.includes("product-listing"))
        ) {
          const body = (await res.json()) as ZeptoApiBody
          const items: ZeptoProduct[] =
            body?.data?.sections
              ?.flatMap((s) => (s.layout || []).map((l) => l.data).filter((d): d is ZeptoProduct => !!d)) ||
            body?.response ||
            []
          captured.push(...items)
        }
      } catch {}
    })

    // Visit homepage first to trigger geolocation and set session
    await page.goto("https://www.zeptonow.com", { waitUntil: "domcontentloaded", timeout: 25000 })
    await new Promise((r) => setTimeout(r, 3000))

    // Click "Allow" / "Use current location" if Zepto shows location modal
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'))
      const btn = buttons.find((b) => {
        const t = (b as HTMLElement).innerText?.toLowerCase() || ""
        return t.includes("detect") || t.includes("allow") || t.includes("current location") || t.includes("use my location")
      })
      if (btn) (btn as HTMLElement).click()
    })
    await new Promise((r) => setTimeout(r, 2000))

    // Navigate to search
    await page.goto(
      `https://www.zeptonow.com/search?query=${encodeURIComponent(query)}`,
      { waitUntil: "domcontentloaded", timeout: 20000 }
    )
    await new Promise((r) => setTimeout(r, 5000))

    const products: ScrapedProduct[] = captured
      .filter((p) => p.product?.name)
      .map((p) => ({
        name: (p.product!.name || "").trim(),
        price: typeof p.sellingPrice === "number" ? p.sellingPrice / 100 : 0,
        quantity: p.productVariant?.formattedPacksize || "",
        image: p.imageUrl || p.images?.[0] || "",
        category: p.product?.category || "General",
        storeId,
      }))

    // DOM fallback — price-based extraction
    if (products.length === 0) {
      const domProducts = await page.evaluate((sid: string) => {
        const items: Array<{ name: string; price: number; quantity: string; image: string; category: string; storeId: string }> = []
        const seen = new Set<string>()
        const allEls = Array.from(document.querySelectorAll("div, span, p, strong"))
        for (const el of allEls) {
          if (el.children.length > 3) continue
          const text = (el as HTMLElement).innerText?.trim() || ""
          if (!/₹\s*\d/.test(text)) continue
          const price = parseFloat(text.replace(/[^0-9.]/g, "")) || 0
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
