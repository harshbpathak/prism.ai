import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Redis } from '@upstash/redis';

// Use relative paths to avoid alias resolution issues
import { supabaseServer } from '../../../../lib/supabase/server';
import { getAIKeyForModule, AI_MODELS } from '../../../../lib/ai-config';
import { logger } from '../../../../lib/monitoring';

import { AgentBuilder, BaseTool, AiSdkLlm } from "@iqai/adk";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Initialize Redis for caching
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
});

// Input validation schema for the forecast API
const ForecastRequestSchema = z.object({
  supplyChainId: z.string().uuid(),
  nodeId: z.string().uuid().optional(),
  forecastHorizon: z.number().int().positive().default(30).describe('Number of days to forecast'),
  includeWeather: z.boolean().default(true),
  includeMarketData: z.boolean().default(true),
  options: z.object({
    forceRefresh: z.boolean().default(false),
    detailLevel: z.enum(['low', 'medium', 'high']).default('medium'),
  }).optional(),
});

/**
 * Forecast Data Tool for ADK
 */
class ForecastDataTool extends BaseTool {
  constructor() {
    super({
      name: "get_forecast_data",
      description: "Fetch historical forecasts and supply chain intelligence for a specific supply chain or node."
    });
  }

  getDeclaration(): any {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: "object",
        properties: {
          nodeId: { type: "string" },
          supplyChainId: { type: "string" }
        },
        required: ["supplyChainId"]
      }
    };
  }

  async runAsync(args: { nodeId?: string, supplyChainId: string }) {
    try {
      const supabase = supabaseServer;
      
      let forecastQuery = supabase
        .from('forecasts')
        .select('*')
        .eq('supply_chain_id', args.supplyChainId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (args.nodeId) forecastQuery = forecastQuery.eq('node_id', args.nodeId);
      const { data: forecasts } = await forecastQuery;
      
      let intelQuery = supabase
        .from('supply_chain_intel')
        .select('*')
        .eq('supply_chain_id', args.supplyChainId)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (args.nodeId) intelQuery = intelQuery.eq('node_id', args.nodeId);
      const { data: intel } = await intelQuery;
      
      return {
        historicalForecasts: forecasts || [],
        recentIntelligence: intel || [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[ForecastDataTool] Error fetching data:', error);
      return { error: "Failed to fetch context data" };
    }
  }
}

class ProductionForecastAgent {
  async generateForecast(params: any) {
    const traceId = `forecast-adk-${Date.now()}`;
    logger.info({ message: 'Generating forecast via ADK', supplyChainId: params.supplyChainId, traceId });

    try {
      const prompt = `
        Generate a supply chain forecast for:
        Supply Chain ID: ${params.supplyChainId}
        Node ID: ${params.nodeId || 'All Nodes'}
        Horizon: ${params.forecastHorizon} days
        Include Weather: ${params.includeWeather}
        Include Market Data: ${params.includeMarketData}
        
        Use the available tools to fetch context data.
        Provide a detailed forecast summary, trend analysis, risk factors, and confidence score.
        Make your insights clear and highly actionable.
      `;

      const google = createGoogleGenerativeAI({
        apiKey: getAIKeyForModule("agents"),
      });

      const response = await AgentBuilder.create("forecast_agent")
        .withDescription("High-fidelity forecasting agent")
        .withInstruction("You are an expert forecaster. Analyze historic patterns, contextual intelligence, and market variables to predict supply chain trends.")
        .withModel(new AiSdkLlm(google(AI_MODELS.agents) as any))
        .withTools(new ForecastDataTool())
        .ask(prompt);

      return response;
    } catch (error) {
      console.error('[FORECAST-AGENT] ❌ Error:', error);
      throw error;
    }
  }
}

/**
 * POST /api/agent/forecast
 */
export async function POST(request: NextRequest) {
  const traceId = `forecast-${Date.now()}`;
  const startTime = Date.now();

  try {
    const requestBody = await request.json();
    const validationResult = ForecastRequestSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      logger.error({ message: 'Invalid forecast request', errors: validationResult.error.errors, traceId });
      return NextResponse.json({ error: 'Invalid request parameters', details: validationResult.error.errors }, { status: 400 });
    }

    const params = validationResult.data;

    // Verify the supply chain exists
    const { data: supplyChain, error: supplyChainError } = await supabaseServer
      .from('supply_chains')
      .select('*')
      .eq('supply_chain_id', params.supplyChainId)
      .single();

    if (supplyChainError || !supplyChain) {
      logger.error({ message: 'Supply chain not found', supplyChainId: params.supplyChainId, error: supplyChainError, traceId });
      return NextResponse.json({ error: 'Supply chain not found', details: supplyChainError?.message }, { status: 404 });
    }

    if (params.nodeId) {
      const { data: node, error: nodeError } = await supabaseServer
        .from('nodes')
        .select('*')
        .eq('node_id', params.nodeId)
        .eq('supply_chain_id', params.supplyChainId)
        .single();

      if (nodeError || !node) {
        logger.error({ message: 'Node not found', nodeId: params.nodeId, supplyChainId: params.supplyChainId, error: nodeError, traceId });
        return NextResponse.json({ error: 'Node not found or does not belong to specified supply chain', details: nodeError?.message }, { status: 404 });
      }
    }

    const agent = new ProductionForecastAgent();
    const forecastResult = await agent.generateForecast(params);

    const processingTime = Date.now() - startTime;
    logger.info({ message: 'Forecast generation completed', processingTimeMs: processingTime, supplyChainId: params.supplyChainId, traceId });

    return NextResponse.json({
      forecast: forecastResult,
      metadata: { processingTime, generated: new Date().toISOString(), supplyChainId: params.supplyChainId, nodeId: params.nodeId, forecastHorizon: params.forecastHorizon }
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    logger.error({ message: 'Error generating forecast', error: error.message, processingTimeMs: processingTime, traceId });
    return NextResponse.json({ error: 'Error generating forecast', message: error.message, traceId }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supply_chain_id = searchParams.get('supply_chain_id');
    const node_id = searchParams.get('node_id');
    const time_horizon = searchParams.get('time_horizon') || '30';
    const force_refresh = searchParams.get('force_refresh') === 'true';

    if (!supply_chain_id) return NextResponse.json({ error: 'Missing supply_chain_id parameter' }, { status: 400 });

    if (!force_refresh && node_id) {
      const cachedForecast = await redis.get(`forecast:${node_id}`);
      if (cachedForecast) return NextResponse.json(cachedForecast);
    }

    let query = supabaseServer
      .from('forecasts')
      .select('*')
      .eq('supply_chain_id', supply_chain_id)
      .order('created_at', { ascending: false });

    if (node_id) query = query.eq('node_id', node_id);

    const { data: forecasts, error } = await query.limit(node_id ? 1 : 20);

    if (error) return NextResponse.json({ error: 'Database query failed' }, { status: 500 });

    if (!forecasts || forecasts.length === 0) {
      return NextResponse.json({ message: 'No forecasts found for the specified criteria', forecasts: [] });
    }

    if (node_id && forecasts[0]) {
      await redis.setex(`forecast:${node_id}`, 1800, forecasts[0]);
    }

    return NextResponse.json({ message: 'Forecasts retrieved successfully', count: forecasts.length, forecasts });
  } catch (error) {
    console.error('Forecast API GET error:', error);
    return NextResponse.json({ error: 'Failed to retrieve forecasts', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
