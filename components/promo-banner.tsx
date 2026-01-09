"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

const PROMOTIONS = [
  {
    id: 1,
    title: "Save 30% on Fresh Vegetables",
    subtitle: "Limited time offer on Zepto",
    color: "from-primary/20 to-primary/5",
  },
  {
    id: 2,
    title: "Free Delivery Above ₹500",
    subtitle: "Use code: SAVE500",
    color: "from-accent/20 to-accent/5",
  },
  {
    id: 3,
    title: "Compare Prices Across 4 Stores",
    subtitle: "Find the best deals in seconds",
    color: "from-secondary/40 to-secondary/10",
  },
]

export function PromoBanner() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % PROMOTIONS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const promo = PROMOTIONS[current]

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-6 sm:p-8 border border-border">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-1">{promo.title}</h3>
          <p className="text-sm text-muted-foreground">{promo.subtitle}</p>
        </div>
        <div className="flex gap-2 ml-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setCurrent((prev) => (prev - 1 + PROMOTIONS.length) % PROMOTIONS.length)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setCurrent((prev) => (prev + 1) % PROMOTIONS.length)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-1 mt-4 absolute bottom-3 left-6">
        {PROMOTIONS.map((_, idx) => (
          <div
            key={idx}
            className={`h-1 w-2 rounded-full transition-colors ${idx === current ? "bg-primary" : "bg-muted-foreground/30"}`}
          />
        ))}
      </div>
    </div>
  )
}
