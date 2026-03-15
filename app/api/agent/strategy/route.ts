/**
 * Enhanced Supply Chain Strategy Agent V2.0 (ADK Version)
 * Production-grade AI agent for comprehensive mitigation strategy generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { AgentBuilder, BaseTool, AiSdkLlm } from "@iqai/adk";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { supabaseServer } from '@/lib/supabase/server';
import { Redis } from '@upstash/redis';
import { tavily } from '@tavily/core';
import { getAIKeyForModule, AI_MODELS } from '@/lib/ai-config';

// Initialize Redis for caching
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
});

/**
 * Tavily Strategic Search Tool
 */
class StrategyIntelligenceTool extends BaseTool {
  constructor() {
    super({
      name: "strategy_intelligence",
      description: "Search for industry best practices, mitigation strategies, and market resilience trends."
    });
  }

  getDeclaration(): any {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" }
        },
        required: ["query"]
      }
    };
  }

  async runAsync(args: { query: string }) {
    if (!process.env.TAVILY_API_KEY) return { error: "Tavily API key missing" };
    const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });
    const result = await tavilyClient.search(args.query, { 
      searchDepth: "advanced",
      maxResults: 3 
    });
    return result;
  }
}

/**
 * Production Strategy Agent
 */
class ProductionStrategyAgent {
  async conductComprehensiveStrategyAnalysis(simulationId: string) {
    console.log(`[STRATEGY-AGENT] 🚀 Analysis via ADK for simulation: ${simulationId}`);
    
    try {
      // 1. Fetch simulation and supply chain details
      const { data: simulation, error: simError } = await supabaseServer
        .from('simulations')
        .select(`*, supply_chains(*)`)
        .eq('simulation_id', simulationId)
        .single();

      if (simError || !simulation) throw new Error("Simulation or Supply Chain not found");

      // 2. Fetch impact results
      const { data: impactResults } = await supabaseServer
        .from('impact_results')
        .select('*')
        .eq('simulation_id', simulationId);

      // 3. Prepare Prompt for ADK
      const prompt = `
        Disruption Scenario: ${simulation.name} (${simulation.scenario_type})
        Supply Chain: ${simulation.supply_chains.name}
        Impact Assessment: ${JSON.stringify(impactResults || [])}
        
        Using the strategy_intelligence tool, research best practices for this type of disruption.
        Then, generate a comprehensive strategic mitigation plan.
        
        Structure your response as a valid JSON object with:
        - immediate: Array of strategies (0-24h)
        - shortTerm: Array of strategies (1-30d)
        - longTerm: Array of strategies (30d+)
        - riskMitigationMetrics: Object with currentRisk, targetRisk, and expectedROI.
      `;

      // Configure the model using centralized settings
      const google = createGoogleGenerativeAI({
        apiKey: getAIKeyForModule("agents"),
      });

      // 4. Execute via ADK
      const response = await AgentBuilder.create("strategy_agent")
        .withDescription("Generates strategic resilience plans")
        .withInstruction("You are a senior supply chain risk consultant. Provide highly actionable and data-driven mitigation strategies.")
        .withModel(new AiSdkLlm(google(AI_MODELS.agents) as any))
        .withTools(new StrategyIntelligenceTool())
        .ask(prompt);

      // 5. Parse and Store Results
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const strategyAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Failed to parse strategy JSON" };

      // Update simulation with result summary
      await supabaseServer
        .from('simulations')
        .update({
          result_summary: {
            ...strategyAnalysis,
            strategy_timestamp: new Date().toISOString()
          }
        })
        .eq('simulation_id', simulationId);

      return strategyAnalysis;
    } catch (error) {
      console.error('[STRATEGY-AGENT] ❌ Error:', error);
      throw error;
    }
  }
}

// API Routes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { simulationId } = body;
    
    if (!simulationId) return NextResponse.json({ error: "Missing simulationId" }, { status: 400 });

    const agent = new ProductionStrategyAgent();
    const result = await agent.conductComprehensiveStrategyAnalysis(simulationId);
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal Error" 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const simulationId = searchParams.get('simulationId');
  if (!simulationId) return NextResponse.json({ error: "Missing simulationId" }, { status: 400 });

  const agent = new ProductionStrategyAgent();
  const result = await agent.conductComprehensiveStrategyAnalysis(simulationId);
  return NextResponse.json({ success: true, data: result });
}
