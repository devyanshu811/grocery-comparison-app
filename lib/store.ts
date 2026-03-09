/**
 * Global Zustand store.
 * Manages: location, cart, search query, selected category.
 *
 * Key fix: hasLocation() is now a pure getter with no side-effects.
 * Location expiry/validation is handled by the explicit validateLocation()
 * action which should be called once on app mount (e.g. in layout.tsx).
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CartItem } from "./types"

const LOCATION_STORAGE_KEY = "pricehub-location"

/** 7-day TTL — after this period the stored location is cleared and the
 *  user is re-prompted to enter their area. */
const LOCATION_TTL_MS = 7 * 24 * 60 * 60 * 1000

export interface LocationState {
  city: string
  pincode: string
  /** Unix timestamp (ms) when location was last saved */
  setAt: number
}

interface StoreState {
  location: LocationState
  searchQuery: string
  cartItems: CartItem[]
  selectedCategory: string
  /** True after the location prompt has been shown at least once */
  locationPromptShown: boolean

  // ── Location actions ────────────────────────────────────────────────────
  setLocation: (city: string, pincode: string) => void
  setLocationPromptShown: (shown: boolean) => void
  clearLocation: () => void

  /**
   * Pure getter — returns true if a valid, non-expired location is stored.
   * Does NOT mutate state; call validateLocation() to clear expired data.
   */
  hasLocation: () => boolean

  /**
   * Call once on app mount.  Clears stored location when it is stale or the
   * pincode is malformed so the location-gate re-prompts the user.
   */
  validateLocation: () => void

  // ── Search actions ──────────────────────────────────────────────────────
  setSearchQuery: (query: string) => void

  // ── Cart actions ────────────────────────────────────────────────────────
  addToCart: (productId: string, quantity: number, storeId: string) => void
  removeFromCart: (productId: string) => void
  updateCartQuantity: (productId: string, quantity: number) => void
  clearCart: () => void

  // ── Category actions ────────────────────────────────────────────────────
  setSelectedCategory: (category: string) => void
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      location: { city: "", pincode: "", setAt: 0 },
      searchQuery: "",
      cartItems: [],
      selectedCategory: "",
      locationPromptShown: false,

      setLocation: (city, pincode) =>
        set({
          location: {
            city: city || "Your area",
            pincode: pincode || "",
            setAt: Date.now(),
          },
        }),

      setLocationPromptShown: (shown) => set({ locationPromptShown: shown }),

      clearLocation: () =>
        set({ location: { city: "", pincode: "", setAt: 0 }, locationPromptShown: false }),

      // ── Pure getter ────────────────────────────────────────────────────
      hasLocation: () => {
        const { location } = get()
        return !!(location.pincode || location.city)
      },

      // ── Explicit validation action (call on mount) ────────────────────
      validateLocation: () => {
        const { location } = get()
        if (!location.pincode && !location.city) return

        const isExpired =
          location.setAt > 0 && Date.now() - location.setAt > LOCATION_TTL_MS
        const isInvalidPincode =
          location.pincode.length > 0 && !/^\d{6}$/.test(location.pincode)

        if (isExpired || isInvalidPincode) {
          set({ location: { city: "", pincode: "", setAt: 0 }, locationPromptShown: false })
        }
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
          cartItems: state.cartItems.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          ),
        })),

      clearCart: () => set({ cartItems: [] }),

      setSelectedCategory: (category) => set({ selectedCategory: category }),
    }),
    {
      name: LOCATION_STORAGE_KEY,
      // Only persist location and prompt flag — cart and query are session-only
      partialize: (s) => ({
        location: s.location,
        locationPromptShown: s.locationPromptShown,
      }),
    }
  )
)
