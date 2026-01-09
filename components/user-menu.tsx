"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronDown, LogOut, Settings, User } from "lucide-react"

interface UserProfile {
  name: string
  phone: string
  email?: string
}

interface UserMenuProps {
  user?: UserProfile
  onLogout?: () => void
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false)

  if (!user) {
    return null
  }

  return (
    <div className="relative">
      <Button variant="ghost" className="gap-2" onClick={() => setOpen(!open)}>
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <ChevronDown className="w-4 h-4" />
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 z-50">
          <Card className="p-0">
            {/* Profile Header */}
            <div className="bg-primary/5 border-b border-border p-4">
              <p className="font-semibold text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.phone}</p>
              {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <Button variant="ghost" className="w-full justify-start gap-2 h-auto py-2 text-sm">
                <User className="w-4 h-4" />
                My Profile
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2 h-auto py-2 text-sm">
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </div>

            {/* Logout */}
            <div className="border-t border-border p-2">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-auto py-2 text-sm text-destructive hover:text-destructive"
                onClick={() => {
                  onLogout?.()
                  setOpen(false)
                }}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
