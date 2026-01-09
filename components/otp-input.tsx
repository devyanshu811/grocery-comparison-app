"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface OTPInputProps {
  onSubmit: (otp: string) => void
  onResend: () => void
  loading?: boolean
  canResend?: boolean
  timeLeft?: number
}

export function OTPInput({ onSubmit, onResend, loading, canResend = true, timeLeft = 0 }: OTPInputProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const [error, setError] = useState("")

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    setError("")

    // Move to next input
    if (value && index < 5) {
      inputs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = () => {
    const otpString = otp.join("")
    if (otpString.length !== 6) {
      setError("Please enter all 6 digits")
      return
    }
    onSubmit(otpString)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-4">Enter OTP</label>
        <div className="flex gap-2 justify-center">
          {otp.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => {
                inputs.current[index] = el
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="h-12 w-12 text-center text-xl font-bold"
            />
          ))}
        </div>
        {error && <p className="text-xs text-destructive mt-2 text-center">{error}</p>}
      </div>

      <Button onClick={handleSubmit} disabled={loading || otp.some((d) => !d)} className="w-full h-12">
        {loading ? "Verifying..." : "Verify & Continue"}
      </Button>

      <div className="text-center">
        {canResend ? (
          <Button variant="link" onClick={onResend} className="text-sm h-auto p-0">
            Resend OTP
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            Resend OTP in <span className="font-semibold">{timeLeft}s</span>
          </p>
        )}
      </div>
    </div>
  )
}
