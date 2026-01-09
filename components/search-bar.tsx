"use client"

import { Search, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { useState } from "react"

export function SearchBar() {
  const [query, setQuery] = useState("")
  const { setSearchQuery } = useStore()

  const handleSearch = () => {
    setSearchQuery(query)
    window.location.href = `/search?q=${encodeURIComponent(query)}`
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="space-y-2">
        <div className="flex gap-2 mb-3">
          <Button variant="ghost" size="sm" className="text-xs gap-1">
            <MapPin className="w-3 h-3" />
            <span>New York</span>
          </Button>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search for products, brands..."
              className="pl-10 h-12 rounded-lg border-2 border-border focus:border-primary focus-visible:ring-0 transition-colors"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} className="h-12 rounded-lg px-6">
            Search
          </Button>
        </div>
      </div>
    </div>
  )
}
