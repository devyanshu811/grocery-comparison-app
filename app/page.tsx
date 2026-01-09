import { SearchBar } from "@/components/search-bar"
import { CategoryGrid } from "@/components/category-grid"
import { PromoBanner } from "@/components/promo-banner"
import { TrendingUp, Zap, Package } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-background/80">
      <section className="relative min-h-screen flex items-center pt-20 px-4 overflow-hidden">
        {/* Background gradient blobs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto w-full space-y-10">
          {/* Main heading */}
          <div className="text-center space-y-6">
            <div className="inline-block">
              <div className="glass px-4 py-2 rounded-full">
                <span className="text-xs font-semibold gradient-text">✨ Smart Price Comparison</span>
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold leading-tight">
              <span className="gradient-text">Compare Prices</span>
              <br />
              <span className="text-foreground">Save Smart</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Compare grocery prices across BigBasket, Zepto, Blinkit, and Amazon Fresh in seconds. Find the best deals
              and save more.
            </p>

            {/* Search Bar */}
            <div className="mt-8 max-w-2xl mx-auto">
              <SearchBar />
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16">
            {[
              { icon: TrendingUp, title: "Real-time Prices", desc: "Live pricing updates across all stores" },
              { icon: Zap, title: "Instant Comparison", desc: "Compare multiple stores in seconds" },
              { icon: Package, title: "Direct Checkout", desc: "One-click shopping on store apps" },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="glass glass-dark p-6 rounded-lg hover:translate-y-[-2px] transition-all duration-300 group"
              >
                <feature.icon className="w-8 h-8 text-primary group-hover:text-accent transition-all duration-300 mb-3" />
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="relative z-10 px-4 -mt-8">
        <div className="max-w-6xl mx-auto">
          <PromoBanner />
        </div>
      </section>

      {/* Categories Section */}
      <section className="relative py-16 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2 text-foreground">Browse Categories</h2>
            <p className="text-muted-foreground">Find products organized by type</p>
          </div>
          <CategoryGrid />
        </div>
      </section>

      <footer className="glass-dark border-t border-white/10 mt-16 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            {[
              { title: "About", links: ["Our Story", "Careers", "Blog"] },
              { title: "Support", links: ["Help Center", "Contact Us", "Status"] },
              { title: "Legal", links: ["Privacy", "Terms", "Cookies"] },
              { title: "Social", links: ["Twitter", "Facebook", "Instagram"] },
            ].map((col, idx) => (
              <div key={idx}>
                <h4 className="font-semibold text-sm mb-4 text-foreground">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map((link, i) => (
                    <li key={i}>
                      <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground gap-4">
            <p>&copy; 2026 PriceHub. All rights reserved.</p>
            <p>Made with care for tech-savvy shoppers</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
