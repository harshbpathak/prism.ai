import { NextRequest, NextResponse } from 'next/server';
import { AgentBuilder, BaseTool, AiSdkLlm } from '@iqai/adk';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getAIKeyForModule, AI_MODELS } from '../../../../lib/ai-config';

// Import coordination utilities and types
import { agentTools } from '../../coordination/agent-tools';
import {
  createCoordinationSession,
  determineStartingAgent,
  calculateWorkflowEfficiency,
  type OrchestratorRequest,
  type OrchestratorResponse,
  type CoordinationStep
} from '../../coordination/types';

export const maxDuration = 60;

/**
 * Universal ADK Tool wrapper for existing agent tools
 */
class AdkOrchestratorTool extends BaseTool {
  toolDef: any;
  logs: CoordinationStep[];
  
  constructor(name: string, description: string, toolDef: any, logs: CoordinationStep[]) {
    super({ name, description });
    this.toolDef = toolDef;
    this.logs = logs;
  }
  
  getDeclaration(): any {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: "object",
        properties: {
          nodeId: { type: "string", description: "Target node ID" },
          userId: { type: "string" },
          focusArea: { type: "string" },
          timeHorizon: { type: "string" },
          disruptionType: { type: "string" }
        },
        required: ["nodeId"]
      }
    };
  }
  
  async runAsync(args: any) {
    const startTime = Date.now();
    try {
      const result = await this.toolDef.execute(args, {} as any);
      
      this.logs.push({
        stepNumber: this.logs.length + 1,
        agent: this.name.replace('generate', '').replace('gather', '').replace('assess', '').toLowerCase(),
        action: `Executed ${this.name}`,
        reasoning: `Analysis required calling ${this.name} for comprehensive supply chain intelligence.`,
        input: args,
        output: result,
        processingTime: Date.now() - startTime,
      });
      
      return JSON.stringify(result);
    } catch (e: any) {
      console.error(`Error in ADK tool ${this.name}:`, e);
      return JSON.stringify({ error: e.message });
    }
  }
}

/**
 * Master Orchestrator (ADK Version) - Central coordination service
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: OrchestratorRequest = await request.json();
    const { query, nodeId, context, preferences = {} } = body;
    const userId = (body as any).userId || null;

    if (!query) {
      return NextResponse.json({ error: 'Query is required for orchestration' }, { status: 400 });
    }

    console.log(`[ADK-ORCHESTRATOR] 🎯 Starting multi-agent workflow for query: "${query}"`);

    const coordinationLogs: CoordinationStep[] = [];

    // Wrap Vercel tools into ADK tools
    const intelTool = new AdkOrchestratorTool("gatherIntelligence", "Gather real-time intelligence and telemetry data", agentTools.gatherIntelligence, coordinationLogs);
    const forecastTool = new AdkOrchestratorTool("generateForecast", "Predictive analytics and trend analysis", agentTools.generateForecast, coordinationLogs);
    const scenarioTool = new AdkOrchestratorTool("generateScenarios", "What-if modeling and simulation of disruptions", agentTools.generateScenarios, coordinationLogs);
    const impactTool = new AdkOrchestratorTool("assessImpact", "Quantitative risk assessment and scoring", agentTools.assessImpact, coordinationLogs);
    const strategyTool = new AdkOrchestratorTool("generateStrategy", "Mitigation planning and strategic actions", agentTools.generateStrategy, coordinationLogs);

    const google = createGoogleGenerativeAI({
      apiKey: getAIKeyForModule('orchestrator')
    });

    const prompt = `Supply Chain Analysis Request: "${query}"
${nodeId ? `Target Node ID: ${nodeId}` : 'Target: All nodes in supply chain network'}
${userId ? `User ID: ${userId}` : ''}

Coordinate appropriate specialized agent tools to provide comprehensive supply chain intelligence.
Use your intelligence rules to execute sequential analysis step by step if needed.
Format the final analysis as structured markdown with clear headings, bullet points, and actionable business insights.`;

    // Execute via ADK
    const responseText = await AgentBuilder.create("master_orchestrator")
      .withDescription("PRISM Master Orchestrator")
      .withInstruction(`You are the PRISM Master Orchestrator - an advanced AI coordination system. 
Proactively coordinate specialized tools to forecast, simulate, and mitigate supply chain disruptions.
Always build insights progressively through multiple tools before providing the final structured markdown response.`)
      .withModel(new AiSdkLlm(google(AI_MODELS.agents) as any))
      .withTools(intelTool, forecastTool, scenarioTool, impactTool, strategyTool)
      .ask(prompt);

    const totalTime = Date.now() - startTime;
    const agentsInvolved = [...new Set(coordinationLogs.map(log => log.agent))];
    const workflowEfficiency = calculateWorkflowEfficiency(coordinationLogs);

    const response: OrchestratorResponse = {
      analysis: responseText,
      coordinationLogs,
      totalSteps: coordinationLogs.length,
      agentsInvolved,
      processingTime: totalTime,
      workflowEfficiency,
      finalRecommendations: extractRecommendationsFromText(responseText)
    };

    console.log(`[ADK-ORCHESTRATOR] ✅ Workflow complete in ${totalTime}ms`);

    return NextResponse.json(response);

  } catch (error: any) {
    console.error(`[ADK-ORCHESTRATOR] ❌ Error:`, error);
    return NextResponse.json({ 
      error: 'Failed to orchestrate multi-agent analysis', 
      details: error.message,
      processingTime: Date.now() - startTime
    }, { status: 500 });
  }
}

function extractRecommendationsFromText(text: string): string[] {
  const recommendations: string[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.match(/^\d+\./) || 
      trimmed.startsWith('•') || 
      trimmed.startsWith('-') || 
      trimmed.toLowerCase().includes('recommend')
    ) {
      if (trimmed.length > 10 && trimmed.length < 200) {
        recommendations.push(trimmed);
      }
    }
  }
  return recommendations.slice(0, 5);
}

export async function GET() {
  return NextResponse.json({ 
    status: 'healthy', 
    orchestrator: 'operational (ADK-based)',
    timestamp: new Date().toISOString()
  });
}
