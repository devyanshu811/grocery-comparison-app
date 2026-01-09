"use client"

import { Button } from "@/components/ui/button"
import { Minus, Plus, Trash2 } from "lucide-react"
import type { Product } from "@/lib/types"

interface CartItemProps {
  product: Product
  quantity: number
  storeId: string
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
}

export function CartItem({ product, quantity, storeId, onQuantityChange, onRemove }: CartItemProps) {
  const price = product.prices.find((p) => p.storeId === storeId)?.price || 0
  const total = price * quantity

  return (
    <div className="flex gap-4 py-4 border-b border-border last:border-b-0">
      <div className="w-20 h-20 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
        <img src={product.image || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-semibold text-foreground">{product.name}</h4>
          <p className="text-xs text-muted-foreground">{product.quantity}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded bg-transparent"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="w-8 text-center font-semibold">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded bg-transparent"
              onClick={() => onQuantityChange(quantity + 1)}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onRemove}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-end justify-between">
        <p className="text-sm font-semibold text-primary">${price.toFixed(2)}</p>
        <p className="text-lg font-bold text-foreground">${total.toFixed(2)}</p>
      </div>
    </div>
  )
}
