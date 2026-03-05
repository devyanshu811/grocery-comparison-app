/**
 * Store Controller
 * Business logic for store operations
 */

import type { RequestContext } from "../middleware/default"
import { StoreModel } from "../models/store"
import type { Store } from "../models/types"

export class StoreController {
  /**
   * Get store by ID
   */
  static async get(req: RequestContext): Promise<Store | null> {
    const { id } = req.params
    if (!id) {
      throw new Error("Store ID is required")
    }
    return await StoreModel.get(id)
  }

  /**
   * List all stores
   */
  static async list(req: RequestContext): Promise<Store[]> {
    return await StoreModel.list()
  }

  /**
   * Create new store
   */
  static async create(req: RequestContext): Promise<Store> {
    // Validate admin access
    if (req.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    const storeData = req.params
    return await StoreModel.create(storeData)
  }

  /**
   * Update store
   */
  static async update(req: RequestContext): Promise<Store> {
    // Validate admin access
    if (req.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    const { id, ...updateData } = req.params
    if (!id) {
      throw new Error("Store ID is required")
    }
    return await StoreModel.update(id, updateData)
  }

  /**
   * Delete store
   */
  static async delete(req: RequestContext): Promise<boolean> {
    // Validate admin access
    if (req.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    const { id } = req.params
    if (!id) {
      throw new Error("Store ID is required")
    }
    return await StoreModel.delete(id)
  }
}
