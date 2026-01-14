/**
 * Store Model
 * Store data model and operations
 */

import { db } from "../database/default"
import type { Store } from "./types"

export class StoreModel {
  /**
   * Create a new store
   */
  static async create(store: Omit<Store, "id" | "createdAt" | "updatedAt">): Promise<Store> {
    const newStore: Store = {
      ...store,
      id: this.generateId(),
      status: store.status || "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    return await db.createStore(newStore)
  }

  /**
   * Get store by ID
   */
  static async get(id: string): Promise<Store | null> {
    return await db.getStore(id)
  }

  /**
   * List all stores
   */
  static async list(): Promise<Store[]> {
    return await db.listStores()
  }

  /**
   * Update store
   */
  static async update(id: string, data: Partial<Store>): Promise<Store> {
    return await db.updateStore(id, data)
  }

  /**
   * Delete store
   */
  static async delete(id: string): Promise<boolean> {
    return await db.deleteStore(id)
  }

  /**
   * Generate unique store ID
   */
  private static generateId(): string {
    return `store_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

