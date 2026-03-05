/**
 * Grocery Data Provider Types
 * Abstraction for live or mock grocery/price data (Swiggy, Blinkit, Zepto, etc.)
 */

import type { Category, Product, Store } from "../models/types"

export interface GroceryProvider {
  /** List all supported stores (or use DB stores when provider is mock) */
  getStores(): Promise<Store[]>

  /** Search products by query; optional pincode for location-specific pricing */
  searchProducts(query: string, pincode?: string): Promise<Product[]>

  /** Get products by category; optional pincode */
  getProductsByCategory(category: string, pincode?: string): Promise<Product[]>

  /** List products with optional category and search filters */
  listProducts(filters?: { category?: string; search?: string }, pincode?: string): Promise<Product[]>

  /** Get a single product by ID (for comparison); optional pincode */
  getProduct(id: string, pincode?: string): Promise<Product | null>
}

export type GroceryProviderName = "mock" | "scrapers" | "nextract" | "realdataapi"
