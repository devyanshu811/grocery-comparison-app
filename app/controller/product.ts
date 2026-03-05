/**
 * Product Controller
 * Business logic for product operations (uses grocery provider for read operations)
 */

import type { RequestContext } from "../middleware/default"
import { ProductModel } from "../models/product"
import { StoreModel } from "../models/store"
import { getProvider } from "../providers"
import type { ComparisonProduct, Product } from "../models/types"

export class ProductController {
  /**
   * Get product by ID (via provider for consistent data source)
   */
  static async get(req: RequestContext): Promise<Product | null> {
    const { id, pincode } = req.params
    if (!id) {
      throw new Error("Product ID is required")
    }
    return await getProvider().getProduct(id, pincode)
  }

  /**
   * List products with filters (via provider)
   */
  static async list(req: RequestContext): Promise<Product[]> {
    const { category, search, status, pincode } = req.params
    const provider = getProvider()
    return await provider.listProducts(
      { category, search },
      pincode
    )
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
   * Get product comparison across stores (via provider; uses all 8 stores)
   */
  static async getComparison(req: RequestContext): Promise<ComparisonProduct | null> {
    const { id, pincode } = req.params
    if (!id) {
      throw new Error("Product ID is required")
    }

    const product = await getProvider().getProduct(id, pincode)
    if (!product) {
      return null
    }

    const stores = await StoreModel.list()
    const storeMap = new Map(stores.map(s => [s.id, s]))

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
        .filter(Boolean) as ComparisonProduct["prices"],
    }

    return comparison
  }

  /**
   * Search products (via provider)
   */
  static async search(req: RequestContext): Promise<Product[]> {
    const { query, pincode } = req.params
    const q = typeof query === "string" ? query.trim() : ""
    if (!q) {
      return await getProvider().listProducts({}, pincode)
    }
    return await getProvider().searchProducts(q, pincode)
  }

  /**
   * Get products by category (via provider)
   */
  static async getByCategory(req: RequestContext): Promise<Product[]> {
    const { category, pincode } = req.params
    if (!category) {
      return await getProvider().listProducts({}, pincode)
    }
    return await getProvider().getProductsByCategory(category, pincode)
  }
}

