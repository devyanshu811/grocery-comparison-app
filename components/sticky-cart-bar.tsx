"use client"

import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { ShoppingCart, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export function StickyCartBar() {
  const { cartItems } = useStore()
  const [show, setShow] = useState(false)

  useEffect(() => {
    setShow(cartItems.length > 0)
  }, [cartItems.length])

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border bg-white/95 backdrop-blur-sm">
      <div className="max-w-full px-4 py-3 flex items-center gap-3">
        <Link href="/cart" className="flex-1">
          <Button className="w-full gap-2">
            <ShoppingCart className="w-4 h-4" />
            Cart ({cartItems.length})
          </Button>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setShow(false)}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
