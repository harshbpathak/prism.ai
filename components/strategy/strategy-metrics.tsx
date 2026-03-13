"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  DollarSign,
  Target,
  Users,
  AlertTriangle,
  CheckCircle,
  Zap,
} from "lucide-react"

interface StrategyMetricsProps {
  strategy: any
}

export function StrategyMetrics({ strategy }: StrategyMetricsProps) {
  const performanceMetrics = [
    { label: "Strategy Effectiveness", value: 87, change: "+12%", trend: "up", color: "text-green-400" },
    { label: "Resource Utilization", value: 73, change: "+8%", trend: "up", color: "text-blue-400" },
    { label: "Risk Mitigation", value: 91, change: "+15%", trend: "up", color: "text-purple-400" },
    { label: "Cost Efficiency", value: 68, change: "-3%", trend: "down", color: "text-orange-400" },
  ]

  const nodePerformance = [
    { name: "Steel Supplier", recovery: 100, efficiency: 95, status: "optimal" },
    { name: "Parts Manufacturer", recovery: 75, efficiency: 68, status: "improving" },
    { name: "Logistics Hub", recovery: 35, efficiency: 42, status: "critical" },
    { name: "Assembly Plant", recovery: 90, efficiency: 85, status: "good" },
    { name: "Distribution Center", recovery: 100, efficiency: 98, status: "optimal" },
    { name: "Retail Network", recovery: 85, efficiency: 78, status: "good" },
  ]

  const timelineData = [
    { phase: "Week 1", planned: 25, actual: 28, efficiency: 112 },
    { phase: "Week 2", planned: 50, actual: 45, efficiency: 90 },
    { phase: "Week 3", planned: 75, actual: 65, efficiency: 87 },
    { phase: "Week 4", planned: 100, actual: 85, efficiency: 85 },
  ]

  const costBreakdown = [
    { category: "Emergency Resources", amount: 1200000, percentage: 32, color: "bg-red-500" },
    { category: "Alternative Suppliers", amount: 800000, percentage: 21, color: "bg-blue-500" },
    { category: "Logistics Rerouting", amount: 600000, percentage: 16, color: "bg-green-500" },
    { category: "Technology & Monitoring", amount: 450000, percentage: 12, color: "bg-purple-500" },
    { category: "Personnel & Training", amount: 350000, percentage: 9, color: "bg-orange-500" },
    { category: "Contingency Buffer", amount: 350000, percentage: 9, color: "bg-yellow-500" },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "optimal":
        return "bg-green-500/20 text-green-600 border-green-500/30 dark:text-green-400"
      case "good":
        return "bg-blue-500/20 text-blue-600 border-blue-500/30 dark:text-blue-400"
      case "improving":
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30 dark:text-yellow-400"
      case "critical":
        return "bg-red-500/20 text-red-600 border-red-500/30 dark:text-red-400"
      default:
        return "bg-gray-500/20 text-gray-600 border-gray-500/30 dark:text-gray-400"
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-4 gap-6">
        {performanceMetrics.map((metric, index) => (
          <Card key={index} className="bg-white/80 dark:bg-slate-800/60 border-slate-200/50 dark:border-slate-700/50 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50">
                  {index === 0 && <Target className="w-5 h-5 text-green-500 dark:text-green-400" />}
                  {index === 1 && <BarChart3 className="w-5 h-5 text-blue-500 dark:text-blue-400" />}
                  {index === 2 && <AlertTriangle className="w-5 h-5 text-purple-500 dark:text-purple-400" />}
                  {index === 3 && <DollarSign className="w-5 h-5 text-orange-500 dark:text-orange-400" />}
                </div>
                <div className={`flex items-center gap-1 text-sm ${metric.color}`}>
                  {metric.trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{metric.change}</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-slate-600 dark:text-slate-400 text-sm">{metric.label}</h3>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{metric.value}%</div>
                <Progress value={metric.value} className="h-2 bg-slate-200 dark:bg-slate-700" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Node Performance Matrix */}
        <Card className="bg-white/80 dark:bg-slate-800/60 border-slate-200/50 dark:border-slate-700/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              Node Performance Matrix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nodePerformance.map((node, index) => (
                <div key={index} className="p-4 rounded-lg bg-slate-50/80 dark:bg-slate-700/30 border border-slate-200/50 dark:border-slate-600/30 hover:bg-slate-100/80 dark:hover:bg-slate-700/50 transition-colors duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-900 dark:text-white font-medium">{node.name}</span>
                    <Badge className={getStatusColor(node.status)}>{node.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 dark:text-slate-400">Recovery</span>
                        <span className="text-slate-900 dark:text-white">{node.recovery}%</span>
                      </div>
                      <Progress value={node.recovery} className="h-1.5 bg-slate-200 dark:bg-slate-600" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 dark:text-slate-400">Efficiency</span>
                        <span className="text-slate-900 dark:text-white">{node.efficiency}%</span>
                      </div>
                      <Progress value={node.efficiency} className="h-1.5 bg-slate-200 dark:bg-slate-600" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card className="bg-white/80 dark:bg-slate-800/60 border-slate-200/50 dark:border-slate-700/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-green-500 dark:text-green-400" />
              Cost Breakdown Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {costBreakdown.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-900 dark:text-white text-sm">{item.category}</span>
                      <span className="text-slate-600 dark:text-slate-400 text-sm">{item.percentage}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Progress value={item.percentage} className="h-1.5 bg-slate-200 dark:bg-slate-700 flex-1 mr-3" />
                      <span className="text-slate-900 dark:text-white font-medium text-sm">${(item.amount / 1000000).toFixed(1)}M</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Total Strategy Cost</span>
                <span className="text-slate-900 dark:text-white font-bold text-lg">$3.75M</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Performance */}
   

   
    </div>
  )
}
