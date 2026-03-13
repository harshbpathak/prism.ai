// Enhanced Supply Chain Strategy Agent V2.0
// Production-grade AI agent for comprehensive mitigation strategy generation with real-time intelligence

import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { createGoogleGenerativeAI, google } from '@ai-sdk/google'
import { z } from 'zod'
import { supabaseServer } from '@/lib/supabase/server'
import { Redis } from '@upstash/redis'
import type { Simulation, ImpactResult, Node, Edge, SupplyChain, Strategy } from '@/lib/types/database'
import { createMem0, addMemories, retrieveMemories, getMemories } from '@mem0/vercel-ai-provider'
import { tavily } from '@tavily/core'
import { getAIKeyForModule, AI_MODELS } from '@/lib/ai-config'

// Initialize Redis for advanced caching with TTL strategies
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
})

// Initialize Mem0 with proper configuration
const mem0 = createMem0({
  provider: 'google',
  mem0ApiKey: process.env.MEM0_API_KEY || '',
  apiKey: getAIKeyForModule('agents'),
  config: {
    compatibility: 'strict',
  }
});

// Initialize Tavily for real-time strategy intelligence
const tavilyClient = tavily({
  apiKey: process.env.TAVILY_API_KEY || ''
});

// Mem0 configuration constants for strategy agent
const MEM0_CONFIG = {
  user_id: 'strategy-agent', 
  org_id: process.env.MEM0_ORG_ID || '',
  project_id: process.env.MEM0_PROJECT_ID || '',
  app_id: 'prism-strategy-agent',
  agent_id: 'supply-chain-strategy-agent',
  run_id: `strategy-run-${Date.now()}`
};

// Enhanced Strategy Schema for AI generation
const MitigationStrategySchema = z.object({
  id: z.number().describe('Unique strategy identifier'),
  title: z.string().describe('Clear, actionable strategy title'),
  description: z.string().describe('Detailed description of the mitigation strategy'),
  priority: z.enum(['Critical', 'High', 'Medium', 'Low', 'Strategic']).describe('Priority level based on urgency and impact'),
  timeframe: z.string().describe('Implementation timeframe (e.g., "0-24 hours", "1-3 days", "30-90 days")'),
  costEstimate: z.string().describe('Cost estimate with currency symbol (e.g., "$120K", "$2.1M")'),
  impactReduction: z.string().describe('Expected impact reduction percentage (e.g., "25%", "60%")'),
  status: z.enum(['ready', 'planning', 'recommended', 'in-progress', 'completed']).describe('Current implementation status'),
  category: z.enum(['immediate', 'shortTerm', 'longTerm']).describe('Strategy category based on timeframe'),
  feasibility: z.enum(['HIGH', 'MEDIUM', 'LOW']).describe('Implementation feasibility'),
  dependencies: z.array(z.string()).describe('Required dependencies or prerequisites'),
  riskFactors: z.array(z.string()).describe('Potential risks or challenges in implementation'),
  successMetrics: z.array(z.string()).describe('Key metrics to measure strategy success'),
  resourceRequirements: z.object({
    personnel: z.number().describe('Number of personnel required'),
    equipment: z.array(z.string()).describe('Required equipment or technology'),
    partnerships: z.array(z.string()).describe('Required external partnerships or vendors')
  }).describe('Resource requirements for implementation')
})

const StrategyAnalysisSchema = z.object({
  immediate: z.array(MitigationStrategySchema).describe('Immediate response strategies (0-24 hours)'),
  shortTerm: z.array(MitigationStrategySchema).describe('Short-term strategies (1-30 days)'),
  longTerm: z.array(MitigationStrategySchema).describe('Long-term strategic initiatives (30+ days)'),
  riskMitigationMetrics: z.object({
    currentRisk: z.number().min(0).max(100).describe('Current risk level score'),
    targetRisk: z.number().min(0).max(100).describe('Target risk level after implementation'),
    costToImplement: z.string().describe('Total cost to implement all strategies'),
    expectedROI: z.string().describe('Expected return on investment'),
    paybackPeriod: z.string().describe('Expected payback period'),
    riskReduction: z.string().describe('Overall risk reduction percentage')
  }).describe('Overall risk mitigation metrics'),
  keyInsights: z.array(z.string()).describe('Key strategic insights and recommendations'),
  marketIntelligence: z.array(z.string()).describe('Relevant market intelligence and trends'),
  bestPractices: z.array(z.string()).describe('Industry best practices and lessons learned'),
  contingencyPlans: z.array(z.string()).describe('Contingency plans for strategy failure scenarios')
})

// Production Strategy Agent Class
class ProductionStrategyAgent {

  constructor() {
    console.log('🚀 Production Strategy Agent V2.0 initialized with Mem0 and Tavily integration')
  }

  // Enhanced cache management for strategy recommendations
  public async getCachedStrategyAnalysis(simulationId: string): Promise<any | null> {
    try {
      const cacheKey = `strategy_analysis_v2:${simulationId}`
      const cached = await redis.get(cacheKey)
      
      if (cached) {
        console.log(`📋 Retrieved cached strategy analysis for simulation ${simulationId}`)
        return cached
      }
      
      return null
    } catch (error) {
      console.error('❌ Cache retrieval error:', error)
      return null
    }
  }

  public async cacheStrategyAnalysis(simulationId: string, analysis: any): Promise<void> {
    try {
      const cacheKey = `strategy_analysis_v2:${simulationId}`
      const ttl = 3600 // 1 hour for strategy analysis
      await redis.setex(cacheKey, ttl, JSON.stringify(analysis))
      
      console.log(`💾 Cached strategy analysis for simulation ${simulationId} (TTL: ${ttl}s)`)
    } catch (error) {
      console.error('❌ Cache storage error:', error)
    }
  }

  /**
   * Gather comprehensive data for strategy generation
   */
  private async gatherStrategyData(simulationId: string): Promise<{
    simulation: Simulation,
    supplyChain: SupplyChain,
    nodes: Node[],
    edges: Edge[],
    impactResults: ImpactResult[],
    existingStrategies: Strategy[]
  }> {
    try {
      console.log(`🔍 Gathering comprehensive data for strategy generation: ${simulationId}`)

      // Fetch simulation details
      const { data: simulation, error: simError } = await supabaseServer
        .from('simulations')
        .select('*')
        .eq('simulation_id', simulationId)
        .single()

      if (simError) throw simError

      // Fetch supply chain details
      const { data: supplyChain, error: scError } = await supabaseServer
        .from('supply_chains')
        .select('*')
        .eq('supply_chain_id', simulation.supply_chain_id)
        .single()

      if (scError) throw scError

      // Fetch nodes and edges
      const [nodesResult, edgesResult] = await Promise.all([
        supabaseServer.from('nodes').select('*').eq('supply_chain_id', simulation.supply_chain_id),
        supabaseServer.from('edges').select('*').eq('supply_chain_id', simulation.supply_chain_id)
      ])

      if (nodesResult.error) throw nodesResult.error
      if (edgesResult.error) throw edgesResult.error

      // Fetch impact results
      const { data: impactResults, error: impactError } = await supabaseServer
        .from('impact_results')
        .select('*')
        .eq('simulation_id', simulationId)

      if (impactError) throw impactError

      // Fetch existing strategies
      const { data: existingStrategies, error: strategiesError } = await supabaseServer
        .from('strategies')
        .select('*')
        .eq('simulation_id', simulationId)

      if (strategiesError) throw strategiesError

      return {
        simulation,
        supplyChain,
        nodes: nodesResult.data || [],
        edges: edgesResult.data || [],
        impactResults: impactResults || [],
        existingStrategies: existingStrategies || []
      }
    } catch (error) {
      console.error('❌ Error gathering strategy data:', error)
      throw error
    }
  }

  /**
   * Build memory context from previous strategy implementations
   */
  async buildStrategyMemoryContext(supplyChainId: string, scenarioType: string): Promise<string> {
    let memoryContext = ''
    
    try {
      if (!process.env.MEM0_API_KEY) {
        console.log('📝 Mem0 API key not available, skipping memory context')
        return 'Memory context not available (Mem0 API key not configured)'
      }

      // Build search queries for strategy-related memories
      const searchQueries = [
        `strategy implementation ${scenarioType} supply chain ${supplyChainId}`,
        `mitigation strategy success ${scenarioType}`,
        `supply chain recovery ${scenarioType} lessons learned`,
        `risk reduction strategy ${scenarioType}`,
        `contingency plan ${scenarioType} best practices`
      ]

      // Retrieve memories using multiple search strategies
      const memoryPromises = searchQueries.map(async (query) => {
        try {
          return await getMemories(query, {
            user_id: `strategy-chain-${supplyChainId}`,
            mem0ApiKey: process.env.MEM0_API_KEY
          })
        } catch (error) {
          console.warn(`Memory retrieval failed for query: ${query}`, error)
          return []
        }
      })

      const memoryResults = await Promise.allSettled(memoryPromises)
      const allMemories = memoryResults
        .filter((result): result is PromiseFulfilledResult<any[]> => result.status === 'fulfilled')
        .flatMap(result => result.value)
        .filter(Boolean)

      // Remove duplicates and get most relevant memories
      const uniqueMemories = Array.from(
        new Map(allMemories.map(m => [m.id || m.content || m.text, m])).values()
      )

      console.log(`🧠 Retrieved ${uniqueMemories.length} unique strategy memories`)

      if (uniqueMemories.length === 0) {
        return 'No historical strategy implementation data available for this supply chain'
      }

      // Filter memories by scenario type for more relevant context
      const relevantMemories = uniqueMemories.filter((memory: any) => {
        const memContent = (memory.content || memory.text || '').toLowerCase()
        return memContent.includes(scenarioType.toLowerCase()) || 
               memContent.includes('strategy') || 
               memContent.includes('mitigation')
      }).slice(0, 5)

      if (relevantMemories.length > 0) {
        memoryContext += `\nHISTORICAL STRATEGY IMPLEMENTATIONS (${scenarioType}):\n`
        relevantMemories.forEach((memory: any, index: number) => {
          const memText = memory.content || memory.text || memory.memory || ''
          memoryContext += `\n${index + 1}. ${memText.substring(0, 300)}...\n`
          
          if (memory.metadata) {
            if (memory.metadata.success_rate) {
              memoryContext += `   - Success Rate: ${memory.metadata.success_rate}\n`
            }
            if (memory.metadata.cost_effectiveness) {
              memoryContext += `   - Cost Effectiveness: ${memory.metadata.cost_effectiveness}\n`
            }
            if (memory.metadata.implementation_time) {
              memoryContext += `   - Implementation Time: ${memory.metadata.implementation_time}\n`
            }
          }
        })
      }

      return memoryContext || 'Limited historical strategy context available'
    } catch (error) {
      console.error('❌ Error building strategy memory context:', error)
      return 'Error retrieving historical strategy context'
    }
  }

  /**
   * Gather real-time market intelligence using Tavily
   */
  async gatherMarketIntelligence(scenarioType: string, supplyChainType: string, geographicRegion: string): Promise<string[]> {
    const marketIntelligence: string[] = []
    
    try {
      if (!process.env.TAVILY_API_KEY) {
        console.log('📡 Tavily API key not available, skipping market intelligence')
        return ['Market intelligence unavailable (Tavily API key not configured)']
      }

      // Build strategic search queries for market intelligence
      const searchQueries = [
        `${scenarioType} supply chain mitigation strategies best practices 2024`,
        `${supplyChainType} supply chain resilience ${geographicRegion}`,
        `supply chain risk management ${scenarioType} case studies`,
        `alternative sourcing strategies ${scenarioType} disruption`,
        `supply chain contingency planning ${scenarioType} lessons learned`
      ]

      console.log(`📡 Gathering market intelligence with ${searchQueries.length} search queries`)

      for (const query of searchQueries) {
        try {
          const searchResult = await tavilyClient.search(query, {
            searchDepth: 'basic',
            maxResults: 3,
            includeAnswer: true,
            includeDomains: ['mckinsey.com', 'supplychainbrain.com', 'logisticsmgmt.com', 'reuters.com', 'bloomberg.com']
          })

          if (searchResult.answer) {
            marketIntelligence.push(`Market Intelligence: ${searchResult.answer}`)
          }

          // Extract key insights from search results
          if (searchResult.results && searchResult.results.length > 0) {
            searchResult.results.forEach((result: any) => {
              if (result.content && result.content.length > 100) {
                const insight = result.content.substring(0, 200) + '...'
                marketIntelligence.push(`Industry Insight: ${insight} (Source: ${result.url})`)
              }
            })
          }
        } catch (searchError) {
          console.warn(`Tavily search failed for query: ${query}`, searchError)
        }
      }

      console.log(`📊 Gathered ${marketIntelligence.length} market intelligence insights`)
      return marketIntelligence.slice(0, 10) // Limit to top 10 insights

    } catch (error) {
      console.error('❌ Error gathering market intelligence:', error)
      return ['Error retrieving market intelligence']
    }
  }

  /**
   * Generate comprehensive strategy analysis using AI
   */
  async generateStrategyAnalysis(
    strategyData: any, 
    memoryContext: string, 
    marketIntelligence: string[]
  ): Promise<any> {
    console.log('🤖 Generating AI-powered strategy analysis')
    
    try {
      const analysisPrompt = `
As an expert supply chain strategy consultant with deep knowledge of risk mitigation and business continuity, analyze this supply chain disruption scenario and provide comprehensive mitigation strategies.

SUPPLY CHAIN CONTEXT:
${JSON.stringify(strategyData.supplyChain, null, 2)}

DISRUPTION SCENARIO:
${JSON.stringify(strategyData.simulation, null, 2)}

NETWORK TOPOLOGY:
- Total Nodes: ${strategyData.nodes.length}
- Total Edges: ${strategyData.edges.length}
- Critical Infrastructure: ${strategyData.nodes.filter((n: any) => n.node_type === 'Infrastructure').length} nodes
- High-Risk Nodes: ${strategyData.nodes.filter((n: any) => n.risk_level > 70).length} nodes

IMPACT ASSESSMENT:
${JSON.stringify(strategyData.impactResults, null, 2)}

EXISTING STRATEGIES:
${strategyData.existingStrategies.length > 0 ? JSON.stringify(strategyData.existingStrategies, null, 2) : 'No existing strategies implemented'}

HISTORICAL CONTEXT:
${memoryContext}

MARKET INTELLIGENCE:
${marketIntelligence.join('\n')}

REQUIREMENTS:
1. Generate immediate strategies (0-24 hours) for crisis response
2. Develop short-term strategies (1-30 days) for stabilization
3. Create long-term strategies (30+ days) for resilience building
4. Provide realistic cost estimates and implementation timeframes
5. Include feasibility assessment and resource requirements
6. Consider industry best practices and lessons learned
7. Account for geographic, regulatory, and market constraints
8. Provide contingency plans for strategy failures

Focus on actionable, specific strategies with clear success metrics and implementation steps.
      `

      // Configure Google provider with dedicated key if available
      const google = createGoogleGenerativeAI({
        apiKey: getAIKeyForModule('agents')
      });

      const result = await generateObject({
        model: google(AI_MODELS.agents),
        schema: StrategyAnalysisSchema,
        prompt: analysisPrompt,
        maxTokens: 6000,
        temperature: 0.2 // Lower temperature for more consistent strategy recommendations
      })

      return result.object
    } catch (error) {
      console.error('❌ Error in AI strategy analysis generation:', error)
      throw error
    }
  }

  /**
   * Store strategy analysis results in database
   */
  async storeStrategyResults(simulationId: string, strategyAnalysis: any): Promise<void> {
    try {
      console.log(`💾 Storing strategy analysis results for simulation ${simulationId}`)

      // Prepare strategies for database insertion
      const allStrategies = [
        ...strategyAnalysis.immediate.map((s: any) => ({ ...s, category: 'immediate' })),
        ...strategyAnalysis.shortTerm.map((s: any) => ({ ...s, category: 'shortTerm' })),
        ...strategyAnalysis.longTerm.map((s: any) => ({ ...s, category: 'longTerm' }))
      ]

      // Transform strategies to match database schema
      const strategiesForDB = allStrategies.map((strategy: any) => ({
        simulation_id: simulationId,
        strategy_title: strategy.title,
        description: strategy.description,
        details: {
          priority: strategy.priority,
          timeframe: strategy.timeframe,
          category: strategy.category,
          feasibility: strategy.feasibility,
          dependencies: strategy.dependencies,
          riskFactors: strategy.riskFactors,
          successMetrics: strategy.successMetrics,
          resourceRequirements: strategy.resourceRequirements,
          impactReduction: strategy.impactReduction
        },
        estimated_roi: parseFloat(strategyAnalysis.riskMitigationMetrics.expectedROI.replace(/[^0-9.]/g, '') || '0'),
        cost_estimate: parseFloat(strategy.costEstimate.replace(/[^0-9.]/g, '') || '0'),
        risk_reduction: parseFloat(strategy.impactReduction.replace(/[^0-9.]/g, '') || '0'),
        implementation_time: strategy.timeframe,
        complexity: strategy.feasibility,
        status: strategy.status,
        tags: [strategy.category, strategy.priority.toLowerCase(), strategy.feasibility.toLowerCase()],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      // Delete existing strategies for this simulation
      await supabaseServer
        .from('strategies')
        .delete()
        .eq('simulation_id', simulationId)

      // Insert new strategies
      const { error: insertError } = await supabaseServer
        .from('strategies')
        .insert(strategiesForDB)

      if (insertError) {
        console.error('❌ Error storing strategies:', insertError)
        throw insertError
      }

      // Update simulation with strategy summary
      const { error: updateError } = await supabaseServer
        .from('simulations')
        .update({
          result_summary: {
            ...strategyAnalysis,
            strategy_generation: true,
            strategy_timestamp: new Date().toISOString()
          }
        })
        .eq('simulation_id', simulationId)

      if (updateError) {
        console.error('❌ Error updating simulation with strategy summary:', updateError)
        throw updateError
      }

      console.log('✅ Successfully stored strategy analysis results')
    } catch (error) {
      console.error('❌ Error storing strategy results:', error)
      throw error
    }
  }

  /**
   * Store strategy memory for future reference
   */
  async storeStrategyMemory(simulationId: string, strategyData: any, strategyAnalysis: any): Promise<boolean> {
    if (!process.env.MEM0_API_KEY) {
      console.log('📝 Mem0 API key not available, skipping memory storage')
      return false
    }
    
    try {
      // Create rich, structured memory about the strategy analysis
      const memoryText = `
SUPPLY CHAIN STRATEGY ANALYSIS:

Scenario Details:
- Scenario: ${strategyData.simulation.name}
- Type: ${strategyData.simulation.scenario_type}
- Supply Chain: ${strategyData.supplyChain.name}
- Organization: ${strategyData.supplyChain.organisation || 'Unknown'}
- Analysis Date: ${new Date().toISOString()}

RISK MITIGATION METRICS:
- Current Risk Level: ${strategyAnalysis.riskMitigationMetrics.currentRisk}%
- Target Risk Level: ${strategyAnalysis.riskMitigationMetrics.targetRisk}% 
- Total Implementation Cost: ${strategyAnalysis.riskMitigationMetrics.costToImplement}
- Expected ROI: ${strategyAnalysis.riskMitigationMetrics.expectedROI}
- Payback Period: ${strategyAnalysis.riskMitigationMetrics.paybackPeriod}
- Risk Reduction: ${strategyAnalysis.riskMitigationMetrics.riskReduction}

STRATEGY IMPLEMENTATION SUMMARY:
- Immediate Strategies: ${strategyAnalysis.immediate.length} (0-24 hour response)
- Short-term Strategies: ${strategyAnalysis.shortTerm.length} (1-30 day stabilization)
- Long-term Strategies: ${strategyAnalysis.longTerm.length} (30+ day resilience)

TOP IMMEDIATE STRATEGIES:
${strategyAnalysis.immediate.slice(0, 3).map((s: any, i: number) => 
  `${i + 1}. ${s.title} - ${s.impactReduction} reduction (${s.costEstimate})`
).join('\n')}

KEY STRATEGIC INSIGHTS:
${strategyAnalysis.keyInsights.slice(0, 5).map((insight: string, i: number) => `${i + 1}. ${insight}`).join('\n')}

MARKET INTELLIGENCE APPLIED:
${strategyAnalysis.marketIntelligence.slice(0, 3).map((intel: string, i: number) => `${i + 1}. ${intel}`).join('\n')}

IMPLEMENTATION SUCCESS FACTORS:
- Strategy Coverage: Immediate + Short-term + Long-term approach
- Cost-Benefit Analysis: ${strategyAnalysis.riskMitigationMetrics.expectedROI} ROI expected
- Risk Mitigation: ${strategyAnalysis.riskMitigationMetrics.riskReduction} overall reduction
- Implementation Feasibility: Mixed (detailed in individual strategies)
      `

      // Create memory messages using the correct format
      const memoryMessages = [{
        role: 'user' as const,
        content: [{
          type: 'text' as const,
          text: memoryText
        }]
      }]

      // Store memory with comprehensive metadata
      await addMemories(memoryMessages, {
        user_id: `strategy-chain-${strategyData.simulation.supply_chain_id}`,
        mem0ApiKey: process.env.MEM0_API_KEY
      })

      console.log(`🧠 Stored comprehensive strategy memory for simulation ${simulationId}`)
      return true
    } catch (error: any) {
      console.error('❌ Error storing strategy memory:', error)
      return false
    }
  }

  /**
   * Main method for comprehensive strategy analysis
   */
  public async conductComprehensiveStrategyAnalysis(simulationId: string): Promise<any> {
    const startTime = Date.now()
    console.log(`🚀 Starting comprehensive strategy analysis for simulation ${simulationId}`)

    try {
      // Check cache first
      const cachedResult = await this.getCachedStrategyAnalysis(simulationId)
      if (cachedResult) {
        console.log('📋 Returning cached strategy analysis')
        return cachedResult
      }

      // Gather comprehensive data
      const strategyData = await this.gatherStrategyData(simulationId)
      
      // Build memory context from previous strategy implementations
      const memoryContext = await this.buildStrategyMemoryContext(
        strategyData.simulation.supply_chain_id,
        strategyData.simulation.scenario_type
      )

      // Gather real-time market intelligence
      const marketIntelligence = await this.gatherMarketIntelligence(
        strategyData.simulation.scenario_type,
        strategyData.supplyChain.name,
        'Global' // Could be extracted from supply chain metadata
      )

      // Generate comprehensive strategy analysis using AI
      const strategyAnalysis = await this.generateStrategyAnalysis(
        strategyData,
        memoryContext,
        marketIntelligence
      )

      // Store results in database
      await this.storeStrategyResults(simulationId, strategyAnalysis)
      
      // Store in memory for future context
      await this.storeStrategyMemory(simulationId, strategyData, strategyAnalysis)

      // Cache the results
      await this.cacheStrategyAnalysis(simulationId, strategyAnalysis)

      const processingTime = Date.now() - startTime
      console.log(`✅ Comprehensive strategy analysis completed in ${processingTime}ms`)

      return {
        ...strategyAnalysis,
        processingTime,
        enhanced: true,
        memoryContextAvailable: memoryContext !== 'Memory context not available (Mem0 API key not configured)',
        marketIntelligenceGathered: marketIntelligence.length > 1
      }

    } catch (error) {
      console.error('❌ Error in comprehensive strategy analysis:', error)
      throw error
    }
  }
}

// API Route Handlers
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(request.url)
    const simulationId = searchParams.get('simulationId')
    
    if (!simulationId) {
      return NextResponse.json({
        success: false,
        error: 'Simulation ID is required'
      }, { status: 400 })
    }

    console.log(`🎯 GET Strategy analysis for simulation: ${simulationId}`)
    
    const agent = new ProductionStrategyAgent()
    const result = await agent.conductComprehensiveStrategyAnalysis(simulationId)
    
    return NextResponse.json({
      success: true,
      data: result,
      processingTime: Date.now() - startTime
    })
    
  } catch (error) {
    console.error('❌ GET Strategy analysis error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      fallback: true
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { simulationId, forceRefresh = false } = body
    
    if (!simulationId) {
      return NextResponse.json({
        success: false,
        error: 'Simulation ID is required'
      }, { status: 400 })
    }

    console.log(`🎯 POST Strategy analysis for simulation: ${simulationId} (force: ${forceRefresh})`)
    
    const agent = new ProductionStrategyAgent()
    
    // Clear cache if force refresh is requested
    if (forceRefresh) {
      await redis.del(`strategy_analysis_v2:${simulationId}`)
      console.log('🗑️ Cache cleared for force refresh')
    }
    
    const result = await agent.conductComprehensiveStrategyAnalysis(simulationId)
    
    return NextResponse.json({
      success: true,
      data: result,
      enhanced: true,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ POST Strategy analysis error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}
