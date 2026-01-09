"use client"

import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Product, Store as StoreType } from "@/lib/types"

interface ProductCardProps {
  product: Product
  stores: StoreType[]
  onCompare?: (productId: string) => void
  onAddToCart?: (productId: string, storeId: string) => void
}

export function ProductCard({ product, stores, onCompare, onAddToCart }: ProductCardProps) {
  const bestPrice = Math.min(...product.prices.map((p) => p.price))
  const bestPriceStore = product.prices.find((p) => p.price === bestPrice)

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square bg-muted overflow-hidden">
        <img src={product.image || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover" />
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
          <p className="text-xs text-muted-foreground">{product.quantity}</p>
        </div>

        <div className="space-y-2">
          <div className="bg-primary/10 rounded-lg p-2">
            <p className="text-xs text-muted-foreground mb-1">Best Price</p>
            <p className="text-lg font-bold text-primary">₹{bestPrice.toFixed(0)}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {product.prices.map((price) => {
              const store = stores.find((s) => s.id === price.storeId)
              return (
                <div
                  key={price.storeId}
                  className={`p-2 rounded border text-center ${
                    price.price === bestPrice ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <p className="text-xs font-medium">{store?.name}</p>
                  <p className="text-xs font-semibold text-foreground">₹{price.price.toFixed(0)}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs bg-transparent"
            onClick={() => onCompare?.(product.id)}
          >
            <Search className="w-3 h-3 mr-1" />
            Compare
          </Button>
          {bestPriceStore && (
            <Button
              size="sm"
              className="flex-1 text-xs"
              onClick={() => onAddToCart?.(product.id, bestPriceStore.storeId)}
            >
              Add to Cart
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
