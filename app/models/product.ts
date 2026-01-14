/**
 * Product Model
 * Product data model and operations
 */

import { db } from "../database/default"
import type { Product } from "./types"

export class ProductModel {
  /**
   * Create a new product
   */
  static async create(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: this.generateId(),
      status: product.status || "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    return await db.createProduct(newProduct)
  }

  /**
   * Get product by ID
   */
  static async get(id: string): Promise<Product | null> {
    return await db.getProduct(id)
  }

  /**
   * List products with optional filters
   */
  static async list(filters?: {
    category?: string
    search?: string
    status?: "active" | "archived"
  }): Promise<Product[]> {
    return await db.listProducts(filters)
  }

  /**
   * Update product
   */
  static async update(id: string, data: Partial<Product>): Promise<Product> {
    return await db.updateProduct(id, data)
  }

  /**
   * Delete (archive) product
   */
  static async delete(id: string): Promise<boolean> {
    // Soft delete by setting status to archived
    await db.updateProduct(id, { status: "archived" })
    return true
  }

  /**
   * Generate unique product ID
   */
  private static generateId(): string {
    return `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

