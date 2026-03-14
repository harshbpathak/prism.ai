"use client"

import React, { useState, useEffect } from "react"
import { Edit, Lock, Mail, Phone, Globe, LogOut } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useUser } from "@/lib/stores/user"
import { ProfilePageSkeleton } from "./profile-page-skeleton"
import { useSearchParams } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { UpdateProfileForm } from "./UpdateProfileForm"
import { ChangePasswordDialog } from "./ChangePasswordDialog"
import { logout } from "@/lib/functions/signout"

// Default values for notification preferences
const defaultPreferences = {
  email: true,
  sms: false
}

// Glassmorphic wrapper from arnab branch
function GlassmorphicCard({
  children,
  className = "",
  ...props
}: {
  children: React.ReactNode
  className?: string
  [key: string]: any
}) {
  return (
    <Card
      className={`border border-white/30 dark:border-slate-700/10 bg-white/70 dark:bg-slate-900/5 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20 rounded-xl ${className}`}
      {...props}
    >
      {children}
    </Card>
  )
}

export function ProfilePage(): React.ReactElement {
  const { userData, setUserData, userLoading } = useUser()
  const searchParams = useSearchParams()

  const [notifPrefs, setNotifPrefs] = useState(defaultPreferences)
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isMandatoryUpdate, setIsMandatoryUpdate] = useState(false)

  // initial fetch
  useEffect(() => {
    setUserData()
  }, [])

  // URL-param popup logic
  useEffect(() => {
    const showPopup = searchParams.get("show_popup")
    if (showPopup === "true") {
      setIsUpdateFormOpen(true)
      setIsMandatoryUpdate(true)
    }
  }, [searchParams])

  if (userLoading || !userData) {
    return <ProfilePageSkeleton />
  }

  return (
    <div className="relative min-h-full flex-1 bg-gradient-to-br from-indigo-100 via-purple-50 to-cyan-100 dark:from-gray-900 dark:to-slate-900 overflow-x-hidden">
      {/* animated blurred background circles */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 dark:bg-purple-900 opacity-30 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 dark:bg-blue-900 opacity-25 blur-3xl"></div>
      <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-gradient-to-br from-emerald-300 to-teal-400 dark:bg-emerald-900 opacity-20 blur-2xl"></div>
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full bg-gradient-to-br from-orange-300 to-amber-400 dark:bg-orange-900 opacity-15 blur-3xl animate-pulse"></div>

      <div className="relative max-w-6xl mx-auto py-8 px-4 space-y-8">
        {/* Profile Header */}
        <GlassmorphicCard className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white via-white to-slate-50 dark:bg-slate-950">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              <div className="relative">
                <Avatar className="w-24 h-24 ring-4 ring-primary/20 shadow-lg">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-2xl font-bold">
                    {userData.organisation_name
                      ? userData.organisation_name[0].toUpperCase()
                      : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-white dark:border-slate-900"></div>
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    {userData.organisation_name || "Unnamed Organization"}
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 text-lg">
                    {userData.email}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-full text-blue-700 dark:text-blue-300">
                    <Globe className="h-4 w-4" />
                    <span>
                      {userData.industry || "No industry"} –{" "}
                      {userData.sub_industry || "No sub-industry"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-full text-emerald-700 dark:text-emerald-300">
                    <span>📍 {userData.location || "Location not specified"}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/30 rounded-full text-purple-700 dark:text-purple-300">
                    <span>👥 {userData.employee_count || "N/A"} employees</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    setIsUpdateFormOpen(true)
                    setIsMandatoryUpdate(false)
                  }}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200 gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Update Profile
                </Button>
                <Button
                  onClick={logout}
                  variant="destructive"
                  className="shadow-lg hover:shadow-xl transition-all duration-200 gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </CardContent>
        </GlassmorphicCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Notification Preferences */}
          <GlassmorphicCard className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:bg-slate-950">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5 text-blue-500" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">Email Notifications</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                      Receive updates via email
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs.email}
                  onCheckedChange={(v) =>
                    setNotifPrefs((p) => ({ ...p, email: v }))
                  }
                />
              </div>

              {/* SMS */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">SMS Notifications</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                      Receive alerts via SMS
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs.sms}
                  onCheckedChange={(v) =>
                    setNotifPrefs((p) => ({ ...p, sms: v }))
                  }
                />
              </div>
            </CardContent>
          </GlassmorphicCard>

          {/* Security */}
          <GlassmorphicCard className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:bg-slate-950">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-5 w-5 text-red-500" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <h4 className="font-medium mb-2">Password</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Keep your account secure with a strong password
                </p>
                <Button
                  onClick={() => setIsPasswordDialogOpen(true)}
                  variant="outline"
                  className="w-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </div>
            </CardContent>
          </GlassmorphicCard>

          {/* Quick Access */}
          <GlassmorphicCard className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:bg-slate-950">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Quick Access</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  asChild
                  className="justify-start h-12 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
                >
                  <a href="/digital-twin" className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      🔗
                    </div>
                    Digital Twin
                  </a>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="justify-start h-12 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
                >
                  <a href="/simulation" className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      ⚡
                    </div>
                    Simulations
                  </a>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="justify-start h-12 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
                >
                  <a href="/strategy" className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      📊
                    </div>
                    Strategies
                  </a>
                </Button>
              </div>
            </CardContent>
          </GlassmorphicCard>
        </div>

        {/* Profile Update Form Modal */}
        <UpdateProfileForm
          isOpen={isUpdateFormOpen}
          onClose={() => {
            setIsUpdateFormOpen(false)
            setIsMandatoryUpdate(false)
          }}
          currentProfile={userData}
          mandatory={isMandatoryUpdate}
        />

        {/* Password Change Dialog */}
        <ChangePasswordDialog
          isOpen={isPasswordDialogOpen}
          onClose={() => setIsPasswordDialogOpen(false)}
        />
      </div>
    </div>
  )
}
