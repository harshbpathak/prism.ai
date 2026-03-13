"use client"

import React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Shield, Target, Clock, TrendingUp, CheckCircle, AlertCircle, RefreshCw, Sparkles, Eye, Activity, FileCheck } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect, useMemo, useRef } from "react"
import { ImplementationRoadmapPanel } from "@/components/simulation/ImplementationRoadmapPanel"
import { FinalizeStrategyPanel } from "@/components/simulation/FinalizeStrategyPanel"
import { GlassmorphicCard } from "@/components/ui/glassmorphic-card"
import { toast } from 'sonner'

// API Types based on the strategy agent response
interface ApiMitigationStrategy {
  id: number
  title: string
  description: string
  priority: 'Critical' | 'High' | 'Medium' | 'Low' | 'Strategic'
  timeframe: string
  costEstimate: string
  impactReduction: string
  status: 'ready' | 'planning' | 'recommended' | 'in-progress' | 'completed'
  category: 'immediate' | 'shortTerm' | 'longTerm'
  feasibility: 'HIGH' | 'MEDIUM' | 'LOW'
  dependencies: string[]
  riskFactors: string[]
  successMetrics: string[]
  resourceRequirements: {
    personnel: number
    equipment: string[]
    partnerships: string[]
  }
}

interface ApiStrategyResponse {
  immediate: ApiMitigationStrategy[]
  shortTerm: ApiMitigationStrategy[]
  longTerm: ApiMitigationStrategy[]
  riskMitigationMetrics: {
    currentRisk: number
    targetRisk: number
    costToImplement: string
    expectedROI: string
    paybackPeriod: string
    riskReduction: string
  }
  keyInsights: string[]
  marketIntelligence: string[]
  bestPractices: string[]
  contingencyPlans: string[]
  processingTime?: number
  enhanced?: boolean
  memoryContextAvailable?: boolean
  marketIntelligenceGathered?: boolean
}

// Legacy types for fallback
interface MitigationStrategy {
  id: number
  title: string
  description: string
  priority: string
  timeframe: string
  costEstimate: string
  impactReduction: string
  status: string
}

interface MitigationStrategies {
  immediate: MitigationStrategy[]
  shortTerm: MitigationStrategy[]
  longTerm: MitigationStrategy[]
}

interface RiskMitigationMetrics {
  currentRisk: number
  targetRisk: number
  costToImplement: string
  expectedROI: string
  paybackPeriod: string
  riskReduction: string
}

interface SelectedStrategySummary {
  immediate: ApiMitigationStrategy[]
  shortTerm: ApiMitigationStrategy[]
  longTerm: ApiMitigationStrategy[]
  totalCost: string
  totalImpact: string
  timelineSpan: string
  riskReduction: string
}

interface FinalizeData {
  approvedStrategies: number[]
  implementationNotes: string
  priorityAdjustments: { strategyId: number; newPriority: string }[]
  stakeholderApproval: boolean
  budgetConfirmed: boolean
  resourcesAllocated: boolean
  timelineAccepted: boolean
}

// Default fallback data
const DEFAULT_MITIGATION_STRATEGIES = {
  immediate: [
    {
      id: 1,
      title: "Activate Alternative Shipping Routes",
      description: "Immediately redirect shipments through Hong Kong and Ningbo ports",
      priority: "Critical",
      timeframe: "0-24 hours",
      costEstimate: "$120K",
      impactReduction: "25%",
      status: "ready"
    }
  ],
  shortTerm: [
    {
      id: 2,
      title: "Expedited Air Freight",
      description: "Charter air freight for critical components and high-priority orders",
      priority: "High",
      timeframe: "1-3 days",
      costEstimate: "$380K",
      impactReduction: "30%",
      status: "planning"
    }
  ],
  longTerm: [
    {
      id: 3,
      title: "Supply Chain Diversification",
      description: "Establish alternative supplier relationships in Southeast Asia",
      priority: "Strategic",
      timeframe: "30-90 days",
      costEstimate: "$2.1M",
      impactReduction: "60%",
      status: "recommended"
    }
  ]
}

const DEFAULT_RISK_MITIGATION_METRICS = {
  currentRisk: 85,
  targetRisk: 35,
  costToImplement: "$8.1M",
  expectedROI: "2.4x",
  paybackPeriod: "18 months",
  riskReduction: "50%"
}

// API function to fetch strategy data
async function fetchStrategyData(simulationId: string): Promise<ApiStrategyResponse | null> {
  try {
    console.log(`🔍 Fetching strategy data for simulation: ${simulationId}`)
    
    const response = await fetch(`/api/agent/strategy?simulationId=${simulationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    if (result.success && result.data) {
      console.log('✅ Successfully fetched strategy data')
      return result.data
    } else {
      throw new Error(result.error || 'Failed to fetch strategy data')
    }
  } catch (error) {
    console.error('❌ Error fetching strategy data:', error)
    return null
  }
}

// Enhanced Strategy Card Component
function StrategyCard({ strategy, index }: { strategy: ApiMitigationStrategy | MitigationStrategy, index: number }) {
  // Helper function to check if strategy is API type
  const isApiStrategy = (s: any): s is ApiMitigationStrategy => {
    return s.feasibility !== undefined && s.dependencies !== undefined;
  }

  // Convert legacy strategy to API format for display
  const apiStrategy: ApiMitigationStrategy = isApiStrategy(strategy) ? strategy : {
    id: strategy.id,
    title: strategy.title,
    description: strategy.description,
    priority: strategy.priority as any,
    timeframe: strategy.timeframe,
    costEstimate: strategy.costEstimate,
    impactReduction: strategy.impactReduction,
    status: strategy.status as any,
    category: 'immediate' as any,
    feasibility: 'HIGH' as any,
    dependencies: [],
    riskFactors: [],
    successMetrics: [],
    resourceRequirements: {
      personnel: 2,
      equipment: [],
      partnerships: []
    }
  }
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30"
      case "High":
        return "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30"
      case "Medium":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30"
      case "Strategic":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30"
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30"
    }
  }

  const getFeasibilityColor = (feasibility: string) => {
    switch (feasibility) {
      case "HIGH":
        return "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30"
      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30"
      case "LOW":
        return "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "planning":
        return <Clock className="h-4 w-4 text-orange-500" />
      case "recommended":
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      case "in-progress":
        return <Activity className="h-4 w-4 text-purple-500" />
      default:
        return null
    }
  }

  const [expanded, setExpanded] = useState(false)

  return (
    <GlassmorphicCard className="p-4 sm:p-6 hover:scale-[1.01] transition-all duration-300 hover:shadow-lg group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 shadow-sm">
            {index + 1}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base sm:text-lg break-words line-clamp-2">{strategy.title}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{strategy.timeframe}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <Badge className={`text-xs font-medium ${getPriorityColor(strategy.priority)}`}>
            {strategy.priority}
          </Badge>
          {getStatusIcon(strategy.status)}
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-3">
        {strategy.description}
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm mb-4">
        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3">
          <p className="font-medium text-muted-foreground text-xs mb-1">Cost</p>
          <p className="font-semibold text-green-600 dark:text-green-400">{strategy.costEstimate}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3">
          <p className="font-medium text-muted-foreground text-xs mb-1">Impact Reduction</p>
          <p className="font-semibold text-emerald-600 dark:text-emerald-400">{strategy.impactReduction}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3">
          <p className="font-medium text-muted-foreground text-xs mb-1">Feasibility</p>
          <Badge className={`text-xs font-medium ${getFeasibilityColor(apiStrategy.feasibility)}`}>
            {apiStrategy.feasibility}
          </Badge>
        </div>
      </div>

      {/* Expandable Details Section */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className="w-full mb-2 text-xs font-medium"
      >
        {expanded ? 'Hide Details' : 'Show Details'}
        <Eye className="h-3 w-3 ml-2" />
      </Button>

      {expanded && (
        <div className="space-y-4 pt-4 border-t border-border/50">
          {apiStrategy.dependencies.length > 0 && (
            <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200/30 dark:border-blue-800/30">
              <p className="font-medium text-sm mb-2 text-blue-700 dark:text-blue-300">Dependencies:</p>
              <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                {apiStrategy.dependencies.map((dep: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                    {dep}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {apiStrategy.riskFactors.length > 0 && (
            <div className="bg-red-50/50 dark:bg-red-950/20 rounded-lg p-3 border border-red-200/30 dark:border-red-800/30">
              <p className="font-medium text-sm mb-2 text-red-700 dark:text-red-300">Risk Factors:</p>
              <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                {apiStrategy.riskFactors.map((risk: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <AlertCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {apiStrategy.successMetrics.length > 0 && (
            <div className="bg-green-50/50 dark:bg-green-950/20 rounded-lg p-3 border border-green-200/30 dark:border-green-800/30">
              <p className="font-medium text-sm mb-2 text-green-700 dark:text-green-300">Success Metrics:</p>
              <ul className="text-xs text-green-600 dark:text-green-400 space-y-1">
                {apiStrategy.successMetrics.map((metric: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Target className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                    {metric}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-gray-50/50 dark:bg-gray-950/20 rounded-lg p-3 border border-gray-200/30 dark:border-gray-800/30">
            <p className="font-medium text-sm mb-2">Resource Requirements:</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><span className="font-medium">Personnel:</span> {apiStrategy.resourceRequirements.personnel} people</p>
              {apiStrategy.resourceRequirements.equipment.length > 0 && (
                <p><span className="font-medium">Equipment:</span> {apiStrategy.resourceRequirements.equipment.join(', ')}</p>
              )}
              {apiStrategy.resourceRequirements.partnerships.length > 0 && (
                <p><span className="font-medium">Partnerships:</span> {apiStrategy.resourceRequirements.partnerships.join(', ')}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </GlassmorphicCard>
  )
}

// Roadmap steps for the panel
const ROADMAP_STEPS = [
  {
    title: "Crisis Response (0-24 hours)",
    description: "Immediate containment and assessment strategies to minimize initial impact",
    color: "bg-red-500 text-white",
    icon: <AlertCircle className="h-6 w-6" />,
  },
  {
    title: "Recovery Operations (1-30 days)", 
    description: "Short-term stabilization and restoration measures",
    color: "bg-orange-500 text-white",
    icon: <Clock className="h-6 w-6" />,
  },
  {
    title: "Strategic Resilience (30+ days)",
    description: "Long-term improvements and future-proofing initiatives",
    color: "bg-blue-500 text-white", 
    icon: <Shield className="h-6 w-6" />,
  },
]

export default function MitigationStrategyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [roadmapOpen, setRoadmapOpen] = useState(false)
  const [finalizeOpen, setFinalizeOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [simulationId, setSimulationId] = useState<string | null>(null)
  const hasAutoOpenedRoadmap = useRef(false)
  
  // API State
  const [strategyData, setStrategyData] = useState<ApiStrategyResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get simulation ID from URL or localStorage
  useEffect(() => {
    const urlSimulationId = searchParams.get('id')
    const storedSimulationId = localStorage.getItem('currentSimulationId')
    
    if (urlSimulationId) {
      setSimulationId(urlSimulationId)
      localStorage.setItem('currentSimulationId', urlSimulationId)
    } else if (storedSimulationId) {
      setSimulationId(storedSimulationId)
    }
  }, [searchParams])

  // Fetch strategy data when simulation ID is available
  useEffect(() => {
    if (simulationId) {
      loadStrategyData(simulationId)
    } else {
      setIsLoading(false)
      setError('No simulation ID available')
    }
  }, [simulationId])

  const loadStrategyData = async (simId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const data = await fetchStrategyData(simId)
      
      if (data) {
        setStrategyData(data)
        toast.success('Strategy data loaded successfully')
      } else {
        setError('Failed to load strategy data')
        toast.error('Failed to load strategy data')
      }
    } catch (err) {
      console.error('Error loading strategy data:', err)
      setError('Failed to load strategy data')
      toast.error('Failed to load strategy data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (!simulationId || isRefreshing) return
    
    setIsRefreshing(true)
    try {
      // Force refresh by calling POST endpoint
      const response = await fetch('/api/agent/strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          simulationId: simulationId,
          forceRefresh: true
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setStrategyData(result.data)
          toast.success('Strategy analysis refreshed successfully')
        }
      } else {
        toast.error('Failed to refresh strategy analysis')
      }
    } catch (error) {
      console.error('Error refreshing strategy data:', error)
      toast.error('Failed to refresh strategy analysis')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Mobile detection effect
  React.useEffect(() => {
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      
      // Auto-open roadmap on desktop only once
      if (!mobile && !hasAutoOpenedRoadmap.current) {
        setRoadmapOpen(true)
        hasAutoOpenedRoadmap.current = true
      }
    }
    const debouncedCheckMobile = () => {
      if (resizeTimer) clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        checkMobile()
      }, 150)
    }
    checkMobile()
    window.addEventListener('resize', debouncedCheckMobile)
    return () => {
      window.removeEventListener('resize', debouncedCheckMobile)
      if (resizeTimer) clearTimeout(resizeTimer)
    }
  }, [])

  // Remove the separate auto-opening effect since it's now handled in the mobile detection effect

  const handleBackToResults = () => {
    if (simulationId) {
      router.push(`/simulation/result?id=${simulationId}`)
    } else {
      router.push("/simulation/result")
    }
  }

  // Use API data if available, otherwise fall back to defaults
  const currentStrategies = strategyData || {
    immediate: DEFAULT_MITIGATION_STRATEGIES.immediate,
    shortTerm: DEFAULT_MITIGATION_STRATEGIES.shortTerm,
    longTerm: DEFAULT_MITIGATION_STRATEGIES.longTerm,
    riskMitigationMetrics: DEFAULT_RISK_MITIGATION_METRICS,
    keyInsights: [],
    marketIntelligence: [],
    bestPractices: [],
    contingencyPlans: []
  }

  // Calculate selected strategies summary for finalize panel (memoized to prevent unnecessary recalculations)
  const strategySummary = useMemo((): SelectedStrategySummary => {
    // Convert all strategies to API format first
    const convertToApiFormat = (strategies: (ApiMitigationStrategy | MitigationStrategy)[]): ApiMitigationStrategy[] => {
      return strategies.map(strategy => {
        // Check if it's already in API format
        if ('feasibility' in strategy && 'dependencies' in strategy) {
          return strategy as ApiMitigationStrategy
        }
        
        // Convert legacy strategy to API format
        const legacyStrategy = strategy as MitigationStrategy
        return {
          id: legacyStrategy.id,
          title: legacyStrategy.title,
          description: legacyStrategy.description,
          priority: legacyStrategy.priority as any,
          timeframe: legacyStrategy.timeframe,
          costEstimate: legacyStrategy.costEstimate,
          impactReduction: legacyStrategy.impactReduction,
          status: legacyStrategy.status as any,
          category: 'immediate' as any, // Default category
          feasibility: 'HIGH' as any,
          dependencies: [],
          riskFactors: [],
          successMetrics: [],
          resourceRequirements: {
            personnel: 2,
            equipment: [],
            partnerships: []
          }
        }
      })
    }

    const immediateApi = convertToApiFormat(currentStrategies.immediate)
    const shortTermApi = convertToApiFormat(currentStrategies.shortTerm)
    const longTermApi = convertToApiFormat(currentStrategies.longTerm)
    
    const allStrategies = [...immediateApi, ...shortTermApi, ...longTermApi]

    // Calculate total cost (extract numbers and sum)
    const totalCostValue = allStrategies.reduce((sum, strategy) => {
      const costMatch = strategy.costEstimate.match(/[\d.]+/)
      return sum + (costMatch ? parseFloat(costMatch[0]) : 0)
    }, 0)

    // Calculate average impact reduction
    const totalImpactValue = allStrategies.reduce((sum, strategy) => {
      const impactMatch = strategy.impactReduction.match(/[\d.]+/)
      return sum + (impactMatch ? parseFloat(impactMatch[0]) : 0)
    }, 0)

    return {
      immediate: immediateApi,
      shortTerm: shortTermApi,
      longTerm: longTermApi,
      totalCost: `$${totalCostValue.toFixed(1)}M`,
      totalImpact: `${Math.round(totalImpactValue / allStrategies.length)}%`,
      timelineSpan: "0-90 days",
      riskReduction: currentStrategies.riskMitigationMetrics.riskReduction
    }
  }, [currentStrategies])

  const handleFinalizeStrategy = async (finalizeData: FinalizeData) => {
    try {
      console.log('Finalizing strategy with data:', finalizeData)
      
      // The actual API call is handled within the FinalizeStrategyPanel
      // Here we can perform any additional client-side actions
      
      // Close the finalize panel
      setFinalizeOpen(false)
      
      // Show success message
      toast.success('Strategy has been successfully finalized and onboarded!')
      
      // Optionally redirect to a tracking/monitoring page
      // router.push(`/strategy/track/${simulationId}`)
      
    } catch (error) {
      console.error('Error in finalize handler:', error)
      toast.error('Failed to complete strategy finalization')
    }
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/60 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-gradient-to-br from-purple-400/20 to-blue-400/15 dark:from-purple-900/30 dark:to-blue-900/25 blur-3xl animate-pulse"></div>
        </div>
        <div className="relative z-10 p-6 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center space-y-6">
              <div className="relative">
                <Activity className="h-16 w-16 animate-spin mx-auto text-blue-500" />
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-lg animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-semibold text-slate-700 dark:text-slate-200">Loading strategy analysis...</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Generating AI-powered mitigation strategies</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Mobile roadmap section component
  const MobileRoadmapSection = () => (
    <div className="lg:hidden">
      <GlassmorphicCard variant="accent" className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Implementation Roadmap</h2>
            <p className="text-sm text-muted-foreground">Strategic execution timeline</p>
          </div>
        </div>
        
        <div className="space-y-6">
          {ROADMAP_STEPS.map((step, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
                {step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl border border-emerald-200/50 dark:border-emerald-800/30">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Total Impact</span>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            Complete implementation reduces supply chain risk by <span className="font-semibold">{currentStrategies.riskMitigationMetrics.riskReduction}</span> with an expected ROI of <span className="font-semibold">{currentStrategies.riskMitigationMetrics.expectedROI}</span>
          </p>
        </div>
      </GlassmorphicCard>
    </div>
  )

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/60 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-gradient-to-br from-purple-400/20 to-blue-400/15 dark:from-purple-900/30 dark:to-blue-900/25 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 rounded-full bg-gradient-to-br from-emerald-400/15 to-teal-400/10 dark:from-emerald-900/25 dark:to-teal-900/20 blur-3xl animate-pulse [animation-delay:2s]"></div>
      </div>

      {/* Roadmap Side Panel (desktop) & Drawer (mobile) */}
      <ImplementationRoadmapPanel
        steps={ROADMAP_STEPS}
        open={roadmapOpen}
        onClose={() => setRoadmapOpen(false)}
        isMobile={isMobile}
        finalizeOpen={finalizeOpen}
      />

      {/* Finalize Strategy Panel (desktop) & Drawer (mobile) */}
      <FinalizeStrategyPanel
        selectedStrategies={strategySummary}
        open={finalizeOpen}
        onClose={() => setFinalizeOpen(false)}
        onFinalize={handleFinalizeStrategy}
        isMobile={isMobile}
        simulationId={simulationId || undefined}
        roadmapOpen={roadmapOpen}
      />

      {/* Floating Roadmap Button (mobile only) */}
      <button
        className="lg:hidden fixed bottom-20 right-6 z-40 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full shadow-lg shadow-blue-500/25 p-4 flex items-center gap-2 transition-all duration-300 hover:scale-105"
        onClick={() => setRoadmapOpen(true)}
        aria-label="Open Implementation Roadmap"
      >
        <TrendingUp className="h-5 w-5" />
        <span className="font-semibold">Roadmap</span>
      </button>

      {/* Floating Finalize Button (mobile only) */}
      <button
        className="lg:hidden fixed bottom-6 left-6 z-40 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-full shadow-lg shadow-green-500/25 p-4 flex items-center gap-2 transition-all duration-300 hover:scale-105"
        onClick={() => setFinalizeOpen(true)}
        aria-label="Finalize Strategy"
      >
        <FileCheck className="h-5 w-5" />
        <span className="font-semibold">Finalize</span>
      </button>

      {/* Desktop Roadmap Toggle Button */}
      {!isMobile && !roadmapOpen && !finalizeOpen && (
        <button
          className="fixed top-1/2 right-4 z-40 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full shadow-lg shadow-blue-500/25 p-3 transition-all duration-300 hover:scale-105 transform -translate-y-1/2"
          onClick={() => setRoadmapOpen(true)}
          aria-label="Open Implementation Roadmap"
        >
          <TrendingUp className="h-5 w-5" />
        </button>
      )}

      <div className={`relative z-10 transition-all duration-300 ${
        !isMobile && roadmapOpen && finalizeOpen ? 'pr-[820px]' : 
        !isMobile && (roadmapOpen || finalizeOpen) ? 'pr-[420px]' : ''
      }`}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <GlassmorphicCard variant="accent" className="p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  onClick={handleBackToResults}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg px-3 py-2"
                  aria-label="Navigate back to simulation results"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Results
                </Button>
                {strategyData?.enhanced && (
                  <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/25 flex items-center gap-2 px-3 py-1">
                    <Sparkles className="h-3 w-3" />
                    AI Enhanced
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 dark:from-purple-400 dark:via-blue-400 dark:to-indigo-400">
                Mitigation Strategy
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-lg sm:text-xl leading-relaxed max-w-3xl">
                {strategyData ? 'AI-powered comprehensive action plan' : 'Comprehensive action plan'} to minimize disruption impact and enhance supply chain resilience
              </p>
              {error && (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-2 rounded-lg border border-amber-200/30 dark:border-amber-800/30">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Button 
                onClick={() => setFinalizeOpen(true)}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                aria-label="Finalize Strategy"
              >
                <FileCheck className="mr-2 h-4 w-4" />
                Finalize Strategy
              </Button>
              <Button 
                onClick={() => setRoadmapOpen(!roadmapOpen)}
                variant="outline"
                className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                aria-label={roadmapOpen ? "Close Implementation Roadmap" : "Open Implementation Roadmap"}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                {roadmapOpen ? 'Close Roadmap' : 'View Roadmap'}
              </Button>
              {simulationId && (
                <Button 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  variant="outline"
                  className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                  aria-label="Refresh strategy analysis"
                >
                  {isRefreshing ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </GlassmorphicCard>

        {/* Mobile Roadmap Section */}
        <MobileRoadmapSection />

        {/* Risk Reduction Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <GlassmorphicCard className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Current Risk</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">{currentStrategies.riskMitigationMetrics.currentRisk}%</p>
              </div>
              <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
            </div>
          </GlassmorphicCard>

          <GlassmorphicCard className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Target Risk</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{currentStrategies.riskMitigationMetrics.targetRisk}%</p>
              </div>
              <Target className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
            </div>
          </GlassmorphicCard>

          <GlassmorphicCard className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Expected ROI</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{currentStrategies.riskMitigationMetrics.expectedROI}</p>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            </div>
          </GlassmorphicCard>

          <GlassmorphicCard className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Risk Reduction</p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{currentStrategies.riskMitigationMetrics.riskReduction}</p>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-500" />
            </div>
          </GlassmorphicCard>
        </div>

        {/* Strategy Tabs */}
        <Tabs defaultValue="immediate" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-white/30 dark:border-slate-700/30 rounded-xl p-2">
            <TabsTrigger value="immediate" className="rounded-lg text-xs sm:text-sm font-medium">
              Immediate ({currentStrategies.immediate.length})
            </TabsTrigger>
            <TabsTrigger value="shortterm" className="rounded-lg text-xs sm:text-sm font-medium">
              Short-term ({currentStrategies.shortTerm.length})
            </TabsTrigger>
            <TabsTrigger value="longterm" className="rounded-lg text-xs sm:text-sm font-medium">
              Long-term ({currentStrategies.longTerm.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="immediate" className="space-y-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Crisis Response (0-24 hours)</h2>
                  <p className="text-sm text-muted-foreground">Immediate actions to contain and minimize initial impact</p>
                </div>
                <Badge className="bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/25 ml-auto">
                  {currentStrategies.immediate.length} strategies
                </Badge>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                {currentStrategies.immediate.map((strategy, index) => (
                  <StrategyCard key={strategy.id} strategy={strategy} index={index} />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="shortterm" className="space-y-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Recovery Operations (1-30 days)</h2>
                  <p className="text-sm text-muted-foreground">Stabilization measures and restoration activities</p>
                </div>
                <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/25 ml-auto">
                  {currentStrategies.shortTerm.length} strategies
                </Badge>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                {currentStrategies.shortTerm.map((strategy, index) => (
                  <StrategyCard key={strategy.id} strategy={strategy} index={index} />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="longterm" className="space-y-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Strategic Resilience (30+ days)</h2>
                  <p className="text-sm text-muted-foreground">Long-term improvements and future-proofing initiatives</p>
                </div>
                <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/25 ml-auto">
                  {currentStrategies.longTerm.length} strategies
                </Badge>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                {currentStrategies.longTerm.map((strategy, index) => (
                  <StrategyCard key={strategy.id} strategy={strategy} index={index} />
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Additional Insights Section - Only show if we have API data */}
        {strategyData && (strategyData.keyInsights.length > 0 || strategyData.bestPractices.length > 0) && (
          <div className="space-y-6">
            {/* Key Insights */}
            {strategyData.keyInsights.length > 0 && (
              <GlassmorphicCard className="p-6">
                <CardHeader className="p-0 pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    Key Strategic Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 gap-4">
                    {strategyData.keyInsights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg border border-purple-200/30 dark:border-purple-800/30">
                        <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{insight}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </GlassmorphicCard>
            )}

            {/* Best Practices */}
            {strategyData.bestPractices.length > 0 && (
              <GlassmorphicCard className="p-6">
                <CardHeader className="p-0 pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    Industry Best Practices
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {strategyData.bestPractices.map((practice, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-green-50/50 dark:bg-green-950/20 rounded-lg border border-green-200/30 dark:border-green-800/30">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{practice}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </GlassmorphicCard>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
