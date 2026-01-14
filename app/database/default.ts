/**
 * Database Layer - Default
 * Database operations and connection management
 */

import type { Category, Product, Session, Store, User } from "../models/types"

// Mock database storage
const mockDatabase = {
  stores: new Map<string, Store>(),
  products: new Map<string, Product>(),
  categories: new Map<string, Category>(),
  users: new Map<string, User>(),
  sessions: new Map<string, Session>(),
}

/**
 * Database Interface
 */
export interface Database {
  // Store operations
  createStore(store: Store): Promise<Store>
  getStore(id: string): Promise<Store | null>
  listStores(): Promise<Store[]>
  updateStore(id: string, data: Partial<Store>): Promise<Store>
  deleteStore(id: string): Promise<boolean>

  // Product operations
  createProduct(product: Product): Promise<Product>
  getProduct(id: string): Promise<Product | null>
  listProducts(filters?: any): Promise<Product[]>
  updateProduct(id: string, data: Partial<Product>): Promise<Product>
  deleteProduct(id: string): Promise<boolean>

  // Category operations
  createCategory(category: Category): Promise<Category>
  getCategory(id: string): Promise<Category | null>
  listCategories(): Promise<Category[]>
  updateCategory(id: string, data: Partial<Category>): Promise<Category>
  deleteCategory(id: string): Promise<boolean>

  // User operations
  createUser(user: User): Promise<User>
  getUser(id: string): Promise<User | null>
  getUserByUsername(username: string): Promise<User | null>
  listUsers(): Promise<User[]>
  updateUser(id: string, data: Partial<User>): Promise<User>
  deleteUser(id: string): Promise<boolean>

  // Session operations
  createSession(session: Session): Promise<Session>
  getSession(id: string): Promise<Session | null>
  deleteSession(id: string): Promise<boolean>
}

/**
 * Mock Database Implementation
 */
class MockDatabase implements Database {
  // Store operations
  async createStore(store: Store): Promise<Store> {
    mockDatabase.stores.set(store.id, store)
    return store
  }

  async getStore(id: string): Promise<Store | null> {
    return mockDatabase.stores.get(id) || null
  }

  async listStores(): Promise<Store[]> {
    return Array.from(mockDatabase.stores.values())
  }

  async updateStore(id: string, data: Partial<Store>): Promise<Store> {
    const store = mockDatabase.stores.get(id)
    if (!store) throw new Error("Store not found")
    const updated = { ...store, ...data, updatedAt: new Date() }
    mockDatabase.stores.set(id, updated)
    return updated
  }

  async deleteStore(id: string): Promise<boolean> {
    return mockDatabase.stores.delete(id)
  }

  // Product operations
  async createProduct(product: Product): Promise<Product> {
    mockDatabase.products.set(product.id, product)
    return product
  }

  async getProduct(id: string): Promise<Product | null> {
    return mockDatabase.products.get(id) || null
  }

  async listProducts(filters?: any): Promise<Product[]> {
    let products = Array.from(mockDatabase.products.values())
    
    if (filters?.category) {
      products = products.filter(p => p.category === filters.category)
    }
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchLower)
      )
    }
    
    return products
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const product = mockDatabase.products.get(id)
    if (!product) throw new Error("Product not found")
    const updated = { ...product, ...data, updatedAt: new Date() }
    mockDatabase.products.set(id, updated)
    return updated
  }

  async deleteProduct(id: string): Promise<boolean> {
    return mockDatabase.products.delete(id)
  }

  // Category operations
  async createCategory(category: Category): Promise<Category> {
    mockDatabase.categories.set(category.id, category)
    return category
  }

  async getCategory(id: string): Promise<Category | null> {
    return mockDatabase.categories.get(id) || null
  }

  async listCategories(): Promise<Category[]> {
    return Array.from(mockDatabase.categories.values())
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const category = mockDatabase.categories.get(id)
    if (!category) throw new Error("Category not found")
    const updated = { ...category, ...data }
    mockDatabase.categories.set(id, updated)
    return updated
  }

  async deleteCategory(id: string): Promise<boolean> {
    return mockDatabase.categories.delete(id)
  }

  // User operations
  async createUser(user: User): Promise<User> {
    mockDatabase.users.set(user.id, user)
    return user
  }

  async getUser(id: string): Promise<User | null> {
    return mockDatabase.users.get(id) || null
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const users = Array.from(mockDatabase.users.values())
    return users.find(u => u.username === username) || null
  }

  async listUsers(): Promise<User[]> {
    return Array.from(mockDatabase.users.values())
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const user = mockDatabase.users.get(id)
    if (!user) throw new Error("User not found")
    const updated = { ...user, ...data }
    mockDatabase.users.set(id, updated)
    return updated
  }

  async deleteUser(id: string): Promise<boolean> {
    return mockDatabase.users.delete(id)
  }

  // Session operations
  async createSession(session: Session): Promise<Session> {
    mockDatabase.sessions.set(session.id, session)
    return session
  }

  async getSession(id: string): Promise<Session | null> {
    return mockDatabase.sessions.get(id) || null
  }

  async deleteSession(id: string): Promise<boolean> {
    return mockDatabase.sessions.delete(id)
  }
}

// Initialize database
export const db: Database = new MockDatabase()

// Initialize with mock data
export async function initDatabase() {
  const now = new Date()

  // Initialize stores
  const stores: Store[] = [
    { id: "1", name: "BigBasket", logo: "🛒", deliveryTime: "30-45 mins", status: "active", createdAt: now },
    { id: "2", name: "Zepto", logo: "⚡", deliveryTime: "10-15 mins", status: "active", createdAt: now },
    { id: "3", name: "Blinkit", logo: "🚀", deliveryTime: "5-10 mins", status: "active", createdAt: now },
    { id: "4", name: "Amazon Fresh", logo: "📦", deliveryTime: "45-60 mins", status: "active", createdAt: now },
  ]

  // Initialize categories
  const categories: Category[] = [
    { id: "1", name: "Grains & Rice", icon: "🌾" },
    { id: "2", name: "Vegetables", icon: "🥕" },
    { id: "3", name: "Dairy & Eggs", icon: "🥛" },
    { id: "4", name: "Spices", icon: "🌶️" },
    { id: "5", name: "Snacks", icon: "🍿" },
  ]

  // Initialize products
  const products: Product[] = [
    {
      id: "1",
      name: "Basmati Rice (1kg)",
      image: "/red-apples.png",
      quantity: "1 kg",
      category: "Grains & Rice",
      prices: [
        { storeId: "1", price: 349 },
        { storeId: "2", price: 369 },
        { storeId: "3", price: 329 },
      ],
      status: "active",
      createdAt: now,
    },
    {
      id: "2",
      name: "Organic Tomatoes",
      image: "/orange-carrots.jpg",
      quantity: "500g",
      category: "Vegetables",
      prices: [
        { storeId: "1", price: 45 },
        { storeId: "2", price: 38 },
        { storeId: "4", price: 52 },
      ],
      status: "active",
      createdAt: now,
    },
    {
      id: "3",
      name: "Amul Milk",
      image: "/milk-carton.png",
      quantity: "1L",
      category: "Dairy & Eggs",
      prices: [
        { storeId: "1", price: 59 },
        { storeId: "2", price: 61 },
        { storeId: "3", price: 57 },
      ],
      status: "active",
      createdAt: now,
    },
    {
      id: "4",
      name: "Turmeric Powder",
      image: "/mixed-nuts-snack.jpg",
      quantity: "100g",
      category: "Spices",
      prices: [
        { storeId: "1", price: 89 },
        { storeId: "3", price: 79 },
        { storeId: "4", price: 99 },
      ],
      status: "active",
      createdAt: now,
    },
    {
      id: "5",
      name: "Lay's Chips (Classic)",
      image: "/orange-juice-bottle.jpg",
      quantity: "40g",
      category: "Snacks",
      prices: [
        { storeId: "2", price: 25 },
        { storeId: "1", price: 28 },
        { storeId: "3", price: 22 },
      ],
      status: "active",
      createdAt: now,
    },
    {
      id: "6",
      name: "Indian Bananas",
      image: "/yellow-bananas.jpg",
      quantity: "1 kg",
      category: "Grains & Rice",
      prices: [
        { storeId: "1", price: 49 },
        { storeId: "2", price: 42 },
        { storeId: "3", price: 45 },
      ],
      status: "active",
      createdAt: now,
    },
  ]

  // Initialize in parallel for better performance
  await Promise.all([
    ...stores.map(store => db.createStore(store)),
    ...categories.map(category => db.createCategory(category)),
    ...products.map(product => db.createProduct(product)),
  ])
}

