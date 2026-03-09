/**
 * BigBasket scraper.
 * BigBasket's JSON API needs a session — navigate with pincode in URL,
 * intercept their catalog API response, and fall back to DOM extraction.
 */

import type { ScrapeContext, ScrapeResult, ScrapedProduct } from "./types"
import { newPage } from "./browser"

interface BBProduct {
  desc?: string
  w?: string
  pricing?: { discount?: { prim_price?: { sp?: number; mrp?: number } } }
  images?: Array<{ m?: string }>
  category?: { name?: string }
}

interface BBTabInfo {
  product_info?: { products?: BBProduct[] }
}

interface BBApiBody {
  products?: BBProduct[]
  tab_info?: BBTabInfo[]
}

export async function scrapeBigBasket(ctx: ScrapeContext): Promise<ScrapeResult> {
  const storeId = "bigbasket"
  const { query, pincode = "400001" } = ctx
  const page = await newPage()

  try {
    const captured: BBProduct[] = []

    await page.setRequestInterception(true)
    page.on("request", (req) => {
      if (["image", "font", "media"].includes(req.resourceType())) req.abort()
      else req.continue()
    })
    page.on("response", async (res) => {
      try {
        const url = res.url()
        const ct = res.headers()["content-type"] || ""
        if (url.includes("bigbasket.com") && ct.includes("json")) {
          const body = (await res.json()) as BBApiBody
          const items =
            body?.products ||
            body?.tab_info?.flatMap((t) => t.product_info?.products ?? []) ||
            []
          if (items.length) captured.push(...items)
        }
      } catch {}
    })

    // Navigate to BigBasket search with pincode in URL
    await page.goto(
      `https://www.bigbasket.com/ps/?q=${encodeURIComponent(query)}&pincode=${pincode}`,
      { waitUntil: "domcontentloaded", timeout: 25000 }
    )
    await new Promise((r) => setTimeout(r, 2000))

    // Detect CAPTCHA or location/pincode gate — return early instead of waiting 12s
    const blocked = await page.evaluate(() => {
      const body = document.body.innerText.toLowerCase()
      const hasCaptcha =
        body.includes("captcha") ||
        body.includes("verify you") ||
        !!document.querySelector('[id*="captcha"], [class*="captcha"], iframe[src*="recaptcha"]')
      const hasLocationGate =
        !!document.querySelector(
          '[class*="location-modal"], [class*="pincode-modal"], [class*="DeliveryModal"], [class*="delivery-location"]'
        ) ||
        (body.includes("enter pincode") || body.includes("enter your pincode") || body.includes("select location"))
      return { hasCaptcha, hasLocationGate }
    })

    if (blocked.hasCaptcha) {
      return { storeId, products: [], success: false, error: "blocked:captcha" }
    }
    if (blocked.hasLocationGate) {
      // Try entering pincode in the modal before giving up
      await page.evaluate((pc) => {
        const input = document.querySelector(
          'input[placeholder*="pincode" i], input[placeholder*="pin" i], input[name*="pincode" i]'
        ) as HTMLInputElement | null
        if (input) {
          input.value = pc
          input.dispatchEvent(new Event("input", { bubbles: true }))
          const form = input.closest("form")
          if (form) form.dispatchEvent(new Event("submit", { bubbles: true }))
          else {
            const btn = document.querySelector('button[type="submit"], [class*="confirm"], [class*="apply"]') as HTMLElement | null
            if (btn) btn.click()
          }
        }
      }, pincode)
      await new Promise((r) => setTimeout(r, 2000))
    }

    // Wait for at least one ₹ price to appear in the DOM
    await page.waitForFunction(
      () => document.body.innerText.includes("₹"),
      { timeout: 10000 }
    ).catch(() => {})
    await new Promise((r) => setTimeout(r, 2000))

    // Map captured API products
    const apiProducts: ScrapedProduct[] = captured
      .filter((p) => p.desc)
      .map((p) => {
        const price =
          p.pricing?.discount?.prim_price?.sp ??
          p.pricing?.discount?.prim_price?.mrp ??
          0
        return {
          name: (p.desc || "").trim(),
          price,
          quantity: p.w || "",
          image: p.images?.[0]?.m || "",
          category: p.category?.name || "General",
          storeId,
        }
      })

    if (apiProducts.length > 0) {
      return { storeId, products: apiProducts, success: true }
    }

    // DOM fallback — BigBasket uses dynamic styled-jsx hash classes, so we
    // find product containers by looking for elements that contain a price
    const domProducts = await page.evaluate((sid) => {
      const items: Array<{
        name: string; price: number; quantity: string; image: string; category: string; storeId: string
      }> = []

      const seen = new Set<string>()

      // Strategy: find elements that have a rupee price, walk up to find product card
      const allEls = Array.from(document.querySelectorAll("span, div, p"))
      for (const el of allEls) {
        const text = (el as HTMLElement).innerText?.trim() || ""
        // Find price elements (e.g. "₹52", "₹ 52")
        if (!/^₹\s*\d/.test(text)) continue
        const price = parseFloat(text.replace(/[^0-9.]/g, "")) || 0
        if (price <= 0 || price > 10000) continue

        // Walk up 3 levels to find the product card
        let card: Element = el
        for (let i = 0; i < 6; i++) {
          if (!card.parentElement) break
          card = card.parentElement
          // Stop when we find a container with an image inside
          if (card.querySelector("img") && card.querySelectorAll("img").length <= 3) break
        }

        // Get name (first text child that looks like a product name)
        const img = (card.querySelector("img") as HTMLImageElement)?.src || ""
        const allTexts = Array.from(card.querySelectorAll("span, div, p, h3, a"))
          .map((e) => (e as HTMLElement).innerText?.trim() || "")
          .filter((t) => t.length > 3 && t.length < 100 && !/^₹/.test(t) && !/^\d+$/.test(t))
        const name = allTexts[0] || ""

        if (name && !seen.has(name)) {
          seen.add(name)
          const qty = allTexts.find((t) => /\d+\s*(g|kg|ml|l|pcs|piece|pack)/i.test(t)) || ""
          items.push({ name, price, quantity: qty, image: img, category: "General", storeId: sid })
        }
      }

      return items
    }, storeId)

    return { storeId, products: domProducts, success: true }
  } catch (e) {
    return { storeId, products: [], success: false, error: (e as Error).message }
  } finally {
    await page.close().catch(() => {})
  }
}
