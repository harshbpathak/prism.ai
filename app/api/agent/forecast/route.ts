import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Redis } from '@upstash/redis';

// Use the correct paths to import the modules - distance from app folder to lib folder
// Path aliases are not resolving correctly, so we'll use relative paths
import { supabaseServer } from '../../../../lib/supabase/server';
import { forecastAgent, orchestrateForecastFlow } from '../../../../lib/agents/forecast';
import { logger } from '../../../../lib/monitoring';

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
 * POST /api/agent/forecast
 * Generates a forecast for a supply chain or node based on intelligence and historical data
 */
export async function POST(request: NextRequest) {
  const traceId = `forecast-${Date.now()}`;
  const startTime = Date.now();

  try {
    // Parse and validate request body
    const requestBody = await request.json();
    
    const validationResult = ForecastRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      logger.error({
        message: 'Invalid forecast request',
        errors: validationResult.error.errors,
        traceId
      });
      
      return NextResponse.json(
        { 
          error: 'Invalid request parameters', 
          details: validationResult.error.errors 
        }, 
        { status: 400 }
      );
    }

    const params = validationResult.data;

    // Verify the supply chain exists
    const { data: supplyChain, error: supplyChainError } = await supabaseServer
      .from('supply_chains')
      .select('*')
      .eq('supply_chain_id', params.supplyChainId)
      .single();

    if (supplyChainError || !supplyChain) {
      logger.error({
        message: 'Supply chain not found',
        supplyChainId: params.supplyChainId,
        error: supplyChainError,
        traceId
      });
      
      return NextResponse.json(
        { 
          error: 'Supply chain not found', 
          details: supplyChainError?.message 
        }, 
        { status: 404 }
      );
    }

    // If nodeId is provided, verify the node exists and belongs to this supply chain
    if (params.nodeId) {
      const { data: node, error: nodeError } = await supabaseServer
        .from('nodes')
        .select('*')
        .eq('node_id', params.nodeId)
        .eq('supply_chain_id', params.supplyChainId)
        .single();

      if (nodeError || !node) {
        logger.error({
          message: 'Node not found or does not belong to specified supply chain',
          nodeId: params.nodeId,
          supplyChainId: params.supplyChainId,
          error: nodeError,
          traceId
        });
        
        return NextResponse.json(
          { 
            error: 'Node not found or does not belong to specified supply chain', 
            details: nodeError?.message 
          }, 
          { status: 404 }
        );
      }
    }

    // Orchestrate the forecast flow
    logger.info({
      message: 'Starting forecast generation',
      params,
      traceId
    });
    
    const forecastResult = await orchestrateForecastFlow({
      supplyChainId: params.supplyChainId,
      nodeId: params.nodeId,
      forecastHorizonDays: params.forecastHorizon,
      includeWeather: params.includeWeather,
      includeMarketData: params.includeMarketData,
      options: {
        forceRefresh: params.options?.forceRefresh || false,
        detailLevel: params.options?.detailLevel || 'medium',
      },
      traceId
    });

    const processingTime = Date.now() - startTime;
    
    logger.info({
      message: 'Forecast generation completed',
      processingTimeMs: processingTime,
      supplyChainId: params.supplyChainId,
      nodeId: params.nodeId,
      traceId
    });

    return NextResponse.json({
      forecast: forecastResult,
      metadata: {
        processingTime,
        generated: new Date().toISOString(),
        supplyChainId: params.supplyChainId,
        nodeId: params.nodeId,
        forecastHorizon: params.forecastHorizon
      }
    });
    
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    
    logger.error({
      message: 'Error generating forecast',
      error: error.message,
      stack: error.stack,
      processingTimeMs: processingTime,
      traceId
    });
    
    return NextResponse.json(
      { 
        error: 'Error generating forecast', 
        message: error.message,
        traceId
      }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supply_chain_id = searchParams.get('supply_chain_id');
    const node_id = searchParams.get('node_id');
    const time_horizon = searchParams.get('time_horizon') || '30'; // Default 30-day forecast
    const force_refresh = searchParams.get('force_refresh') === 'true';

    // Validate required parameters
    if (!supply_chain_id) {
      return NextResponse.json({ error: 'Missing supply_chain_id parameter' }, { status: 400 });
    }

    // Check cache first if not forcing refresh
    if (!force_refresh && node_id) {
      const cachedForecast = await redis.get(`forecast:${node_id}`);
      if (cachedForecast) {
        return NextResponse.json(cachedForecast);
      }
    }

    // Build query based on params
    let query = supabaseServer
      .from('forecasts')
      .select('*')
      .eq('supply_chain_id', supply_chain_id)
      .order('created_at', { ascending: false });

    // Add node filter if provided
    if (node_id) {
      query = query.eq('node_id', node_id);
    }

    // Execute query
    const { data: forecasts, error } = await query.limit(node_id ? 1 : 20);

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    // If no forecasts found, return empty result
    if (!forecasts || forecasts.length === 0) {
      return NextResponse.json({ 
        message: 'No forecasts found for the specified criteria',
        forecasts: [] 
      });
    }

    // Cache the forecast for the node if applicable
    if (node_id && forecasts[0]) {
      await redis.setex(`forecast:${node_id}`, 1800, forecasts[0]); // 30 min TTL
    }

    return NextResponse.json({ 
      message: 'Forecasts retrieved successfully',
      count: forecasts.length, 
      forecasts 
    });
  } catch (error) {
    console.error('Forecast API GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve forecasts', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}
