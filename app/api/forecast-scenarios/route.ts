import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supplyChainId = searchParams.get('supply_chain_id');
    
    if (!supplyChainId) {
      return NextResponse.json(
        { error: 'Supply chain ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Fetching forecast scenarios for supply chain: ${supplyChainId}`);

    // Fetch forecast data from the forecasts table
    const { data: forecasts, error: forecastError } = await supabaseServer
      .from('forecasts')
      .select('scenario_json, forecast_data, created_at, confidence_score')
      .eq('supply_chain_id', supplyChainId)
      .not('scenario_json', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1); // Get the most recent forecast

    if (forecastError) {
      // The 'forecasts' table may not exist yet in this Supabase project.
      // Return empty scenarios gracefully rather than a hard 500.
      console.warn('⚠️ Forecast table error (table may not exist yet):', forecastError.message);
      return NextResponse.json({
        success: true,
        scenarios: [],
        message: 'Forecast scenarios not available yet'
      });
    }

    if (!forecasts || forecasts.length === 0) {
      console.log('📭 No forecast data found for supply chain');
      return NextResponse.json({
        success: true,
        scenarios: [],
        message: 'No forecast scenarios available for this supply chain'
      });
    }

    const forecast = forecasts[0];
    const scenarioJson = forecast.scenario_json;

    if (!Array.isArray(scenarioJson) || scenarioJson.length === 0) {
      console.log('📭 No scenarios found in forecast data');
      return NextResponse.json({
        success: true,
        scenarios: [],
        message: 'No scenarios available in the latest forecast'
      });
    }

    // Transform the scenario data to match the expected format
    const transformedScenarios = scenarioJson.map((scenario: any) => {
      // Ensure all required fields are present with fallbacks
      return {
        scenarioName: scenario.scenarioName || 'Unnamed Scenario',
        scenarioType: scenario.scenarioType || 'disruption',
        description: scenario.description || 'AI-generated forecast scenario',
        disruptionSeverity: scenario.disruptionSeverity || 50,
        disruptionDuration: scenario.disruptionDuration || 7,
        affectedNode: scenario.affectedNode || 'unknown-node',
        startDate: scenario.startDate || new Date().toISOString(),
        endDate: scenario.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        monteCarloRuns: scenario.monteCarloRuns || 1000,
        distributionType: scenario.distributionType || 'normal',
        cascadeEnabled: scenario.cascadeEnabled !== undefined ? scenario.cascadeEnabled : true,
        failureThreshold: scenario.failureThreshold || 0.5,
        bufferPercent: scenario.bufferPercent || 15,
        alternateRouting: scenario.alternateRouting !== undefined ? scenario.alternateRouting : true,
        randomSeed: scenario.randomSeed || `forecast-${Date.now()}`
      };
    });

    console.log(`✅ Successfully fetched ${transformedScenarios.length} forecast scenarios`);

    return NextResponse.json({
      success: true,
      scenarios: transformedScenarios,
      metadata: {
        forecastDate: forecast.created_at,
        confidenceScore: forecast.confidence_score,
        scenarioCount: transformedScenarios.length,
        supplyChainId
      }
    });

  } catch (error) {
    console.error('❌ Error fetching forecast scenarios:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
