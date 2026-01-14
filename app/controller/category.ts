/**
 * Category Controller
 * Business logic for category operations
 */

import type { RequestContext } from "../middleware/default"
import { CategoryModel } from "../models/category"
import type { Category } from "../models/types"

export class CategoryController {
  /**
   * Get category by ID
   */
  static async get(req: RequestContext): Promise<Category | null> {
    const { id } = req.params
    if (!id) {
      throw new Error("Category ID is required")
    }
    return await CategoryModel.get(id)
  }

  /**
   * List all categories
   */
  static async list(req: RequestContext): Promise<Category[]> {
    return await CategoryModel.list()
  }

  /**
   * Create new category
   */
  static async create(req: RequestContext): Promise<Category> {
    // Validate admin access
    if (req.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    const categoryData = req.params
    return await CategoryModel.create(categoryData)
  }

  /**
   * Update category
   */
  static async update(req: RequestContext): Promise<Category> {
    // Validate admin access
    if (req.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    const { id, ...updateData } = req.params
    if (!id) {
      throw new Error("Category ID is required")
    }
    return await CategoryModel.update(id, updateData)
  }

  /**
   * Delete category
   */
  static async delete(req: RequestContext): Promise<boolean> {
    // Validate admin access
    if (req.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    const { id } = req.params
    if (!id) {
      throw new Error("Category ID is required")
    }
    return await CategoryModel.delete(id)
  }
}

