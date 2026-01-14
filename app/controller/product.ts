/**
 * Product Controller
 * Business logic for product operations
 */

import type { RequestContext } from "../middleware/default"
import { ProductModel } from "../models/product"
import { StoreModel } from "../models/store"
import type { ComparisonProduct, Product } from "../models/types"

export class ProductController {
  /**
   * Get product by ID
   */
  static async get(req: RequestContext): Promise<Product | null> {
    const { id } = req.params
    if (!id) {
      throw new Error("Product ID is required")
    }
    return await ProductModel.get(id)
  }

  /**
   * List products with filters
   */
  static async list(req: RequestContext): Promise<Product[]> {
    const { category, search, status } = req.params
    return await ProductModel.list({ category, search, status })
  }

  /**
   * Create new product
   */
  static async create(req: RequestContext): Promise<Product> {
    // Validate admin access
    if (req.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    const productData = req.params
    return await ProductModel.create(productData)
  }

  /**
   * Update product
   */
  static async update(req: RequestContext): Promise<Product> {
    // Validate admin access
    if (req.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    const { id, ...updateData } = req.params
    if (!id) {
      throw new Error("Product ID is required")
    }
    return await ProductModel.update(id, updateData)
  }

  /**
   * Delete product
   */
  static async delete(req: RequestContext): Promise<boolean> {
    // Validate admin access
    if (req.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    const { id } = req.params
    if (!id) {
      throw new Error("Product ID is required")
    }
    return await ProductModel.delete(id)
  }

  /**
   * Get product comparison across stores
   */
  static async getComparison(req: RequestContext): Promise<ComparisonProduct | null> {
    const { id } = req.params
    if (!id) {
      throw new Error("Product ID is required")
    }

    const product = await ProductModel.get(id)
    if (!product) {
      return null
    }

    // Get all stores
    const stores = await StoreModel.list()
    const storeMap = new Map(stores.map(s => [s.id, s]))

    // Build comparison
    const comparison: ComparisonProduct = {
      id: product.id,
      name: product.name,
      image: product.image,
      quantity: product.quantity,
      prices: product.prices
        .map(price => {
          const store = storeMap.get(price.storeId)
          if (!store) return null
          return {
            store,
            price: price.price,
          }
        })
        .filter(Boolean) as any,
    }

    return comparison
  }

  /**
   * Search products
   */
  static async search(req: RequestContext): Promise<Product[]> {
    const { query } = req.params
    if (!query) {
      return await ProductModel.list()
    }
    return await ProductModel.list({ search: query })
  }

  /**
   * Get products by category
   */
  static async getByCategory(req: RequestContext): Promise<Product[]> {
    const { category } = req.params
    if (!category) {
      return await ProductModel.list()
    }
    return await ProductModel.list({ category })
  }
}

