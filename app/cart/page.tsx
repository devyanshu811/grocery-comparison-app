"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CartItem } from "@/components/cart-item"
import { getStores } from "@/lib/api"
import { useStore } from "@/lib/store"
import type { Product, Store } from "@/lib/types"
import { ChevronLeft, ShoppingCart, Tag } from "lucide-react"
import Link from "next/link"

// Mock products - in real app would fetch from API
const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Fresh Apples",
    image: "/red-apples.png",
    quantity: "1 kg",
    category: "Fruits",
    prices: [
      { storeId: "1", price: 4.99 },
      { storeId: "2", price: 5.49 },
      { storeId: "3", price: 4.49 },
    ],
  },
  {
    id: "2",
    name: "Organic Carrots",
    image: "/orange-carrots.jpg",
    quantity: "500g",
    category: "Vegetables",
    prices: [
      { storeId: "1", price: 3.99 },
      { storeId: "2", price: 3.49 },
      { storeId: "4", price: 3.79 },
    ],
  },
  {
    id: "3",
    name: "Whole Milk",
    image: "/milk-carton.png",
    quantity: "1L",
    category: "Dairy",
    prices: [
      { storeId: "1", price: 2.99 },
      { storeId: "2", price: 3.09 },
      { storeId: "3", price: 2.79 },
    ],
  },
]

export default function CartPage() {
  const searchParams = useSearchParams()
  const { cartItems, addToCart, removeFromCart, updateCartQuantity } = useStore()
  const [stores, setStores] = useState<Store[]>([])
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({})
  const [promoCode, setPromoCode] = useState("")
  const [discount, setDiscount] = useState(0)

  useEffect(() => {
    const loadStores = async () => {
      const data = await getStores()
      setStores(data)
    }
    loadStores()

    // Check for product in URL params
    const productId = searchParams.get("product")
    const storeId = searchParams.get("store")
    if (productId && storeId) {
      addToCart(productId, 1, storeId)
      setCartQuantities((prev) => ({ ...prev, [productId]: 1 }))
    }
  }, [searchParams, addToCart])

  // Group items by store
  const itemsByStore: Record<string, typeof cartItems> = {}
  cartItems.forEach((item) => {
    if (!itemsByStore[item.selectedStoreId]) {
      itemsByStore[item.selectedStoreId] = []
    }
    itemsByStore[item.selectedStoreId].push(item)
  })

  // Calculate totals
  const calculateStoreTotal = (storeId: string) => {
    return (
      itemsByStore[storeId]?.reduce((total, item) => {
        const product = MOCK_PRODUCTS.find((p) => p.id === item.productId)
        const price = product?.prices.find((p) => p.storeId === storeId)?.price || 0
        return total + price * (cartQuantities[item.productId] || item.quantity)
      }, 0) || 0
    )
  }

  const grandTotal = Object.keys(itemsByStore).reduce((total, storeId) => total + calculateStoreTotal(storeId), 0)
  const discountAmount = (grandTotal * discount) / 100
  const finalTotal = grandTotal - discountAmount

  const applyPromo = () => {
    if (promoCode === "SAVE10") {
      setDiscount(10)
    } else if (promoCode === "SAVE20") {
      setDiscount(20)
    } else {
      setDiscount(0)
    }
  }

  const isEmpty = cartItems.length === 0

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-primary flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Cart
            </h1>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {isEmpty ? (
          <div className="text-center py-16">
            <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add some products to get started</p>
            <Link href="/">
              <Button className="px-6">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              {Object.entries(itemsByStore).map(([storeId, items]) => {
                const store = stores.find((s) => s.id === storeId)
                const storeTotal = calculateStoreTotal(storeId)

                return (
                  <Card key={storeId} className="mb-6 overflow-hidden">
                    <div className="bg-primary/5 border-b border-border p-4 flex items-center gap-2">
                      <span className="text-2xl">{store?.logo}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{store?.name}</h3>
                        <p className="text-xs text-muted-foreground">{store?.deliveryTime} delivery</p>
                      </div>
                      <p className="text-lg font-bold text-primary">${storeTotal.toFixed(2)}</p>
                    </div>

                    <div className="p-4">
                      {items.map((item) => {
                        const product = MOCK_PRODUCTS.find((p) => p.id === item.productId)
                        if (!product) return null

                        return (
                          <CartItem
                            key={item.productId}
                            product={product}
                            quantity={cartQuantities[item.productId] || item.quantity}
                            storeId={storeId}
                            onQuantityChange={(qty) => {
                              setCartQuantities((prev) => ({ ...prev, [item.productId]: qty }))
                              updateCartQuantity(item.productId, qty)
                            }}
                            onRemove={() => {
                              removeFromCart(item.productId)
                              setCartQuantities((prev) => {
                                const newQt = { ...prev }
                                delete newQt[item.productId]
                                return newQt
                              })
                            }}
                          />
                        )
                      })}
                    </div>

                    <div className="bg-muted/30 border-t border-border p-4">
                      <Button className="w-full">Checkout at {store?.name}</Button>
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Sidebar */}
            <div>
              {/* Order Summary */}
              <Card className="mb-6 p-6 sticky top-20">
                <h3 className="font-semibold text-lg text-foreground mb-4">Order Summary</h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${grandTotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-primary">
                      <span>Discount ({discount}%)</span>
                      <span className="font-medium">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-foreground">Total</span>
                      <span className="font-bold text-lg text-primary">${finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Promo Code */}
                <div className="space-y-2 mb-6 p-4 bg-muted/30 rounded-lg">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Tag className="w-4 h-4" />
                    Promo Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 rounded border border-border bg-white text-sm"
                    />
                    <Button variant="outline" size="sm" onClick={applyPromo}>
                      Apply
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Try: SAVE10 or SAVE20</p>
                </div>

                <Button className="w-full mb-3">Proceed to Checkout</Button>

                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/search">Continue Shopping</Link>
                </Button>
              </Card>

              {/* Info Box */}
              <Card className="p-4 bg-accent/5 border-accent/20">
                <h4 className="font-semibold text-sm text-foreground mb-2">💳 Multi-Store Checkout</h4>
                <p className="text-xs text-muted-foreground">
                  Your cart is organized by store. You can checkout separately with each store for best prices.
                </p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
