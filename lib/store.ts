import { create } from "zustand"
import type { CartItem } from "./types"

interface StoreState {
  location: {
    city: string
    pincode: string
  }
  searchQuery: string
  cartItems: CartItem[]
  selectedCategory: string

  // Location actions
  setLocation: (city: string, pincode: string) => void

  // Search actions
  setSearchQuery: (query: string) => void

  // Cart actions
  addToCart: (productId: string, quantity: number, storeId: string) => void
  removeFromCart: (productId: string) => void
  updateCartQuantity: (productId: string, quantity: number) => void
  clearCart: () => void

  // Category actions
  setSelectedCategory: (category: string) => void
}

export const useStore = create<StoreState>((set) => ({
  location: {
    city: "New York",
    pincode: "10001",
  },
  searchQuery: "",
  cartItems: [],
  selectedCategory: "",

  setLocation: (city, pincode) => set({ location: { city, pincode } }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  addToCart: (productId, quantity, storeId) =>
    set((state) => ({
      cartItems: [...state.cartItems, { productId, quantity, selectedStoreId: storeId }],
    })),

  removeFromCart: (productId) =>
    set((state) => ({
      cartItems: state.cartItems.filter((item) => item.productId !== productId),
    })),

  updateCartQuantity: (productId, quantity) =>
    set((state) => ({
      cartItems: state.cartItems.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
    })),

  clearCart: () => set({ cartItems: [] }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
}))
