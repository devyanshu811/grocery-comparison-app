/**
 * Models - Type Definitions
 * Core data models and interfaces for the grocery comparison system
 */

export interface Store {
  id: string
  name: string
  logo: string
  deliveryTime: string
  status?: "active" | "inactive"
  createdAt?: Date
  updatedAt?: Date
}

export interface Product {
  id: string
  name: string
  image: string
  quantity: string
  category: string
  prices: {
    storeId: string
    price: number
  }[]
  status?: "active" | "archived"
  createdAt?: Date
  updatedAt?: Date
}

export interface CartItem {
  productId: string
  quantity: number
  selectedStoreId: string
  addedAt?: Date
}

export interface ComparisonProduct {
  id: string
  name: string
  image: string
  quantity: string
  prices: {
    store: Store
    price: number
  }[]
}

export interface Category {
  id: string
  name: string
  icon: string
  description?: string
}

export interface User {
  id: string
  username: string
  email?: string
  role: "admin" | "user"
  projects?: string[]
  createdAt?: Date
}

export interface Session {
  id: string
  userId: string
  token: string
  expiresAt: Date
  createdAt: Date
}

