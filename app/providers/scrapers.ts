/**
 * Scraper Provider
 * Calls the internal /api/stores/search route (which runs Puppeteer scrapers for all 8 stores).
 * Falls back to mockProvider if scraping fails or returns nothing.
 */

import type { GroceryProvider } from "./types"
import type { Category, Product, Store } from "../models/types"
import { mockProvider } from "./mock"
import { scrapeAllStores } from "../scrapers/index"

async function fetchFromScrapers(query: string, ctx?: { lat?: string; lon?: string; pincode?: string }): Promise<Product[]> {
  try {
    const { products } = await scrapeAllStores({ query, ...ctx }, 35000)
    return products
  } catch {
    return []
  }
}

export const scraperProvider: GroceryProvider = {
  async getStores(): Promise<Store[]> {
    return mockProvider.getStores()
  },

  async searchProducts(query: string, pincode?: string): Promise<Product[]> {
    const results = await fetchFromScrapers(query, { pincode })
    if (results.length > 0) return results
    return mockProvider.searchProducts(query, pincode)
  },

  async getProductsByCategory(category: string, pincode?: string): Promise<Product[]> {
    const results = await fetchFromScrapers(category, { pincode })
    if (results.length > 0) return results
    return mockProvider.getProductsByCategory(category, pincode)
  },

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

  async getProduct(id: string, pincode?: string): Promise<Product | null> {
    return mockProvider.getProduct(id, pincode)
  },
}
