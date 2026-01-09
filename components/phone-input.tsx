"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ChevronRight } from "lucide-react"

interface PhoneInputProps {
  onSubmit: (phone: string) => void
  loading?: boolean
}

export function PhoneInput({ onSubmit, loading }: PhoneInputProps) {
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = () => {
    // Simple validation
    const phoneRegex = /^\d{10}$/
    if (!phoneRegex.test(phone.replace(/\D/g, ""))) {
      setError("Please enter a valid 10-digit phone number")
      return
    }
    setError("")
    onSubmit(phone)
  }

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "")
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
        <Input
          type="tel"
          placeholder="Enter your 10-digit phone"
          value={phone}
          onChange={(e) => {
            setPhone(formatPhone(e.target.value))
            setError("")
          }}
          className="h-12 text-lg tracking-wider"
        />
        {error && <p className="text-xs text-destructive mt-2">{error}</p>}
      </div>

      <Button onClick={handleSubmit} disabled={loading || phone.length < 10} className="w-full h-12">
        {loading ? "Sending OTP..." : "Send OTP"}
        <ChevronRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  )
}
