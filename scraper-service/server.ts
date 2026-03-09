/**
 * Standalone scraper service — runs on port 3001.
 * Keeps a warm Puppeteer browser between requests so cold-start
 * only happens once instead of on every Next.js API call.
 *
 * Start:  npx tsx scraper-service/server.ts
 * Or via: npm run dev:all  (runs Next.js + this service together)
 */

import { createServer } from "http"
import { parse } from "url"
import { scrapeAllStores } from "../app/scrapers/index"

const PORT = Number(process.env.SCRAPER_PORT || 3001)

const server = createServer(async (req, res) => {
  const { pathname, query } = parse(req.url || "/", true)

  res.setHeader("Content-Type", "application/json")
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000")
  res.setHeader("Access-Control-Allow-Methods", "GET")

  if (pathname === "/health") {
    res.end(JSON.stringify({ ok: true, pid: process.pid }))
    return
  }

  if (pathname === "/scrape") {
    const q = String(query.q || "").trim()
    if (!q) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: "Missing required param: q" }))
      return
    }

    const lat = String(query.lat || "") || undefined
    const lon = String(query.lon || "") || undefined
    const pincode = String(query.pincode || "") || undefined

    try {
      const { products, results } = await scrapeAllStores(
        { query: q, lat, lon, pincode },
        55000
      )

      const summary = results.map((r) => ({
        storeId: r.storeId,
        count: r.products.length,
        success: r.success,
        error: r.error ?? null,
      }))

      res.end(JSON.stringify({ query: q, total: products.length, products, summary }))
    } catch (e) {
      res.statusCode = 500
      res.end(JSON.stringify({ error: "Scraping failed", details: (e as Error).message }))
    }
    return
  }

  res.statusCode = 404
  res.end(JSON.stringify({ error: "Not found" }))
})

server.listen(PORT, () => {
  console.log(`[scraper-service] Running on http://localhost:${PORT}`)
  console.log(`[scraper-service] Test: http://localhost:${PORT}/scrape?q=milk`)
})

server.on("error", (err) => {
  console.error("[scraper-service] Server error:", err)
  process.exit(1)
})
