/**
 * Store Controller
 * Business logic for store CRUD operations.
 *
 * Key fix: create() and update() now destructure only the known, allowed
 * fields from req.params instead of forwarding the raw params object.
 * This prevents unknown client-supplied keys from reaching the database layer.
 */

import type { RequestContext } from "../middleware/default"
import { StoreModel } from "../models/store"
import type { Store } from "../models/types"

export class StoreController {
  /** Get a single store by id */
  static async get(req: RequestContext): Promise<Store | null> {
    const { id } = req.params
    if (!id) throw new Error("Store ID is required")
    return StoreModel.get(id)
  }

  /** List all active stores */
  static async list(_req: RequestContext): Promise<Store[]> {
    return StoreModel.list()
  }

  /**
   * Create a new store (admin only).
   * Only the fields defined on the Store model are accepted.
   */
  static async create(req: RequestContext): Promise<Store> {
    if (req.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    const { name, logo, deliveryTime, status } = req.params as {
      name?: string
      logo?: string
      deliveryTime?: string
      status?: "active" | "inactive"
    }

    if (!name?.trim()) throw new Error("Store name is required")

    return StoreModel.create({
      name: name.trim(),
      logo: logo?.trim() ?? "",
      deliveryTime: deliveryTime?.trim() ?? "N/A",
      status: status === "inactive" ? "inactive" : "active",
    })
  }

  /**
   * Update an existing store (admin only).
   * Only the fields defined on the Store model are accepted.
   */
  static async update(req: RequestContext): Promise<Store> {
    if (req.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    const { id, name, logo, deliveryTime, status } = req.params as {
      id?: string
      name?: string
      logo?: string
      deliveryTime?: string
      status?: "active" | "inactive"
    }

    if (!id) throw new Error("Store ID is required")

    // Build the update object — only include fields that were actually sent
    const updateData: Partial<Store> = {}
    if (name       !== undefined) updateData.name         = name.trim()
    if (logo       !== undefined) updateData.logo         = logo.trim()
    if (deliveryTime !== undefined) updateData.deliveryTime = deliveryTime.trim()
    if (status     !== undefined) updateData.status       = status

    return StoreModel.update(id, updateData)
  }

  /** Delete a store (admin only) */
  static async delete(req: RequestContext): Promise<boolean> {
    if (req.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    const { id } = req.params
    if (!id) throw new Error("Store ID is required")
    return StoreModel.delete(id)
  }
}
