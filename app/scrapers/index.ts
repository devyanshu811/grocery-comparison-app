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

const SCRAPERS: Array<(ctx: ScrapeContext) => Promise<ScrapeResult>> = [
  scrapeBlinkit,
  scrapeZepto,
  scrapeSwiggy,
  scrapeBigBasket,
  scrapeJiomart,
  scrapeAmazon,
  scrapeFlipkart,
  scrapeDmart,
]

/** Merge per-store scrape results into Product[] with prices[] across all stores */
export function mergeScrapedProducts(results: ScrapeResult[]): Product[] {
  // Group by normalized product name
  const byName = new Map<string, Product>()
  const idCounters = new Map<string, number>()

  for (const { storeId, products } of results) {
    for (const sp of products) {
      if (!sp.name || sp.price <= 0) continue
      const key = sp.name
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim()

      const existing = byName.get(key)
      if (existing) {
        if (!existing.prices.some((p) => p.storeId === storeId)) {
          existing.prices.push({ storeId, price: sp.price })
        }
      } else {
        const count = (idCounters.get(key) || 0) + 1
        idCounters.set(key, count)
        byName.set(key, {
          id: `live-${key.replace(/\s/g, "-").substring(0, 40)}-${Date.now()}`,
          name: sp.name,
          image: sp.image || "",
          quantity: sp.quantity || "",
          category: sp.category || "General",
          prices: [{ storeId, price: sp.price }],
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
    }
  }

  return Array.from(byName.values())
}

/**
 * Run all scrapers in parallel and return merged products.
 * @param ctx Scrape context (query, lat, lon, pincode)
 * @param timeout Per-scraper timeout in ms (default 35s)
 */
export async function scrapeAllStores(
  ctx: ScrapeContext,
  timeout = 55000
): Promise<{ products: Product[]; results: ScrapeResult[] }> {
  // Wrap each scraper with a per-scraper timeout
  const withTimeout = (fn: (c: ScrapeContext) => Promise<ScrapeResult>) =>
    Promise.race([
      fn(ctx).catch((e) => ({
        storeId: "unknown",
        products: [],
        success: false,
        error: (e as Error).message,
      })),
      new Promise<ScrapeResult>((resolve) =>
        setTimeout(
          () =>
            resolve({ storeId: "unknown", products: [], success: false, error: "timeout" }),
          timeout
        )
      ),
    ])

  const results = await Promise.all(SCRAPERS.map(withTimeout))
  const products = mergeScrapedProducts(results)
  return { products, results }
}
