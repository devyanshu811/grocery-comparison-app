import type { Product, Store, ComparisonProduct } from "./types"

// Mock data
const MOCK_STORES: Store[] = [
  { id: "1", name: "BigBasket", logo: "🛒", deliveryTime: "30-45 mins" },
  { id: "2", name: "Zepto", logo: "⚡", deliveryTime: "10-15 mins" },
  { id: "3", name: "Blinkit", logo: "🚀", deliveryTime: "5-10 mins" },
  { id: "4", name: "Amazon Fresh", logo: "📦", deliveryTime: "45-60 mins" },
]

const MOCK_CATEGORIES = [
  { id: "1", name: "Grains & Rice", icon: "🌾" },
  { id: "2", name: "Vegetables", icon: "🥕" },
  { id: "3", name: "Dairy & Eggs", icon: "🥛" },
  { id: "4", name: "Spices", icon: "🌶️" },
  { id: "5", name: "Snacks", icon: "🍿" },
]

const MOCK_PRODUCTS: Product[] = [
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
  },
]

// API functions
export async function getStores(): Promise<Store[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_STORES), 300)
  })
}

export async function getCategories() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_CATEGORIES), 200)
  })
}

export async function searchProducts(query: string): Promise<Product[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!query.trim()) {
        resolve(MOCK_PRODUCTS)
        return
      }
      const filtered = MOCK_PRODUCTS.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
      resolve(filtered)
    }, 400)
  })
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!category) {
        resolve(MOCK_PRODUCTS)
        return
      }
      const filtered = MOCK_PRODUCTS.filter((p) => p.category === category)
      resolve(filtered)
    }, 300)
  })
}

export async function getProductComparison(productId: string): Promise<ComparisonProduct | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const product = MOCK_PRODUCTS.find((p) => p.id === productId)
      if (!product) {
        resolve(null)
        return
      }

      const comparison: ComparisonProduct = {
        id: product.id,
        name: product.name,
        image: product.image,
        quantity: product.quantity,
        prices: product.prices.map((p) => {
          const store = MOCK_STORES.find((s) => s.id === p.storeId)
          return {
            store: store!,
            price: p.price,
          }
        }),
      }
      resolve(comparison)
    }, 300)
  })
}
