import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CartItem } from "./types"

const LOCATION_STORAGE_KEY = "pricehub-location"

export interface LocationState {
  city: string
  pincode: string
}

interface StoreState {
  location: LocationState
  searchQuery: string
  cartItems: CartItem[]
  selectedCategory: string
  /** True after user has been prompted for location (so we don't block forever) */
  locationPromptShown: boolean

  // Location actions
  setLocation: (city: string, pincode: string) => void
  setLocationPromptShown: (shown: boolean) => void
  hasLocation: () => boolean

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

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      location: {
        city: "",
        pincode: "",
      },
      searchQuery: "",
      cartItems: [],
      selectedCategory: "",
      locationPromptShown: false,

      setLocation: (city, pincode) => set({ location: { city: city || "Your area", pincode: pincode || "" } }),
      setLocationPromptShown: (shown) => set({ locationPromptShown: shown }),
      hasLocation: () => {
        const { location } = get()
        return !!(location.pincode || location.city)
      },
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
}),
    { name: LOCATION_STORAGE_KEY, partialize: (s) => ({ location: s.location }) }
  )
)
