import { ErrorBoundary } from "@/components/error-boundary"
import { LocationGate } from "@/components/location-gate"
import { StickyCartBar } from "@/components/sticky-cart-bar"
import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next"
import type React from "react"
import "./globals.css"
import { initializeApp } from "./init"

export const metadata: Metadata = {
  title: "PriceHub - Compare Grocery Prices",
  description: "Find the best prices on groceries across multiple stores in your area",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#66bb6a",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Initialize application on server startup
  await initializeApp()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        <ErrorBoundary>
          <LocationGate>
            {children}
            <StickyCartBar />
          </LocationGate>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
