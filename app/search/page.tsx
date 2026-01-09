"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FilterSidebar } from "@/components/filter-sidebar"
import { ProductCard } from "@/components/product-card"
import { searchProducts, getProductsByCategory, getStores } from "@/lib/api"
import type { Product, Store } from "@/lib/types"
import { ChevronLeft, Filter, X } from "lucide-react"
import Link from "next/link"

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const category = searchParams.get("category") || ""
  const [products, setProducts] = useState<Product[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const [storesData, productsData] = await Promise.all([
        getStores(),
        query ? searchProducts(query) : category ? getProductsByCategory(category) : searchProducts(""),
      ])
      setStores(storesData)
      setProducts(productsData)
      setLoading(false)
    }
    loadData()
  }, [query, category])

  const handleCompare = (productId: string) => {
    window.location.href = `/compare/${productId}`
  }

  const handleAddToCart = (productId: string, storeId: string) => {
    // Navigate to cart page with item
    window.location.href = `/cart?product=${productId}&store=${storeId}`
  }

  const displayTitle = query ? `Results for "${query}"` : category ? `${category}` : "All Products"

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-primary flex items-center gap-2">
            <ChevronLeft className="w-5 h-5" />
            PriceHub
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">
              Cart
            </Button>
            <Button variant="ghost" size="sm">
              Account
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{displayTitle}</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} product{products.length !== 1 ? "s" : ""} found
          </p>
        </div>

        <div className="flex gap-6">
          {/* Filters - Hidden on mobile, shown in modal */}
          {showFilters && (
            <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setShowFilters(false)} />
          )}

          <div
            className={`fixed left-0 top-0 h-screen w-64 bg-background border-r border-border p-4 overflow-y-auto z-50 md:static md:w-56 md:h-auto md:border-r md:p-0 transition-transform ${
              showFilters ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            }`}
          >
            <div className="flex justify-between items-center mb-4 md:hidden">
              <h2 className="font-semibold">Filters</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <FilterSidebar />
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-muted animate-pulse rounded-lg aspect-square" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="flex justify-between items-center mb-4 md:hidden">
                  <span className="text-sm font-medium">{products.length} products</span>
                  <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      stores={stores}
                      onCompare={handleCompare}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>

                {/* Infinite scroll placeholder */}
                <div className="mt-8 text-center py-8 border border-dashed border-border rounded-lg">
                  <p className="text-sm text-muted-foreground">Load more products (infinite scroll demo)</p>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-4">No products found</p>
                <Link href="/">
                  <Button>Back to Home</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  )
}
