/**
 * API Client Layer
 * Frontend API functions that call the backend controllers
 * This layer provides a clean interface for React components
 */

import type { Category, ComparisonProduct, Product, Store } from "./types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api"

/**
 * Make API request
 */
async function apiRequest<T>(
  method: string,
  params: any = {},
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}/rpc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method,
        params,
        id: Date.now(),
      }),
      ...options,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message || "API request failed")
    }

    return data.result
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Unknown error occurred")
  }
}

/**
 * Store API functions
 */
export async function getStores(): Promise<Store[]> {
  return apiRequest<Store[]>("store.list")
}

export async function getStore(id: string): Promise<Store | null> {
  return apiRequest<Store | null>("store.get", { id })
}

/**
 * Category API functions
 */
export async function getCategories(): Promise<Category[]> {
  return apiRequest<Category[]>("category.list")
}

export async function getCategory(id: string): Promise<Category | null> {
  return apiRequest<Category | null>("category.get", { id })
}

/**
 * Product API functions
 */
export async function searchProducts(query: string): Promise<Product[]> {
  return apiRequest<Product[]>("product.search", { query })
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  return apiRequest<Product[]>("product.getByCategory", { category })
}

export async function getProduct(id: string): Promise<Product | null> {
  return apiRequest<Product | null>("product.get", { id })
}

export async function getProductComparison(productId: string): Promise<ComparisonProduct | null> {
  return apiRequest<ComparisonProduct | null>("product.comparison", { id: productId })
}

export async function listProducts(filters?: {
  category?: string
  search?: string
}): Promise<Product[]> {
  return apiRequest<Product[]>("product.list", filters || {})
}
