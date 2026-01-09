"use client"

import { useState, useCallback } from "react"
import type { Toast } from "@/components/notification-toast"

export function useNotification() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: Toast["type"] = "info", duration?: number) => {
    const id = Date.now().toString()
    const toast = { id, message, type, duration }
    setToasts((prev) => [...prev, toast])
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, addToast, removeToast }
}
