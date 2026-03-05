/**
 * Shared types for all store scrapers
 */

export interface ScrapeContext {
  query: string
  lat?: string
  lon?: string
  pincode?: string
}

export interface ScrapedProduct {
  name: string
  price: number
  quantity: string
  image: string
  category: string
  storeId: string
  sourceUrl?: string
}

export interface ScrapeResult {
  storeId: string
  products: ScrapedProduct[]
  success: boolean
  error?: string
}
