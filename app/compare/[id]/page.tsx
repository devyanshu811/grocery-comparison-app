"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getProductComparison } from "@/lib/api"
import type { ComparisonProduct } from "@/lib/types"
import { ChevronLeft, ExternalLink, ShoppingCart } from "lucide-react"

export default function ComparisonPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string
  const [product, setProduct] = useState<ComparisonProduct | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProduct = async () => {
      const data = await getProductComparison(productId)
      setProduct(data)
      setLoading(false)
    }
    loadProduct()
  }, [productId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-primary">PriceHub</h1>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-muted animate-pulse rounded-lg h-96" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Product not found</h1>
        <Button onClick={() => router.push("/")}>Back to Home</Button>
      </div>
    )
  }

  const bestPrice = Math.min(...product.prices.map((p) => p.price))

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-primary">Compare Prices</h1>
          </div>
          <Button variant="ghost" size="sm">
            Cart
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Product Info */}
        <div className="bg-white rounded-lg border border-border p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex-shrink-0 w-full sm:w-48">
              <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{product.name}</h1>
              <p className="text-lg text-muted-foreground mb-4">{product.quantity}</p>

              <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg p-4 mb-6 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Best Price Available</p>
                <p className="text-4xl font-bold text-primary">${bestPrice.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Save up to ${(Math.max(...product.prices.map((p) => p.price)) - bestPrice).toFixed(2)} vs other stores
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground mb-4">Price Comparison Across Stores</h2>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto border border-border rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left p-4 font-semibold">Store</th>
                  <th className="text-left p-4 font-semibold">Price</th>
                  <th className="text-left p-4 font-semibold">Delivery Time</th>
                  <th className="text-right p-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {product.prices.map((item, idx) => (
                  <tr key={idx} className={`border-b border-border ${item.price === bestPrice ? "bg-primary/5" : ""}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{item.store.logo}</span>
                        <div>
                          <p className="font-semibold">{item.store.name}</p>
                          {item.price === bestPrice && <p className="text-xs text-primary font-semibold">Best Price</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p
                        className={`text-xl font-bold ${item.price === bestPrice ? "text-primary" : "text-foreground"}`}
                      >
                        ${item.price.toFixed(2)}
                      </p>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{item.store.deliveryTime}</td>
                    <td className="p-4 text-right">
                      <Button size="sm" variant={item.price === bestPrice ? "default" : "outline"}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Go to Store
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-3">
            {product.prices
              .sort((a, b) => a.price - b.price)
              .map((item, idx) => (
                <Card
                  key={idx}
                  className={`p-4 ${item.price === bestPrice ? "border-primary border-2 bg-primary/5" : "border-border"}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{item.store.logo}</span>
                      <div>
                        <p className="font-semibold">{item.store.name}</p>
                        {item.price === bestPrice && <p className="text-xs text-primary font-semibold">Best Price</p>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Price</span>
                      <p className="text-2xl font-bold text-primary">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Delivery</span>
                      <p className="text-sm font-medium">{item.store.deliveryTime}</p>
                    </div>
                  </div>

                  <Button className="w-full gap-2" variant={item.price === bestPrice ? "default" : "outline"}>
                    <ShoppingCart className="w-4 h-4" />
                    Go to Store
                  </Button>
                </Card>
              ))}
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-12 bg-accent/5 border border-accent/20 rounded-lg p-6">
          <h3 className="font-semibold text-foreground mb-3">💡 Smart Shopping Tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Check delivery times - fastest may not always be cheapest</li>
            <li>Compare total costs including delivery fees</li>
            <li>Look for store loyalty discounts and offers</li>
            <li>Sign up for notifications to track price changes</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
