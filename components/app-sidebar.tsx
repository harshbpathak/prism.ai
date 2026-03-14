"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Home,
  LineChart,
  Network,
  Settings,
  ShieldAlert,
  User,
} from "lucide-react"

import { ThemeToggle } from "@/components/theme"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { NotificationDropdown } from "@/components/layout/notification-dropdown"

export function AppSidebar() {
  const pathname = usePathname()

  const navigationItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard", isActive: pathname === "/dashboard" },
    { href: "/digital-twin", icon: Network, label: "Digital Twin", isActive: pathname === "/digital-twin" },
    { href: "/simulation", icon: LineChart, label: "Simulation", isActive: pathname === "/simulation" },
  ]

  const footerItems = [
    { href: "/profile", icon: User, label: "Profile", isActive: pathname === "/profile" },
  ]

  return (
    <div className="w-full h-16 border-b border-border/50 bg-background/95 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 shrink-0 z-[100]">
      {/* Left: Logo + Nav links */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-xl blur-sm group-hover:blur-md transition-all" />
            <div className="relative bg-primary p-1.5 rounded-xl shadow-sm">
              <ShieldAlert className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
          <span className="font-bold text-base hidden sm:block tracking-tight">
            PRISM
          </span>
        </Link>

        <div className="h-5 w-px bg-border hidden sm:block" />

        <nav className="flex items-center gap-0.5 sm:gap-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <TooltipProvider key={item.href} delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                        item.isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="hidden md:block">{item.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          })}
        </nav>
      </div>

      {/* Right: Notification + Theme + Profile */}
      <div className="flex items-center gap-1 sm:gap-2">
        <NotificationDropdown />
        <ThemeToggle />
        {footerItems.map((item) => {
          const Icon = item.icon
          return (
            <TooltipProvider key={item.href} delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                      item.isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:block">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </div>
    </div>
  )
}