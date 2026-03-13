"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users, 
  Target, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Zap,
  Shield,
  DollarSign,
  BarChart3,
  GitBranch
} from "lucide-react"

interface Node {
  id: number
  name: string
  riskLevel: string
  confidence: number
  status: string
  assignedTeam: string
  tasks: Array<{
    id: number
    title: string
    status: string
    deadline: string
    priority: string
    assignee: string
    blocker?: string
  }>
}

interface Strategy {
  id: number
  name: string
  progress: number
  totalTasks: number
  completedTasks: number
  cost: string
  roi: string
  riskReduction: string
}

interface LiveExecutionStatsProps {
  nodes: Node[]
  strategy: Strategy
  compact?: boolean
}

export function LiveExecutionStats({ nodes, strategy, compact }: LiveExecutionStatsProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Simulate loading
    const loadingTimer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => {
      clearInterval(timer)
      clearTimeout(loadingTimer)
    }
  }, [])

  const getOverallProgress = () => {
    if (!nodes || nodes.length === 0) return 0
    
    const totalTasks = nodes.reduce((sum, node) => sum + (node.tasks?.length || 0), 0)
    const completedTasks = nodes.reduce((sum, node) => 
      sum + (node.tasks?.filter(task => task.status === "Done").length || 0), 0
    )
    
    if (totalTasks === 0) return 0
    return Math.round((completedTasks / totalTasks) * 100)
  }

  const getBottleneckNodes = () => {
    if (!nodes || nodes.length === 0) return []
    
    return nodes.filter(node => {
      if (!node.tasks || node.tasks.length === 0) return false
      const blockedTasks = node.tasks.filter(task => task.status === "Blocked").length
      const totalTasks = node.tasks.length
      return (blockedTasks / totalTasks) > 0.3 // More than 30% blocked
    })
  }

  const getCriticalTasks = () => {
    if (!nodes || nodes.length === 0) return []
    
    return nodes.flatMap(node => 
      node.tasks?.filter(task => task.priority === "critical") || []
    )
  }

  const getTeamWorkload = () => {
    if (!nodes || nodes.length === 0) return {}
    
    const teamWorkload: { [key: string]: number } = {}
    nodes.forEach(node => {
      if (node.assignedTeam && node.tasks) {
        teamWorkload[node.assignedTeam] = (teamWorkload[node.assignedTeam] || 0) + node.tasks.length
      }
    })
    return teamWorkload
  }

  const getRiskDistribution = () => {
    if (!nodes || nodes.length === 0) return { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
    
    const distribution = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
    nodes.forEach(node => {
      if (node.riskLevel && node.riskLevel in distribution) {
        distribution[node.riskLevel as keyof typeof distribution]++
      }
    })
    return distribution
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-slate-800/60 border-slate-700/50 animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-slate-700 rounded mb-2" />
                <div className="h-8 bg-slate-700 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Live Execution Analytics</h2>
          <p className="text-slate-400">Real-time insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <Activity className="w-4 h-4 text-green-400 animate-pulse" />
          <span>Live Data</span>
          <span>•</span>
          <span>Last updated: {formatTime(currentTime)}</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className={`grid ${compact ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'} gap-6`}>
        {/* Overall Progress */}
        <Card className="bg-white border-gray-200 shadow-md dark:bg-slate-800/60 dark:border-slate-700/50 hover:bg-slate-800/80 transition-all duration-300 hover:shadow-lg hover:shadow-slate-500/10 transform hover:-translate-y-1 min-w-0">
          <CardContent className={`p-6 ${compact ? 'flex flex-col items-center gap-y-2' : ''}`}> 
            <div className={`flex ${compact ? 'flex-col items-center gap-y-2' : 'items-center gap-4'}`}> 
              <div className={`bg-blue-500/20 rounded-xl ${compact ? 'mb-1 p-2 self-center' : 'p-3'}`}> 
                <Target className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} text-blue-400`} />
              </div>
              <div className={`${compact ? 'flex flex-col items-center' : ''} min-w-0`}>
                <p className={`font-medium text-gray-700 dark:text-slate-300 ${compact ? 'text-xs' : 'text-sm'} text-center truncate`}>Overall Progress</p>
                <p className={`font-bold text-black dark:text-white ${compact ? 'text-base' : 'text-2xl'} text-center truncate`}>{getOverallProgress()}%</p>
                <div className={`flex items-center gap-1 mt-1 ${compact ? 'justify-center' : ''}`}>
                  <TrendingUp className={`${compact ? 'w-3 h-3' : 'w-3 h-3'} text-green-400`} />
                  <span className={`text-green-400 ${compact ? 'text-xs' : 'text-xs'}`}>+2.3%</span>
                </div>
              </div>
            </div>
            <Progress value={getOverallProgress()} className="mt-4 h-2 bg-gray-200 dark:bg-slate-700" />
          </CardContent>
        </Card>
        {/* Completed Tasks */}
        <Card className="bg-white border-gray-200 shadow-md dark:bg-slate-800/60 dark:border-slate-700/50 hover:bg-slate-800/80 transition-all duration-300 hover:shadow-lg hover:shadow-slate-500/10 transform hover:-translate-y-1 min-w-0">
          <CardContent className={`p-6 ${compact ? 'flex flex-col items-center gap-y-2' : ''}`}> 
            <div className={`flex ${compact ? 'flex-col items-center gap-y-2' : 'items-center gap-4'}`}> 
              <div className={`bg-green-500/20 rounded-xl ${compact ? 'mb-1 p-2 self-center' : 'p-3'}`}> 
                <CheckCircle className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} text-green-400`} />
              </div>

              <div>
                <p className="text-sm text-slate-400 font-medium">Completed Tasks</p>
                <p className="text-2xl font-bold text-white">{strategy?.completedTasks || 0}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-green-400">+3 today</span>
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-400">
              {strategy?.totalTasks && strategy.totalTasks > 0 ? 
                Math.round(((strategy.completedTasks || 0) / strategy.totalTasks) * 100) : 0}% of total
            </div>

          </CardContent>
        </Card>
        {/* Bottlenecks */}
        <Card className="bg-white border-gray-200 shadow-md dark:bg-slate-800/60 dark:border-slate-700/50 hover:bg-slate-800/80 transition-all duration-300 hover:shadow-lg hover:shadow-slate-500/10 transform hover:-translate-y-1 min-w-0">
          <CardContent className={`p-6 ${compact ? 'flex flex-col items-center gap-y-2' : ''}`}> 
            <div className={`flex ${compact ? 'flex-col items-center gap-y-2' : 'items-center gap-4'}`}> 
              <div className={`bg-red-500/20 rounded-xl ${compact ? 'mb-1 p-2 self-center' : 'p-3'}`}> 
                <AlertTriangle className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} text-red-400`} />
              </div>
              <div className={`${compact ? 'flex flex-col items-center' : ''} min-w-0`}>
                <p className={`font-medium text-gray-700 dark:text-slate-300 ${compact ? 'text-xs' : 'text-sm'} text-center truncate`}>Bottlenecks</p>
                <p className={`font-bold text-black dark:text-white ${compact ? 'text-base' : 'text-2xl'} text-center truncate`}>{getBottleneckNodes().length}</p>
                <div className={`flex items-center gap-1 mt-1 ${compact ? 'justify-center' : ''}`}>
                  <TrendingDown className={`${compact ? 'w-3 h-3' : 'w-3 h-3'} text-red-400`} />
                  <span className={`text-red-400 ${compact ? 'text-xs' : 'text-xs'}`}>-1 resolved</span>
                </div>
              </div>
            </div>
            <div className={`mt-4 text-gray-600 dark:text-slate-400 ${compact ? 'text-xs text-center truncate' : 'text-xs'}`}>
              {compact
                ? getBottleneckNodes().map(node =>
                    node.name === 'Port of Los Angeles'
                      ? <span key={node.name} className="block max-w-[90px] break-words mx-auto">Port of<br/>Los Angeles</span>
                      : <span key={node.name} className="block max-w-[90px] break-words mx-auto">{node.name}</span>
                  )
                : getBottleneckNodes().map(node => node.name).join(", ")
              }
            </div>
          </CardContent>
        </Card>
        {/* Critical Tasks */}
        <Card className="bg-white border-gray-200 shadow-md dark:bg-slate-800/60 dark:border-slate-700/50 hover:bg-slate-800/80 transition-all duration-300 hover:shadow-lg hover:shadow-slate-500/10 transform hover:-translate-y-1 min-w-0">
          <CardContent className={`p-6 ${compact ? 'flex flex-col items-center gap-y-2' : ''}`}> 
            <div className={`flex ${compact ? 'flex-col items-center gap-y-2' : 'items-center gap-4'}`}> 
              <div className={`bg-purple-500/20 rounded-xl ${compact ? 'mb-1 p-2 self-center' : 'p-3'}`}> 
                <Zap className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} text-purple-400`} />
              </div>
              <div className={`${compact ? 'flex flex-col items-center' : ''} min-w-0`}>
                <p className={`font-medium text-gray-700 dark:text-slate-300 ${compact ? 'text-xs' : 'text-sm'} text-center truncate`}>Critical Tasks</p>
                <p className={`font-bold text-black dark:text-white ${compact ? 'text-base' : 'text-2xl'} text-center truncate`}>{getCriticalTasks().length}</p>
                <div className={`flex items-center gap-1 mt-1 ${compact ? 'justify-center' : ''}`}>
                  <Clock className={`${compact ? 'w-3 h-3' : 'w-3 h-3'} text-yellow-400`} />
                  <span className={`text-yellow-400 ${compact ? 'text-xs' : 'text-xs'}`}>5 due today</span>
                </div>
              </div>
            </div>
            <div className={`mt-4 text-gray-600 dark:text-slate-400 ${compact ? 'text-xs text-center truncate' : 'text-xs'}`}>{getCriticalTasks().filter(task => task.status === "Done").length} completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Workload */}
        <Card className="bg-white border-gray-200 shadow-md dark:bg-slate-800/60 dark:border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-black dark:text-white">
              <Users className="w-5 h-5 text-blue-400" />
              Team Workload Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(getTeamWorkload()).map(([team, workload], index) => (
                <div key={team} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{team}</span>
                    <span className="text-sm text-gray-600 dark:text-slate-400">{workload} tasks</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${(() => {
                          const workloadValues = Object.values(getTeamWorkload())
                          const maxWorkload = workloadValues.length > 0 ? Math.max(...workloadValues) : 1
                          return (workload / maxWorkload) * 100
                        })()}%`,
                        animationDelay: `${index * 100}ms`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card className="bg-white border-gray-200 shadow-md dark:bg-slate-800/60 dark:border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-black dark:text-white">
              <Shield className="w-5 h-5 text-yellow-400" />
              Risk Level Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(getRiskDistribution()).map(([risk, count], index) => (
                <div key={risk} className="flex items-center justify-between p-3 bg-gray-200 dark:bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      risk === "CRITICAL" ? "bg-red-400" :
                      risk === "HIGH" ? "bg-orange-400" :
                      risk === "MEDIUM" ? "bg-yellow-400" : "bg-green-400"
                    }`} />
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{risk}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {compact ? (
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-600 dark:text-slate-400 font-bold">{count}</span>
                        <span className="text-xs text-gray-600 dark:text-slate-400">nodes</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-600 dark:text-slate-400">{count} nodes</span>
                    )}
                    <Badge className={`${compact ? 'text-xs' : 'text-xs'} ${
                      risk === "CRITICAL" ? "bg-red-500/20 text-red-400" :
                      risk === "HIGH" ? "bg-orange-500/20 text-orange-400" :
                      risk === "MEDIUM" ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"
                    }`}>
                      {nodes && nodes.length > 0 ? Math.round((count / nodes.length) * 100) : 0}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="bg-white border-gray-200 shadow-md dark:bg-slate-800/60 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-black dark:text-white">
            <BarChart3 className="w-5 h-5 text-green-400" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="text-center p-4 bg-slate-700/30 rounded-xl">
              <div className="text-3xl font-bold text-white mb-2">{strategy?.roi || "N/A"}</div>
              <div className="text-sm text-slate-400 font-medium">Projected ROI</div>
              <div className="flex items-center justify-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-xs text-green-400">+2.1% vs target</span>
              </div>
            </div>
            

            <div className="text-center p-4 bg-slate-700/30 rounded-xl">
              <div className="text-3xl font-bold text-white mb-2">{strategy?.riskReduction || "N/A"}</div>
              <div className="text-sm text-slate-400 font-medium">Risk Reduction</div>

              <div className="flex items-center justify-center gap-1 mt-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-blue-400">On track</span>
              </div>
            </div>
            

            <div className="text-center p-4 bg-slate-700/30 rounded-xl">
              <div className="text-3xl font-bold text-white mb-2">{strategy?.cost || "N/A"}</div>
              <div className="text-sm text-slate-400 font-medium">Total Cost</div>

              <div className="flex items-center justify-center gap-1 mt-2">
                <DollarSign className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-yellow-400">-5% under budget</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


    </div>
  )
}

