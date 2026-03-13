"use client"

import { AlertTriangle, Clock, Gauge, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NotificationFeed } from "@/components/dashboard/notification-feed"

export default function DashboardPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-cyan-100 dark:from-gray-900 dark:to-slate-900 overflow-x-hidden">
      {/* Enhanced background blurred elements for light mode */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 dark:bg-purple-900 opacity-30 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 dark:bg-blue-900 opacity-25 blur-3xl"></div>
      <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-gradient-to-br from-emerald-300 to-teal-400 dark:bg-emerald-900 opacity-20 blur-2xl"></div>
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full bg-gradient-to-br from-orange-300 to-amber-400 dark:bg-orange-900 opacity-15 blur-3xl animate-pulse"></div>
      
      <div className="relative flex flex-col gap-6 p-6 md:gap-8 md:p-8 max-w-full">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-300">Welcome to your Supply Chain Resilience Planner dashboard.</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="grid flex-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <GlassmorphicKpiCard
              title="Risk Score"
              value="0%"
              trend="0%"
              trendDirection="down"
              icon={<Gauge className="h-5 w-5" />}
              description="Overall supply chain risk"
                          />
            <GlassmorphicKpiCard
              title="Recovery Time"
              value="0 days"
              trend="0"
              trendDirection="down"
              icon={<Clock className="h-5 w-5" />}
              description="Average time to recover"
            />
            <GlassmorphicKpiCard
              title="Active Disruptions"
              value="0"
              trend="0"
              trendDirection="down"
              icon={<AlertTriangle className="h-5 w-5" />}
              description="Current disruptions"
            />
            <GlassmorphicKpiCard
              title="ROI Estimate"
              value="$0"
              trend="0%"
              trendDirection="down"
              icon={<TrendingUp className="h-5 w-5" />}
              description="Estimated annual savings"
            />
          </div>
        </div>

        <div className="w-full">
          {/* Notification Feed with integrated tabs */}
          <GlassmorphicCard className="border-0 min-h-[600px]">
            <NotificationFeed />
          </GlassmorphicCard>
        </div>
      </div>
    </div>
  )
}

// Glassmorphic Card Component
function GlassmorphicCard({ children, className = "", ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) {
  return (
    <Card 
      className={`border border-white/30 dark:border-slate-700/10 bg-white/70 dark:bg-slate-900/5 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20 rounded-xl ${className}`} 
      {...props}
    >
      {children}
    </Card>
  )
}

// Glassmorphic KPI Card Component
  function GlassmorphicKpiCard({ title, value, trend, trendDirection, icon, description }: {
  title: string;
  value: string;
  trend: string;
  trendDirection: "up" | "down";
  icon: React.ReactNode;
  description: string;
}) {
  return (
      <div className="block group">
      <GlassmorphicCard className="h-full overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:bg-white/80 dark:hover:bg-slate-900/10 border-gradient-to-r from-purple-200/50 to-blue-200/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-400">{title}</CardTitle>
            <span className="rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:bg-gradient-to-br dark:from-slate-700 dark:to-slate-600 p-1.5 backdrop-blur-sm shadow-md text-slate-600 dark:text-slate-200">{icon}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-100 bg-clip-text text-transparent">{value}</div>
          <div className="mt-1 flex items-center text-xs">
            <span className={trendDirection === "up" ? "text-red-600 dark:text-red-400 font-semibold" : "text-emerald-600 dark:text-green-400 font-semibold"}>
              {trend}
            </span>
            <span className="ml-2 text-slate-700 dark:text-slate-400">{description}</span>
          </div>
        </CardContent>
      </GlassmorphicCard>
    </div>
  )
}

