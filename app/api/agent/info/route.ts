/**
 * Enhanced Supply Chain Intelligent Agent V2.0 (ADK Version)
 * Specialized agent for gathering real-time supply chain intelligence
 */

import { NextRequest, NextResponse } from 'next/server';
import { streamText, generateText } from 'ai';
import { AgentBuilder, BaseTool, AiSdkLlm } from "@iqai/adk";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { tavily } from '@tavily/core';
import { getAIKeyForModule, AI_MODELS } from '@/lib/ai-config';

/**
 * Tavily Search Tool for ADK
 */
class TavilySearchTool extends BaseTool {
  constructor() {
    super({
      name: "tavily_search",
      description: "Search for real-time supply chain intelligence, weather, and disruptions."
    });
  }

  // Simplified declaration to avoid type conflicts
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
      maxResults: 5 
    });
    return result;
  }
}

/**
 * Production Intelligent Agent
 */
class ProductionIntelligentAgent {
  async gatherIntelligence(nodeId: string, focusArea: string = 'all') {
    console.log(`[INTEL-AGENT] 🕵️ Gathering intelligence for node: ${nodeId}`);

    try {
      const prompt = `
        Gather intelligence for supply chain node: ${nodeId}
        Focus Area: ${focusArea}
        
        Search for current disruptions, weather impacts, and market trends.
        Provide a detailed summary and risk score (0-100).
      `;

      // Configure the model using centralized settings
      const google = createGoogleGenerativeAI({
        apiKey: getAIKeyForModule("agents"),
      });

      // Execute via ADK
      const response = await AgentBuilder.create("intelligent_agent")
        .withDescription("Gathers real-time intelligence")
        .withInstruction("You are an expert analyst. Use search tools to find the latest data and provide a quantitative risk assessment.")
        .withModel(new AiSdkLlm(google(AI_MODELS.agents) as any))
        .withTools(new TavilySearchTool())
        .ask(prompt);

      return {
        intelligence: response,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[INTEL-AGENT] ❌ Error:', error);
      throw error;
    }
  }
}

// Single POST Export
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { supply_chain_id, nodeId, focusArea, messages } = body;
    
    // We expect either nodeId or supply_chain_id in the body (the frontend sends supply_chain_id)
    const targetId = nodeId || supply_chain_id;
    if (!targetId) return NextResponse.json({ error: "Missing Target ID" }, { status: 400 });

    const google = createGoogleGenerativeAI({
      apiKey: getAIKeyForModule("agents"),
    });

    const systemPrompt = `
      Gather intelligence for supply chain node or ID: ${targetId}
      Focus Area: ${focusArea || 'all'}
      
      Search for current disruptions, weather impacts, and market trends.
      Provide a detailed summary and risk score (0-100).
    `;

    // Extract the latest query from messages if they exist, otherwise use the system prompt
    const promptMessage = messages && messages.length > 0 
      ? messages[messages.length - 1].content 
      : systemPrompt;

    if (body.stream) {
      const result = await streamText({
        model: google(AI_MODELS.agents),
        system: systemPrompt,
        messages: messages || [{ role: 'user', content: promptMessage }],
      });
      return result.toDataStreamResponse();
    } else {
      const result = await generateText({
        model: google(AI_MODELS.agents),
        system: systemPrompt,
        messages: messages || [{ role: 'user', content: promptMessage }],
      });
      return NextResponse.json({ success: true, data: result.text });
    }
  } catch (error) {
    console.error('[INTEL-AGENT] ❌ Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal Error" 
    }, { status: 500 });
  }
}