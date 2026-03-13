/**
 * Product Controller
 * Enhanced business logic for product operations with caching, validation, and advanced features
 */

import type { RequestContext } from "../middleware/default"
import { ProductModel } from "../models/product"
import { StoreModel } from "../models/store"
import { getProvider } from "../providers"
import type { ComparisonProduct, Product } from "../models/types"

interface ProductFilters {
  category?: string
  search?: string
  status?: string
  priceRange?: [number, number]
  stores?: string[]
  sortBy?: "price" | "name" | "rating" | "popularity"
  sortOrder?: "asc" | "desc"
}

interface SearchOptions {
  query: string
  limit?: number
  offset?: number
  includeSuggestions?: boolean
}

export class ProductController {
  private static cache = new Map<string, { data: any; timestamp: number }>()
  private static CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Get product by ID with caching and enhanced error handling
   */
  static async get(req: RequestContext): Promise<Product | null> {
    const { id, pincode } = req.params
    
    if (!id) {
      throw new Error("Product ID is required")
    }

    if (!pincode) {
      throw new Error("Pincode is required for location-based pricing")
    }

    // Check cache first
    const cacheKey = `product:${id}:${pincode}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const product = await getProvider().getProduct(id, pincode)
      
      if (!product) {
        throw new Error(`Product with ID ${id} not found`)
      }

      // Enhance product with additional metadata
      const enhancedProduct = {
        ...product,
        lastUpdated: new Date().toISOString(),
        availableIn: await this.checkAvailability(product.id, pincode)
      }

      this.setCache(cacheKey, enhancedProduct)
      return enhancedProduct
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error)
      throw new Error(`Failed to fetch product: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * List products with advanced filtering, sorting, and pagination
   */
  static async list(req: RequestContext): Promise<{
    products: Product[]
    total: number
    hasMore: boolean
    suggestions?: string[]
  }> {
    const { 
      category, 
      search, 
      status, 
      pincode,
      priceMin,
      priceMax,
      stores,
      sortBy = "name",
      sortOrder = "asc",
      limit = 20,
      offset = 0
    } = req.params

    if (!pincode) {
      throw new Error("Pincode is required for location-based results")
    }

    try {
      const filters: ProductFilters = {
        category,
        search: search?.trim(),
        status,
        priceRange: priceMin && priceMax ? [Number(priceMin), Number(priceMax)] : undefined,
        stores: stores ? (Array.isArray(stores) ? stores : [stores]) : undefined,
        sortBy,
        sortOrder
      }

      const provider = getProvider()
      const products = await provider.listProducts(filters, pincode)
      
      // Apply additional filtering and sorting
      const filteredProducts = this.applyFilters(products, filters)
      const sortedProducts = this.applySorting(filteredProducts, sortBy, sortOrder)
      
      // Pagination
      const total = sortedProducts.length
      const paginatedProducts = sortedProducts.slice(offset, offset + limit)
      const hasMore = offset + limit < total

      // Generate search suggestions if searching
      let suggestions: string[] | undefined
      if (search) {
        suggestions = await this.generateSearchSuggestions(search, category)
      }

      return {
        products: paginatedProducts,
        total,
        hasMore,
        suggestions
      }
    } catch (error) {
      console.error("Error listing products:", error)
      throw new Error(`Failed to list products: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create new product with validation and metadata
   */
  static async create(req: RequestContext): Promise<Product> {
    // Validate admin access
    this.validateAdminAccess(req.user)

    const productData = req.params
    
    // Validate required fields
    this.validateProductData(productData)

    try {
      // Add metadata
      const enhancedProduct = {
        ...productData,
        id: this.generateProductId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: productData.status || "active",
        createdBy: req.user?.id
      }

      const product = await ProductModel.create(enhancedProduct)
      
      // Clear relevant cache
      this.clearCachePattern("product:*")
      
      return product
    } catch (error) {
      console.error("Error creating product:", error)
      throw new Error(`Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update product with validation and change tracking
   */
  static async update(req: RequestContext): Promise<Product> {
    this.validateAdminAccess(req.user)

    const { id, ...updateData } = req.params
    
    if (!id) {
      throw new Error("Product ID is required")
    }

    // Validate update data
    if (updateData.prices && !Array.isArray(updateData.prices)) {
      throw new Error("Prices must be an array")
    }

    try {
      // Add update metadata
      const enhancedUpdateData = {
        ...updateData,
        updatedAt: new Date().toISOString(),
        updatedBy: req.user?.id,
        lastPriceUpdate: updateData.prices ? new Date().toISOString() : undefined
      }

      const product = await ProductModel.update(id, enhancedUpdateData)
      
      if (!product) {
        throw new Error(`Product with ID ${id} not found`)
      }

      // Clear cache for this product and related searches
      this.clearCachePattern(`product:${id}:*`)
      this.clearCachePattern("product:*")
      
      return product
    } catch (error) {
      console.error(`Error updating product ${id}:`, error)
      throw new Error(`Failed to update product: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete product with cascade handling
   */
  static async delete(req: RequestContext): Promise<boolean> {
    this.validateAdminAccess(req.user)

    const { id } = req.params
    
    if (!id) {
      throw new Error("Product ID is required")
    }

    try {
      // Check if product exists
      const existingProduct = await ProductModel.findById(id)
      if (!existingProduct) {
        throw new Error(`Product with ID ${id} not found`)
      }

      // Perform soft delete or hard delete based on dependencies
      const result = await ProductModel.delete(id)
      
      // Clear all related cache
      this.clearCachePattern(`product:${id}:*`)
      this.clearCachePattern("product:*")
      
      return result
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error)
      throw new Error(`Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Enhanced product comparison with price history and availability
   */
  static async getComparison(req: RequestContext): Promise<{
    product: ComparisonProduct
    priceHistory: Array<{ date: string; price: number; store: string }>
    availability: Record<string, boolean>
    bestDeal: { store: string; price: number; savings: number }
  }> {
    const { id, pincode } = req.params
    
    if (!id) {
      throw new Error("Product ID is required")
    }

    if (!pincode) {
      throw new Error("Pincode is required for location-based comparison")
    }

    try {
      const product = await getProvider().getProduct(id, pincode)
      if (!product) {
        throw new Error(`Product with ID ${id} not found`)
      }

      const stores = await StoreModel.list()
      const storeMap = new Map(stores.map(s => [s.id, s]))

      // Build comparison data
      const prices = product.prices
        .map(price => {
          const store = storeMap.get(price.storeId)
          if (!store) return null
          return {
            store,
            price: price.price,
            available: true // TODO: Check actual availability
          }
        })
        .filter(Boolean) as ComparisonProduct["prices"]

      // Find best deal
      const bestPrice = Math.min(...prices.map(p => p.price))
      const bestDeal = prices.find(p => p.price === bestPrice)
      const averagePrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length

      const comparison: ComparisonProduct = {
        id: product.id,
        name: product.name,
        image: product.image,
        quantity: product.quantity,
        prices
      }

      // Get price history (mock data for now)
      const priceHistory = await this.getPriceHistory(id)
      
      // Check availability
      const availability = Object.fromEntries(
        prices.map(p => [p.store.id, p.available])
      )

      return {
        product: comparison,
        priceHistory,
        availability,
        bestDeal: {
          store: bestDeal!.store.name,
          price: bestPrice,
          savings: Math.round(((averagePrice - bestPrice) / averagePrice) * 100)
        }
      }
    } catch (error) {
      console.error(`Error getting comparison for product ${id}:`, error)
      throw new Error(`Failed to get product comparison: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Advanced search with suggestions and analytics
   */
  static async search(req: RequestContext): Promise<{
    products: Product[]
    suggestions: string[]
    analytics: {
      totalResults: number
      searchTime: number
      categories: Array<{ name: string; count: number }>
    }
  }> {
    const { query, pincode, limit = 20, includeSuggestions = true } = req.params
    
    if (!query || typeof query !== "string") {
      throw new Error("Search query is required")
    }

    if (!pincode) {
      throw new Error("Pincode is required for location-based search")
    }

    const startTime = Date.now()
    const trimmedQuery = query.trim()

    try {
      const provider = getProvider()
      const products = await provider.searchProducts(trimmedQuery, pincode)
      
      // Generate suggestions
      let suggestions: string[] = []
      if (includeSuggestions) {
        suggestions = await this.generateSearchSuggestions(trimmedQuery)
      }

      // Analytics
      const categories = this.categorizeResults(products)
      const searchTime = Date.now() - startTime

      return {
        products: products.slice(0, limit),
        suggestions,
        analytics: {
          totalResults: products.length,
          searchTime,
          categories
        }
      }
    } catch (error) {
      console.error("Error searching products:", error)
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get products by category with enhanced filtering
   */
  static async getByCategory(req: RequestContext): Promise<{
    products: Product[]
    subcategories: string[]
    priceRange: { min: number; max: number }
    featured: Product[]
  }> {
    const { category, pincode, priceMin, priceMax, featured = false } = req.params
    
    if (!pincode) {
      throw new Error("Pincode is required for location-based results")
    }

    try {
      const provider = getProvider()
      let products = await provider.listProducts({ category }, pincode)

      // Apply price filtering
      if (priceMin || priceMax) {
        products = products.filter(p => {
          const minPrice = Math.min(...p.prices.map(price => price.price))
          return (!priceMin || minPrice >= Number(priceMin)) && 
                 (!priceMax || minPrice <= Number(priceMax))
        })
      }

      // Get subcategories
      const subcategories = [...new Set(products.map(p => p.subcategory).filter(Boolean))]

      // Calculate price range
      const allPrices = products.flatMap(p => p.prices.map(price => price.price))
      const priceRange = {
        min: allPrices.length > 0 ? Math.min(...allPrices) : 0,
        max: allPrices.length > 0 ? Math.max(...allPrices) : 0
      }

      // Get featured products
      const featuredProducts = featured 
        ? products.filter(p => p.featured || p.rating >= 4.5).slice(0, 5)
        : []

      return {
        products,
        subcategories,
        priceRange,
        featured: featuredProducts
      }
    } catch (error) {
      console.error(`Error getting products for category ${category}:`, error)
      throw new Error(`Failed to get category products: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Helper methods
  private static validateAdminAccess(user: any) {
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }
  }

  private static validateProductData(data: any) {
    if (!data.name || typeof data.name !== "string") {
      throw new Error("Product name is required and must be a string")
    }
    
    if (!data.prices || !Array.isArray(data.prices) || data.prices.length === 0) {
      throw new Error("Product prices are required and must be an array")
    }

    // Validate each price
    data.prices.forEach((price: any, index: number) => {
      if (!price.storeId) {
        throw new Error(`Price at index ${index} missing storeId`)
      }
      if (typeof price.price !== "number" || price.price <= 0) {
        throw new Error(`Price at index ${index} must be a positive number`)
      }
    })
  }

  private static generateProductId(): string {
    return `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private static async checkAvailability(productId: string, pincode: string): Promise<string[]> {
    // TODO: Implement actual availability check
    return ["bigbasket", "zepto", "blinkit", "amazon_fresh"]
  }

  private static async generateSearchSuggestions(query: string, category?: string): Promise<string[]> {
    // TODO: Implement smart suggestions based on search history and popular products
    return [
      `${query} organic`,
      `${query} premium`,
      `${query} fresh`,
      `${query} pack of 2`
    ]
  }

  private static async getPriceHistory(productId: string): Promise<Array<{ date: string; price: number; store: string }>> {
    // TODO: Implement actual price history from database
    return [
      { date: "2024-01-01", price: 100, store: "BigBasket" },
      { date: "2024-01-15", price: 95, store: "BigBasket" },
      { date: "2024-02-01", price: 90, store: "BigBasket" }
    ]
  }

  private static applyFilters(products: Product[], filters: ProductFilters): Product[] {
    let filtered = [...products]

    if (filters.priceRange) {
      const [min, max] = filters.priceRange
      filtered = filtered.filter(p => {
        const prices = p.prices.map(price => price.price)
        const minPrice = Math.min(...prices)
        return minPrice >= min && minPrice <= max
      })
    }

    if (filters.stores && filters.stores.length > 0) {
      filtered = filtered.filter(p => 
        p.prices.some(price => filters.stores!.includes(price.storeId))
      )
    }

    return filtered
  }

  private static applySorting(products: Product[], sortBy: string, sortOrder: "asc" | "desc"): Product[] {
    const sorted = [...products].sort((a, b) => {
      switch (sortBy) {
        case "price":
          const aMinPrice = Math.min(...a.prices.map(p => p.price))
          const bMinPrice = Math.min(...b.prices.map(p => p.price))
          return aMinPrice - bMinPrice
        case "name":
          return a.name.localeCompare(b.name)
        case "rating":
          return (a.rating || 0) - (b.rating || 0)
        case "popularity":
          return (a.popularity || 0) - (b.popularity || 0)
        default:
          return 0
      }
    })

    return sortOrder === "desc" ? sorted.reverse() : sorted
  }

  private static categorizeResults(products: Product[]): Array<{ name: string; count: number }> {
    const categories = products.reduce((acc, product) => {
      const cat = product.category || "Other"
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(categories)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  // Cache methods
  private static getFromCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }
    return null
  }

  private static setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  private static clearCachePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace(/\*/g, ".*"))
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }
}
