/**
 * Scraper Provider
 * Calls scrapeAllStores (the 8-store Puppeteer/fetch aggregator) and returns
 * Product[] for the app.  Falls back to mockProvider when scraping returns
 * nothing so the UI is never completely empty.
 *
 * Key fix: timeout is 55 000 ms everywhere (was 35 000 in the old version,
 * inconsistent with the 55 000 used by the API route).
 *
 * Key fix: getProduct() checks the live product cache first so that items
 * returned by a scrape are resolvable by id on the compare/detail pages.
 */

import type { GroceryProvider } from "./types"
import type { Product, Store } from "../models/types"
import { mockProvider } from "./mock"
import { scrapeAllStores, getLiveProduct } from "../scrapers/index"

const SCRAPER_TIMEOUT = 55000

async function fetchFromScrapers(
  query: string,
  ctx?: { lat?: string; lon?: string; pincode?: string }
): Promise<Product[]> {
  try {
    const { products } = await scrapeAllStores({ query, ...ctx }, SCRAPER_TIMEOUT)
    return products
  } catch {
    return []
  }
}

export const scraperProvider: GroceryProvider = {
  /** Stores come from the mock DB (8 stores are seeded at startup) */
  async getStores(): Promise<Store[]> {
    return mockProvider.getStores()
  },

  /** Search products — live first, mock fallback */
  async searchProducts(query: string, pincode?: string): Promise<Product[]> {
    const results = await fetchFromScrapers(query, { pincode })
    if (results.length > 0) return results
    return mockProvider.searchProducts(query, pincode)
  },

  /** Category products — live first, mock fallback */
  async getProductsByCategory(category: string, pincode?: string): Promise<Product[]> {
    const results = await fetchFromScrapers(category, { pincode })
    if (results.length > 0) return results
    return mockProvider.getProductsByCategory(category, pincode)
  },

  /** List products (with optional filters) — live first, mock fallback */
  async listProducts(
    filters?: { category?: string; search?: string },
    pincode?: string
  ): Promise<Product[]> {
    const query = filters?.search || filters?.category || ""
    if (!query) return mockProvider.listProducts(filters, pincode)
    const results = await fetchFromScrapers(query, { pincode })
    if (results.length > 0) return results
    return mockProvider.listProducts(filters, pincode)
  },

  /**
   * Get a single product by id.
   * Live scraped products are cached in liveProductCache inside scrapers/index.ts.
   * We check the live cache first so the compare page works with scraped items.
   */
  async getProduct(id: string, pincode?: string): Promise<Product | null> {
    const cached = getLiveProduct(id)
    if (cached) return cached
    // Fall back to the mock DB (handles products seeded at startup)
    return mockProvider.getProduct(id, pincode)
  },
}
