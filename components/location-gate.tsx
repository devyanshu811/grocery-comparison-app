"use client"

import { useCallback, useEffect, useState } from "react"
import { useStore } from "@/lib/store"
import { LocationSelector } from "./location-selector"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Loader2 } from "lucide-react"
import { detectLocation } from "@/lib/location"

/**
 * Shows a full-screen "Select your location" prompt when location is not set.
 * Similar to Quick Compare: detect location first, then "set your location manually" if denied.
 * Children (main app) render only after location is set or user dismisses.
 */
export function LocationGate({ children }: { children: React.ReactNode }) {
  const { hasLocation, validateLocation, locationPromptShown, setLocation, setLocationPromptShown } = useStore()
  const [showPrompt, setShowPrompt] = useState(false)
  const [detecting, setDetecting] = useState(true)

  // Validate stored location on mount — clears expired/invalid data so the
  // gate re-prompts the user instead of silently using a stale pincode.
  useEffect(() => {
    validateLocation()
  }, [validateLocation])

  const tryDetect = useCallback(async () => {
    if (hasLocation()) return
    setDetecting(true)
    try {
      const geo = await detectLocation()
      if (geo) {
        setLocation(geo.city, geo.pincode)
        setShowPrompt(false)
      }
    } finally {
      setDetecting(false)
    }
  }, [hasLocation, setLocation])

  useEffect(() => {
    if (!hasLocation() && !locationPromptShown) {
      setShowPrompt(true)
      tryDetect()
    }
  }, [hasLocation, locationPromptShown, tryDetect])
  const handleDismiss = () => {
    useStore.getState().setLocationPromptShown(true)
    setShowPrompt(false)
  }

  if (!showPrompt || hasLocation()) return <>{children}</>

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <Card className="max-w-md w-full p-8 text-center shadow-xl">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary/10 p-4">
            {detecting ? <Loader2 className="w-10 h-10 text-primary animate-spin" /> : <MapPin className="w-10 h-10 text-primary" />}
          </div>
        </div>
        <h2 className="text-xl font-bold mb-2">
          {detecting ? "Detecting your location…" : "Select your location"}
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          {detecting
            ? "Allow browser location to see prices for your area."
            : "Set your location to see accurate prices and delivery options from stores near you."}
        </p>
        {!detecting && (
          <div className="space-y-3">
            <LocationSelector variant="full" className="!flex !justify-center" />
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleDismiss}>
              I&apos;ll set it later
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
