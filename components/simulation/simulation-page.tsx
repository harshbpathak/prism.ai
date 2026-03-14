"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from 'sonner'

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

import { SimulationLoader } from "@/components/simulation/test/simulation-loader"
import { AIScenarioSuggestions } from "@/components/simulation/test/ai-scenario-suggestions"
import { ScenarioProvider, useScenario, ScenarioData } from "@/lib/context/scenario-context"
import type { Simulation } from "@/lib/types/database"
import { getUserSupplyChains } from "@/lib/api/supply-chain"
import {  updateSimulation, getSimulations, findCachedSimulation, createSimulationWithCache } from "@/lib/api/simulation"
import { useUser } from "@/lib/stores/user"
import { useImpact } from "@/lib/context/impact-context"

// Import separated components
import { SimulationHeader } from "./simulation-header"
import { FloatingRunButton } from "./floating-run-button"
import { ProfessionalTemplateSelection } from "./professional-template-selection"
import type { ApiResponse, SupplyChainData } from "./types"
import { ScenarioConfigurationForm } from "./enhanced-scenario-configuration-form"

// Glassmorphic Card Component with enhanced styling
function GlassmorphicCard({ children, className = "", variant = "default", ...props }: { 
  children: React.ReactNode; 
  className?: string; 
  variant?: "default" | "accent" | "subtle";
  [key: string]: any 
}) {
  const variantStyles = {
    default: "border border-white/30 dark:border-slate-700/20 bg-white/80 dark:bg-slate-900/20 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/30",
    accent: "border border-blue-200/50 dark:border-blue-800/30 bg-gradient-to-br from-white/90 to-blue-50/80 dark:from-slate-900/30 dark:to-blue-950/20 backdrop-blur-xl shadow-xl shadow-blue-500/10 dark:shadow-blue-500/20",
    subtle: "border border-white/20 dark:border-slate-700/10 bg-white/60 dark:bg-slate-900/10 backdrop-blur-lg shadow-lg shadow-black/5 dark:shadow-black/20"
  }
  
  return (
    <Card 
      className={`${variantStyles[variant]} rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-black/40 ${className}`} 
      {...props}
    >
      {children}
    </Card>
  )
}

function SimulationPageContent() {
  const router = useRouter()
  const [simulationHistory, setSimulationHistory] = useState<Simulation[]>([])
  const [currentSimulation, setCurrentSimulation] = useState<Simulation | null>(null)
  const [isAIScenarioOpen, setIsAIScenarioOpen] = useState(false)
  const [progress, setProgress] = useState(0)

  // View state management - simplified without query params
  const [view, setView] = useState('templates')
  const [simulationRunning, setSimulationRunning] = useState(false)
  const [simulationComplete, setSimulationComplete] = useState(false)
  
  // Navigation state to track when to navigate
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  // Access scenario context
  const { 
    scenarioData, 
    updateScenarioData, 
    supplyChains, 
    setSupplyChains, 
    selectedSupplyChainId, 
    setSelectedSupplyChainId 
  } = useScenario()

  // Access the impact context
  const { setImpactData, setIsLoading } = useImpact()

  //fetch user 
  const { userData } = useUser()

  const user_id = userData?.id

  // Form validation - more robust checking
  const isFormValid = !!(
    scenarioData.scenarioName && 
    scenarioData.scenarioName.trim().length > 0 &&
    scenarioData.scenarioType && 
    scenarioData.scenarioType.trim().length > 0 &&
    scenarioData.affectedNode && 
    scenarioData.affectedNode.trim().length > 0 &&
    selectedSupplyChainId &&
    selectedSupplyChainId.trim().length > 0 &&
    scenarioData.disruptionSeverity > 0 &&
    scenarioData.disruptionDuration > 0
  )

  // Debug logging for form validation (moved to useEffect to avoid render-time side effects)
  useEffect(() => {
    console.log('🔧 Form validation debug:', {
      scenarioName: scenarioData.scenarioName,
      scenarioType: scenarioData.scenarioType,
      affectedNode: scenarioData.affectedNode,
      selectedSupplyChainId: selectedSupplyChainId,
      disruptionSeverity: scenarioData.disruptionSeverity,
      disruptionDuration: scenarioData.disruptionDuration,
      isFormValid: isFormValid
    })
  }, [scenarioData, selectedSupplyChainId, isFormValid])

  useEffect(() => {
    const fetchSupplyChains = async () => {
      if (!userData?.id) {
        toast.error("User not found. Please log in.")
        return
      }

      try {
        const response: ApiResponse = await getUserSupplyChains(userData.id)
        if (response.status === 'success' && response.data) {
          const transformedData = response.data.map((chain: SupplyChainData) => ({
            supply_chain_id: chain.supply_chain_id,
            user_id: chain.user_id ?? null,
            name: chain.name,
            description: chain.description ?? null,
            form_data: chain.form_data ?? {},
            organisation: chain.organisation ?? {},
            timestamp: chain.timestamp ?? null
          }))
          setSupplyChains(transformedData)
          if (transformedData.length > 0) {
            setSelectedSupplyChainId(transformedData[0].supply_chain_id)
            fetchSimulationHistory(transformedData[0].supply_chain_id)
          }
        } else {
          toast.error("Failed to load supply chains")
        }
      } catch (error) {
        console.error('Error fetching supply chains:', error)
        toast.error("Failed to load supply chains")
      }
    }
    
    if (!supplyChains.length && userData?.id) {
      fetchSupplyChains()
    } else if (supplyChains.length > 0 && !selectedSupplyChainId) {
      setSelectedSupplyChainId(supplyChains[0].supply_chain_id)
      fetchSimulationHistory(supplyChains[0].supply_chain_id)
    }
  }, [supplyChains, userData, selectedSupplyChainId])

  const fetchSimulationHistory = async (id: string) => {
    try {
      const sims = await getSimulations(id)
      setSimulationHistory(sims)
    } catch (error) {
      console.error('Error fetching simulation history:', error)
      toast.error("Failed to load simulation history")
    }
  }

  const handleAIScenarioSelect = (scenario: ScenarioData) => {
    updateScenarioData(scenario)
    setView('form')
    toast.success(`Applied "${scenario.scenarioName}" to the builder`)
  }

  const handleForecastScenarioSelect = (scenario: ScenarioData) => {
    updateScenarioData(scenario)
    setView('form')
    toast.success(`Applied AI forecast scenario "${scenario.scenarioName}" to the builder`)
  }

  const handleTemplateSelect = (template: any) => {
    if (template) {
      updateScenarioData(template.scenarioData)
      setView('form')
      toast.success(`Applied "${template.name}" template`)
    }
  }

  const handleStartFromScratch = () => {
    // Reset scenario data to defaults
    updateScenarioData({
      scenarioName: "",
      scenarioType: "",
      disruptionSeverity: 0,
      disruptionDuration: 0,
      affectedNode: "",
      description: "",
      startDate: "",
      endDate: "",
      monteCarloRuns: 1000,
      distributionType: "normal",
      cascadeEnabled: true,
      failureThreshold: 50,
      bufferPercent: 15,
      alternateRouting: true,
      randomSeed: ""
    })
    setView('form')
    toast.success("Started with blank scenario")
  }

  const runSimulation = async () => {
    if (!selectedSupplyChainId) {
      toast.error("Please select a supply chain first")
      return
    }

    if (!isFormValid) {
      toast.error("Please complete all required fields")
      return
    }

    try {
      setView('simulation')
      setSimulationRunning(true)
      setSimulationComplete(false)
      setProgress(0)
      setPendingNavigation(null) // Reset any pending navigation

      // Check for cached simulation first
      console.log('🔍 Checking for cached simulation...')
      const cachedSimulation = await findCachedSimulation(scenarioData, selectedSupplyChainId)
      
      if (cachedSimulation) {
        console.log(`✅ Found cached simulation: ${cachedSimulation.simulation_id}`)
        toast.success("Found existing simulation with same parameters")
        setCurrentSimulation(cachedSimulation)
        
        // Fast progress for cached simulation
        const fastInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              clearInterval(fastInterval)
              setSimulationRunning(false)
              setSimulationComplete(true)
              
              console.log(`✅ Setting navigation for cached results: ${cachedSimulation.simulation_id}`)
              setPendingNavigation(`/simulation/result?id=${cachedSimulation.simulation_id}`)
              
              return 100
            }
            return prev + 25 // Faster progress for cached results
          })
        }, 200)
        
        return
      }

      console.log('📭 No cached simulation found, creating new simulation...')
      
      const newSim: Partial<Simulation> = {
        supply_chain_id: selectedSupplyChainId,
        name: scenarioData.scenarioName,
        scenario_type: scenarioData.scenarioType,
        parameters: {
          severity: scenarioData.disruptionSeverity,
          duration: scenarioData.disruptionDuration,
          affectedNode: scenarioData.affectedNode,
          description: scenarioData.description,
          startDate: scenarioData.startDate,
          endDate: scenarioData.endDate,
          monteCarloRuns: scenarioData.monteCarloRuns,
          distributionType: scenarioData.distributionType,
          cascadeEnabled: scenarioData.cascadeEnabled,
          failureThreshold: scenarioData.failureThreshold,
          bufferPercent: scenarioData.bufferPercent,
          alternateRouting: scenarioData.alternateRouting,
          randomSeed: scenarioData.randomSeed
        },
        status: "running"
      }

      const created = await createSimulationWithCache(newSim, scenarioData)
      setCurrentSimulation(created)

      const simulationConfig = {
        id: created?.simulation_id,
        name: scenarioData.scenarioName,
        type: scenarioData.scenarioType,
        supplyChainId: selectedSupplyChainId,
        parameters: {
          severity: scenarioData.disruptionSeverity,
          duration: scenarioData.disruptionDuration,
          affectedNode: scenarioData.affectedNode,
          description: scenarioData.description,
          startDate: scenarioData.startDate,
          endDate: scenarioData.endDate,
          monteCarloRuns: scenarioData.monteCarloRuns,
          distributionType: scenarioData.distributionType,
          cascadeEnabled: scenarioData.cascadeEnabled,
          failureThreshold: scenarioData.failureThreshold,
          bufferPercent: scenarioData.bufferPercent,
          alternateRouting: scenarioData.alternateRouting,
          randomSeed: scenarioData.randomSeed
        }
      }

      setIsLoading(true)

      // Call the impact assessment agent with the simulation ID
      try {
        console.log(`🎯 Triggering impact assessment for simulation: ${created?.simulation_id}`)
        
        const response = await fetch('/api/agent/impact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            simulationId: created?.simulation_id,
            forceRefresh: true 
          })
        })

        const impactResponse = await response.json()
        
        if (response.ok && impactResponse.success) {
          console.log('✅ Impact assessment completed successfully:', impactResponse)
          toast.success("Impact assessment completed successfully")
          
          // Update simulation with enhanced results
          if (created?.simulation_id && impactResponse.data) {
            await updateSimulation(created.simulation_id, {
              status: "completed",
              result_summary: {
                enhanced_analysis: true,
                impact_assessment_completed: true,
                analysis_timestamp: new Date().toISOString(),
                ...impactResponse.data
              },
              simulated_at: new Date().toISOString()
            })
          }
        } else {
          console.warn('Impact assessment warning:', impactResponse.error)
          toast.warning("Impact assessment completed with warnings")
          
          // Still update simulation as completed but without enhanced data
          if (created?.simulation_id) {
            await updateSimulation(created.simulation_id, {
              status: "completed",
              result_summary: {
                enhanced_analysis: false,
                impact_assessment_completed: false,
                costImpact: "$1.2M",
                timeDelay: "14.5 days",
                inventoryImpact: "-42%",
                recoveryTime: "35 days"
              },
              simulated_at: new Date().toISOString()
            })
          }
        }
      } catch (error) {
        console.error('❌ Error calling impact assessment agent:', error)
        toast.error("Failed to run impact assessment, using basic simulation")
        
        // Fallback: Update simulation as completed without impact assessment
        if (created?.simulation_id) {
          await updateSimulation(created.simulation_id, {
            status: "completed",
            result_summary: {
              enhanced_analysis: false,
              impact_assessment_completed: false,
              error: "Impact assessment failed",
              costImpact: "$1.2M",
              timeDelay: "14.5 days",
              inventoryImpact: "-42%",
              recoveryTime: "35 days"
            },
            simulated_at: new Date().toISOString()
          })
        }
      } finally {
        setIsLoading(false)
      }

        const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setSimulationRunning(false)
            setSimulationComplete(true)
            
            // Set navigation URL for pending navigation
            if (created?.simulation_id) {
              console.log(`✅ Setting navigation for simulation: ${created.simulation_id}`)
              setPendingNavigation(`/simulation/result?id=${created.simulation_id}`)
            } else {
              console.warn('⚠️ No simulation ID available, setting basic results page navigation')
              setPendingNavigation('/simulation/result')
            }

            return 100
          }
          return prev + 10
        })
      }, 500)
    } catch (error) {
      console.error('Error starting simulation:', error)
      toast.error("Failed to start simulation")
      setIsLoading(false)
      setView('form')
    }
  }

  const handleNewSimulation = () => {
    setView('templates')
    setSimulationRunning(false)
    setSimulationComplete(false)
    setProgress(0)
    setPendingNavigation(null) // Reset any pending navigation
    setCurrentSimulation(null)
  }

  // Function to view existing simulation results
  const handleViewSimulationResults = (simulationId: string) => {
    // Navigate directly to results page with simulation ID
    router.push(`/simulation/result?id=${simulationId}`)
  }

  // Handle navigation when simulation is complete
  useEffect(() => {
    if (simulationComplete && pendingNavigation) {
      console.log(`🎯 Navigating to: ${pendingNavigation}`)
      router.push(pendingNavigation)
      setPendingNavigation(null)
      
      if (selectedSupplyChainId) {
        fetchSimulationHistory(selectedSupplyChainId)
      }
    }
  }, [simulationComplete, pendingNavigation, selectedSupplyChainId, router])

  return (
    <div className="relative min-h-full flex-1 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/60 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 overflow-x-hidden">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-gradient-to-br from-purple-400/30 to-pink-400/20 dark:from-purple-900/40 dark:to-pink-900/30 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400/25 to-cyan-400/15 dark:from-blue-900/40 dark:to-cyan-900/30 blur-3xl animate-bounce [animation-duration:8s]"></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-emerald-300/20 to-teal-400/10 dark:from-emerald-900/30 dark:to-teal-900/20 blur-2xl animate-pulse [animation-delay:2s]"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full bg-gradient-to-br from-orange-300/15 to-amber-400/10 dark:from-orange-900/25 dark:to-amber-900/20 blur-3xl animate-pulse [animation-delay:4s]"></div>

        {/* Additional floating elements for depth */}
        <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-gradient-to-br from-rose-300/20 to-pink-300/10 dark:from-rose-900/30 dark:to-pink-900/20 blur-xl animate-bounce [animation-duration:6s] [animation-delay:1s]"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 rounded-full bg-gradient-to-br from-violet-300/15 to-purple-300/10 dark:from-violet-900/25 dark:to-purple-900/20 blur-xl animate-pulse [animation-delay:3s]"></div>
      </div>

      <div className="relative flex flex-col h-full z-10">
        <SimulationHeader />

        <div className="flex-1 overflow-y-auto">
          {view === "templates" && (
            <div className="relative flex flex-col gap-6 p-6 md:gap-8 md:p-8 max-w-full">
              <div className="max-w-7xl mx-auto">
                <div>
                  <h1 className="text-4xl text-center font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                    Supply Chain Risk Simulation
                  </h1>
                  <p className="text-slate-600 text-center pb-10 dark:text-slate-300">
                    Choose from AI-powered scenarios, professional templates, or
                    create custom simulations to test your supply chain
                    resilience
                  </p>
                </div>

                <ProfessionalTemplateSelection
                  onTemplateSelect={handleTemplateSelect}
                  onStartFromScratch={handleStartFromScratch}
                  onAIScenarios={() => setIsAIScenarioOpen(true)}
                  onSelectScenario={handleForecastScenarioSelect}
                />
              </div>
            </div>
          )}

          {view === "form" && (
            <div className="relative">
              <div className="p-4 px-10 space-y-8">
                {/* Enhanced Header Section */}
                <div className="max-w-7xl mx-auto">
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                          Scenario Builder
                        </h1>
                        <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
                          Build and configure supply chain disruption scenarios
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setView("templates")}
                        className="text-sm self-start"
                      >
                        ← Back to Templates
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Enhanced Form Configuration */}
                <div className="max-w-7xl mx-auto">
                  <ScenarioConfigurationForm />
                </div>
              </div>

              {/* Floating Action Button */}
              <FloatingRunButton
                isFormValid={isFormValid}
                onRunSimulation={runSimulation}
                scenarioData={scenarioData}
              />
            </div>
          )}

          {view === "simulation" && simulationRunning && (
            <div className="p-6 px-10">
              <div className="max-w-4xl mx-auto">
                <GlassmorphicCard variant="accent" className="p-12">
                  <SimulationLoader progress={progress} />
                </GlassmorphicCard>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Scenario Suggestions Sheet */}
      <AIScenarioSuggestions
        open={isAIScenarioOpen}
        onOpenChange={setIsAIScenarioOpen}
        onSelectScenario={handleAIScenarioSelect}
      />
    </div>
  );
}

// Wrap component with context provider
export function SimulationPage() {
  return (
    <ScenarioProvider>
      <SimulationPageContent />
    </ScenarioProvider>
  )
}
