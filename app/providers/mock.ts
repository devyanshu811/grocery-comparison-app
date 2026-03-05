/**
 * Mock Grocery Provider
 * Uses in-memory database for stores and products (no external API)
 */

import { db } from "../database/default"
import type { GroceryProvider } from "./types"
import type { Product, Store } from "../models/types"

export const mockProvider: GroceryProvider = {
  async getStores(): Promise<Store[]> {
    return await db.listStores()
  },

  async searchProducts(query: string, _pincode?: string): Promise<Product[]> {
    const q = typeof query === "string" ? query.trim() : ""
    if (!q) return await db.listProducts()
    return await db.listProducts({ search: q })
  },

  async getProductsByCategory(category: string, _pincode?: string): Promise<Product[]> {
    const c = typeof category === "string" ? category.trim() : ""
    if (!c) return await db.listProducts()
    return await db.listProducts({ category: c })
  },

  async listProducts(
    filters?: { category?: string; search?: string },
    _pincode?: string
  ): Promise<Product[]> {
    const search = filters?.search != null ? String(filters.search).trim() : undefined
    const category = filters?.category != null ? String(filters.category).trim() : undefined
    return await db.listProducts(
      (search || category) ? { search: search || undefined, category: category || undefined } : undefined
    )
  },

  async getProduct(id: string, _pincode?: string): Promise<Product | null> {
    return await db.getProduct(id)
  },
}
