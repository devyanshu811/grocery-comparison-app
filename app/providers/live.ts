/**
 * Live Grocery Provider
 * Aggregates product/price data from all 8 platforms via a third-party API
 * (e.g. Nextract, RealDataAPI). Set GROCERY_API_URL and GROCERY_API_KEY to enable.
 */

import { db } from "../database/default"
import type { Product, Store } from "../models/types"
import { STORE_API_CONFIG, STORE_IDS } from "./config/stores"
import type { GroceryProvider } from "./types"
import { mockProvider } from "./mock"

const BASE_URL = process.env.GROCERY_API_URL || ""
const API_KEY = process.env.GROCERY_API_KEY || ""

/** Normalize external API item to our price entry (storeId + price) */
function normalizePriceEntry(
  storeId: string,
  raw: { price?: number; selling_price?: number; mrp?: number; [k: string]: unknown }
): { storeId: string; price: number } | null {
  const price =
    typeof raw.price === "number"
      ? raw.price
      : typeof raw.selling_price === "number"
        ? raw.selling_price
        : typeof raw.mrp === "number"
          ? raw.mrp
          : null
  if (price === null || price < 0) return null
  return { storeId, price }
}

/** Normalize external product shape to our Product (single store); merge later */
function normalizeProduct(
  storeId: string,
  raw: Record<string, unknown>
): { name: string; image: string; quantity: string; category: string; price: number } | null {
  const name =
    (raw.name as string) ||
    (raw.title as string) ||
    (raw.product_name as string) ||
    ""
  const price =
    typeof raw.price === "number"
      ? raw.price
      : typeof raw.selling_price === "number"
        ? raw.selling_price
        : typeof raw.mrp === "number"
          ? raw.mrp
          : 0
  if (!name) return null
  return {
    name: String(name).trim(),
    image: (raw.image as string) || (raw.image_url as string) || (raw.thumbnail as string) || "",
    quantity: (raw.quantity as string) || (raw.weight as string) || (raw.size as string) || "",
    category: (raw.category as string) || (raw.category_name as string) || "General",
    price: Number(price) || 0,
  }
}

/** Extract product list from various API response shapes */
function extractProducts(response: unknown): Record<string, unknown>[] {
  if (!response || typeof response !== "object") return []
  const r = response as Record<string, unknown>
  if (Array.isArray(r.products)) return r.products as Record<string, unknown>[]
  if (Array.isArray(r.data)) return r.data as Record<string, unknown>[]
  if (Array.isArray(r.items)) return r.items as Record<string, unknown>[]
  if (Array.isArray(r.results)) return r.results as Record<string, unknown>[]
  return []
}

async function fetchStoreSearch(
  storeId: string,
  query: string,
  pincode?: string
): Promise<{ storeId: string; items: Record<string, unknown>[] }> {
  const config = STORE_API_CONFIG[storeId]
  if (!config) return { storeId, items: [] }

  const base = BASE_URL.replace(/\/$/, "")
  const path = `${base}/api/v1/${config.apiPath}/search`
  const url = new URL(path)
  url.searchParams.set("q", query)
  if (pincode) url.searchParams.set("pincode", pincode)

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(API_KEY && { Authorization: `Bearer ${API_KEY}` }),
    ...(API_KEY && { "X-API-Key": API_KEY }),
  }

  try {
    const res = await fetch(url.toString(), { headers, signal: AbortSignal.timeout(10000) })
    if (!res.ok) return { storeId, items: [] }
    const data = (await res.json()) as unknown
    const items = extractProducts(data)
    return { storeId, items }
  } catch {
    return { storeId, items: [] }
  }
}

/** Merge per-store results into Product[] with prices from each store */
function mergeProducts(
  perStore: { storeId: string; items: Record<string, unknown>[] }[]
): Product[] {
  const byKey = new Map<string, Product>()

  for (const { storeId, items } of perStore) {
    for (const raw of items) {
      const norm = normalizeProduct(storeId, raw)
      if (!norm) continue
      const key = norm.name.toLowerCase().replace(/\s+/g, " ").trim()
      const existing = byKey.get(key)
      const priceEntry = { storeId, price: norm.price }
      if (existing) {
        const hasStore = existing.prices.some((p) => p.storeId === storeId)
        if (!hasStore) existing.prices.push(priceEntry)
      } else {
        byKey.set(key, {
          id: `live-${key.replace(/\s/g, "-")}-${Date.now()}`,
          name: norm.name,
          image: norm.image,
          quantity: norm.quantity,
          category: norm.category,
          prices: [priceEntry],
          status: "active",
        })
      }
    }
  }

  return Array.from(byKey.values())
}

const liveProvider: GroceryProvider = {
  async getStores(): Promise<Store[]> {
    return await db.listStores()
  },

  async searchProducts(query: string, pincode?: string): Promise<Product[]> {
    if (!BASE_URL || !query?.trim()) {
      return await mockProvider.searchProducts(query, pincode)
    }
    const results = await Promise.all(
      STORE_IDS.map((storeId) => fetchStoreSearch(storeId, query, pincode))
    )
    const merged = mergeProducts(results)
    if (merged.length === 0) return await mockProvider.searchProducts(query, pincode)
    return merged
  },

  async getProductsByCategory(category: string, pincode?: string): Promise<Product[]> {
    if (!BASE_URL || !category?.trim()) {
      return await mockProvider.getProductsByCategory(category, pincode)
    }
    const results = await Promise.all(
      STORE_IDS.map((storeId) => {
        const config = STORE_API_CONFIG[storeId]
        if (!config) return Promise.resolve({ storeId, items: [] })
        const base = BASE_URL.replace(/\/$/, "")
        const path = `${base}/api/v1/${config.apiPath}/category/${encodeURIComponent(category)}`
        const url = pincode ? `${path}?pincode=${pincode}` : path
        return fetch(url, {
          headers: {
            "Content-Type": "application/json",
            ...(API_KEY && { Authorization: `Bearer ${API_KEY}` }),
            ...(API_KEY && { "X-API-Key": API_KEY }),
          },
          signal: AbortSignal.timeout(10000),
        })
          .then((r) => (r.ok ? r.json() : ({})))
          .then((data) => ({ storeId, items: extractProducts(data) }))
          .catch(() => ({ storeId, items: [] }))
      })
    )
    const merged = mergeProducts(results)
    if (merged.length === 0) return await mockProvider.getProductsByCategory(category, pincode)
    return merged
  },

  async listProducts(
    filters?: { category?: string; search?: string },
    pincode?: string
  ): Promise<Product[]> {
    if (!BASE_URL) return await mockProvider.listProducts(filters, pincode)
    if (filters?.search) return await liveProvider.searchProducts(filters.search, pincode)
    if (filters?.category) return await liveProvider.getProductsByCategory(filters.category, pincode)
    return await mockProvider.listProducts(filters, pincode)
  },

  async getProduct(id: string, pincode?: string): Promise<Product | null> {
    const fromDb = await db.getProduct(id)
    if (fromDb) return fromDb
    if (!BASE_URL) return null
    for (const storeId of STORE_IDS) {
      const config = STORE_API_CONFIG[storeId]
      if (!config) continue
      const base = BASE_URL.replace(/\/$/, "")
      const path = `${base}/api/v1/${config.apiPath}/product/${encodeURIComponent(id)}`
      try {
        const res = await fetch(pincode ? `${path}?pincode=${pincode}` : path, {
          headers: {
            "Content-Type": "application/json",
            ...(API_KEY && { Authorization: `Bearer ${API_KEY}` }),
            ...(API_KEY && { "X-API-Key": API_KEY }),
          },
          signal: AbortSignal.timeout(8000),
        })
        if (!res.ok) continue
        const data = (await res.json()) as unknown
        let items = extractProducts(data)
        if (items.length === 0 && data && typeof data === "object") {
          const single = (data as Record<string, unknown>).product ?? data
          if (single && typeof single === "object") items = [single as Record<string, unknown>]
        }
        const raw = items[0]
        if (!raw) continue
        const norm = normalizeProduct(storeId, raw)
        if (!norm) continue
        const priceEntry = normalizePriceEntry(storeId, raw)
        return {
          id,
          name: norm.name,
          image: norm.image,
          quantity: norm.quantity,
          category: norm.category,
          prices: priceEntry ? [priceEntry] : [{ storeId, price: norm.price }],
          status: "active",
        }
      } catch {
        continue
      }
    }
    return await mockProvider.getProduct(id, pincode)
  },
}

export { liveProvider }
