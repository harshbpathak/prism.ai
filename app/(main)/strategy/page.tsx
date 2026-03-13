"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { 
  Clock, 
  Play, 
  Filter, 
  Search, 
  ArrowLeft, 
  FileText, 
  Download, 
  MapPin, 
  Users, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pause,
  MessageSquare,
  BarChart3,
  GitBranch,
  Zap,
  Shield,
  DollarSign,
  Loader2,
  RefreshCw
} from "lucide-react"
import { StrategyOverview } from "@/components/strategy/strategy-overview"
import { NodeBreakdown } from "@/components/strategy/node-breakdown"
import { TaskBoard } from "@/components/strategy/task-board"
import { StrategyMetrics } from "@/components/strategy/strategy-metrics"
import { ExecutionFlowMap } from "@/components/strategy/execution-flow-map"
import { StrategyKanban } from "@/components/strategy/strategy-kanban"
import { DependencyGraphModal } from "@/components/strategy/dependency-graph-modal"
import { supabaseClient } from "@/lib/supabase/client"
import { LiveExecutionStats } from "@/components/strategy/live-execution-stats"
import { useToast } from "@/hooks/use-toast"

// Kanban board data
const kanbanColumns = [
  { id: "todo", title: "To Do", color: "bg-slate-500 dark:bg-slate-700" },
  { id: "in-progress", title: "In Progress", color: "bg-blue-500 dark:bg-blue-600" },
  { id: "blocked", title: "Blocked", color: "bg-red-500 dark:bg-red-600" },
  { id: "done", title: "Done", color: "bg-green-500 dark:bg-green-600" }
]

// Default fallback data structure
const defaultStrategy = {
  id: 1,
  name: "Loading Strategy...",
  type: "Loading",
  status: "active" as const,
  priority: "medium" as const,
  progress: 0,
  estimatedCompletion: "Calculating...",
  cost: "$0",
  roi: "0%",
  confidence: 0,
  riskReduction: "0%",
  affectedNodes: 0,
  totalTasks: 0,
  completedTasks: 0,
  description: "Loading strategy details...",
  lastUpdated: "Loading...",
  assignedTeam: "TBD",
  teamLead: "TBD",
  riskLevel: "medium" as const,
  scenarioSource: "Loading...",
  dateFinalized: new Date().toISOString().split('T')[0],
  nodes: []
}

export default function StrategyPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  
  const [strategies, setStrategies] = useState([defaultStrategy])
  const [selectedStrategy, setSelectedStrategy] = useState(defaultStrategy)
  const [activeTab, setActiveTab] = useState("execution")
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Get strategy ID from URL params
  const strategyId = searchParams.get('strategyId')

  // Get current user ID
  const getCurrentUser = async () => {
    try {
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
      
      if (authError || !user) {
        console.error('❌ Authentication failed:', authError)
        router.push('/signin')
        return null
      }

      // Get user ID from users table using email
      const { data: userData, error } = await supabaseClient
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single()

      if (error || !userData) {
        console.error('❌ Error fetching user data:', error)
        return null
      }

      console.log('✅ Current user ID:', userData.id)
      setCurrentUserId(userData.id)
      return userData.id
    } catch (error) {
      console.error('❌ Error getting current user:', error)
      return null
    }
  }

  // Fetch strategies list
  const fetchStrategiesList = async () => {
    try {
      console.log('🔍 Fetching strategies list...')
      
      // Ensure we have the current user ID
      const userId = currentUserId || await getCurrentUser()
      if (!userId) {
        setError('Unable to identify current user')
        return
      }

      const response = await fetch(`/api/strategy/list?userId=${userId}`)
      const result = await response.json()
      
      console.log('📊 Strategy list result:', result)
      
      if (result.success && result.data?.length > 0) {
        console.log(`✅ Found ${result.data.length} strategies`)
        setStrategies(result.data)
        
        // If strategyId in URL, find and select that strategy
        if (strategyId) {
          const strategy = result.data.find((s: any) => s.id === strategyId)
          if (strategy) {
            console.log('🎯 Selected strategy from URL:', strategy.name)
            setSelectedStrategy(strategy)
          }
        } else {
          console.log('🎯 Selected first strategy:', result.data[0].name)
          setSelectedStrategy(result.data[0])
        }
      } else {
        console.log('⚠️ No strategies found')
        setStrategies([])
        setSelectedStrategy(defaultStrategy)
      }
    } catch (error) {
      console.error('❌ Error fetching strategies:', error)
      setError('Failed to load strategies')
    }
  }

  // Fetch or generate strategy execution data
  const fetchStrategyExecutionData = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      // First try to get existing execution data
      const existingResponse = await fetch(`/api/strategy/execution?strategyId=${id}`)
      const existingResult = await existingResponse.json()

      if (existingResult.success && existingResult.data) {
        setSelectedStrategy(existingResult.data)
        return
      }

      // If no existing data, generate new execution data using AI
      setGenerating(true)
      toast({
        title: "🤖 AI Agent Working",
        description: "Generating dynamic strategy execution plan...",
      })

      const generateResponse = await fetch('/api/agent/strategy-execution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyId: id,
          supplyChainContext: {
            supplyChainId: searchParams.get('supplyChainId'),
            organizationName: searchParams.get('organizationName')
          },
          scenarioType: searchParams.get('scenarioType') || 'Supply Chain Disruption',
          organizationInfo: {
            industry: searchParams.get('industry'),
            employeeCount: searchParams.get('employeeCount'),
            location: searchParams.get('location')
          }
        })
      })

      const generateResult = await generateResponse.json()

      if (generateResult.success) {
        setSelectedStrategy(generateResult.data)
        
        // Save the generated data to database
        await fetch('/api/strategy/execution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            strategyId: id,
            ...generateResult.data
          })
        })

        toast({
          title: "✅ Strategy Generated",
          description: `Generated execution plan with ${generateResult.data.totalTasks} tasks across ${generateResult.data.affectedNodes} nodes`,
        })
      } else {
        throw new Error(generateResult.error || 'Failed to generate strategy')
      }

    } catch (error) {
      console.error('Error fetching strategy execution data:', error)
      setError('Failed to load strategy execution data')
      toast({
        title: "❌ Error",
        description: "Failed to generate strategy execution data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setGenerating(false)
    }
  }

  // Regenerate strategy data
  const regenerateStrategy = async () => {
    if (!strategyId) return
    await fetchStrategyExecutionData(strategyId)
  }

  useEffect(() => {
    const loadStrategies = async () => {
      setLoading(true)
      try {
        // First get the current user, then fetch strategies
        const userId = await getCurrentUser()
        if (userId) {
          await fetchStrategiesList()
        }
      } catch (error) {
        console.error('❌ Error loading strategies:', error)
        setError('Failed to load strategies')
      } finally {
        setLoading(false)
      }
    }
    loadStrategies()
  }, [])

  useEffect(() => {
    if (strategyId) {
      fetchStrategyExecutionData(strategyId)
    }
  }, [strategyId])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "planning":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case "Done":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "In Progress":
        return <Clock className="w-4 h-4 text-blue-400" />
      case "Blocked":
        return <XCircle className="w-4 h-4 text-red-400" />
      default:
        return <Pause className="w-4 h-4 text-slate-400" />
    }
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "CRITICAL":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "HIGH":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "LOW":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-900 dark:text-white flex items-center justify-center">
        <Card className="bg-white/80 dark:bg-slate-800/60 border-slate-200/50 dark:border-slate-700/50 p-8 text-center backdrop-blur-sm">
          <CardContent>
            <AlertTriangle className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Error Loading Strategy</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700 text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-900 dark:text-white">
      {/* Sticky Header Bar */}
      <div className="sticky top-0 z-50 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-600" />
            <div className="animate-fade-in">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{selectedStrategy.name}</h1>
                {generating && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {selectedStrategy.scenarioSource} • Finalized {selectedStrategy.dateFinalized}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={regenerateStrategy}
              disabled={loading || !strategyId}
              className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 bg-white/50 dark:bg-transparent transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 bg-white/50 dark:bg-transparent transition-all duration-200"
            >
              <FileText className="w-4 h-4 mr-2" />
              View Reports
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 bg-white/50 dark:bg-transparent transition-all duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <DependencyGraphModal nodes={selectedStrategy.nodes || []} />
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Strategy List Sidebar */}
        <div className="w-80 border-r border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-6 text-slate-900 dark:text-white">Active Strategies</h3>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-white/60 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-700/50 animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded mb-2"></div>
                      <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded mb-3"></div>
                      <div className="h-2 bg-slate-300 dark:bg-slate-700 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : strategies.length === 0 ? (
              <Card className="bg-white/60 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-700/50">
                <CardContent className="p-8 text-center">
                  <Target className="w-12 h-12 text-slate-400 dark:text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No Strategies Onboarded</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    No finalized strategies found. Create and finalize strategies through the Simulation and Orchestrator workflows to see them here.
                  </p>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => router.push('/simulation')} 
                      className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                    >
                      Start Simulation
                    </Button>
                    <Button 
                      onClick={() => router.push('/orchestrator')} 
                      variant="outline"
                      className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 bg-white/50 dark:bg-transparent w-full"
                    >
                      Go to Orchestrator
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {strategies.map((strategy, index) => (
                  <Card
                    key={strategy.id}
                    className={`cursor-pointer transition-all duration-300 border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg hover:shadow-slate-200/20 dark:hover:shadow-slate-500/10 transform hover:-translate-y-1 ${
                      selectedStrategy.id === strategy.id
                        ? "bg-blue-50 dark:bg-slate-800/80 border-blue-300 dark:border-blue-500/50 shadow-xl shadow-blue-200/20 dark:shadow-blue-500/20 ring-2 ring-blue-300/20 dark:ring-blue-500/20"
                        : "bg-white/60 dark:bg-slate-800/40 hover:bg-white/80 dark:hover:bg-slate-800/60"
                    }`}
                    onClick={() => {
                      setSelectedStrategy(strategy)
                      if (String(strategy.id) !== strategyId) {
                        router.push(`/strategy?strategyId=${strategy.id}`)
                      }
                    }}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-slate-900 dark:text-white text-sm leading-tight">{strategy.name}</h4>
                        <div className="flex gap-1">
                          <Badge className={`text-xs px-2 py-1 ${getPriorityColor(strategy.priority)}`}>
                            {strategy.priority}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">Progress</span>
                          <span className="text-slate-900 dark:text-white font-medium">{strategy.progress}%</span>
                        </div>
                        <Progress value={strategy.progress} className="h-2 bg-slate-200 dark:bg-slate-700" />

                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {strategy.estimatedCompletion}
                          </span>
                          <Badge className={`text-xs ${getStatusColor(strategy.status)}`}>{strategy.status}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="border-b border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-6 py-4">
              <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 p-1">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-200"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="kanban"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-200"
                >
                  <GitBranch className="w-4 h-4 mr-2" />
                  Kanban
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto">
              {strategies.length === 0 ? (
                // Empty state for main content
                <div className="flex items-center justify-center h-full">
                  <Card className="bg-white/80 dark:bg-slate-800/60 border-slate-200/50 dark:border-slate-700/50 p-12 text-center max-w-md">
                    <CardContent>
                      <Target className="w-16 h-16 text-slate-400 dark:text-slate-400 mx-auto mb-6" />
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">No Strategies Available</h2>
                      <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                        Start your supply chain resilience journey by creating and finalizing strategies through our simulation and orchestration workflows.
                      </p>
                      <div className="space-y-3">
                        <Button 
                          onClick={() => router.push('/simulation')} 
                          className="bg-blue-600 hover:bg-blue-700 w-full"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Run Simulation
                        </Button>
                        <Button 
                          onClick={() => router.push('/orchestrator')} 
                          variant="outline"
                          className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 bg-white/50 dark:bg-transparent w-full"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          AI Orchestrator
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <>
              {/* Strategy Summary Panel */}
              <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-slate-100/30 to-slate-200/30 dark:from-slate-800/30 dark:to-slate-900/30">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-white/80 dark:bg-slate-800/60 border-slate-200/50 dark:border-slate-700/50 hover:bg-white/90 dark:hover:bg-slate-800/80 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/20 dark:hover:shadow-slate-500/10 transform hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                          <Target className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Strategy Type</p>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedStrategy.type}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 dark:bg-slate-800/60 border-slate-200/50 dark:border-slate-700/50 hover:bg-white/90 dark:hover:bg-slate-800/80 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/20 dark:hover:shadow-slate-500/10 transform hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/20 rounded-xl">
                          <TrendingUp className="w-6 h-6 text-green-500 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Expected ROI</p>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedStrategy.roi}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 dark:bg-slate-800/60 border-slate-200/50 dark:border-slate-700/50 hover:bg-white/90 dark:hover:bg-slate-800/80 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/20 dark:hover:shadow-slate-500/10 transform hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-500/20 rounded-xl">
                          <Shield className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Risk Reduction</p>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedStrategy.riskReduction}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 dark:bg-slate-800/60 border-slate-200/50 dark:border-slate-700/50 hover:bg-white/90 dark:hover:bg-slate-800/80 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/20 dark:hover:shadow-slate-500/10 transform hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/20 rounded-xl">
                          <DollarSign className="w-6 h-6 text-purple-500 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Total Cost</p>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedStrategy.cost}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <TabsContent value="overview" className="h-full m-0">
                <div className="p-6 space-y-8">
                  <StrategyOverview strategy={selectedStrategy} />
                  <StrategyMetrics strategy={selectedStrategy} />
                  <LiveExecutionStats 
                    strategy={selectedStrategy} 
                    nodes={selectedStrategy.nodes || []}
                  />
                </div>
              </TabsContent>

              <TabsContent value="kanban" className="h-full m-0">
                <div className="p-6">
                  <StrategyKanban nodes={selectedStrategy.nodes || []} />
                </div>
              </TabsContent>
                </>
              )}
            </div>
          </Tabs>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fade-in-up {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes slide-in-right {
          from { 
            transform: translateX(100%); 
          }
          to { 
            transform: translateX(0); 
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
