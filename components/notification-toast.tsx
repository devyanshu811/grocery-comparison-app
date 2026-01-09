"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"

export interface Toast {
  id: string
  type: "success" | "error" | "info"
  message: string
  duration?: number
}

interface NotificationToastProps {
  toast: Toast
  onClose: (id: string) => void
}

export function NotificationToast({ toast, onClose }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose(toast.id)
    }, toast.duration || 3000)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onClose])

  if (!isVisible) return null

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-destructive" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  }

  const bgColors = {
    success: "bg-green-50 border-green-200",
    error: "bg-destructive/5 border-destructive/20",
    info: "bg-blue-50 border-blue-200",
  }

  return (
    <div
      className={`fixed bottom-4 right-4 flex items-center gap-3 p-4 rounded-lg border ${bgColors[toast.type]} max-w-sm`}
    >
      {icons[toast.type]}
      <span className="text-sm font-medium text-foreground flex-1">{toast.message}</span>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsVisible(false)}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}
