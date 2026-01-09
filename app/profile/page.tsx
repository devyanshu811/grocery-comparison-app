"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ChevronLeft, Edit2, Save } from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john@example.com",
    phone: "+1 234-567-8900",
    address: "123 Main St, New York, NY 10001",
    city: "New York",
    pincode: "10001",
  })

  const [tempProfile, setTempProfile] = useState(profile)

  const handleSave = () => {
    setProfile(tempProfile)
    setEditing(false)
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-primary">My Profile</h1>
          </div>
          {!editing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTempProfile(profile)
                setEditing(true)
              }}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Profile Avatar */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-4xl font-bold text-primary mx-auto">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-2xl font-bold text-foreground mt-4">{profile.name}</h2>
          <p className="text-muted-foreground">{profile.phone}</p>
        </div>

        {/* Personal Information */}
        <Card className="p-6 mb-6">
          <h3 className="font-semibold text-lg text-foreground mb-4">Personal Information</h3>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Full Name</label>
              {editing ? (
                <Input
                  value={tempProfile.name}
                  onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                />
              ) : (
                <p className="text-foreground">{profile.name}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Email</label>
              {editing ? (
                <Input
                  type="email"
                  value={tempProfile.email}
                  onChange={(e) => setTempProfile({ ...tempProfile, email: e.target.value })}
                />
              ) : (
                <p className="text-foreground">{profile.email}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Phone</label>
              <p className="text-foreground text-sm">{profile.phone}</p>
              <p className="text-xs text-muted-foreground mt-1">Contact via Settings to change phone</p>
            </div>
          </div>
        </Card>

        {/* Address Information */}
        <Card className="p-6 mb-6">
          <h3 className="font-semibold text-lg text-foreground mb-4">Address</h3>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Address</label>
              {editing ? (
                <Input
                  value={tempProfile.address}
                  onChange={(e) => setTempProfile({ ...tempProfile, address: e.target.value })}
                />
              ) : (
                <p className="text-foreground">{profile.address}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">City</label>
                {editing ? (
                  <Input
                    value={tempProfile.city}
                    onChange={(e) => setTempProfile({ ...tempProfile, city: e.target.value })}
                  />
                ) : (
                  <p className="text-foreground">{profile.city}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Pincode</label>
                {editing ? (
                  <Input
                    value={tempProfile.pincode}
                    onChange={(e) => setTempProfile({ ...tempProfile, pincode: e.target.value })}
                  />
                ) : (
                  <p className="text-foreground">{profile.pincode}</p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        {editing && (
          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1 gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
            <Button
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => {
                setTempProfile(profile)
                setEditing(false)
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Account Settings */}
        <Card className="p-6 mt-6 border-destructive/30 bg-destructive/5">
          <h3 className="font-semibold text-foreground mb-4">Danger Zone</h3>
          <Button variant="destructive" className="w-full">
            Delete Account
          </Button>
        </Card>
      </div>
    </main>
  )
}
