"use client"

import { AlertTriangle, Clock, Gauge, TrendingUp, ArrowUpRight, ArrowDownRight, ChevronRight, Layers, RefreshCw } from "lucide-react"
import Link from "next/link"
import { NotificationFeed } from "@/components/dashboard/notification-feed"
import { useDashboardMetrics } from "@/components/dashboard/useDashboardMetrics"

export default function DashboardPage() {
  const m = useDashboardMetrics()

  return (
    <div className="relative min-h-full flex-1 bg-white dark:bg-black overflow-hidden text-black dark:text-white">
      <div className="flex h-full">

        {/* Left Sidebar — System Status */}
        <aside className="w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold">System Status</p>
              {m.isLoading && (
                <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" />
              )}
            </div>
            <div className="space-y-4">
              <StatRow
                icon={<Gauge className="w-4 h-4" />}
                label="Exposure Index"
                value={m.isLoading ? "…" : m.exposureIndex}
                note={m.isLoading ? "" : m.exposureIndex === "—" ? "No data" : "avg risk score"}
              />
              <StatRow
                icon={<Clock className="w-4 h-4" />}
                label="Mean Recovery"
                value={m.isLoading ? "…" : m.meanRecovery}
                note={m.isLoading ? "" : m.meanRecovery === "—" ? "No data" : "lead time avg"}
              />
              <StatRow
                icon={<AlertTriangle className="w-4 h-4" />}
                label="Active Faults"
                value={m.isLoading ? "…" : String(m.activeFaults)}
                note={m.activeFaults === 0 ? "All clear" : `risk > 75`}
              />
              <StatRow
                icon={<TrendingUp className="w-4 h-4" />}
                label="Supply Chains"
                value={m.isLoading ? "…" : String(m.totalSupplyChains)}
                note={m.isLoading ? "" : `${m.totalNodes} nodes · ${m.totalEdges} edges`}
              />
            </div>
          </div>

          <div className="p-5 flex-1">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold mb-3">Node Health</p>
            <div className="space-y-2">
              <NodeHealthRow label="Origin / Suppliers" count={m.nodeHealth.originNodes} loading={m.isLoading} />
              <NodeHealthRow label="Transit Hubs" count={m.nodeHealth.transitHubs} loading={m.isLoading} />
              <NodeHealthRow label="Distribution" count={m.nodeHealth.distribution} loading={m.isLoading} />
              <NodeHealthRow label="End Points" count={m.nodeHealth.endPoints} loading={m.isLoading} />
            </div>

            {m.error && (
              <p className="mt-4 text-[10px] text-red-400 leading-snug">⚠️ {m.error}</p>
            )}
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
              <span className={`w-2 h-2 rounded-full ${m.isLoading ? "bg-yellow-400 animate-pulse" : "bg-green-500 animate-pulse"}`} />
              <span className="text-xs text-slate-400">{m.isLoading ? "Loading…" : "Live"}</span>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-4 divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <KpiBlock
              label="Node Exposure"
              value={m.isLoading ? "…" : m.nodeExposurePct}
              sublabel={m.totalNodes > 0 ? `${m.totalNodes} nodes total` : undefined}
              alert={!m.isLoading && m.nodeExposurePct !== "0%" && m.nodeExposurePct !== "—"}
            />
            <KpiBlock
              label="Recovery Window"
              value={m.isLoading ? "…" : m.recoveryWindow}
              sublabel={m.isLoading ? undefined : m.recoveryWindow === "—" ? "No lead-time data" : "estimated range"}
            />
            <KpiBlock
              label="Fault Signals"
              value={m.isLoading ? "…" : String(m.activeFaults)}
              sublabel={m.activeFaults === 0 ? "All clear" : "nodes risk > 75"}
              positive={m.activeFaults === 0}
            />
            <KpiBlock
              label="Supply Chains"
              value={m.isLoading ? "…" : String(m.totalSupplyChains)}
              sublabel={m.isLoading ? undefined : `${m.totalEdges} connections`}
            />
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

/* ─── Sub-components ──────────────────────────────────────────────── */

function StatRow({ icon, label, value, note }: {
  icon: React.ReactNode
  label: string
  value: string
  note: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-slate-400 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500 truncate">{label}</p>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-black dark:text-white">{value}</span>
          {note && <span className="text-[10px] text-slate-400">{note}</span>}
        </div>
      </div>
    </div>
  )
}

function NodeHealthRow({ label, count, loading }: { label: string; count: number; loading: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      {loading ? (
        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-400 rounded">…</span>
      ) : (
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium
          ${count > 0
            ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
            : "bg-slate-100 dark:bg-slate-900 text-slate-400"
          }`}>
          {count > 0 ? count : "–"}
        </span>
      )}
    </div>
  )
}

function KpiBlock({ label, value, sublabel, alert, positive }: {
  label: string
  value: string
  sublabel?: string
  alert?: boolean
  positive?: boolean
}) {
  return (
    <div className="px-5 py-4">
      <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${alert ? "text-red-500" : positive ? "text-green-600 dark:text-green-400" : "text-black dark:text-white"}`}>
        {value}
      </p>
      {sublabel && (
        <p className="text-[11px] text-slate-400 mt-0.5">{sublabel}</p>
      )}
    </div>
  )
}
