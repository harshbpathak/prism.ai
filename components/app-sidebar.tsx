"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Home,
  LineChart,
  Network, 
  Settings,
  ShieldAlert,
  Target,
  Truck,
  User,
  Sparkles,
  BarChart2,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { ThemeToggle, SidebarThemeToggle } from "@/components/theme"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function AppSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { state, open, setOpen } = useSidebar()
  
  // Check if we should auto-collapse based on URL params
  const shouldAutoCollapse = pathname === "/digital-twin" && searchParams.get("twinId")
  
  // Use the sidebar context state instead of local state
  const isCollapsed = state === "collapsed"

  // Auto-collapse when twinId is present in digital-twin page
  useEffect(() => {
    if (shouldAutoCollapse) {
      setOpen(false)
    }
  }, [shouldAutoCollapse, setOpen])

  const toggleSidebar = () => {
    setOpen(!open)
  }



  // Navigation items configuration
  const navigationItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard", isActive: pathname === "/dashboard" },
    { href: "/digital-twin", icon: Network, label: "Digital Twin", isActive: pathname === "/digital-twin" },
    { href: "/simulation", icon: LineChart, label: "Simulation", isActive: pathname === "/simulation" },

    { href: "/strategy", icon: Settings, label: "Strategy", isActive: pathname === "/strategy" },
  ]

  const footerItems = [
    { href: "/profile", icon: User, label: "Profile", isActive: pathname === "/profile" },
  ]

  if (isCollapsed) {
    // Collapsed state - icon-only layout
    return (
      <TooltipProvider>
        <div className="w-16 h-screen flex flex-col bg-gradient-to-b from-background/95 via-background/90 to-background/95 backdrop-blur-xl border-r shadow-xl">
          {/* Collapsed Header */}
          <div className="h-16 border-b border-border/50 bg-gradient-to-r from-primary/5 via-primary/3 to-primary/5 flex items-center justify-center relative">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl blur-sm"></div>
              <div className="relative bg-gradient-to-br from-primary to-primary/80 p-2 rounded-xl shadow-lg">
                <ShieldAlert className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
          </div>

          {/* Collapsed Navigation */}
          <div className="flex-1 py-4 flex flex-col items-center space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                        item.isActive
                          ? "bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 shadow-sm"
                          : "hover:bg-gradient-to-r hover:from-muted/80 hover:to-muted/40 hover:shadow-sm hover:scale-105"
                      )}
                    >
                      <Icon 
                        className={cn(
                          "h-4 w-4 transition-colors",
                          item.isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )} 
                      />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>

          {/* Theme Toggle - Above Footer */}
          <div className="px-4 pb-2">
            <SidebarThemeToggle variant="collapsed" />
          </div>

          {/* Collapsed Footer */}
          <div className="border-t border-border/50 bg-gradient-to-r from-muted/20 via-muted/10 to-muted/20 p-4 space-y-2">
            {footerItems.map((item) => {
              const Icon = item.icon
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                        item.isActive
                          ? "bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 shadow-sm"
                          : "hover:bg-gradient-to-r hover:from-muted/80 hover:to-muted/40 hover:shadow-sm hover:scale-105"
                      )}
                    >
                      <Icon 
                        className={cn(
                          "h-4 w-4 transition-colors",
                          item.isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )} 
                      />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </div>
      </TooltipProvider>
    )
  }

  // Expanded state - full layout
  return (
    <Sidebar 
      className={cn(
        "border-r-0 shadow-xl w-64",
        "bg-gradient-to-b from-background/95 via-background/90 to-background/95 backdrop-blur-xl"
      )}
    >
      <SidebarHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 via-primary/3 to-primary/5">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl blur-sm"></div>
              <div className="relative bg-gradient-to-br from-primary to-primary/80 p-2 rounded-xl shadow-lg">
                <ShieldAlert className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <div className="font-bold text-xl">
              <Link href="/" className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent hover:from-primary hover:to-primary/80 transition-all duration-200">
                PRISM
              </Link>
            </div>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={item.isActive}
                      className={cn(
                        "group relative mx-2 rounded-xl transition-all duration-200",
                        item.isActive
                          ? "bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 shadow-sm text-primary" 
                          : "hover:bg-gradient-to-r hover:from-muted/80 hover:to-muted/40 hover:shadow-sm hover:scale-[1.02]"
                      )}
                    >
                      <Link href={item.href}>
                        <Icon className={cn("h-4 w-4", item.isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-border/50 bg-gradient-to-r from-muted/20 via-muted/10 to-muted/20 p-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {footerItems.map((item) => {
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={item.isActive}
                      className={cn(
                        "group relative mx-2 rounded-xl transition-all duration-200",
                        item.isActive
                          ? "bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 shadow-sm text-primary" 
                          : "hover:bg-gradient-to-r hover:from-muted/80 hover:to-muted/40 hover:shadow-sm hover:scale-[1.02]"
                      )}
                    >
                      <Link href={item.href}>
                        <Icon className={cn("h-4 w-4", item.isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="p-4 flex items-center justify-between bg-gradient-to-r from-background/60 to-background/40 rounded-xl mx-2 mt-2 border border-border/30 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-primary" />
            <div className="text-xs font-medium text-muted-foreground">v1.0.0</div>
          </div>
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}