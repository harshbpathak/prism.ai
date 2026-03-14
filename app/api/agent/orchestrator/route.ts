import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextRequest, NextResponse } from 'next/server';
import { getAIKeyForModule, AI_MODELS } from '@/lib/ai-config';
import { tool } from 'ai';
import {
  agentTools,
  defaultToolSet
} from '../../coordination/agent-tools';
import {
  createCoordinationSession,
  determineStartingAgent,
  calculateWorkflowEfficiency,
  type OrchestratorRequest,
  type OrchestratorResponse,
  type CoordinationStep
} from '../../coordination/types';

// Allow processing up to 60 seconds for complex multi-agent workflows
export const maxDuration = 60;

/**
 * Master Orchestrator - Central coordination service for multi-agent workflows
 * Uses Vercel AI SDK with maxSteps for intelligent agent coordination
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse and validate request
    const body: OrchestratorRequest = await request.json();
    const { query, nodeId, context, preferences = {} } = body;

    // Extract userId from request for database queries - ensure proper handling
    const userId = (body as any).userId || null;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required for orchestration' },
        { status: 400 }
      );
    }

    console.log(`[ORCHESTRATOR] 🎯 Starting FAST multi-agent workflow for query: "${query}"`);
    console.log(`[ORCHESTRATOR] 👤 User ID: ${userId || 'Anonymous'}`);
    console.log(`[ORCHESTRATOR] 📍 Node ID: ${nodeId || 'All nodes'}`);
    console.log(`[ORCHESTRATOR] ⚙️ Preferences:`, preferences);
    console.log(`[ORCHESTRATOR] ⚡ Using cached database data for speed`);

    // Create or use existing coordination session
    const coordinationSession = context || createCoordinationSession(query, nodeId);
    console.log(`[ORCHESTRATOR] 🆔 Session: ${coordinationSession.sessionId}`);

    // Determine optimal starting point and max steps based on preferences
    const startingAgent = determineStartingAgent(query);
    const maxSteps = (preferences as any).depth === 'basic' ? 3 :
      (preferences as any).depth === 'comprehensive' ? 8 : 6;

    console.log(`[ORCHESTRATOR] 🚀 Starting with ${startingAgent} agent, max ${maxSteps} steps`);

    // Configure Google provider with dedicated key if available
    const google = createGoogleGenerativeAI({
      apiKey: getAIKeyForModule('orchestrator')
    });

    // Orchestrate the multi-agent workflow using Vercel AI SDK
    const { text, steps } = await generateText({
      model: google(AI_MODELS.agents),
      maxSteps,
      // Use the agent tools directly
      tools: {
        gatherIntelligence: agentTools.gatherIntelligence,
        generateForecast: agentTools.generateForecast,
        generateScenarios: agentTools.generateScenarios,
        assessImpact: agentTools.assessImpact,
        generateStrategy: agentTools.generateStrategy
      },

      system: `You are the PRISM Master Orchestrator - an advanced AI coordination system for supply chain intelligence.

🎯 Your Mission: 
Proactively coordinate specialized agents to forecast, simulate, and mitigate supply chain disruptions using digital twins, real-time intelligence, and autonomous strategy planning.

🤖 Available Specialized Agents:
1. **Intelligence Agent**: Real-time data gathering, weather monitoring, port disruptions, market intelligence
2. **Forecast Agent**: Predictive analytics, demand forecasting, trend analysis, future risk assessment  
3. **Scenario Agent**: What-if modeling, disruption simulation, contingency planning
4. **Impact Agent**: Monte Carlo analysis, quantitative risk assessment, financial impact modeling
5. **Strategy Agent**: Mitigation planning, action plan development, implementation roadmaps

🧠 Coordination Intelligence Rules:
- **Always explain your reasoning** before calling each agent
- **Build insights progressively** - each agent should enhance the previous analysis
- **Be intelligent about sequencing** - don't just follow a rigid order
- **Consider the user's specific query** - adapt the workflow to their needs
- **Stop when analysis is comprehensive** - don't over-engineer simple requests

📊 Standard Workflows:
- **Risk Analysis**: Intelligence → Forecast → Scenario → Impact → Strategy
- **Disruption Response**: Intelligence → Scenario → Impact → Strategy  
- **Planning Queries**: Intelligence → Forecast → Strategy
- **Current State**: Intelligence only (if user just wants current info)

💭 Reasoning Examples:
"I need to gather real-time intelligence first to understand the current supply chain state"
"The intelligence shows concerning weather patterns - forecast analysis will help predict impacts"
"Forecast indicates high-risk trends - scenario modeling is needed to explore what-if outcomes"
"Multiple severe scenarios identified - quantitative impact assessment required"
"High impact confirmed - strategic mitigation planning is essential"

🎯 Quality Guidelines:
- **Format output as structured markdown** with clear headings, bullet points, and sections
- Use markdown formatting: bold for key insights, italics for emphasis, code blocks for technical details
- Structure analysis with clear sections: Overview, Key Findings, Risk Assessment, Recommendations
- Provide specific, actionable insights with quantified metrics where possible
- Use supply chain terminology appropriately  
- Connect insights between agents logically
- Focus on business impact and decisions
- Include bullet points and numbered lists for clarity
- Be comprehensive but organized - use headings and subheadings

Remember: You are orchestrating a sophisticated multi-agent intelligence system. Make each agent call count and explain your coordination decisions clearly. Format all output as structured markdown for maximum readability.`,

      prompt: `Supply Chain Analysis Request: "${query}"
${nodeId ? `Target Node ID: ${nodeId} (UUID format expected)` : 'Target: All nodes in supply chain'}
${userId ? `User ID: ${userId}` : ''}

Coordinate appropriate agents to provide comprehensive supply chain intelligence. 

IMPORTANT: 
- When calling any agent tools, always include the userId parameter if provided above.
- If a nodeId is provided, it should be a valid UUID. Use it to focus analysis on that specific node.
- If nodeId is "all" or undefined, analyze the entire supply chain network.

Think step by step:
1. What type of analysis does this query require?
2. Which agent should I start with and why?
3. What insights do I expect from each agent?
4. How will I build comprehensive analysis through agent coordination?

Begin the coordinated analysis now.`
    });

    const totalTime = Date.now() - startTime;

    // Process coordination steps - fix the result access
    const coordinationLogs: CoordinationStep[] = steps.map((step, index) => {
      const toolCalls = step.toolCalls || [];
      const stepOutput = toolCalls.length > 0 ? toolCalls.map(tc => (tc as any).result) : null;

      return {
        stepNumber: index + 1,
        agent: toolCalls.length > 0 ? toolCalls[0].toolName : 'orchestrator',
        action: toolCalls.length > 0 ? `Called ${toolCalls[0].toolName}` : 'Analysis',
        reasoning: step.text,
        input: toolCalls.length > 0 ? toolCalls[0].args : null,
        output: stepOutput,
        processingTime: 0, // Individual step times not available in generateText
        nextAgentRecommendation: extractNextAgentFromStep(step)
      };
    });

    // Extract unique agents involved
    const agentsInvolved = [...new Set(
      coordinationLogs
        .map(log => log.agent)
        .filter(agent => agent !== 'orchestrator')
    )];

    // Calculate workflow efficiency
    const workflowEfficiency = calculateWorkflowEfficiency(coordinationLogs);

    // Extract final recommendations from the analysis
    const finalRecommendations = extractRecommendationsFromText(text);

    console.log(`[ORCHESTRATOR] ✅ Workflow complete in ${totalTime}ms`);
    console.log(`[ORCHESTRATOR] 👥 Agents involved: ${agentsInvolved.join(', ')}`);
    console.log(`[ORCHESTRATOR] ⚡ Efficiency: ${Math.round(workflowEfficiency * 100)}%`);

    const response: OrchestratorResponse = {
      analysis: text,
      coordinationLogs,
      totalSteps: steps.length,
      agentsInvolved,
      processingTime: totalTime,
      workflowEfficiency,
      finalRecommendations: finalRecommendations.length > 0 ? finalRecommendations : undefined
    };

    return NextResponse.json(response);

  } catch (error) {
    const totalTime = Date.now() - startTime;

    console.error(`[ORCHESTRATOR] ❌ Error in orchestration:`, error);

    // Provide helpful error responses
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          {
            error: 'Orchestration timeout - try reducing complexity or using basic depth preference',
            processingTime: totalTime
          },
          { status: 408 }
        );
      }

      if (error.message.includes('quota') || error.message.includes('rate')) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded - please try again in a moment',
            processingTime: totalTime
          },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to orchestrate multi-agent analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
        processingTime: totalTime
      },
      { status: 500 }
    );
  }
}

/**
 * Extract next agent recommendation from step text
 */
function extractNextAgentFromStep(step: any): { agent: string; reason: string } | undefined {
  const text = step.text?.toLowerCase() || '';

  // Simple pattern matching for next agent mentions
  if (text.includes('forecast') && text.includes('next')) {
    return { agent: 'forecast', reason: 'Forecast analysis mentioned' };
  }
  if (text.includes('scenario') && text.includes('next')) {
    return { agent: 'scenario', reason: 'Scenario modeling mentioned' };
  }
  if (text.includes('impact') && text.includes('next')) {
    return { agent: 'impact', reason: 'Impact assessment mentioned' };
  }
  if (text.includes('strategy') && text.includes('next')) {
    return { agent: 'strategy', reason: 'Strategy planning mentioned' };
  }

  return undefined;
}

/**
 * Extract actionable recommendations from analysis text
 */
function extractRecommendationsFromText(text: string): string[] {
  const recommendations: string[] = [];

  // Look for numbered lists, bullet points, or recommendation keywords
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Pattern matching for recommendations
    if (
      trimmed.match(/^\d+\./) || // Numbered list
      trimmed.startsWith('•') || // Bullet point
      trimmed.startsWith('-') || // Dash
      trimmed.toLowerCase().includes('recommend') ||
      trimmed.toLowerCase().includes('suggest') ||
      trimmed.toLowerCase().includes('should')
    ) {
      if (trimmed.length > 10 && trimmed.length < 200) { // Reasonable length
        recommendations.push(trimmed);
      }
    }
  }

  return recommendations.slice(0, 5); // Limit to top 5 recommendations
}

/**
 * Health check endpoint
 */
export async function GET() {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      orchestrator: 'operational',
      dependencies: {
        'vercel-ai-sdk': 'connected',
        'google-gemini': !!process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'configured' : 'missing',
        'agent-tools': 'loaded'
      }
    };

    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
