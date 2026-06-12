/**
 * Enhanced Supply Chain Strategy Agent V2.0 (ADK Version)
 * Production-grade AI agent for comprehensive mitigation strategy generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { LlmAgent, FunctionTool, Gemini, InMemoryRunner, stringifyContent } from "@google/adk";
import { withTrace } from '../../../../lib/adk/core/trace';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { tavily } from '@tavily/core';
import { getAIKeyForModule, AI_MODELS } from '@/lib/ai-config';


/**
 * Tavily Strategic Search Tool
 */
const strategyIntelligenceTool = new FunctionTool({
  name: "strategy_intelligence",
  description: "Search for industry best practices, mitigation strategies, and market resilience trends.",
  parameters: z.object({ query: z.string() }),
  execute: async (args) => {
    if (!process.env.TAVILY_API_KEY) return { error: "Tavily API key missing" };
    const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });
    const result = await tavilyClient.search(args.query, { 
      searchDepth: "advanced",
      maxResults: 3 
    });
    return result;
  }
});

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
        - immediate: Array of strategies (0-24h). Each must have a 'priority' field ('low', 'medium', 'high', 'critical').
        - shortTerm: Array of strategies (1-30d). Each must have a 'priority' field ('low', 'medium', 'high', 'critical').
        - longTerm: Array of strategies (30d+). Each must have a 'priority' field ('low', 'medium', 'high', 'critical').
        - riskMitigationMetrics: Object with currentRisk (0-100), targetRisk, and expectedROI.
      `;

      const traceId = `strategy-${Date.now()}`;
      const traceResult = await withTrace(traceId, 'StrategyAgent', async () => {
        const agent = new LlmAgent({
          name: "strategy_agent",
          description: "Generates strategic resilience plans",
          instruction: "You are a senior supply chain risk consultant. Provide highly actionable and data-driven mitigation strategies.",
          model: new Gemini({ 
            model: AI_MODELS.agents, 
            apiKey: getAIKeyForModule("agents")
          }),
          tools: [strategyIntelligenceTool]
        });

        const runner = new InMemoryRunner({ appName: 'strategy', agent });
        let finalContent = "";
        for await (const event of runner.runEphemeral({
          userId: 'system',
          newMessage: { role: 'user', parts: [{ text: prompt }] }
        })) {
          const text = stringifyContent(event);
          if (text) finalContent += text;
        }
        
        return { success: true, data: finalContent };
      });

      if (!traceResult.success) throw new Error(traceResult.error);
      const response = traceResult.data as string;

      // 5. Parse and Store Results
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const strategyAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Failed to parse strategy JSON" };

      // Human-in-the-Loop Checkpoint
      const isCriticalRisk = strategyAnalysis.riskMitigationMetrics?.currentRisk > 80;
      const hasCriticalStrategy = [...(strategyAnalysis.immediate || []), ...(strategyAnalysis.shortTerm || [])]
        .some((s: any) => s.priority === 'critical');

      const requiresApproval = isCriticalRisk || hasCriticalStrategy;

      if (requiresApproval) {
        console.log(`[STRATEGY-AGENT] 🛑 HITL Gate Triggered! Critical risk detected for simulation ${simulationId}`);
        // Save as pending_approval
        await supabaseServer
          .from('simulations')
          .update({
            result_summary: {
              ...strategyAnalysis,
              approval_status: 'pending_approval',
              strategy_timestamp: new Date().toISOString()
            }
          })
          .eq('simulation_id', simulationId);

        return {
          ...strategyAnalysis,
          status: 'requires_approval',
          message: 'Critical risk detected. Human approval required before implementation.'
        };
      }

      // Normal flow - Update simulation with result summary
      await supabaseServer
        .from('simulations')
        .update({
          result_summary: {
            ...strategyAnalysis,
            approval_status: 'auto_approved',
            strategy_timestamp: new Date().toISOString()
          }
        })
        .eq('simulation_id', simulationId);

      return {
        ...strategyAnalysis,
        status: 'completed'
      };
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
  try {
    const { searchParams } = new URL(request.url);
    const simulationId = searchParams.get('simulationId');
    if (!simulationId) return NextResponse.json({ error: "Missing simulationId" }, { status: 400 });

    const agent = new ProductionStrategyAgent();
    const result = await agent.conductComprehensiveStrategyAnalysis(simulationId);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('GET Strategy Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal Error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
