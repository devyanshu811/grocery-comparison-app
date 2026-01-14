/**
 * Category Model
 * Category data model and operations
 */

import { db } from "../database/default"
import type { Category } from "./types"

export class CategoryModel {
  /**
   * Create a new category
   */
  static async create(category: Omit<Category, "id">): Promise<Category> {
    const newCategory: Category = {
      ...category,
      id: this.generateId(),
    }
    return await db.createCategory(newCategory)
  }

  /**
   * Get category by ID
   */
  static async get(id: string): Promise<Category | null> {
    return await db.getCategory(id)
  }

  /**
   * List all categories
   */
  static async list(): Promise<Category[]> {
    return await db.listCategories()
  }

  /**
   * Update category
   */
  static async update(id: string, data: Partial<Category>): Promise<Category> {
    return await db.updateCategory(id, data)
  }

  /**
   * Delete category
   */
  static async delete(id: string): Promise<boolean> {
    return await db.deleteCategory(id)
  }

  /**
   * Generate unique category ID
   */
  private static generateId(): string {
    return `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

