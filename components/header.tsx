"use client"

import { Button } from "@/components/ui/button"
import { ShoppingCart, User, Zap } from "lucide-react"
import Link from "next/link"
import { useStore } from "@/lib/store"

export function Header() {
  const { cartItems } = useStore()

  return (
    <header className="sticky top-0 z-50 glass-dark border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center glow-effect">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg gradient-text group-hover:brightness-110 transition-all duration-300">
            PriceHub
          </span>
        </Link>

        <div className="flex gap-3">
          <Link href="/cart">
            <Button variant="ghost" size="sm" className="relative hover:bg-white/10 transition-all duration-300">
              <ShoppingCart className="w-5 h-5" />
              {cartItems.length > 0 && (
                <span className="absolute top-0 right-0 bg-gradient-to-br from-primary to-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold glow-effect">
                  {cartItems.length}
                </span>
              )}
            </Button>
          </Link>

          <Link href="/auth">
            <Button variant="ghost" size="sm" className="hover:bg-white/10 transition-all duration-300">
              <User className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
