"use client"

import { AlertTriangle, Clock, Gauge, TrendingUp, Activity, ArrowUpRight, ArrowDownRight, ChevronRight, Cpu, Radio, Layers } from "lucide-react"
import Link from "next/link"
import { NotificationFeed } from "@/components/dashboard/notification-feed"

export default function DashboardPage() {
  return (
    <div className="relative min-h-full flex-1 bg-white dark:bg-black overflow-hidden text-black dark:text-white">
      <div className="flex h-full">

        {/* Left Sidebar — System Status */}
        <aside className="w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
          <div className="p-5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold mb-4">System Status</p>
            <div className="space-y-4">
              <StatRow icon={<Gauge className="w-4 h-4" />} label="Exposure Index" value="—" note="No data" />
              <StatRow icon={<Clock className="w-4 h-4" />} label="Mean Recovery" value="—" note="No data" />
              <StatRow icon={<AlertTriangle className="w-4 h-4" />} label="Active Faults" value="0" note="All clear" />
              <StatRow icon={<TrendingUp className="w-4 h-4" />} label="Net Yield Gain" value="—" note="Pending" />
            </div>
          </div>

          <div className="p-5 flex-1">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold mb-3">Node Health</p>
            <div className="space-y-2">
              {["Origin Nodes", "Transit Hubs", "Distribution", "End Points"].map((label, i) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-400 rounded">–</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top bar */}
          <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
            <div>
              <h1 className="text-base font-semibold tracking-tight text-black dark:text-white">Control Center</h1>
              <p className="text-xs text-slate-400 mt-0.5">Operational intelligence overview</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-slate-400">Live</span>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-4 divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <KpiBlock label="Node Exposure" value="0%" delta={null} />
            <KpiBlock label="Recovery Window" value="—" delta={null} />
            <KpiBlock label="Fault Signals" value="0" delta={null} positive />
            <KpiBlock label="Estimated Savings" value="$0" delta={null} />
          </div>

          {/* Feed area */}
          <div className="flex-1 overflow-y-auto">
            <NotificationFeed />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatRow({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-slate-400 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500 truncate">{label}</p>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-black dark:text-white">{value}</span>
          <span className="text-[10px] text-slate-400">{note}</span>
        </div>
      </div>
    </div>
  )
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 px-2 py-1.5 rounded text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-black dark:hover:text-white transition-colors group">
      <span className="text-slate-400 group-hover:text-black dark:group-hover:text-white transition-colors">{icon}</span>
      {label}
      <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  )
}

function KpiBlock({ label, value, delta, positive }: { label: string; value: string; delta: string | null; positive?: boolean }) {
  return (
    <div className="px-5 py-4">
      <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <p className="text-xl font-bold text-black dark:text-white">{value}</p>
      {delta && (
        <div className="flex items-center gap-1 mt-1">
          {positive ? <ArrowDownRight className="w-3 h-3 text-green-500" /> : <ArrowUpRight className="w-3 h-3 text-red-500" />}
          <span className={`text-[11px] ${positive ? 'text-green-600' : 'text-red-500'}`}>{delta}</span>
        </div>
      )}
    </div>
  )
}
