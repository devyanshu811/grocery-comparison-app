"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

interface FilterSidebarProps {
  onStoreFilter?: (storeId: string) => void
  onPriceFilter?: (min: number, max: number) => void
  onSortChange?: (sort: string) => void
}

const STORES = [
  { id: "1", name: "Fresh Mart" },
  { id: "2", name: "Quick Shop" },
  { id: "3", name: "Value Store" },
  { id: "4", name: "Organic Plus" },
]

const PRICE_RANGES = [
  { id: "0-5", label: "$0 - $5" },
  { id: "5-10", label: "$5 - $10" },
  { id: "10-20", label: "$10 - $20" },
  { id: "20+", label: "$20+" },
]

const SORT_OPTIONS = [
  { id: "relevance", label: "Relevance" },
  { id: "price-low", label: "Price: Low to High" },
  { id: "price-high", label: "Price: High to Low" },
  { id: "delivery", label: "Fastest Delivery" },
]

export function FilterSidebar({ onStoreFilter, onPriceFilter, onSortChange }: FilterSidebarProps) {
  const [openFilters, setOpenFilters] = useState({ stores: true, price: false, sort: true })
  const [selectedStore, setSelectedStore] = useState<string>("")
  const [selectedSort, setSelectedSort] = useState("relevance")

  return (
    <div className="space-y-4">
      {/* Sort */}
      <div className="border border-border rounded-lg">
        <button
          onClick={() => setOpenFilters((p) => ({ ...p, sort: !p.sort }))}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
        >
          <span className="font-semibold text-sm">Sort By</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${openFilters.sort ? "rotate-180" : ""}`} />
        </button>
        {openFilters.sort && (
          <div className="border-t border-border p-4 space-y-2">
            {SORT_OPTIONS.map((option) => (
              <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sort"
                  value={option.id}
                  checked={selectedSort === option.id}
                  onChange={(e) => {
                    setSelectedSort(e.target.value)
                    onSortChange?.(e.target.value)
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Store Filter */}
      <div className="border border-border rounded-lg">
        <button
          onClick={() => setOpenFilters((p) => ({ ...p, stores: !p.stores }))}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
        >
          <span className="font-semibold text-sm">Stores</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${openFilters.stores ? "rotate-180" : ""}`} />
        </button>
        {openFilters.stores && (
          <div className="border-t border-border p-4 space-y-2">
            {STORES.map((store) => (
              <label key={store.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStore === store.id}
                  onChange={(e) => {
                    const newValue = e.target.checked ? store.id : ""
                    setSelectedStore(newValue)
                    onStoreFilter?.(newValue)
                  }}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm">{store.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="border border-border rounded-lg">
        <button
          onClick={() => setOpenFilters((p) => ({ ...p, price: !p.price }))}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
        >
          <span className="font-semibold text-sm">Price Range</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${openFilters.price ? "rotate-180" : ""}`} />
        </button>
        {openFilters.price && (
          <div className="border-t border-border p-4 space-y-2">
            {PRICE_RANGES.map((range) => (
              <label key={range.id} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" />
                <span className="text-sm">{range.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <Button variant="outline" className="w-full bg-transparent">
        Clear Filters
      </Button>
    </div>
  )
}
