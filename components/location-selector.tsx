"use client"

import { useCallback, useState } from "react"
import { MapPin, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useStore } from "@/lib/store"
import { detectLocation } from "@/lib/location"

interface LocationSelectorProps {
  /** Compact: just the "Delivering to" button. Full: button + optional modal. */
  variant?: "compact" | "full"
  className?: string
}

export function LocationSelector({ variant = "full", className = "" }: LocationSelectorProps) {
  const { location, setLocation, setLocationPromptShown, hasLocation } = useStore()
  const [open, setOpen] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [manualPincode, setManualPincode] = useState("")
  const [manualCity, setManualCity] = useState("")

  const handleUseCurrentLocation = useCallback(async () => {
    setDetecting(true)
    try {
      const geo = await detectLocation()
      if (geo) {
        setLocation(geo.city, geo.pincode)
        setLocationPromptShown(true)
        setOpen(false)
      }
    } finally {
      setDetecting(false)
    }
  }, [setLocation, setLocationPromptShown])

  const handleSetManual = useCallback(() => {
    const city = manualCity.trim() || "Your area"
    const pincode = manualPincode.trim()
    setLocation(city, pincode)
    setLocationPromptShown(true)
    setOpen(false)
    setManualPincode("")
    setManualCity("")
  }, [manualCity, manualPincode, setLocation, setLocationPromptShown])

  const displayText = hasLocation()
    ? location.city || location.pincode || "Your area"
    : "Select Location"

  return (
    <div className={className}>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <MapPin className="w-4 h-4 shrink-0" />
        <span className="truncate max-w-[140px]">{displayText}</span>
      </Button>

      {variant === "full" && open && (
        <>
          <div
            className="fixed inset-0 z-[110] bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="fixed left-1/2 top-1/2 z-[110] w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-4">
            <Card className="p-6 shadow-xl">
              <h3 className="font-semibold text-lg mb-1">Set your location</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We need your location to show delivery options and accurate prices.
              </p>

              <Button
                className="w-full mb-4 gap-2"
                onClick={handleUseCurrentLocation}
                disabled={detecting}
              >
                {detecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
                Use current location
              </Button>

              <div className="relative my-2">
                <span className="absolute left-0 right-0 top-1/2 h-px bg-border" />
                <span className="relative bg-card px-2 text-xs text-muted-foreground">or enter manually</span>
              </div>

              <div className="space-y-2 mb-4">
                <Input
                  placeholder="Pincode (e.g. 110001)"
                  value={manualPincode}
                  onChange={(e) => setManualPincode(e.target.value)}
                  className="h-10"
                />
                <Input
                  placeholder="City / Area name"
                  value={manualCity}
                  onChange={(e) => setManualCity(e.target.value)}
                  className="h-10"
                />
              </div>
              <Button variant="secondary" className="w-full gap-2" onClick={handleSetManual}>
                <Search className="w-4 h-4" />
                Set location
              </Button>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

/** Banner showing "Delivering to [location]" - use in header or above search */
export function DeliveringToBanner({ className = "" }: { className?: string }) {
  const { location, hasLocation } = useStore()
  if (!hasLocation()) return null
  return (
    <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
      <span>Delivering to</span>
      <LocationSelector variant="compact" className="!p-0 h-auto font-medium text-foreground" />
    </div>
  )
}
