/**
 * Scraper aggregator.
 * Runs all 8 store scrapers in parallel and merges results into Product[].
 * Falls back gracefully if a store scraper fails or returns nothing.
 */

import type { Product } from "../models/types"
import type { ScrapeContext, ScrapedProduct, ScrapeResult } from "./types"
import { scrapeBlinkit } from "./blinkit"
import { scrapeZepto } from "./zepto"
import { scrapeSwiggy } from "./swiggy"
import { scrapeBigBasket } from "./bigbasket"
import { scrapeJiomart } from "./jiomart"
import { scrapeAmazon } from "./amazon"
import { scrapeFlipkart } from "./flipkart"
import { scrapeDmart } from "./dmart"

/** Each entry pairs the canonical storeId with its scraper function.
 *  This is critical: the storeId here is used on timeout so the summary
 *  always has the correct store name, not a generic "unknown".
 */
const SCRAPERS: Array<{ storeId: string; fn: (ctx: ScrapeContext) => Promise<ScrapeResult> }> = [
  { storeId: "blinkit",          fn: scrapeBlinkit },
  { storeId: "zepto",            fn: scrapeZepto },
  { storeId: "swiggy",           fn: scrapeSwiggy },
  { storeId: "bigbasket",        fn: scrapeBigBasket },
  { storeId: "jiomart",          fn: scrapeJiomart },
  { storeId: "amazon_now",       fn: scrapeAmazon },
  { storeId: "flipkart_minutes", fn: scrapeFlipkart },
  { storeId: "dmart_ready",      fn: scrapeDmart },
]

// ─── In-memory product cache ────────────────────────────────────────────────
// Keyed by the stable slug used in Product.id.
// Allows scraperProvider.getProduct(id) to resolve live-scraped products.
const liveProductCache = new Map<string, Product>()

export function getLiveProduct(id: string): Product | null {
  return liveProductCache.get(id) ?? null
}

// ─── Merge logic ─────────────────────────────────────────────────────────────

/** Merge per-store scrape results into a unified Product[] with prices[] across all stores */
export function mergeScrapedProducts(results: ScrapeResult[]): Product[] {
  const byName = new Map<string, Product>()

  for (const { storeId, products } of results) {
    for (const sp of products) {
      if (!sp.name || sp.price <= 0) continue

      // Normalise the product name into a stable lookup key
      const key = sp.name
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim()

      const existing = byName.get(key)
      if (existing) {
        // Add this store's price only if it isn't already recorded
        if (!existing.prices.some((p) => p.storeId === storeId)) {
          existing.prices.push({ storeId, price: sp.price })
        }
      } else {
        // Stable id: slug from name + a fixed timestamp bucket (1-second resolution)
        // so the same product searched twice within a second gets the same id.
        const tsSeconds = Math.floor(Date.now() / 1000)
        const id = `live-${key.replace(/\s/g, "-").substring(0, 40)}-${tsSeconds}`
        const product: Product = {
          id,
          name: sp.name,
          image: sp.image || "",
          quantity: sp.quantity || "",
          category: sp.category || "General",
          prices: [{ storeId, price: sp.price }],
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        byName.set(key, product)
      }
    }
  }

  const products = Array.from(byName.values())

  // Populate the live cache so getProduct(id) resolves correctly
  for (const p of products) {
    liveProductCache.set(p.id, p)
  }

  return products
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Run all 8 scrapers in parallel and return merged products + per-store results.
 *
 * @param ctx   - ScrapeContext: query, optional lat/lon/pincode
 * @param timeout - Per-scraper wall-clock limit in ms (default 55 000)
 */
export async function scrapeAllStores(
  ctx: ScrapeContext,
  timeout = 55000
): Promise<{ products: Product[]; results: ScrapeResult[] }> {
  /**
   * Wrap a scraper with:
   *  • a per-scraper timeout that preserves the real storeId
   *  • a top-level catch so one crashed scraper never rejects the whole Promise.all
   */
  const withTimeout = ({ storeId, fn }: { storeId: string; fn: (c: ScrapeContext) => Promise<ScrapeResult> }) =>
    Promise.race<ScrapeResult>([
      fn(ctx).catch((e: unknown) => ({
        storeId,
        products: [],
        success: false,
        error: (e as Error).message ?? String(e),
      })),
      new Promise<ScrapeResult>((resolve) =>
        setTimeout(
          () => resolve({ storeId, products: [], success: false, error: "timeout" }),
          timeout
        )
      ),
    ])

  const results = await Promise.all(SCRAPERS.map(withTimeout))
  const products = mergeScrapedProducts(results)
  return { products, results }
}
