"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PhoneInput } from "@/components/phone-input"
import { OTPInput } from "@/components/otp-input"
import Link from "next/link"

type AuthStep = "phone" | "otp" | "success"

export default function AuthPage() {
  const [step, setStep] = useState<AuthStep>("phone")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  const handlePhoneSubmit = async (phoneNumber: string) => {
    setLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setPhone(phoneNumber)
    setStep("otp")
    setLoading(false)
    setResendTimer(30)

    // Countdown timer
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleOTPSubmit = async (otp: string) => {
    setLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setStep("success")
    setLoading(false)
  }

  const handleResend = () => {
    setResendTimer(30)
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">PriceHub</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        {step === "phone" && <PhoneInput onSubmit={handlePhoneSubmit} loading={loading} />}

        {step === "otp" && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground mb-1">OTP sent to</p>
              <p className="font-semibold text-foreground">{phone}</p>
              <Button variant="link" className="text-xs h-auto p-0 mt-2" onClick={() => setStep("phone")}>
                Change number
              </Button>
            </div>

            <OTPInput
              onSubmit={handleOTPSubmit}
              onResend={handleResend}
              loading={loading}
              canResend={resendTimer === 0}
              timeLeft={resendTimer}
            />
          </div>
        )}

        {step === "success" && (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-3xl">✓</div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Welcome!</h2>
              <p className="text-sm text-muted-foreground">Your account is all set</p>
            </div>

            <div className="space-y-3 pt-4">
              <Link href="/">
                <Button className="w-full">Go to Home</Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" className="w-full bg-transparent">
                  Set Up Profile
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          <p>
            By continuing, you agree to our{" "}
            <Button variant="link" className="h-auto p-0 text-primary">
              Terms of Service
            </Button>{" "}
            and{" "}
            <Button variant="link" className="h-auto p-0 text-primary">
              Privacy Policy
            </Button>
          </p>
        </div>
      </Card>
    </main>
  )
}
