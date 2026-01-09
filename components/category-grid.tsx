"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { getCategories } from "@/lib/api"
import { useStore } from "@/lib/store"

interface Category {
  id: string
  name: string
  icon: string
}

export function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const { setSelectedCategory } = useStore()

  useEffect(() => {
    const loadCategories = async () => {
      const data = await getCategories()
      setCategories(data)
      setLoading(false)
    }
    loadCategories()
  }, [])

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category)
    window.location.href = `/search?category=${encodeURIComponent(category)}`
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-muted animate-pulse rounded-lg aspect-square" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant="outline"
          onClick={() => handleCategoryClick(category.name)}
          className="h-auto flex-col aspect-square rounded-lg bg-white hover:bg-primary/5 border-border hover:border-primary/30 transition-all"
        >
          <span className="text-3xl mb-1">{category.icon}</span>
          <span className="text-xs font-medium text-center">{category.name}</span>
        </Button>
      ))}
    </div>
  )
}
