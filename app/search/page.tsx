"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FilterSidebar } from "@/components/filter-sidebar"
import { ProductCard } from "@/components/product-card"
import { searchProducts, getProductsByCategory, getStores, listProducts } from "@/lib/api"
import type { Product, Store } from "@/lib/types"
import { useStore } from "@/lib/store"
import { DeliveringToBanner } from "@/components/location-selector"
import { ChevronLeft, Filter, X } from "lucide-react"
import Link from "next/link"

interface StoreSummary {
  storeId: string
  count: number
  success: boolean
  error: string | null
}

const STORE_LABELS: Record<string, string> = {
  blinkit: "Blinkit",
  zepto: "Zepto",
  swiggy: "Swiggy",
  bigbasket: "BigBasket",
  jiomart: "JioMart",
  amazon_now: "Amazon",
  flipkart_minutes: "Flipkart",
  dmart_ready: "D'Mart",
}

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const category = searchParams.get("category") || ""
  const { location } = useStore()
  const pincode = location.pincode || undefined
  const [products, setProducts] = useState<Product[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMockData, setIsMockData] = useState(false)
  const [storeSummary, setStoreSummary] = useState<StoreSummary[]>([])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      setIsMockData(false)
      setStoreSummary([])

      try {
        const searchQuery = (query || "").trim()
        const categoryFilter = (category || "").trim()
        const activeQuery = searchQuery || categoryFilter

        // For active queries, hit /api/stores/search directly to get live data + per-store summary
        if (activeQuery) {
          const params = new URLSearchParams({ q: activeQuery })
          if (pincode) params.set("pincode", pincode)
          if (location.city) params.set("city", location.city)

          const [liveRes, storesData] = await Promise.all([
            fetch(`/api/stores/search?${params}`).then((r) => r.json()).catch(() => null),
            getStores(),
          ])

          setStores(storesData)

          if (liveRes?.summary) setStoreSummary(liveRes.summary)

          if (liveRes?.products?.length > 0) {
            setProducts(liveRes.products)
            setIsMockData(false)
          } else {
            // No live results — fall back to mock data via the RPC provider
            const mockProducts = searchQuery
              ? await searchProducts(searchQuery, pincode)
              : await getProductsByCategory(categoryFilter, pincode)
            setProducts(Array.isArray(mockProducts) ? mockProducts : [])
            setIsMockData(true)
          }
        } else {
          // No query — just list products from the provider (mock)
          const [storesData, productsData] = await Promise.all([
            getStores(),
            listProducts(undefined, pincode),
          ])
          setStores(storesData)
          setProducts(Array.isArray(productsData) ? productsData : [])
          setIsMockData(true)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load products")
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [query, category, pincode])

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
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold text-primary flex items-center gap-2">
              <ChevronLeft className="w-5 h-5" />
              PriceHub
            </Link>
            <DeliveringToBanner className="hidden sm:flex" />
          </div>
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
            {location.city || location.pincode ? (
              <span className="ml-1">
                · Showing products for{" "}
                <span className="font-medium text-foreground">
                  {location.city && location.pincode
                    ? `${location.city} (${location.pincode})`
                    : location.city || location.pincode}
                </span>
              </span>
            ) : null}
          </p>
        </div>

        {/* Mock data warning */}
        {isMockData && !loading && (query || category) && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span className="mt-0.5 shrink-0">⚠️</span>
            <span>
              Showing <strong>sample data</strong> — live prices from grocery apps are
              unavailable right now. Results may not reflect actual prices or availability.
            </span>
          </div>
        )}

        {/* Per-store status row */}
        {storeSummary.length > 0 && !loading && (
          <div className="mb-6 flex flex-wrap gap-2">
            {storeSummary.map((s) => {
              const label = STORE_LABELS[s.storeId] || s.storeId
              const isCaptcha = s.error?.includes("captcha")
              const isBlocked = isCaptcha || s.error?.includes("blocked")
              return (
                <div
                  key={s.storeId}
                  title={s.error ?? undefined}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                    s.count > 0
                      ? "border-green-200 bg-green-50 text-green-700"
                      : isBlocked
                      ? "border-gray-200 bg-gray-50 text-gray-400"
                      : !s.success
                      ? "border-red-200 bg-red-50 text-red-600"
                      : "border-orange-200 bg-orange-50 text-orange-600"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      s.count > 0
                        ? "bg-green-500"
                        : isBlocked
                        ? "bg-gray-300"
                        : !s.success
                        ? "bg-red-400"
                        : "bg-orange-400"
                    }`}
                  />
                  {label}
                  {s.count > 0 && <span className="opacity-70">· {s.count}</span>}
                  {isBlocked && <span className="opacity-60">· blocked</span>}
                </div>
              )
            })}
          </div>
        )}

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
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>Try again</Button>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-2">
                  No products found{query ? ` for "${query}"` : category ? ` in ${category}` : ""}.
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Try &quot;rice&quot;, &quot;milk&quot;, &quot;vegetables&quot; or browse categories below.
                </p>
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
