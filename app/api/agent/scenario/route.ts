/**
 * Production Scenario Generator Agent (ADK Version)
 * Generates realistic "What-if" supply chain disruption scenarios
 */

import { NextRequest, NextResponse } from 'next/server';
import { AgentBuilder, AiSdkLlm } from "@iqai/adk";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { supabaseServer } from '@/lib/supabase/server';
import { getAIKeyForModule, AI_MODELS } from '@/lib/ai-config';

/**
 * Production Scenario Agent
 */
class ProductionScenarioAgent {
  async generateScenarios(supplyChainId: string, scenarioCount: number = 3) {
    console.log(`[SCENARIO-AGENT] 🎭 Generating ${scenarioCount} scenarios via ADK for ${supplyChainId}`);

    try {
      // 1. Fetch supply chain structure
      const { data: chain, error: chainError } = await supabaseServer
        .from('supply_chains')
        .select(`*, nodes(*)`)
        .eq('supply_chain_id', supplyChainId)
        .single();

      if (chainError || !chain) throw new Error("Supply chain not found");

      // 2. Prepare Prompt
      const prompt = `
        Supply Chain Context: ${chain.name} - ${chain.description}
        Nodes: ${JSON.stringify(chain.nodes || [])}
        
        Generate exactly ${scenarioCount} realistic disruption scenarios.
        Each scenario should include:
        - scenarioName: Short title
        - scenarioType: e.g., NATURAL_DISASTER, CYBER_ATTACK, GEOPOLITICAL
        - disruptionSeverity: 0-100 score
        - affectedNode: ID of the primary node affected
        - description: Detailed description of the event
        - probability: 0-1 score
        
        Return the response as a valid JSON array of scenario objects.
      `;

      // Configure the model using centralized settings
      const google = createGoogleGenerativeAI({
        apiKey: getAIKeyForModule("agents"),
      });

      // 3. Execute via ADK
      const response = await AgentBuilder.create("scenario_agent")
        .withDescription("Simulates supply chain disruptions")
        .withInstruction("You are a risk modeling expert. Create diverse, high-impact, and realistic scenarios based on the provided supply chain structure.")
        .withModel(new AiSdkLlm(google(AI_MODELS.agents) as any))
        .ask(prompt);

      // 4. Parse JSON
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      const scenarios = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

      // 5. Store scenarios in Supabase
      const dbRecords = scenarios.map((s: any) => ({
        supply_chain_id: supplyChainId,
        name: s.scenarioName,
        scenario_type: s.scenarioType,
        parameters: s,
        status: 'generated'
      }));

      await supabaseServer
        .from('simulations')
        .insert(dbRecords);

      return {
        success: true,
        scenarios,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[SCENARIO-AGENT] ❌ Error:', error);
      throw error;
    }
  }
}

// API Routes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { supplyChainId, scenarioCount = 3 } = body;

    if (!supplyChainId) return NextResponse.json({ error: "Missing supplyChainId" }, { status: 400 });

    const agent = new ProductionScenarioAgent();
    const result = await agent.generateScenarios(supplyChainId, scenarioCount);
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal Error" 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const supplyChainId = searchParams.get('supplyChainId');
  if (!supplyChainId) return NextResponse.json({ error: "Missing supplyChainId" }, { status: 400 });

  const agent = new ProductionScenarioAgent();
  const result = await agent.generateScenarios(supplyChainId);
  return NextResponse.json(result);
}