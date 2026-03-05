/**
 * Grocery Provider Factory
 * Returns the active provider based on GROCERY_PROVIDER env (default: scrapers)
 *
 * Values:
 *   scrapers   - Puppeteer-based scraper for all 8 stores (live, no API key needed)
 *   mock       - In-memory mock data (fast, for dev/testing)
 *   nextract   - Nextract.dev paid API
 *   realdataapi - RealDataAPI paid API
 */

import type { GroceryProvider, GroceryProviderName } from "./types"
import { liveProvider } from "./live"
import { mockProvider } from "./mock"
import { scraperProvider } from "./scrapers"

let cachedProvider: GroceryProvider | null = null

export function getProvider(): GroceryProvider {
  if (cachedProvider) return cachedProvider

  const name = (process.env.GROCERY_PROVIDER || "scrapers").toLowerCase() as GroceryProviderName

  switch (name) {
    case "scrapers":
      cachedProvider = scraperProvider
      break
    case "mock":
      cachedProvider = mockProvider
      break
    case "nextract":
    case "realdataapi":
      cachedProvider = liveProvider
      break
    default:
      cachedProvider = scraperProvider
  }

  return cachedProvider
}

export { liveProvider } from "./live"
export { mockProvider } from "./mock"
export { scraperProvider } from "./scrapers"
export type { GroceryProvider, GroceryProviderName } from "./types"
