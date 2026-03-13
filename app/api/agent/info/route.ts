import { NextRequest, NextResponse } from 'next/server';
import { streamText, tool, generateObject, generateText } from 'ai';
import { createGoogleGenerativeAI, google } from '@ai-sdk/google';
import { getAIKeyForModule, AI_MODELS } from '@/lib/ai-config';
import { createMem0, addMemories, retrieveMemories, getMemories } from '@mem0/vercel-ai-provider';
import { tavilyTools } from '@/lib/fixed-tavily';
import { tavily } from '@tavily/core';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { Redis } from '@upstash/redis';
import { NotificationTrigger } from '@/lib/tools/notification-trigger';

// Initialize Redis for caching
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
});

// Initialize Mem0 with proper configuration following latest docs
const mem0 = createMem0({
  provider: 'google',
  mem0ApiKey: process.env.MEM0_API_KEY || '',
  apiKey: getAIKeyForModule('agents'),
  config: {
    compatibility: 'strict',
  }
});

// Mem0 configuration constants
const MEM0_CONFIG = {
  user_id: 'supply-chain-agent', // Default user ID
  org_id: process.env.MEM0_ORG_ID || '',
  project_id: process.env.MEM0_PROJECT_ID || '',
  app_id: 'prism-agent',
  agent_id: 'supply-chain-intel-agent',
  run_id: `run-${Date.now()}` // Generate a unique run ID
};

// Enhanced Intelligence Schema
const SupplyChainIntelligenceSchema = z.object({
  nodeId: z.string(),
  timestamp: z.string(),
  intelligence: z.object({
    criticalEvents: z.array(z.object({
      title: z.string().describe('Clear event title'),
      summary: z.string().describe('2-3 sentence summary'),
      severity: z.number().min(0).max(100).describe('Risk severity score 0-100'),
      impact: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      category: z.enum(['WEATHER', 'GEOPOLITICAL', 'OPERATIONAL', 'REGULATORY', 'ECONOMIC', 'SECURITY']),
      affectedEntities: z.array(z.string()).describe('Companies, ports, regions affected'),
      timeframe: z.string().describe('When this will impact operations'),
      confidence: z.number().min(0).max(1).describe('Confidence in this intelligence'),
      sources: z.array(z.object({
        title: z.string(),
        url: z.string(),
        publishedAt: z.string(),
        credibility: z.number().min(0).max(1)
      }))
    })),
    marketIntelligence: z.object({
      priceFluctuations: z.array(z.object({
        commodity: z.string(),
        change: z.number(),
        reason: z.string()
      })),
      demandShifts: z.array(z.string()),
      competitorActivities: z.array(z.string())
    }),
    riskAssessment: z.object({
      overallRiskScore: z.number().min(0).max(100),
      riskFactors: z.array(z.object({
        factor: z.string(),
        probability: z.number().min(0).max(1),
        impact: z.number().min(0).max(100)
      })),
      mitigationSuggestions: z.array(z.string())
    }),
    relationshipMapping: z.array(z.object({
      source: z.string(),
      target: z.string(),
      relationship: z.string(),
      strength: z.number().min(0).max(1),
      context: z.string()
    }))
  }),
  metadata: z.object({
    processingTime: z.number(),
    sourcesChecked: z.number(),
    qualityScore: z.number().min(0).max(1),
    nextUpdateRecommended: z.string(),
    memoryContext: z.boolean()
  })
});

class ProductionIntelligenceAgent {

  constructor() {
    // Agent is now initialized with proper Mem0 and Tavily integration
  }
  public async getCachedIntelligence(nodeId: string): Promise<any | null> {
    try {
      const cached = await redis.get(`intel:${nodeId}`);
      if (cached) {
        // Handle both string and object formats for backward compatibility
        let data;
        if (typeof cached === 'string') {
          try {
            data = JSON.parse(cached);
          } catch (parseError) {
            console.warn(`Cache parse error for node ${nodeId}:`, parseError);
            return null;
          }
        } else if (typeof cached === 'object') {
          // Already an object, no need to parse
          data = cached;
        } else {
          console.warn(`Unexpected cache data type for node ${nodeId}: ${typeof cached}`);
          return null;
        }
        
        // Validate that we have a timestamp field
        if (!data?.timestamp) {
          console.warn(`Invalid cache data format for node ${nodeId}: no timestamp`);
          return null;
        }
        
        const age = Date.now() - new Date(data.timestamp).getTime();
        // Return cached data if less than 30 minutes old
        if (age < 30 * 60 * 1000) {
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error('Cache retrieval error:', error);
      return null;
    }
  }

  public async cacheIntelligence(nodeId: string, data: any): Promise<void> {
    try {
      // Ensure we're always storing a JSON string
      const jsonData = typeof data === 'string' ? data : JSON.stringify(data);
      await redis.setex(`intel:${nodeId}`, 1800, jsonData); // 30 min TTL
      console.log(`Successfully cached intelligence for node ${nodeId}`);
    } catch (error) {
      console.error('Cache storage error:', error);
    }
  }

  private async buildSearchContext(node: any, supplyChainData?: any): Promise<string> {
    let memoryContext = '';
    let historicalTrends = '';
    let supplyChainContext = '';
    let networkContext = '';
    
    // Extract supply chain form data if available
    if (supplyChainData?.form_data) {
      try {
        const formData = typeof supplyChainData.form_data === 'string' 
          ? JSON.parse(supplyChainData.form_data) 
          : supplyChainData.form_data;
        
        supplyChainContext = `
        SUPPLY CHAIN COMPANY INFORMATION:
        - Company Name: ${supplyChainData.name || 'Not specified'}
        - Business Type: ${formData.businessType || 'Not specified'}
        - Industry Sector: ${formData.industrySector || 'Not specified'}
        - Company Size: ${formData.companySize || 'Not specified'}
        - Annual Revenue: ${formData.annualRevenue || 'Not specified'}
        - Geographic Focus: ${formData.geographicFocus || 'Not specified'}
        - Main Products/Services: ${formData.mainProducts || 'Not specified'}
        - Supply Chain Complexity: ${formData.supplyChainComplexity || 'Not specified'}
        - Primary Risk Concerns: ${formData.primaryRisks || 'Not specified'}
        - Current Challenges: ${formData.currentChallenges || 'Not specified'}`;
      } catch (error) {
        console.warn('Error parsing supply chain form_data:', error);
        supplyChainContext = `
        SUPPLY CHAIN COMPANY INFORMATION:
        - Company Name: ${supplyChainData.name || 'Not specified'}
        - Additional Data: Available but format not recognized`;
      }
    } else if (supplyChainData?.name) {
      supplyChainContext = `
      SUPPLY CHAIN COMPANY INFORMATION:
      - Company Name: ${supplyChainData.name}
      - Organisation: ${supplyChainData.organisation || 'Not specified'}
      - Description: ${supplyChainData.description || 'Not specified'}`;
    }
    
    // Build network context if edges and connections are available
    if (supplyChainData?.nodeConnections && supplyChainData?.edges) {
      const nodeConnections = supplyChainData.nodeConnections[node.node_id];
      const totalEdges = supplyChainData.edges.length;
      
      if (nodeConnections) {
        const upstreamNodes = nodeConnections.upstream;
        const downstreamNodes = nodeConnections.downstream;
        const isCriticalPath = nodeConnections.criticalPath;
        
        // Enhanced edge risk analysis
        const allNodeEdges = supplyChainData.edges.filter((edge: any) => 
          edge.source === node.node_id || edge.target === node.node_id
        );
        
        const highRiskEdges = allNodeEdges.filter((edge: any) => 
          edge.data?.riskMultiplier > 1.5
        );
        
        const edgeByTransportMode = allNodeEdges.reduce((acc: any, edge: any) => {
          const mode = edge.data?.transportMode || 'unknown';
          acc[mode] = (acc[mode] || 0) + 1;
          return acc;
        }, {});

        networkContext = `
        SUPPLY CHAIN NETWORK CONTEXT:
        - Total Supply Chain Connections: ${totalEdges} edges
        - Node Role: ${isCriticalPath ? 'CRITICAL PATH NODE' : 'Standard Node'}
        - Dependencies Count: ${nodeConnections.dependencies}
        - Connected Edges: ${allNodeEdges.length}
        - High-Risk Edges: ${highRiskEdges.length} (risk >1.5x)
        - Transport Modes: ${Object.entries(edgeByTransportMode).map(([mode, count]) => `${mode}(${count})`).join(', ')}
        
        UPSTREAM SUPPLIERS (${upstreamNodes.length}):
        ${upstreamNodes.slice(0, 5).map((up: any) => 
          `  • ${up.nodeName} (${up.nodeType}) - Transport: ${up.transportMode}, Cost: ${up.cost}, Transit: ${up.transitTime}h, Risk: ${up.riskMultiplier}x`
        ).join('\n') || '  • No upstream suppliers'}
        
        DOWNSTREAM CUSTOMERS (${downstreamNodes.length}):
        ${downstreamNodes.slice(0, 5).map((down: any) => 
          `  • ${down.nodeName} (${down.nodeType}) - Transport: ${down.transportMode}, Cost: ${down.cost}, Transit: ${down.transitTime}h, Risk: ${down.riskMultiplier}x`
        ).join('\n') || '  • No downstream customers'}
        
        EDGE-SPECIFIC RISK ANALYSIS:
        ${highRiskEdges.length > 0 ? 
          `HIGH-RISK CONNECTIONS:\n${highRiskEdges.slice(0, 3).map((edge: any) => 
            `  • ${edge.data?.label || 'Edge'} - Risk: ${edge.data?.riskMultiplier}x, Mode: ${edge.data?.transportMode}`
          ).join('\n')}` : '  • No high-risk edge connections detected'}
        
        NETWORK RISK FACTORS:
        ${isCriticalPath ? '- HIGH PRIORITY: This node is on the critical path - disruptions here will cascade through the network' : '- Standard network priority'}
        ${nodeConnections.dependencies > 2 ? '- Multiple dependencies - vulnerable to multi-supplier disruptions' : '- Limited dependencies - more resilient to supplier issues'}
        ${upstreamNodes.some((up: any) => up.riskMultiplier > 1.5) ? '- High-risk upstream connections detected' : '- Upstream connections appear stable'}
        ${downstreamNodes.some((down: any) => down.riskMultiplier > 1.5) ? '- High-risk downstream connections detected' : '- Downstream connections appear stable'}
        ${highRiskEdges.length > 2 ? '- Multiple high-risk edges create cascade failure potential' : ''}
        ${Object.keys(edgeByTransportMode).length === 1 ? '- Single transport mode dependency - vulnerable to mode-specific disruptions' : '- Diversified transport modes provide resilience'}`;
      } else {
        networkContext = `
        SUPPLY CHAIN NETWORK CONTEXT:
        - Total Supply Chain Connections: ${totalEdges} edges
        - Node Position: Isolated or connection data unavailable
        - This node may be disconnected from the main supply chain network`;
      }
    }
    
    // Try to retrieve memories with proper error handling following latest Mem0 docs
    if (process.env.MEM0_API_KEY) {try {
        // Build a rich, specific search query for more relevant memories
        const searchQuery = `supply chain intelligence analysis for ${node.name} ${node.type} in ${node.location} ${node.industry || ''} recent disruptions risk assessment`;
        
        // Retrieve textual memory context
        memoryContext = await retrieveMemories(searchQuery, {
          user_id: `node:${node.node_id}`,
          mem0ApiKey: process.env.MEM0_API_KEY
        });
        
        // Get raw memories for trend analysis
        const rawMemories = await getMemories(searchQuery, {
          user_id: `node:${node.node_id}`,
          mem0ApiKey: process.env.MEM0_API_KEY,
          // Removed 'limit' property as it is not valid in 'Mem0ConfigSettings'
        });
        
        // Process raw memories to extract trend data
        if (rawMemories && rawMemories.length > 0) {
          try {
            // Extract risk scores and event counts from past memories
            interface MemoryContent {
              content: string;
            }

            interface RiskHistoryEntry {
              date: string;
              riskScore: number | null;
              eventCount: number | null;
            }

            const riskHistory: RiskHistoryEntry[] = rawMemories
              .filter((m: MemoryContent) => m.content && m.content.includes('Risk Score:'))
              .map((m: MemoryContent) => {
                // Extract risk score using regex
                const riskMatch = m.content.match(/Risk Score:\s*(\d+)/i);
                const dateMatch = m.content.match(/Date:\s*([^\\n]+)/i);
                const eventsMatch = m.content.match(/Critical Events:\s*(\d+)/i);

                return {
                  date: dateMatch?.[1] || 'unknown date',
                  riskScore: riskMatch ? parseInt(riskMatch[1]) : null,
                  eventCount: eventsMatch ? parseInt(eventsMatch[1]) : null
                };
              })
              .filter((r: RiskHistoryEntry) => r.riskScore !== null);
            
            // Calculate trend if we have enough data points
            if (riskHistory.length >= 2) {
              const sortedHistory = [...riskHistory].sort((a, b) => 
                new Date(a.date).getTime() - new Date(b.date).getTime()
              );
              
              const oldestRisk = sortedHistory[0].riskScore;
              const newestRisk = sortedHistory[sortedHistory.length - 1].riskScore;
              const riskTrend = newestRisk && oldestRisk ? newestRisk - oldestRisk : 0;
              
              // Create a trend summary
              historicalTrends = `
RISK TREND ANALYSIS:
- Risk trend over ${sortedHistory.length} reports: ${riskTrend > 0 ? '⬆️ Increasing' : riskTrend < 0 ? '⬇️ Decreasing' : '⬌ Stable'}
- Risk change: ${riskTrend > 0 ? '+' : ''}${riskTrend} points
- Last recorded risk level: ${newestRisk}/100
- Historical risk pattern: ${sortedHistory.map(h => h.riskScore).join(' → ')}

Historical event pattern suggests ${riskTrend > 10 ? 'significant deterioration' : riskTrend < -10 ? 'significant improvement' : 'relative stability'} in supply chain conditions.
              `;
            }
          } catch (error) {
            console.warn('Error processing memory trends:', error);
          }
        }
        
        // Log successful memory retrieval
        console.log(`Memory retrieved for node ${node.node_id}: ${memoryContext.length} chars, ${rawMemories?.length || 0} memory entries`);
        
      } catch (error: any) {
        console.warn('Mem0 memory retrieval failed:', {
          nodeId: node.node_id,
          error: error.message,
          status: error.status || 'unknown'
        });
        
        // Provide specific error context based on error type
        if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
          memoryContext = 'Memory service authentication failed - check MEM0_API_KEY configuration.';
        } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
          memoryContext = 'Memory service quota exceeded - upgrade Mem0 plan or try again later.';
        } else {
          memoryContext = `Memory service temporarily unavailable: ${error.message}`;
        }
      }
    } else {
      console.warn('MEM0_API_KEY not configured, skipping memory retrieval');
      memoryContext = 'Memory service not configured - historical context unavailable.';
    }    return `
      ${supplyChainContext}
      
      NODE CONTEXT:
      - Name: ${node.name}
      - Type: ${node.type}
      - Location: ${node.address || 'Location not specified'}
      - Coordinates: ${node.location_lat && node.location_lng ? `${node.location_lat},${node.location_lng}` : 'Coordinates not available'}
      - Industry: ${node.data?.industry || 'General'}
      - Capacity: ${node.data?.capacity || 'Unknown'}
      - Description: ${node.description || 'No description'}
      
      HISTORICAL INTELLIGENCE MEMORY:
      ${memoryContext}
      
      ${historicalTrends}
      
      FOCUS AREAS FOR EDGE-AWARE INTELLIGENCE:
      - Supply chain disruptions affecting ${node.type} operations and connected transport routes
      - Transport route disruptions affecting various transport modes
      - Weather events in ${node.address || 'this location'} affecting logistics corridors
      - Geopolitical events affecting trade routes and transport networks
      - Regulatory changes in logistics/shipping affecting edge connections
      - Economic factors affecting supply chains and transport costs
      - Port congestions, strikes, closures affecting connected routes
      - Manufacturing shutdowns or capacity changes in connected supplier/customer nodes
      - Cross-border trade issues affecting international transport edges
      - Infrastructure problems affecting transport networks and edge reliability
    `;
  }
  
  public async gatherComprehensiveIntelligence(node: any, supplyChainData?: any): Promise<any> {
    const startTime = Date.now();
    const context = await this.buildSearchContext(node, supplyChainData);

    // Check API keys availability
    const googleApiMissing = !process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const tavilyApiMissing = !process.env.TAVILY_API_KEY;
    const weatherApiMissing = !process.env.OPENWEATHER_API_KEY;
    
    // Determine available data sources
    const dataSources = {
      tavily: !tavilyApiMissing,
      weather: !weatherApiMissing,
      memory: process.env.MEM0_API_KEY ? true : false
    };
    // If all critical APIs are missing, use fallback mode
    if (googleApiMissing && tavilyApiMissing && weatherApiMissing) {
      console.log('Using complete fallback mode - all critical API keys missing');
      return this.generateFallbackIntelligence(node, startTime, supplyChainData);
    }

      // Data collection object to track what we've obtained
    const collectedData: {
      tavilyResults: any[];
      weatherForecast: any;
      previousIntelligence: any;
      memoryTrends: {
        available: boolean;
        riskDelta: number;
        eventCountDelta: number;
        historicalRisk: number[];
        historicalEvents: number[];
      };
      industryNews: any[];
      dataSourcesChecked: number;
    } = {
      tavilyResults: [],
      weatherForecast: null,
      previousIntelligence: null,
      memoryTrends: {
        available: false,
        riskDelta: 0,
        eventCountDelta: 0,
        historicalRisk: [],
        historicalEvents: []
      },
      industryNews: [],
      dataSourcesChecked: 0
    };
    
    // Retrieve memory context history for trend analysis
    if (dataSources.memory) {
      try {
        // Get past intelligence from Mem0 using getMemories instead of search
        const previousIntel = await getMemories(`node:${node.node_id} supply chain intelligence`, {
          user_id: `node:${node.node_id}`,
          mem0ApiKey: process.env.MEM0_API_KEY || '',
        
        });
        
        if (previousIntel && previousIntel.length > 0) {
          console.log(`Retrieved ${previousIntel.length} previous intelligence entries for node ${node.node_id}`);
          
          // Extract risk scores and event counts
          const riskScores = [];
          const eventCounts = [];
          
          for (const intel of previousIntel) {
            if (!intel.text) continue;
            
            // Extract risk score
            const riskMatch = intel.text.match(/Risk Score:\s*(\d+)/i);
            if (riskMatch && riskMatch[1]) {
              riskScores.push(parseInt(riskMatch[1]));
            }
            
            // Extract event count
            const eventMatch = intel.text.match(/Critical Events:\s*(\d+)/i);
            if (eventMatch && eventMatch[1]) {
              eventCounts.push(parseInt(eventMatch[1]));
            }
          }
          
          // Calculate trends if we have data
          if (riskScores.length >= 2) {
            collectedData.memoryTrends.available = true;
            collectedData.memoryTrends.historicalRisk = riskScores;
            collectedData.memoryTrends.historicalEvents = eventCounts;
            collectedData.memoryTrends.riskDelta = riskScores[0] - riskScores[riskScores.length - 1];
            
            if (eventCounts.length >= 2) {
              collectedData.memoryTrends.eventCountDelta = eventCounts[0] - eventCounts[eventCounts.length - 1];
            }
            
            collectedData.dataSourcesChecked++;
            console.log(`Memory trends analysis successful for node ${node.node_id}: Risk delta: ${collectedData.memoryTrends.riskDelta}`);
          }
        }
      } catch (error) {
        console.error('Memory context retrieval error:', error);
        // Continue without memory trends
      }
    }

    try {      // INTEGRATION 1: Tavily Search (with robust retry logic)
      if (dataSources.tavily) {
        try {
          // Initialize Tavily client
          const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY! });
          
          // Create more strategic search queries with supply chain specific focus
          const searchQueries = [
            `${node.type} supply chain disruption ${node.location} recent news`,
            `${node.industry || node.type} ${node.location} logistics problems`,
            `geopolitical issues affecting ${node.type} supply chain ${node.location}`,
            `${node.location} weather impact on ${node.type} operations`,
            `${node.industry || 'supply chain'} price fluctuations ${node.location}`
          ];
          
          // Track success rate and implement retry logic
          let successfulQueries = 0;
          const maxRetries = 2;
          
          // Perform searches with enhanced domain targeting and retry logic
          for (const query of searchQueries) {
            let retries = 0;
            let success = false;
            
            while (!success && retries <= maxRetries) {
              try {
                // If this isn't the first attempt, wait longer between retries
                if (retries > 0) {
                  await new Promise(resolve => setTimeout(resolve, 1000 * retries));
                  console.log(`Retry #${retries} for query: ${query}`);
                }
                
                const result = await tavilyClient.search(query, {
                  maxResults: 4,
                  searchDepth: retries === maxRetries ? 'basic' : 'advanced', // Fall back to basic search on final retry
                  topic: 'news',
                  days: 10, // Look back further for trending issues
                  includeAnswer: true,
                  includeDomains: [
                    'reuters.com', 'bloomberg.com', 'wsj.com', 'ft.com',
                    'apnews.com', 'cnn.com', 'bbc.com', 'economist.com',
                    'logisticsmgmt.com', 'supplychaindive.com', 'freightwaves.com',
                    'scm.ncsu.edu', 'ism.ws', 'logistics.org', 'resilienc.io'
                  ],
                  excludeDomains: ['twitter.com', 'facebook.com', 'reddit.com', 'pinterest.com', 'instagram.com']
                });
                
                // Check if we got meaningful results
                if (result && result.results && result.results.length > 0) {
                  // Extract only essential information to reduce token usage
                  const compactResult = {
                    query,
                    answer: result.answer?.substring(0, 350) || '', 
                    results: result.results?.slice(0, 3).map(r => ({
                      title: r.title?.substring(0, 120) || '',
                      content: r.content?.substring(0, 250) || '',
                      url: r.url,
                      publishedDate: r.publishedDate || '',
                      score: r.score || 0
                    })) || []
                  };
                  
                  collectedData.tavilyResults.push(compactResult);
                  collectedData.dataSourcesChecked++;
                  successfulQueries++;
                  success = true;
                  
                  console.log(`Successful Tavily search for "${query}": ${result.results.length} results`);
                } else {
                  // No results but API call succeeded, count as success to avoid unnecessary retries
                  console.warn(`Tavily search for "${query}" returned no results`);
                  success = true;
                }
              } catch (error: any) {
                console.error(`Tavily search error for query "${query}" (attempt ${retries + 1}):`, error.message || error);
                retries++;
                
                // Check for rate limiting or quota issues and apply exponential backoff
                if (error.message?.includes('429') || error.message?.includes('rate') || error.message?.includes('quota')) {
                  await new Promise(resolve => setTimeout(resolve, 2000 * (retries * retries)));
                }
              }
            }
            
            // Rate limiting between queries
            await new Promise(resolve => setTimeout(resolve, 800));
          }
          
          // Log success rate for monitoring and debugging
          console.log(`Tavily search success rate: ${successfulQueries}/${searchQueries.length} queries`);
          
        } catch (error) {
          console.error('Tavily integration error:', error);
          
          // Record the failure in metadata for reporting
          collectedData.tavilyResults.push({
            error: error instanceof Error ? error.message : 'Unknown Tavily error',
            failedAt: new Date().toISOString(),
            query: 'tavily_integration_failure'
          });
        }
      }      // INTEGRATION 2: Weather forecast for node location with improved reliability
      if (dataSources.weather) {
        try {
          let lat, lon;
          const defaultCoordinates = { lat: 0, lon: 0, source: 'default' };
          let coordinatesSource = 'unknown';
          
          // Primary: Use location_lat and location_lng from database
          if (node.location_lat && node.location_lng) {
            lat = parseFloat(node.location_lat);
            lon = parseFloat(node.location_lng);
            coordinatesSource = 'database location fields';
          }
          // Fallback: Check node.data.coordinates from JSONB field
          else if (node.data?.coordinates) {
            try {
              if (typeof node.data.coordinates === 'string') {
                const parts = node.data.coordinates.split(',').map((p: string) => parseFloat(p.trim()));
                if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                  [lat, lon] = parts;
                  coordinatesSource = 'node.data.coordinates (string)';
                }
              } else if (Array.isArray(node.data.coordinates) && node.data.coordinates.length >= 2) {
                [lat, lon] = node.data.coordinates.map(Number);
                coordinatesSource = 'node.data.coordinates (array)';
              }
            } catch (parseError) {
              console.error('Error parsing coordinates from node.data:', parseError);
            }
          }
          
          // Geocoding fallback using address instead of location
          if ((lat === undefined || lon === undefined) && node.address) {
            try {
              // Hardcoded coordinates for common locations to reduce API calls and handle errors
              const commonLocations: Record<string, {lat: number, lon: number}> = {
                'austin': {lat: 30.2672, lon: -97.7431},
                'new york': {lat: 40.7128, lon: -74.0060},
                'los angeles': {lat: 34.0522, lon: -118.2437},
                'london': {lat: 51.5074, lon: -0.1278},
                'tokyo': {lat: 35.6762, lon: 139.6503},
                'shanghai': {lat: 31.2304, lon: 121.4737},
                'singapore': {lat: 1.3521, lon: 103.8198},
              };
              
              // Check for known locations first
              const normalizedLocation = node.address.toLowerCase();
              let found = false;
              
              for (const [key, coords] of Object.entries(commonLocations)) {
                if (normalizedLocation.includes(key)) {
                  lat = coords.lat;
                  lon = coords.lon;
                  coordinatesSource = `common location match: ${key}`;
                  found = true;
                  break;
                }
              }
              
              // Try geocoding API only if we didn't find a match and the API key is available
              if (!found && process.env.OPENWEATHER_API_KEY) {
                // Try geocode the location using OpenWeather's API
                const geocodeUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(node.address)}&limit=1&appid=${process.env.OPENWEATHER_API_KEY}`;
                const geoResponse = await fetch(geocodeUrl);
                
                if (geoResponse.ok) {
                  const geoData = await geoResponse.json();
                  if (geoData && geoData.length > 0) {
                    lat = geoData[0].lat;
                    lon = geoData[0].lon;
                    coordinatesSource = 'geocoding API';
                    console.log(`Successfully geocoded location "${node.address}" to coordinates ${lat},${lon}`);
                  }
                } else {
                  console.warn(`Geocoding failed for "${node.address}": ${geoResponse.status} ${geoResponse.statusText}`);
                }
              }
            } catch (error) {
              console.error('Geocoding error:', error);
            }
          }
          
          // If we have valid coordinates, proceed with weather forecast
          if (!isNaN(lat) && !isNaN(lon) && lat !== undefined && lon !== undefined) {
            console.log(`Using coordinates for ${node.name}: ${lat},${lon} (source: ${coordinatesSource})`);
            
            // Single attempt weather retrieval - our service handles retries and fallbacks internally now
            try {
              collectedData.weatherForecast = await weatherService.getWeatherForecast(lat, lon);
              
              if (collectedData.weatherForecast) {
                collectedData.dataSourcesChecked++;
                console.log(`Weather data obtained for ${node.name}: ${collectedData.weatherForecast.location || 'Unknown location'}`);
                
                // Add coordinates to the forecast data for reference
                collectedData.weatherForecast.coordinates = {
                  lat, 
                  lon, 
                  source: coordinatesSource
                };
              }
            } catch (error) {
              console.error(`Weather forecast error:`, error);
            }
          } else {
            // Use a very simple fallback approach that doesn't require coordinates
            console.warn(`No valid coordinates available for node ${node.node_id} (${node.name}) - using generic weather fallback`);
            collectedData.weatherForecast = {
              location: node.location || 'Unknown location',
              coordinates: defaultCoordinates,
              source: 'fallback (no coordinates)',
              forecasts: [
                {
                  date: new Date().toISOString().split('T')[0],
                  weather: 'Unknown',
                  description: 'Weather data unavailable - no coordinates',
                  temp: 20, // Default reasonable temperature
                  severe: false
                }
              ]
            };
          }
        } catch (error) {
          console.error('Weather integration error:', error);
          // Continue without weather data if unavailable
        }
      }
      
      // INTEGRATION 3: Retrieve previous intelligence for comparison
      if (dataSources.memory) {
        try {
          // Get the last intelligence report for this node to track changes
          const previousIntel = await this.getCachedIntelligence(node.node_id);
          if (previousIntel) {
            collectedData.previousIntelligence = {
              timestamp: previousIntel.timestamp,
              riskScore: previousIntel.intelligence?.riskAssessment?.overallRiskScore || 0,
              criticalEvents: previousIntel.intelligence?.criticalEvents?.length || 0,
              topRisks: previousIntel.intelligence?.riskAssessment?.riskFactors?.slice(0, 2).map((f: any) => f.factor) || []
            };
            collectedData.dataSourcesChecked++;
          }
        } catch (error) {
          console.error('Previous intelligence retrieval error:', error);
        }
      }      // Build an enhanced prompt with all collected data
      let enhancedPrompt = `
Analyze comprehensive supply chain data for ${node.name} (${node.type}) in ${node.address || 'unknown location'}:

NODE CONTEXT:
- Name: ${node.name}
- Type: ${node.type}
- Location: ${node.address || 'Not specified'}
- Industry: ${node.data?.industry || 'General'}
- Capacity: ${node.data?.capacity || 'Unknown'}

${supplyChainData?.form_data ? 'COMPANY CONTEXT:\n' + JSON.stringify(supplyChainData.form_data, null, 2) : ''}

SEARCH RESULTS:
${JSON.stringify(collectedData.tavilyResults, null, 1)}`;// Add weather data if available
      if (collectedData.weatherForecast) {
        enhancedPrompt += `\n\nWEATHER FORECAST (${collectedData.weatherForecast?.location || node.location}):
${JSON.stringify(collectedData.weatherForecast?.forecasts || [], null, 1)}`;
      }

      // Add previous intelligence for trend analysis
      if (collectedData.previousIntelligence) {
        const timestamp = collectedData.previousIntelligence?.timestamp ? 
          new Date(collectedData.previousIntelligence.timestamp).toLocaleDateString() : 'previous report';
        
        enhancedPrompt += `\n\nPREVIOUS INTELLIGENCE (${timestamp}):
- Risk Score: ${collectedData.previousIntelligence?.riskScore || 'N/A'}/100
- Critical Events: ${collectedData.previousIntelligence?.criticalEvents || 0}
- Top Risks: ${Array.isArray(collectedData.previousIntelligence?.topRisks) ? 
    collectedData.previousIntelligence.topRisks.join(', ') : 'None recorded'}`;
      }// Add memory trends to prompt if available
      if (collectedData.memoryTrends.available) {
        enhancedPrompt += `\n\nMEMORY TRENDS ANALYSIS:
- Historical risk score pattern: ${collectedData.memoryTrends.historicalRisk.join(' → ')}
- Risk change over time: ${collectedData.memoryTrends.riskDelta > 0 ? '+' : ''}${collectedData.memoryTrends.riskDelta} points
- Critical event pattern: ${collectedData.memoryTrends.historicalEvents.join(' → ')} events
- Event count change: ${collectedData.memoryTrends.eventCountDelta > 0 ? '+' : ''}${collectedData.memoryTrends.eventCountDelta} events`;
      }

      // Complete the prompt with analysis instructions
      enhancedPrompt += `
\nINSTRUCTIONS:
1. Generate structured supply chain intelligence focusing on ACTIONABLE insights
2. Identify critical events (severity >50, high impact)
3. Calculate overall risk assessment score (0-100) with detailed factors
4. Provide 2-3 specific mitigation strategies

5. RELATIONSHIP MAPPING REQUIREMENTS:
   Create a comprehensive relationship mapping showing causal links between events and their effects on specific nodes AND edges
   - For each critical event, identify CAUSE → EFFECT relationships including edge-specific impacts
   - Example: "Port strike in Shanghai" → "Delay in delivery to Tesla Texas via sea freight edge"
   - Include edge-specific disruptions: transport mode failures, route closures, capacity reductions
   - Map how edge disruptions cascade through the network to affect downstream nodes
   - Include strength of relationship (0.0-1.0) based on confidence and edge risk multipliers
   - Identify primary and secondary impacts on both nodes and connecting edges
   - Consider transport mode vulnerabilities and alternative route availability
   - Populate relationshipMapping array with AT LEAST 3 relationships if any events are detected

6. EDGE-AWARE RISK ASSESSMENT:
   - Analyze how edge characteristics affect overall node risk
   - Consider transport mode diversity vs. single-mode dependency
   - Evaluate high-risk edge connections and their impact on node resilience
   - Assess critical path dependencies and cascade failure potential
   - Factor in edge costs, transit times, and risk multipliers for comprehensive risk scoring

6. TREND ANALYSIS REQUIREMENTS:
   ${collectedData.memoryTrends.available ? 
     '- Analyze the risk trend over time (increasing, decreasing, or stable)' +
     '\n   - Explain significant changes in risk level or event count' +
     '\n   - Consider if current events are part of a pattern or new developments' :
     '- This appears to be the first intelligence report for this node' +
     '\n   - Establish baseline risk assessment for future trend analysis'}

7. WEATHER IMPACT ASSESSMENT:
   ${collectedData.weatherForecast ? 
     '- Analyze the forecast data for potential supply chain disruptions' +
     '\n   - Identify any severe weather that could impact operations' +
     '\n   - Calculate probability of weather-related delays' :
     '- No detailed weather forecast available' +
     '\n   - Consider seasonal weather patterns for this location'}

Be specific, factual, and provide evidence-based analysis. Focus on real business impact.
YOUR ANALYSIS MUST POPULATE EVERY FIELD IN THE REQUESTED SCHEMA.`;

      // Generate intelligence using enhanced Gemini model
      // Configure Google provider with dedicated key if available
      const google = createGoogleGenerativeAI({
        apiKey: getAIKeyForModule('agents')
      });

      const result = await generateObject({
        model: google(AI_MODELS.agents),
        schema: SupplyChainIntelligenceSchema,
        prompt: enhancedPrompt,
        temperature: 0.2 // Lower temperature for more factual responses
      });

      const processingTime = Date.now() - startTime;        // Add new intelligence to memory for future context using latest Mem0 patterns
      if (process.env.MEM0_API_KEY) {
        try {
          // Format memory data according to Mem0 best practices
          const memoryMessages = [{
            role: 'user' as const,
            content: [{ 
              type: 'text' as const, 
              text: `Supply chain intelligence update for ${node.name} (${node.type}) in ${node.location}:
              
Risk Score: ${result.object.intelligence.riskAssessment.overallRiskScore}/100
Critical Events: ${result.object.intelligence.criticalEvents.length}
Key Risks: ${result.object.intelligence.riskAssessment.riskFactors.map(r => r.factor).join(', ')}
Quality Score: ${this.calculateQualityScore(result.object)}

Critical Events Summary:
${result.object.intelligence.criticalEvents.map(event => 
  `- ${event.title} (${event.impact}): ${event.summary}`
).join('\n')}

Generated at: ${new Date().toISOString()}` 
            }]
          }];          // Simplify Mem0 API call with minimal required parameters
          await addMemories(memoryMessages, {
            user_id: `node:${node.node_id}`,
            mem0ApiKey: process.env.MEM0_API_KEY
          });
          
          console.log(`Successfully stored memory for node ${node.node_id}`);
          
        } catch (error: any) {
          console.warn('Failed to store memories:', {
            nodeId: node.node_id,
            error: error.message,
            status: error.status || 'unknown'
          });
          
          // Don't fail the entire operation if memory storage fails
        }
      }

      // Prepare final intelligence result
      const finalIntelligence = {
        ...result.object,
        nodeId: node.node_id, // Ensure we always use the correct node_id from database
        weatherForecast: collectedData.weatherForecast, // Include weather data for separate storage
        tavilyResults: collectedData.tavilyResults, // Include search results for separate storage
        metadata: {
          ...result.object.metadata,
          processingTime,
          sourcesChecked: collectedData.dataSourcesChecked,
          qualityScore: this.calculateQualityScore(result.object),
          nextUpdateRecommended: this.calculateNextUpdate(result.object),
          memoryContext: process.env.MEM0_API_KEY ? true : false
        }
      };

      // Trigger notifications for critical events (run asynchronously to not block response)
      if (supplyChainData?.user_id && finalIntelligence.intelligence) {
        this.triggerNotificationsAsync(finalIntelligence.intelligence, {
          user_id: supplyChainData.user_id,
          supply_chain_id: supplyChainData.supply_chain_id || node.supply_chain_id,
          node_id: node.node_id,
          node_name: node.name || 'Unknown Node',
          node_type: node.type || 'Unknown Type',
          node_location: node.address || node.location_lat && node.location_lng ? 
            `${node.location_lat},${node.location_lng}` : undefined
        }).catch((error: any) => {
          console.error('Error triggering notifications:', error);
          // Don't fail the main operation if notifications fail
        });
      }

      return finalIntelligence;

    } catch (error) {
      console.error('Intelligence gathering error:', error);
      throw new Error(`Failed to gather intelligence for node ${node.node_id}: ${error}`);
    }
  }

  private calculateQualityScore(intelligence: any): number {
    let score = 0;
    const events = intelligence.intelligence.criticalEvents;
    
    if (!events || events.length === 0) return 0;
    
    // Source credibility
    const avgCredibility = events.reduce((sum: number, event: any) => {
      return sum + event.sources.reduce((s: number, source: any) => s + source.credibility, 0) / event.sources.length;
    }, 0) / events.length;
    
    // Confidence levels
    const avgConfidence = events.reduce((sum: number, event: any) => sum + event.confidence, 0) / events.length;
    
    // Source diversity
    const uniqueSources = new Set(events.flatMap((e: any) => e.sources.map((s: any) => s.url))).size;
    const sourceDiversity = Math.min(uniqueSources / 10, 1);
    
    // Event relevance (critical events score higher)
    const criticalEventsRatio = events.filter((e: any) => e.impact === 'CRITICAL').length / events.length;
    
    score = (avgCredibility * 0.3 + avgConfidence * 0.3 + sourceDiversity * 0.2 + criticalEventsRatio * 0.2);
    return Math.round(score * 100) / 100;
  }

  private calculateNextUpdate(intelligence: any): string {
    const riskScore = intelligence.intelligence.riskAssessment.overallRiskScore;
    const criticalEvents = intelligence.intelligence.criticalEvents.filter((e: any) => e.impact === 'CRITICAL').length;
    
    if (riskScore > 80 || criticalEvents > 0) {
      return new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes
    } else if (riskScore > 60) {
      return new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    } else {
      return new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(); // 4 hours
    }
  }

  /**
   * Build a map of node connections to understand supply chain relationships
   */
  public buildNodeConnectionMap(nodes: any[], edges: any[]): any {
    const nodeMap = new Map(nodes.map(node => [node.node_id, node]));
    const connectionMap: any = {};
    
    // Initialize connection map for each node
    nodes.forEach(node => {
      connectionMap[node.node_id] = {
        upstream: [], // nodes that supply to this node
        downstream: [], // nodes that this node supplies to
        dependencies: 0,
        criticalPath: false
      };
    });
    
    // Build connections based on edges
    edges.forEach(edge => {
      const fromNode = nodeMap.get(edge.from_node_id);
      const toNode = nodeMap.get(edge.to_node_id);
      
      if (fromNode && toNode) {
        // Add downstream connection (from -> to)
        connectionMap[edge.from_node_id].downstream.push({
          nodeId: edge.to_node_id,
          nodeName: toNode.name,
          nodeType: toNode.type,
          edgeType: edge.type,
          transportMode: edge.data?.mode || 'road',
          cost: edge.data?.cost || 0,
          transitTime: edge.data?.transitTime || 0,
          riskMultiplier: edge.data?.riskMultiplier || 1
        });
        
        // Add upstream connection (to <- from)
        connectionMap[edge.to_node_id].upstream.push({
          nodeId: edge.from_node_id,
          nodeName: fromNode.name,
          nodeType: fromNode.type,
          edgeType: edge.type,
          transportMode: edge.data?.mode || 'road',
          cost: edge.data?.cost || 0,
          transitTime: edge.data?.transitTime || 0,
          riskMultiplier: edge.data?.riskMultiplier || 1
        });
        
        // Count dependencies
        connectionMap[edge.to_node_id].dependencies++;
      }
    });
    
    // Identify critical path nodes (high dependency count)
    const maxDependencies = Math.max(...Object.values(connectionMap).map((conn: any) => conn.dependencies));
    Object.keys(connectionMap).forEach(nodeId => {
      if (connectionMap[nodeId].dependencies >= maxDependencies * 0.7) {
        connectionMap[nodeId].criticalPath = true;
      }
    });
    
    return connectionMap;
  }

  async processSupplyChainIntelligence(supplyChainId: string, forceRefresh: boolean = false, supplyChainData?: any): Promise<any[]> {
    const results = [];
    
    // Get all nodes for this supply chain
    const { data: nodes, error } = await supabaseServer
      .from('nodes')
      .select('*')
      .eq('supply_chain_id', supplyChainId);

    if (error) throw error;
    if (!nodes?.length) return [];

    // Get all edges for this supply chain to understand relationships
    const { data: edges, error: edgesError } = await supabaseServer
      .from('edges')
      .select('*')
      .eq('supply_chain_id', supplyChainId);

    if (edgesError) {
      console.warn('Failed to fetch edges:', edgesError);
    }

    console.log(`Processing intelligence for ${nodes.length} nodes and ${edges?.length || 0} edges in supply chain ${supplyChainId}`);
    console.log(`Node IDs to process: ${nodes.map(n => `${n.node_id} (${n.name})`).join(', ')}`);

    // Build supply chain data with edges for enhanced context
    const enhancedSupplyChainData = {
      ...supplyChainData,
      edges: edges || [],
      nodeConnections: this.buildNodeConnectionMap(nodes, edges || [])
    };

    // Process nodes with intelligent prioritization
    const highPriorityNodes = nodes.filter(n => 
      ['port', 'factory', 'warehouse'].includes(n.type?.toLowerCase() || '')
    );
    const regularNodes = nodes.filter(n => 
      !['port', 'factory', 'warehouse'].includes(n.type?.toLowerCase() || '')
    );

    console.log(`High priority nodes: ${highPriorityNodes.length}, Regular nodes: ${regularNodes.length}`);

    // Process high-priority nodes first
    for (const node of highPriorityNodes) {
      try {
        console.log(`Processing high-priority node: ${node.node_id} (${node.name})`);
        
        // Check cache first unless force refresh
        let intelligence = !forceRefresh ? await this.getCachedIntelligence(node.node_id) : null;
        
        if (!intelligence) {
          console.log(`Gathering fresh intelligence for node ${node.node_id}`);
          intelligence = await this.gatherComprehensiveIntelligence(node, enhancedSupplyChainData);
          await this.cacheIntelligence(node.node_id, intelligence);
        } else {
          console.log(`Using cached intelligence for node ${node.node_id}`);
        }
        
        // Ensure nodeId is set correctly and validate the result
        if (intelligence) {
          if (!intelligence.nodeId) {
            console.warn(`Setting missing nodeId for node ${node.node_id}`);
            intelligence.nodeId = node.node_id;
          }
          
          // Validate the nodeId matches
          if (intelligence.nodeId !== node.node_id) {
            console.error(`NodeId mismatch! Expected: ${node.node_id}, Got: ${intelligence.nodeId}`);
            intelligence.nodeId = node.node_id; // Force correct nodeId
          }
          
          console.log(`Validated intelligence for node ${node.node_id}, nodeId: ${intelligence.nodeId}`);
        } else {
          console.error(`No intelligence generated for node ${node.node_id}`);
        }
        
        results.push(intelligence);
        console.log(`Successfully processed node ${node.node_id}, total results: ${results.length}`);
        
        // Rate limiting between calls
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Error processing high-priority node ${node.node_id}:`, error);
        results.push({
          nodeId: node.node_id,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Process regular nodes
    for (const node of regularNodes) {
      try {
        console.log(`Processing regular node: ${node.node_id} (${node.name})`);
        
        let intelligence = !forceRefresh ? await this.getCachedIntelligence(node.node_id) : null;
        
        if (!intelligence) {
          console.log(`Gathering fresh intelligence for node ${node.node_id}`);
          intelligence = await this.gatherComprehensiveIntelligence(node, enhancedSupplyChainData);
          await this.cacheIntelligence(node.node_id, intelligence);
        } else {
          console.log(`Using cached intelligence for node ${node.node_id}`);
        }
        
        // Ensure nodeId is set correctly and validate the result
        if (intelligence) {
          if (!intelligence.nodeId) {
            console.warn(`Setting missing nodeId for node ${node.node_id}`);
            intelligence.nodeId = node.node_id;
          }
          
          // Validate the nodeId matches
          if (intelligence.nodeId !== node.node_id) {
            console.error(`NodeId mismatch! Expected: ${node.node_id}, Got: ${intelligence.nodeId}`);
            intelligence.nodeId = node.node_id; // Force correct nodeId
          }
          
          console.log(`Validated intelligence for node ${node.node_id}, nodeId: ${intelligence.nodeId}`);
        } else {
          console.error(`No intelligence generated for node ${node.node_id}`);
        }
        
        results.push(intelligence);
        console.log(`Successfully processed node ${node.node_id}, total results: ${results.length}`);
        
        // Longer delay for regular nodes
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.error(`Error processing regular node ${node.node_id}:`, error);
        results.push({
          nodeId: node.node_id,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    }

    console.log(`Completed processing ${results.length} nodes for supply chain ${supplyChainId}`);
    console.log(`Results summary: ${results.filter(r => !r.error).length} successful, ${results.filter(r => r.error).length} failed`);
    console.log(`Final result nodeIds: ${results.map(r => r?.nodeId || 'NO_NODE_ID').join(', ')}`);

    return results;
  }
  async getNodeMemories(nodeId: string): Promise<any[]> {
    if (!process.env.MEM0_API_KEY) {
      console.warn('MEM0_API_KEY not configured for memory retrieval');
      return [];
    }

    try {      // Simplify getMemories call with only required parameters
      const memories = await getMemories(`node:${nodeId}`, {
        user_id: `node:${nodeId}`,
        mem0ApiKey: process.env.MEM0_API_KEY
      });
      
      console.log(`Retrieved ${memories.length} memories for node ${nodeId}`);
      return memories;
      
    } catch (error: any) {
      console.error('Error retrieving memories:', {
        nodeId,
        error: error.message,
        status: error.status || 'unknown'
      });
      
      // Return empty array instead of throwing to maintain API stability
      return [];
    }
  }  private generateFallbackIntelligence(node: any, startTime: number, supplyChainData?: any): any {
    // Extract node data properly from database schema
    const nodeAddress = node.address || 'Location not specified';
    const nodeCoords = node.location_lat && node.location_lng ? 
      `${node.location_lat},${node.location_lng}` : 'Coordinates not available';
    const nodeIndustry = node.data?.industry || 'General';
    
    // Include supply chain context in fallback mode
    const companyContext = supplyChainData?.form_data ? 
      `Company: ${typeof supplyChainData.form_data === 'string' 
        ? JSON.parse(supplyChainData.form_data).companyName 
        : supplyChainData.form_data.companyName || supplyChainData.name}` : 
      `Organization: ${supplyChainData?.organisation || 'Unknown'}`;
    
    // Try to get some real data even in fallback mode by using fetch directly
    let sources = [{
      title: 'System Generated Alert',
      url: 'internal://fallback-with-retry',
      publishedAt: new Date().toISOString(),
      credibility: 0.5
    }];
    
    // Attempt to fetch some real data using direct fetch if possible
    try {
      // Try to fetch news for location via a simple web API if Tavily is not available
      if (!process.env.TAVILY_API_KEY && nodeAddress) {
        fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(nodeAddress + ' supply chain')}&sortBy=publishedAt&apiKey=sample-key`)
          .then(response => response.ok ? response.json() : null)
          .then(data => {
            if (data && data.articles && data.articles.length > 0) {
              // Add real news sources if available
              const article = data.articles[0];
              sources.push({
                title: article.title || 'News Update',
                url: article.url || 'https://newsapi.org',
                publishedAt: article.publishedAt || new Date().toISOString(),
                credibility: 0.6
              });
            }
          })
          .catch(() => {
            // Continue with fallback if this fails
          });
      }
    } catch (error) {
      // Silently continue with basic fallback if fetch fails
    }

    // Even in fallback mode, try to populate relationship mapping with at least placeholder data
    const relationshipMapping = [
      {
        source: node.name,
        target: supplyChainData?.name || "Supply Chain Network",
        relationship: "part_of",
        strength: 0.9,
        context: `${node.name} is a ${node.type} node in the broader supply chain network at ${nodeAddress}. ${companyContext}`
      },
      {
        source: "Global Events",
        target: node.name,
        relationship: "affects",
        strength: 0.4,
        context: "Global economic and geopolitical events may affect this node's operations"
      }
    ];

    return {
      nodeId: node.node_id,
      timestamp: new Date().toISOString(),
      intelligence: {
        criticalEvents: [
          {
            title: `Supply Chain Monitoring for ${node.name}`,
            summary: `Regular monitoring active for ${node.type} operations at ${nodeAddress}. ${companyContext}. Limited data available in fallback mode. Real-time data integration pending.`,
            severity: 20,
            impact: 'LOW',
            category: 'OPERATIONAL',
            affectedEntities: [node.name, nodeAddress],
            timeframe: 'Next 24 hours',
            confidence: 0.6,
            sources: sources
          }
        ],
        marketIntelligence: {
          priceFluctuations: [],
          demandShifts: ['Normal operations expected'],
          competitorActivities: ['Monitoring in progress']
        },
        riskAssessment: {
          overallRiskScore: 25,
          riskFactors: [
            {
              factor: 'Limited intelligence gathering',
              probability: 1.0,
              impact: 20
            },
            {
              factor: 'API integration pending',
              probability: 1.0, 
              impact: 15
            }
          ],
          mitigationSuggestions: [
            'Configure API keys for full intelligence gathering',
            'Monitor manual sources for critical updates',
            'Establish backup communication channels',
            'Implement Tavily integration for real-time intelligence'
          ]
        },
        relationshipMapping: relationshipMapping
      },
      metadata: {
        processingTime: Date.now() - startTime,
        sourcesChecked: 0,
        qualityScore: 0.3,
        nextUpdateRecommended: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        memoryContext: false,
        fallbackMode: true,
        fallbackReason: !process.env.TAVILY_API_KEY ? "Missing Tavily API Key" : 
                        !process.env.OPENWEATHER_API_KEY ? "Missing OpenWeather API Key" : 
                        !process.env.GOOGLE_GENERATIVE_AI_API_KEY ? "Missing Google AI API Key" : "Unknown reason",
        nodeData: {
          address: nodeAddress,
          coordinates: nodeCoords,
          industry: nodeIndustry,
          type: node.type,
          supply_chain_id: node.supply_chain_id
        }
      }
    };
  }
  async storeStructuredMemory(node: any, intelligenceData: any): Promise<boolean> {
    if (!process.env.MEM0_API_KEY) {
      return false;
    }
    
    try {
      // Create a structured memory with clear hierarchical organization
      const eventsSummary = intelligenceData.intelligence.criticalEvents
        .map((e: any) => `- ${e.title} (${e.impact}, ${e.severity}/100): ${e.summary}`)
        .join('\n');
      
      const riskFactors = intelligenceData.intelligence.riskAssessment.riskFactors
        .map((r: any) => `- ${r.factor}: Impact ${r.impact}/100, Probability ${Math.round(r.probability * 100)}%`)
        .join('\n');
      
      const mitigation = intelligenceData.intelligence.riskAssessment.mitigationSuggestions
        .map((m: any) => `- ${m}`)
        .join('\n');
      
      // Create message with structured intelligence
      const memoryMessages = [{
        role: 'user' as const,
        content: [{ 
          type: 'text' as const, 
          text: `## Supply Chain Intelligence Report: ${node.name}
Date: ${new Date().toISOString()}
Node: ${node.name} (${node.type}) in ${node.location}
Risk Score: ${intelligenceData.intelligence.riskAssessment.overallRiskScore}/100
Quality Score: ${intelligenceData.metadata.qualityScore}

### Critical Events
${eventsSummary || 'No critical events detected'}

### Risk Factors
${riskFactors || 'No significant risk factors identified'}

### Recommended Mitigation
${mitigation || 'No specific mitigation required at this time'}

### Market Intelligence
Price Fluctuations: ${intelligenceData.intelligence.marketIntelligence.priceFluctuations.length} detected
Demand Shifts: ${intelligenceData.intelligence.marketIntelligence.demandShifts.join(', ') || 'None detected'}
` 
          }]
      }];      // Simplify addMemories call with minimal required parameters
      await addMemories(memoryMessages, {
        user_id: `node:${node.node_id}`,
        mem0ApiKey: process.env.MEM0_API_KEY,
        run_id: `intel-${Date.now()}` // Keep the run_id as it's useful for tracking
      });
      
      console.log(`Successfully stored structured memory for node ${node.node_id}`);
      return true;
    } catch (error: any) {
      console.warn('Failed to store structured memory:', {
        nodeId: node.node_id,
        error: error.message,
        status: error.status || 'unknown'
      });
      return false;
    }
  }

  /**
   * Asynchronously trigger notifications for critical events
   * This method runs in the background to avoid blocking the main intelligence response
   */
  private async triggerNotificationsAsync(
    intelligenceData: any,
    context: {
      user_id: string;
      supply_chain_id: string;
      node_id: string;
      node_name: string;
      node_type: string;
      node_location?: string;
    }
  ): Promise<void> {
    try {
      console.log('Triggering notifications for critical events', {
        component: 'ProductionIntelligenceAgent',
        user_id: context.user_id,
        node_id: context.node_id,
        criticalEventsCount: intelligenceData.criticalEvents?.length || 0
      });

      const notificationIds = await NotificationTrigger.processIntelligenceForNotifications(
        intelligenceData,
        context
      );

      console.log('Successfully triggered notifications', {
        component: 'ProductionIntelligenceAgent',
        notificationIds,
        count: notificationIds.length
      });

    } catch (error: any) {
      console.error('Failed to trigger notifications', {
        component: 'ProductionIntelligenceAgent',
        error: error.message,
        context
      });
      // Don't rethrow - this should not break the main intelligence flow
    }
  }
}

// Quota Manager Class
// API Key Validation System
interface ApiKeyStatus {
  name: string;
  isValid: boolean;
  isConfigured: boolean;
  error?: string;
  details?: string;
}

interface ValidationResult {
  allValid: boolean;
  canProceed: boolean;
  issues: ApiKeyStatus[];
  recommendations: string[];
}

class ApiKeyValidator {
  
  static async validateAllKeys(): Promise<ValidationResult> {
    const results: ApiKeyStatus[] = [];
    
    // Validate Google Gemini API Key
    const geminiStatus = await this.validateGeminiKey();
    results.push(geminiStatus);
    
    // Validate Tavily API Key
    const tavilyStatus = await this.validateTavilyKey();
    results.push(tavilyStatus);
    
    // Validate Mem0 API Key (optional)
    const mem0Status = await this.validateMem0Key();
    results.push(mem0Status);
    
    // Validate Redis Keys (optional)
    const redisStatus = await this.validateRedisKeys();
    results.push(redisStatus);
    
    // Validate Supabase Keys
    const supabaseStatus = await this.validateSupabaseKeys();
    results.push(supabaseStatus);
    
    const allValid = results.every(r => r.isValid);
    const criticalServices = results.filter(r => 
      ['Google Gemini', 'Tavily', 'Supabase'].includes(r.name)
    );
    const canProceed = criticalServices.every(r => r.isValid);
    
    const recommendations = this.generateRecommendations(results);
    
    return {
      allValid,
      canProceed,
      issues: results.filter(r => !r.isValid),
      recommendations
    };
  }
  
  // Public method to validate just the Mem0 key
  static async validateMem0ApiKey(): Promise<ApiKeyStatus> {
    return this.validateMem0Key();
  }
  
  private static async validateGeminiKey(): Promise<ApiKeyStatus> {
    const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    
    if (!key) {
      return {
        name: 'Google Gemini',
        isValid: false,
        isConfigured: false,
        error: 'API key not configured',
        details: 'GOOGLE_GENERATIVE_AI_API_KEY environment variable is missing'
      };
    }
    
    try {
      // Test Gemini API with minimal request
      const testModel = google(AI_MODELS.agents);
      const testResult = await generateObject({
        model: testModel,
        schema: z.object({ test: z.string() }),
        prompt: 'Return {"test": "ok"}'
      });
      
      return {
        name: 'Google Gemini',
        isValid: true,
        isConfigured: true,
        details: 'API key validated successfully'
      };
    } catch (error) {
      let errorDetails = 'Unknown error';
      
      if (error instanceof Error) {
        if (error.message.includes('quota')) {
          errorDetails = 'API quota exceeded - upgrade your plan or wait for quota reset';
        } else if (error.message.includes('invalid')) {
          errorDetails = 'Invalid API key - check your Google AI Studio credentials';
        } else if (error.message.includes('permission')) {
          errorDetails = 'Permission denied - ensure API is enabled in Google Cloud';
        } else {
          errorDetails = error.message;
        }
      }
      
      return {
        name: 'Google Gemini',
        isValid: false,
        isConfigured: true,
        error: 'API validation failed',
        details: errorDetails
      };
    }
  }
  
  private static async validateTavilyKey(): Promise<ApiKeyStatus> {
    const key = process.env.TAVILY_API_KEY;
    
    if (!key) {
      return {
        name: 'Tavily',
        isValid: false,
        isConfigured: false,
        error: 'API key not configured',
        details: 'TAVILY_API_KEY environment variable is missing'
      };
    }
    
    try {
      // Test Tavily API with minimal search
      const tavilyClient = tavily({ apiKey: key });
      const testResult = await tavilyClient.search('test', {
        maxResults: 1,
        searchDepth: 'basic'
      });
      
      return {
        name: 'Tavily',
        isValid: true,
        isConfigured: true,
        details: 'API key validated successfully'
      };
    } catch (error) {
      let errorDetails = 'Unknown error';
      
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('unauthorized')) {
          errorDetails = 'Invalid API key - check your Tavily dashboard credentials';
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
          errorDetails = 'API quota exceeded - upgrade your Tavily plan';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorDetails = 'Network error - check internet connection';
        } else {
          errorDetails = error.message;
        }
      }
      
      return {
        name: 'Tavily',
        isValid: false,
        isConfigured: true,
        error: 'API validation failed',
        details: errorDetails
      };
    }
  }
  private static async validateMem0Key(): Promise<ApiKeyStatus> {
    const key = process.env.MEM0_API_KEY;
    
    if (!key) {
      return {
        name: 'Mem0 (Optional)',
        isValid: true, // Optional service
        isConfigured: false,
        details: 'Memory features disabled - MEM0_API_KEY not configured'
      };
    }
    
    try {
      // Test Mem0 API with minimal request using minimal parameters
      // Following the latest docs, we'll simplify the validation call
      const testMemories = await retrieveMemories('health check test', {
        user_id: 'health-check',
        mem0ApiKey: key
      });
      
      // If we get here, the API key is valid
      return {
        name: 'Mem0 (Optional)',
        isValid: true,
        isConfigured: true,
        details: `Memory features enabled - API key validated successfully`
      };
    } catch (error: any) {
      let errorDetails = 'Unknown error';
      
      // Better error handling with specific messages
      if (error.message?.includes('401') || error.message?.includes('unauthorized') || error.message?.includes('Authentication')) {
        errorDetails = 'Invalid API key - Obtain a valid key from https://app.mem0.ai/dashboard/api-keys';
      } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
        errorDetails = 'API quota exceeded - upgrade your Mem0 plan';
      } else if (error.message?.includes('project') || error.message?.includes('organization')) {
        errorDetails = 'Invalid org_id or project_id - these are optional, try without them';
      } else {
        errorDetails = error.message;
      }
      
      console.error('Mem0 validation error:', {
        message: error.message,
        stack: error.stack,
        details: errorDetails
      });
      
      return {
        name: 'Mem0 (Optional)',
        isValid: false,
        isConfigured: true,
        error: 'Memory service unavailable',
        details: `Memory features disabled: ${errorDetails}`
      };
    }
  }
  
  private static async validateRedisKeys(): Promise<ApiKeyStatus> {
    const url = process.env.UPSTASH_REDIS_URL;
    const token = process.env.UPSTASH_REDIS_TOKEN;
    
    if (!url || !token) {
      return {
        name: 'Redis Cache (Optional)',
        isValid: true, // Optional service
        isConfigured: false,
        details: 'Caching disabled - Redis credentials not configured'
      };
    }
    
    try {
      // Test Redis connection
      const testRedis = new Redis({ url, token });
      await testRedis.set('test-key', 'test-value', { ex: 1 });
      await testRedis.del('test-key');
      
      return {
        name: 'Redis Cache (Optional)',
        isValid: true,
        isConfigured: true,
        details: 'Caching enabled - Redis connection validated'
      };
    } catch (error) {
      let errorDetails = 'Unknown error';
      
      if (error instanceof Error) {
        if (error.message.includes('authentication')) {
          errorDetails = 'Invalid credentials - check your Upstash Redis token';
        } else if (error.message.includes('network')) {
          errorDetails = 'Network error - check Redis URL and connectivity';
        } else {
          errorDetails = error.message;
        }
      }
      
      return {
        name: 'Redis Cache (Optional)',
        isValid: false,
        isConfigured: true,
        error: 'Cache service unavailable',
        details: `Caching disabled: ${errorDetails}`
      };
    }
  }
  
  private static async validateSupabaseKeys(): Promise<ApiKeyStatus> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      return {
        name: 'Supabase',
        isValid: false,
        isConfigured: false,
        error: 'Database credentials not configured',
        details: 'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing'
      };
    }
    
    try {
      // Test Supabase connection
      const { data, error } = await supabaseServer
        .from('supply_chains')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      
      return {
        name: 'Supabase',
        isValid: true,
        isConfigured: true,
        details: 'Database connection validated successfully'
      };
    } catch (error) {
      let errorDetails = 'Unknown error';
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid API key')) {
          errorDetails = 'Invalid API key - check your Supabase project credentials';
        } else if (error.message.includes('not found')) {
          errorDetails = 'Database table not found - run migrations first';
        } else {
          errorDetails = error.message;
        }
      }
      
      return {
        name: 'Supabase',
        isValid: false,
        isConfigured: true,
        error: 'Database validation failed',
        details: errorDetails
      };
    }
  }
  
  private static generateRecommendations(results: ApiKeyStatus[]): string[] {
    const recommendations: string[] = [];
    
    const invalidServices = results.filter(r => !r.isValid);
    
    if (invalidServices.some(s => s.name === 'Google Gemini')) {
      recommendations.push('Configure GOOGLE_GENERATIVE_AI_API_KEY for AI analysis features');
    }
    
    if (invalidServices.some(s => s.name === 'Tavily')) {
      recommendations.push('Configure TAVILY_API_KEY for real-time intelligence gathering');
    }
    
    if (invalidServices.some(s => s.name === 'Supabase')) {
      recommendations.push('Configure Supabase credentials for data persistence');
    }
    
    if (invalidServices.some(s => s.name.includes('Mem0'))) {
      recommendations.push('Configure MEM0_API_KEY for enhanced memory features (optional)');
    }
    
    if (invalidServices.some(s => s.name.includes('Redis'))) {
      recommendations.push('Configure Redis credentials for improved performance (optional)');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('All services configured correctly!');
    }
    
    return recommendations;
  }
}

// WeatherService client for node-specific weather forecasts
class WeatherService {
  private apiKey: string;
  private isKeyValid: boolean = true;
  
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || '';
    // Mark key as invalid if not provided
    if (!this.apiKey) {
      this.isKeyValid = false;
    }
  }
  
  async getWeatherForecast(lat: number, lon: number): Promise<any> {
    // Early return with mock data if we know the key is invalid
    if (!this.isKeyValid) {
      console.warn('OpenWeather API key not configured or invalid - using fallback weather data');
      return this.getFallbackWeatherData(lat, lon);
    }
    
    try {
      // Add validation parameters to catch issues early
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
      console.log(`Fetching weather data for coordinates ${lat},${lon} (key: ${this.apiKey ? this.apiKey.substring(0, 3) + '...' : 'missing'})`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        // Mark key as invalid if we get auth errors
        if (response.status === 401 || response.status === 403) {
          this.isKeyValid = false;
          console.error(`OpenWeather API key is invalid or unauthorized (${response.status})`);
          return this.getFallbackWeatherData(lat, lon);
        }
        
        // Handle other errors
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return this.processWeatherData(data);
    } catch (error) {
      console.error('Weather forecast fetch error:', error);
      // Return fallback data instead of null to maintain consistent structure
      return this.getFallbackWeatherData(lat, lon);
    }
  }
  
  // Provide fallback weather data based on coordinates for resilience
  private getFallbackWeatherData(lat: number, lon: number): any {
    // Convert coordinates to a location name (rough estimate)
    const location = this.estimateLocationFromCoordinates(lat, lon);
    
    // Generate some basic fallback weather data
    return {
      location: location,
      country: "Unknown",
      forecasts: [
        {
          date: new Date().toISOString().split('T')[0],
          temp: this.estimateTemperature(lat),
          weather: "Unknown",
          description: "Weather data unavailable",
          wind: 0,
          precipitation: 0,
          severe: false
        },
        {
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          temp: this.estimateTemperature(lat),
          weather: "Unknown",
          description: "Weather data unavailable",
          wind: 0,
          precipitation: 0,
          severe: false
        }
      ],
      source: "fallback",
      message: "Weather API key invalid or unauthorized - using estimated data"
    };
  }
  
  // Simple function to estimate a location name from coordinates
  private estimateLocationFromCoordinates(lat: number, lon: number): string {
    // Very rough estimation of continent/region
    let region = "Unknown Location";
    
    // North America
    if (lat > 15 && lat < 72 && lon < -30 && lon > -170) {
      region = "North America";
    } 
    // Europe
    else if (lat > 36 && lat < 70 && lon > -10 && lon < 40) {
      region = "Europe";
    }
    // Asia
    else if (lat > 0 && lat < 70 && lon > 40 && lon < 180) {
      region = "Asia";
    }
    // Australia
    else if (lat < 0 && lat > -50 && lon > 110 && lon < 180) {
      region = "Australia";
    }
    // South America
    else if (lat < 15 && lat > -60 && lon < -30 && lon > -90) {
      region = "South America";
    }
    // Africa
    else if (lat < 36 && lat > -40 && lon > -20 && lon < 60) {
      region = "Africa";
    }
    
    return `${region} (${lat.toFixed(2)},${lon.toFixed(2)})`;
  }
  
  // Simple temperature estimate based on latitude and current month
  private estimateTemperature(lat: number): number {
    const month = new Date().getMonth(); // 0-11
    const isSummer = (month > 4 && month < 10 && lat > 0) || (month < 4 || month > 9 && lat < 0);
    const absLat = Math.abs(lat);
    
    // Rough temperature estimate
    if (absLat < 15) return isSummer ? 32 : 26; // Tropical
    if (absLat < 30) return isSummer ? 28 : 15; // Subtropical
    if (absLat < 50) return isSummer ? 22 : 5;  // Temperate
    if (absLat < 70) return isSummer ? 15 : -5; // Subpolar
    return isSummer ? 5 : -20; // Polar
  }
  
  private processWeatherData(data: any): any {
    if (!data || !data.list || !data.list.length) {
      return null;
    }
    
    // Extract 5-day forecast (simplified)
    const forecasts = data.list.filter((_: any, i: number) => i % 8 === 0).slice(0, 5);
    
    return {
      location: data.city?.name,
      country: data.city?.country,
      forecasts: forecasts.map((f: any) => ({
        date: new Date(f.dt * 1000).toISOString().split('T')[0],
        temp: f.main.temp,
        weather: f.weather[0].main,
        description: f.weather[0].description,
        wind: f.wind.speed,
        precipitation: f.pop,
        severe: this.isSevereWeather(f)
      }))
    };
  }
  
  private isSevereWeather(forecast: any): boolean {
    const severeConditions = [
      'Thunderstorm', 'Tornado', 'Hurricane', 'Tropical Storm',
      'Blizzard', 'Heavy Snow', 'Ice Storm', 'Freezing Rain'
    ];
    
    // Check for severe weather patterns
    const isHighWind = forecast.wind?.speed > 15; // Wind over 15 m/s
    const isHeavyRain = forecast.rain?.['3h'] > 20; // Heavy rain
    const isSevereType = severeConditions.some(c => 
      forecast.weather?.[0]?.main.includes(c) || 
      forecast.weather?.[0]?.description.toLowerCase().includes(c.toLowerCase())
    );
    
    return isHighWind || isHeavyRain || isSevereType;
  }
}

// Create weather service instance
const weatherService = new WeatherService();

// API Route Handler
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const url = new URL(request.url);
    const supplyChainId = url.searchParams.get('supply_chain_id');
    const nodeId = url.searchParams.get('node_id');
    const forceRefresh = url.searchParams.get('force_refresh') === 'true';
    const getMemories = url.searchParams.get('get_memories') === 'true';
    const healthCheck = url.searchParams.get('health') === 'true';

    // Health check endpoint
    if (healthCheck) {
      const validation = await ApiKeyValidator.validateAllKeys();
      
      return NextResponse.json({
        status: validation.canProceed ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        services: {
          allValid: validation.allValid,
          canProceed: validation.canProceed,
          issues: validation.issues,
          recommendations: validation.recommendations
        },
        processingTime: Date.now() - startTime
      });
    }

    if (!supplyChainId) {
      return NextResponse.json({
        error: 'supply_chain_id parameter is required'
      }, { status: 400 });
    }    // Validate API keys before processing
    const validation = await ApiKeyValidator.validateAllKeys();
    
    // Log validation results
    console.log('API Key Validation Results:', {
      canProceed: validation.canProceed,
      issues: validation.issues.map(i => `${i.name}: ${i.error || 'OK'}`),
      mode: validation.canProceed ? 'LIVE' : 'FALLBACK'
    });

    // Get supply chain information including user_id and form_data for proper data association
    const { data: supplyChain } = await supabaseServer
      .from('supply_chains')
      .select('user_id, name, description, organisation, form_data')
      .eq('supply_chain_id', supplyChainId)
      .single();

    if (!supplyChain) {
      return NextResponse.json({
        error: 'Supply chain not found'
      }, { status: 404 });
    }

    const agent = new ProductionIntelligenceAgent();

    // Handle memory retrieval request
    if (getMemories && nodeId) {
      const memories = await agent.getNodeMemories(nodeId);
      return NextResponse.json({
        success: true,
        nodeId,
        memories,
        count: memories.length
      });
    }

    let results;

    if (nodeId) {
      // Process single node with full network context
      const { data: node } = await supabaseServer
        .from('nodes')
        .select('*')
        .eq('node_id', nodeId)
        .eq('supply_chain_id', supplyChainId)
        .single();

      if (!node) {
        return NextResponse.json({ error: 'Node not found' }, { status: 404 });
      }

      if (!forceRefresh) {
        const cached = await agent.getCachedIntelligence(nodeId);
        if (cached) {
          return NextResponse.json({
            success: true,
            cached: true,
            data: [cached],
            processingTime: Date.now() - startTime
          });
        }
      }

      // Get all nodes and edges for this supply chain to build complete network context
      const { data: allNodes } = await supabaseServer
        .from('nodes')
        .select('*')
        .eq('supply_chain_id', supplyChainId);

      const { data: edges } = await supabaseServer
        .from('edges')
        .select('*')
        .eq('supply_chain_id', supplyChainId);

      // Build enhanced supply chain data with full network context
      const enhancedSupplyChainData = {
        ...supplyChain,
        edges: edges || [],
        nodeConnections: agent.buildNodeConnectionMap(allNodes || [], edges || [])
      };

      const intelligence = await agent.gatherComprehensiveIntelligence(node, enhancedSupplyChainData);
      await agent.cacheIntelligence(nodeId, intelligence);
      results = [intelligence];
    } else {
      // Process entire supply chain
      results = await agent.processSupplyChainIntelligence(supplyChainId, forceRefresh, supplyChain);
    }

    // Store results in database with proper user association
    const validResults = results.filter(r => !r.error && r.nodeId); // Ensure nodeId exists
    console.log(`Filtering results: ${results.length} total, ${validResults.length} valid (with nodeId)`);
    
    // Log detailed information about invalid results
    const invalidResults = results.filter(r => r.error || !r.nodeId);
    if (invalidResults.length > 0) {
      console.warn(`Found ${invalidResults.length} invalid results:`);
      invalidResults.forEach((result, index) => {
        console.warn(`  Invalid result ${index + 1}: nodeId=${result?.nodeId || 'MISSING'}, hasError=${!!result?.error}, error=${result?.error || 'none'}`);
      });
    }
    
    const dbResults = validResults.map(result => {
      console.log(`Preparing DB record for node ${result.nodeId}`);
      
      // Ensure risk_score is an integer (database constraint)
      const rawRiskScore = result.intelligence?.riskAssessment?.overallRiskScore || 0;
      const riskScore = Math.round(Number(rawRiskScore)); // Convert to integer
      
      // Quality score can be decimal (numeric type in DB)
      const qualityScore = Number(result.metadata?.qualityScore || 0);
      
      // Extract weather data from the intelligence result
      const weatherData = {
        forecast: result.weatherForecast || null,
        lastUpdated: new Date().toISOString(),
        source: result.weatherForecast?.source || 'unknown'
      };
      
      // Extract news/search data from Tavily results
      const newsData = {
        searches: result.tavilyResults || [],
        criticalEvents: result.intelligence?.criticalEvents || [],
        marketIntelligence: result.intelligence?.marketIntelligence || {},
        lastUpdated: new Date().toISOString(),
        sourcesChecked: result.metadata?.sourcesChecked || 0
      };
      
      // Store core intelligence data (without weather and news which are now separate)
      const coreIntelligenceData = {
        nodeId: result.nodeId,
        timestamp: result.timestamp,
        riskAssessment: result.intelligence?.riskAssessment || {},
        relationshipMapping: result.intelligence?.relationshipMapping || [],
        metadata: result.metadata || {}
      };
      
      console.log(`Node ${result.nodeId}: risk_score=${riskScore} (from ${rawRiskScore}), quality_score=${qualityScore}`);
      console.log(`Node ${result.nodeId}: weather_data=${weatherData.forecast ? 'present' : 'null'}, news_items=${newsData.criticalEvents.length}`);
      
      return {
        user_id: supplyChain.user_id,
        supply_chain_id: supplyChainId,
        node_id: result.nodeId,
        intelligence_data: coreIntelligenceData, // Core intelligence without weather/news
        weather: weatherData, // Weather data in separate column
        news: newsData, // News and search data in separate column
        risk_score: riskScore,
        quality_score: qualityScore,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    console.log(`Attempting to store ${dbResults.length} intelligence records in database`);
    console.log(`DB Results nodeIds: ${dbResults.map(r => r.node_id).join(', ')}`);

    if (dbResults.length > 0) {
      try {
        console.log(`Starting database upsert for ${dbResults.length} records...`);
        
        const { data: insertedData, error: insertError } = await supabaseServer
          .from('supply_chain_intel')
          .upsert(dbResults, { 
            onConflict: 'supply_chain_id,node_id',
            ignoreDuplicates: false 
          });

        if (insertError) {
          console.error('Database insertion error:', insertError);
          console.error('Failed records data:', JSON.stringify(dbResults.map(r => ({
            node_id: r.node_id,
            supply_chain_id: r.supply_chain_id,
            user_id: r.user_id
          })), null, 2));
          throw insertError;
        }

        console.log(`Successfully stored ${dbResults.length} intelligence records in database`);
        console.log(`Database operation completed successfully`);
        
      } catch (dbError) {
        console.error('Failed to store intelligence in database:', dbError);
        console.error('Database error details:', {
          error: dbError,
          recordCount: dbResults.length,
          nodeIds: dbResults.map(r => r.node_id)
        });
        // Don't throw here to avoid failing the entire request
      }
    } else {
      console.warn('No valid intelligence data to store in database');
      console.warn('This means either no nodes were processed or all processing failed');
    }

    const summary = {
      totalNodes: results.length,
      successfulNodes: results.filter(r => !r.error).length,
      failedNodes: results.filter(r => r.error).length,
      averageRiskScore: results
        .filter(r => !r.error && r.intelligence?.riskAssessment?.overallRiskScore)
        .reduce((sum, r) => sum + r.intelligence.riskAssessment.overallRiskScore, 0) / 
        results.filter(r => !r.error && r.intelligence?.riskAssessment?.overallRiskScore).length || 0,
      criticalEvents: results
        .filter(r => !r.error)
        .reduce((sum, r) => sum + (r.intelligence?.criticalEvents?.filter((e: any) => e.impact === 'CRITICAL').length || 0), 0),
      memoryEnhanced: results.filter(r => r.metadata?.memoryContext).length
    };    return NextResponse.json({
      success: true,
      data: results,
      summary,
      apiValidation: {
        canProceed: validation.canProceed,
        mode: validation.canProceed ? 'LIVE' : 'FALLBACK',
        issues: validation.issues,
        recommendations: validation.recommendations
      },
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Intelligence API error:', error);
    return NextResponse.json({
      error: 'Intelligence gathering failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      processingTime: Date.now() - startTime
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { supply_chain_id, node_id, stream = false, query } = body;    if (!supply_chain_id) {
      return NextResponse.json({
        error: 'supply_chain_id is required'
      }, { status: 400 });
    }

    // Get supply chain data for context
    const { data: supplyChain } = await supabaseServer
      .from('supply_chains')
      .select('user_id, name, description, organisation, form_data')
      .eq('supply_chain_id', supply_chain_id)
      .single();

    if (!supplyChain) {
      return NextResponse.json({ error: 'Supply chain not found' }, { status: 404 });
    }
    
    // If streaming is requested, use streamText with memory-enhanced intelligence
    if (stream) {
      // Get node information
      const { data: node } = await supabaseServer
        .from('nodes')
        .select('*')
        .eq('node_id', node_id)
        .eq('supply_chain_id', supply_chain_id)
        .single();

      if (!node && node_id) {
        return NextResponse.json({ error: 'Node not found' }, { status: 404 });
      }

      // Get all nodes and edges for this supply chain to build complete network context
      const { data: allNodes } = await supabaseServer
        .from('nodes')
        .select('*')
        .eq('supply_chain_id', supply_chain_id);

      const { data: edges } = await supabaseServer
        .from('edges')
        .select('*')
        .eq('supply_chain_id', supply_chain_id);

      // Build enhanced supply chain data with full network context
      const enhancedSupplyChainData = {
        ...supplyChain,
        edges: edges || [],
        nodeConnections: new ProductionIntelligenceAgent().buildNodeConnectionMap(allNodes || [], edges || [])
      };
        // Validate Mem0 key configuration before proceeding
      const apiKeyStatus = await ApiKeyValidator.validateMem0ApiKey();
      const memoryEnabled = apiKeyStatus.isValid && apiKeyStatus.isConfigured;
      
      // Get Tavily tools for real-time search
      const tavily = tavilyTools({ apiKey: process.env.TAVILY_API_KEY! });
        // Streaming with Mem0-enhanced intelligence - simplified config
      const streamingModel = memoryEnabled
        ? mem0(AI_MODELS.agents, {
            user_id: `node:${node_id || 'chain'}`
          })
        : google(AI_MODELS.agents);
      
      console.log(`Using streaming model with memory: ${memoryEnabled ? 'enabled' : 'disabled'}`);

      // When a query is provided, don't stream intermediate steps to client
      if (query) {
        // Use generateText instead of streamText to get just the final response
        const result = await generateText({
          model: streamingModel,
          tools: {
            ...tavily,
            getNodeContext: tool({
              description: 'Get supply chain node context, historical intelligence, and network relationships',
              parameters: z.object({
                nodeId: z.string().describe('The node ID to get context for')
              }),
              execute: async ({ nodeId }) => {
                const agent = new ProductionIntelligenceAgent();
                const cached = await agent.getCachedIntelligence(nodeId);
                
                // Use proper Mem0 API with error handling
                let memories = [];
                if (memoryEnabled) {
                  try {
                    memories = await agent.getNodeMemories(nodeId);
                  } catch (error) {
                    console.error('Memory retrieval failed in streaming context:', error);
                  }
                }

                // Get network context for this node
                const nodeConnections = enhancedSupplyChainData.nodeConnections?.[nodeId];
                let networkInfo = 'No network connections found';
                
                if (nodeConnections) {
                  networkInfo = `Network Analysis:
- Role: ${nodeConnections.criticalPath ? 'CRITICAL PATH NODE' : 'Standard Node'}
- Dependencies: ${nodeConnections.dependencies}
- Upstream Suppliers: ${nodeConnections.upstream.length}
- Downstream Customers: ${nodeConnections.downstream.length}
- Total Network Edges: ${enhancedSupplyChainData.edges?.length || 0}

Key Connections:
${nodeConnections.upstream.slice(0, 3).map((up: any) => 
  `↑ ${up.nodeName} (${up.nodeType}) - ${up.transportMode} transport, Risk: ${up.riskMultiplier}x`
).join('\n')}
${nodeConnections.downstream.slice(0, 3).map((down: any) => 
  `↓ ${down.nodeName} (${down.nodeType}) - ${down.transportMode} transport, Risk: ${down.riskMultiplier}x`
).join('\n')}`;
                }
                
                return {
                  cached: cached ? 'Recent intelligence available' : 'No recent intelligence',
                  memories: memories.slice(0, 5), // Last 5 memories
                  nodeInfo: node,
                  networkContext: networkInfo,
                  supplyChainInfo: {
                    name: enhancedSupplyChainData.name,
                    totalNodes: allNodes?.length || 0,
                    totalEdges: enhancedSupplyChainData.edges?.length || 0
                  },
                  memoryStatus: memoryEnabled ? 'enabled' : 'disabled'
                };
              }
            }),
            storeIntelligence: tool({
            description: 'Store gathered intelligence in the database and memory system. IMPORTANT: This is NOT the final step - you must continue to provide a detailed analysis response after storing.',
            parameters: z.object({              intelligence: z.object({
                nodeId: z.string(),
                riskScore: z.number(),
                criticalEvents: z.array(z.object({
                  title: z.string(),
                  summary: z.string(),
                  severity: z.number(),
                  impact: z.string(),
                  category: z.string(),
                  affectedEntities: z.array(z.string()),
                  timeframe: z.string(),
                  confidence: z.number().optional(),
                  sources: z.array(z.object({
                    title: z.string(),
                    url: z.string(),
                    publishedAt: z.string(),
                    credibility: z.number().optional()
                  })).optional()
                })),
                summary: z.string(),
                // Optional fields for enhanced intelligence - now supports null values
                marketIntelligence: z.preprocess(
                  // Convert null to default object structure
                  (val) => val === null ? { 
                    priceFluctuations: [], 
                    demandShifts: [], 
                    competitorActivities: [] 
                  } : val,
                  z.object({
                    priceFluctuations: z.array(z.object({
                      commodity: z.string(),
                      change: z.number(),
                      reason: z.string()
                    })).default([]),
                    demandShifts: z.array(z.string()).default([]),
                    competitorActivities: z.array(z.string()).default([])
                  })
                ).optional(),
                riskFactors: z.array(z.object({
                  factor: z.string(),
                  probability: z.number(),
                  impact: z.number()
                })).optional(),
                mitigationSuggestions: z.array(z.string()).optional(),
                relationshipMapping: z.array(z.object({
                  source: z.string(),
                  target: z.string(),
                  relationship: z.string(),
                  strength: z.number(),
                  context: z.string()
                })).optional(),
                sourcesChecked: z.number().optional(),
                qualityScore: z.number().optional()
              })
            }),
              execute: async ({ intelligence }) => {
                try {
                  // Safety check - ensure marketIntelligence is not null
                  if (intelligence.marketIntelligence === null) {
                    intelligence.marketIntelligence = {
                      priceFluctuations: [],
                      demandShifts: [],
                      competitorActivities: []
                    };
                  }
                  
                  const agent = new ProductionIntelligenceAgent();
                  
                  // Format the intelligence data in our expected structure
                  const formattedIntelligence = {
                    nodeId: intelligence.nodeId,
                    timestamp: new Date().toISOString(),
                    intelligence: {
                      criticalEvents: intelligence.criticalEvents.map((e: any) => ({
                        ...e,
                        confidence: e.confidence || 0.8,
                        sources: e.sources || [{ 
                          title: 'Agent Generated',
                          url: 'internal://streaming',
                          publishedAt: new Date().toISOString(),
                          credibility: 0.7
                        }]
                      })),
                      marketIntelligence: intelligence.marketIntelligence || {
                        priceFluctuations: [],
                        demandShifts: [],
                        competitorActivities: []
                      },
                      riskAssessment: {
                        overallRiskScore: intelligence.riskScore,
                        riskFactors: intelligence.riskFactors || [],
                        mitigationSuggestions: intelligence.mitigationSuggestions || []
                      },
                      relationshipMapping: intelligence.relationshipMapping || []
                    },
                    metadata: {
                      processingTime: 0,
                      sourcesChecked: intelligence.sourcesChecked || 0,
                      qualityScore: intelligence.qualityScore || 0.8,
                      nextUpdateRecommended: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                      memoryContext: memoryEnabled
                    }
                  };
                  
                  // Store in database
                  await supabaseServer
                    .from('supply_chain_intel')
                    .upsert({
                      supply_chain_id,
                      node_id: intelligence.nodeId,
                      intelligence_data: formattedIntelligence,
                      risk_score: intelligence.riskScore,
                      quality_score: formattedIntelligence.metadata.qualityScore,
                      created_at: formattedIntelligence.timestamp,
                      updated_at: formattedIntelligence.timestamp
                    }, { 
                      onConflict: 'supply_chain_id,node_id',
                      ignoreDuplicates: false 
                    });
                  
                  // Store in memory if enabled
                  let memoryStored = false;
                  if (memoryEnabled && node) {
                    memoryStored = await agent.storeStructuredMemory(node, formattedIntelligence);
                  }
                  
                  // Cache intelligence 
                  await agent.cacheIntelligence(intelligence.nodeId, formattedIntelligence);
                  
                  return { 
                    success: true, 
                    message: 'Intelligence stored successfully',
                    memoryStored: memoryStored,
                    timestamp: formattedIntelligence.timestamp
                  };
                } catch (error) {
                  console.error('Intelligence storage error:', error);
                  return { 
                    success: false, 
                    error: error instanceof Error ? error.message : 'Storage failed',
                    memoryStored: false
                  };
                }
              }
            })
          },
          prompt: `
            You are an elite AI supply chain intelligence analyst with advanced real-time research capabilities. Your mission is to provide comprehensive, evidence-based analysis of supply chain disruptions and risks using real-time data and historical intelligence.
            
            USER QUERY: "${query || 'Comprehensive supply chain intelligence analysis'}"
            
            SUPPLY CHAIN CONTEXT:
            - Supply Chain ID: ${supply_chain_id}
            ${node ? `- Target Node: ${node.name} (${node.type})` : '- Analyzing entire supply chain'}
            ${node?.address ? `- Location: ${node.address}` : ''}
            ${node?.location_lat && node?.location_lng ? `- Coordinates: ${node.location_lat}, ${node.location_lng}` : ''}
            ${supplyChain?.form_data ? `- Company: ${typeof supplyChain.form_data === 'string' ? JSON.parse(supplyChain.form_data).companyName : supplyChain.form_data.companyName || supplyChain.name}` : `- Organization: ${supplyChain.organisation || 'Unknown'}`}
            
            CRITICAL EXECUTION SEQUENCE - FOLLOW EXACTLY:
            
            ═══════════════════════════════════════════════
            PHASE 1: CONTEXT GATHERING (MANDATORY FIRST STEP)
            ═══════════════════════════════════════════════
            🔸 IMMEDIATELY call getNodeContext to retrieve historical intelligence and memory data
            🔸 Analyze the retrieved context to understand past patterns, risks, and vulnerabilities
            🔸 Use this data to inform your search strategy and risk assessment
            
            ═══════════════════════════════════════════════
            PHASE 2: COMPREHENSIVE INTELLIGENCE GATHERING
            ═══════════════════════════════════════════════
            You MUST execute ALL of these search operations:
            
            🔍 SEARCH SET A - Recent Disruptions (MANDATORY):
            - Search: "${node?.name || 'supply chain'} disruption risks current ${new Date().getFullYear()}"
            - Search: "${node?.address || supplyChain?.organisation || 'supply chain'} logistics issues recent"
            - Search: "${node?.type || 'manufacturing'} industry supply chain problems ${new Date().toISOString().slice(0, 7)}"
            
            🔍 SEARCH SET B - Targeted Analysis (MANDATORY):
            - searchQNA: "What supply chain disruptions are currently affecting ${node?.address || 'the region'}?"
            - searchQNA: "Are there any port delays, strikes, or transportation issues in ${node?.address || 'the area'}?"
            - searchQNA: "What weather events or natural disasters could impact logistics in ${node?.address || 'this location'}?"
            
            🔍 SEARCH SET C - Deep Intelligence (MANDATORY):
            - Search for weather alerts and natural disasters in the region
            - Search for economic indicators and market disruptions
            - Search for regulatory changes affecting the industry
            - If you find relevant URLs during searches, use extract tool for detailed analysis
            
            ═══════════════════════════════════════════════
            PHASE 3: EVIDENCE-BASED RISK ANALYSIS
            ═══════════════════════════════════════════════
            Based on your comprehensive searches, identify and analyze:
            🎯 Current disruptions (last 7 days) with specific impacts
            🎯 Emerging risks (next 30 days) with probability assessments
            🎯 Historical patterns from memory data showing trends
            🎯 Geographic threats (weather, natural disasters, infrastructure)
            🎯 Industry-specific vulnerabilities and market conditions
            🎯 Regulatory, political, and economic factors
            🎯 Cross-reference findings across multiple sources for accuracy
            
            ═══════════════════════════════════════════════
            PHASE 4: DATA STORAGE (MANDATORY)
            ═══════════════════════════════════════════════
            🔸 Call storeIntelligence with comprehensive structured data including:
            - Risk score (0-100) based on evidence from your searches
            - Critical events with severity levels and probability assessments
            - Market intelligence with specific data points from research
            - Risk factors with evidence-based probability calculations
            - Mitigation suggestions derived from your analysis
            
            ⚠️ CRITICAL: The storeIntelligence tool is for data persistence ONLY. After calling it, you MUST continue with Phase 5.
            
            ═══════════════════════════════════════════════
            PHASE 5: COMPREHENSIVE INTELLIGENCE REPORT
            ═══════════════════════════════════════════════
            
            You MUST provide your final analysis in this EXACT format with ALL sections completed:
            
            # 🚨 Supply Chain Intelligence Report
            
            ## Executive Summary
            [Write 2-3 sentences summarizing the most critical findings from your comprehensive research, including specific risk levels and key threats discovered]
            
            ## 📊 Current Risk Assessment
            **Overall Risk Level:** [LOW/MEDIUM/HIGH/CRITICAL] (Risk Score: X/100)
            **Confidence Level:** [X%] based on [number] verified sources from real-time research
            **Assessment Date:** ${new Date().toISOString()}
            
            ## 🔍 Key Intelligence from Research
            [List 5-7 specific findings with evidence from your web searches - include dates, sources, and specific data]
            • **Critical Finding 1:** [Specific detail with source reference and date]
            • **Critical Finding 2:** [Specific detail with source reference and date]
            • **Critical Finding 3:** [Specific detail with source reference and date]
            • **Critical Finding 4:** [Specific detail with source reference and date]
            • **Critical Finding 5:** [Specific detail with source reference and date]
            
            ## ⚠️ Disruption Risk Matrix
            
            ### 🚨 Immediate Risks (0-7 days):
            - [Specific risk with XX% probability and impact level - based on evidence]
            - [Specific risk with XX% probability and impact level - based on evidence]
            
            ### ⏰ Short-term Risks (1-4 weeks):
            - [Specific risk with XX% probability and impact level - based on evidence]
            - [Specific risk with XX% probability and impact level - based on evidence]
            
            ### 📅 Medium-term Risks (1-3 months):
            - [Specific risk with XX% probability and impact level - based on evidence]
            - [Specific risk with XX% probability and impact level - based on evidence]
            
            ## 🛡️ Actionable Recommendations
            
            ### Priority 1 (Execute Immediately):
            1. [Specific actionable recommendation based on your research]
            2. [Specific actionable recommendation based on your research]
            
            ### Priority 2 (Execute within 1 week):
            1. [Specific preventive measure based on identified risks]
            2. [Specific monitoring protocol based on threats found]
            
            ### Priority 3 (Strategic - 1-3 months):
            1. [Long-term mitigation strategy based on trend analysis]
            2. [Resilience improvement based on vulnerability assessment]
            
            ## 📈 Market & Economic Intelligence
            [Include specific price fluctuations, demand shifts, economic indicators, or competitor activities discovered in your research]
            
            ## 🌍 Geographic & Environmental Factors
            [Detail location-specific threats, weather patterns, infrastructure status, and regional economic conditions found in your searches]
            
            ## 📚 Sources & Evidence Base
            [List the key sources from your Tavily searches with credibility assessment and specific data extracted]
            1. [Source 1 with URL if available and key data point]
            2. [Source 2 with URL if available and key data point]
            3. [Source 3 with URL if available and key data point]
            
            ## 🔄 Continuous Monitoring Protocol
            **Key Indicators to Track:** [Specific metrics from your research]
            **Update Frequency:** [Based on risk level and volatility found]
            **Alert Thresholds:** [Specific trigger points for escalation]
            **Next Review Date:** [Recommended next assessment timing]
            
            ---
            *Intelligence Report Generated: ${new Date().toISOString()}*
            *Sources: Real-time web research + Historical pattern analysis*
            *Confidence: Evidence-based assessment with multiple source verification*
            
            ═══════════════════════════════════════════════
            NON-NEGOTIABLE REQUIREMENTS:
            ═══════════════════════════════════════════════
            ✅ Your response MUST be based on actual web search results, not generic knowledge
            ✅ ALWAYS cite specific facts, dates, numbers, company names, and sources from your searches
            ✅ NEVER provide generic analysis without evidence from your tool calls
            ✅ Use specific risk percentages and impact assessments based on evidence found
            ✅ Include geographic and temporal specificity in all findings
            ✅ Cross-reference multiple sources for accuracy and confidence scoring
            ✅ Minimum 800 words in your final comprehensive response
            ✅ Include at least 5 specific recent events or data points from searches
            ✅ Reference specific dates, locations, companies, and quantitative data
            ✅ The storeIntelligence tool stores data - your main response must be the full analysis
            
            ⛔ FORBIDDEN RESPONSES:
            ⛔ "I have stored the gathered intelligence" (without full analysis)
            ⛔ Generic risk assessments without specific evidence
            ⛔ Responses without citing specific search results
            ⛔ Analysis based solely on general knowledge
            ⛔ Incomplete reports missing required sections
            
            BEGIN COMPREHENSIVE ANALYSIS NOW - Execute all phases in exact sequence and provide the complete formatted intelligence report.
          `,
          maxSteps: 50,
          temperature: 0.05
        });
        
        // Return only the final answer without streaming intermediate steps
        return NextResponse.json({
          success: true,
          analysis: result.text,
          evidence_based: true, // Flag to indicate the response is evidence-based
          analyzed_with_tools: true, // Flag to indicate tools were used
          timestamp: new Date().toISOString()
        });
      } else {
        // Original streaming behavior for interactive exploration without a specific query
        const result = streamText({
          model: streamingModel,
          tools: {
            ...tavily,
            getNodeContext: tool({
              description: 'Get supply chain node context, historical intelligence, and network relationships',
              parameters: z.object({
                nodeId: z.string().describe('The node ID to get context for')
              }),
              execute: async ({ nodeId }) => {
                const agent = new ProductionIntelligenceAgent();
                const cached = await agent.getCachedIntelligence(nodeId);
                
                // Use proper Mem0 API with error handling
                let memories = [];
                if (memoryEnabled) {
                  try {
                    memories = await agent.getNodeMemories(nodeId);
                  } catch (error) {
                    console.error('Memory retrieval failed in streaming context:', error);
                  }
                }

                // Get network context for this node
                const nodeConnections = enhancedSupplyChainData.nodeConnections?.[nodeId];
                let networkInfo = 'No network connections found';
                
                if (nodeConnections) {
                  networkInfo = `Network Analysis:
- Role: ${nodeConnections.criticalPath ? 'CRITICAL PATH NODE' : 'Standard Node'}
- Dependencies: ${nodeConnections.dependencies}
- Upstream Suppliers: ${nodeConnections.upstream.length}
- Downstream Customers: ${nodeConnections.downstream.length}
- Total Network Edges: ${enhancedSupplyChainData.edges?.length || 0}

Key Connections:
${nodeConnections.upstream.slice(0, 3).map((up: any) => 
  `↑ ${up.nodeName} (${up.nodeType}) - ${up.transportMode} transport, Risk: ${up.riskMultiplier}x`
).join('\n')}
${nodeConnections.downstream.slice(0, 3).map((down: any) => 
  `↓ ${down.nodeName} (${down.nodeType}) - ${down.transportMode} transport, Risk: ${down.riskMultiplier}x`
).join('\n')}`;
                }
                
                return {
                  cached: cached ? 'Recent intelligence available' : 'No recent intelligence',
                  memories: memories.slice(0, 5), // Last 5 memories
                  nodeInfo: node,
                  networkContext: networkInfo,
                  supplyChainInfo: {
                    name: enhancedSupplyChainData.name,
                    totalNodes: allNodes?.length || 0,
                    totalEdges: enhancedSupplyChainData.edges?.length || 0
                  },
                  memoryStatus: memoryEnabled ? 'enabled' : 'disabled'
                };
              }
            }),
            // Same storeIntelligence tool as above, but omitted for brevity
            storeIntelligence: tool({
              description: 'Store gathered intelligence in the database and memory system',
              parameters: z.object({
                intelligence: z.object({
                  nodeId: z.string(),
                  riskScore: z.number(),
                  criticalEvents: z.array(z.object({
                    title: z.string(),
                    summary: z.string(),
                    severity: z.number(),
                    impact: z.string(),
                    category: z.string(),
                    affectedEntities: z.array(z.string()),
                    timeframe: z.string(),
                    confidence: z.number().optional(),
                    sources: z.array(z.object({
                      title: z.string(),
                      url: z.string(),
                      publishedAt: z.string(),
                      credibility: z.number().optional()
                    })).optional()
                  })),
                  summary: z.string(),
                  // Optional fields for enhanced intelligence - now supports null values
                  marketIntelligence: z.preprocess(
                    // Convert null to default object structure
                    (val) => val === null ? { 
                      priceFluctuations: [], 
                      demandShifts: [], 
                      competitorActivities: [] 
                    } : val,
                    z.object({
                      priceFluctuations: z.array(z.object({
                        commodity: z.string(),
                        change: z.number(),
                        reason: z.string()
                      })).default([]),
                      demandShifts: z.array(z.string()).default([]),
                      competitorActivities: z.array(z.string()).default([])
                    })
                  ).optional(),
                  riskFactors: z.array(z.object({
                    factor: z.string(),
                    probability: z.number(),
                    impact: z.number()
                  })).optional(),
                  mitigationSuggestions: z.array(z.string()).optional(),
                  relationshipMapping: z.array(z.object({
                    source: z.string(),
                    target: z.string(),
                    relationship: z.string(),
                    strength: z.number(),
                    context: z.string()
                  })).optional(),
                  sourcesChecked: z.number().optional(),
                  qualityScore: z.number().optional()
                })
              }),
              execute: async ({ intelligence }) => {
                // Same implementation as above
                try {
                  // Safety check - ensure marketIntelligence is not null
                  if (intelligence.marketIntelligence === null) {
                    intelligence.marketIntelligence = {
                      priceFluctuations: [],
                      demandShifts: [],
                      competitorActivities: []
                    };
                  }
                  
                  const agent = new ProductionIntelligenceAgent();
                  
                  // Format the intelligence data in our expected structure
                  const formattedIntelligence = {
                    nodeId: intelligence.nodeId,
                    timestamp: new Date().toISOString(),
                    intelligence: {
                      criticalEvents: intelligence.criticalEvents.map((e: any) => ({
                        ...e,
                        confidence: e.confidence || 0.8,
                        sources: e.sources || [{ 
                          title: 'Agent Generated',
                          url: 'internal://streaming',
                          publishedAt: new Date().toISOString(),
                          credibility: 0.7
                        }]
                      })),
                      marketIntelligence: intelligence.marketIntelligence || {
                        priceFluctuations: [],
                        demandShifts: [],
                        competitorActivities: []
                      },
                      riskAssessment: {
                        overallRiskScore: intelligence.riskScore,
                        riskFactors: intelligence.riskFactors || [],
                        mitigationSuggestions: intelligence.mitigationSuggestions || []
                      },
                      relationshipMapping: intelligence.relationshipMapping || []
                    },
                    metadata: {
                      processingTime: 0,
                      sourcesChecked: intelligence.sourcesChecked || 0,
                      qualityScore: intelligence.qualityScore || 0.8,
                      nextUpdateRecommended: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                      memoryContext: memoryEnabled
                    }
                  };
                  
                  // Store in database
                  await supabaseServer
                    .from('supply_chain_intel')
                    .upsert({
                      supply_chain_id,
                      node_id: intelligence.nodeId,
                      intelligence_data: formattedIntelligence,
                      risk_score: intelligence.riskScore,
                      quality_score: formattedIntelligence.metadata.qualityScore,
                      created_at: formattedIntelligence.timestamp,
                      updated_at: formattedIntelligence.timestamp
                    }, { 
                      onConflict: 'supply_chain_id,node_id',
                      ignoreDuplicates: false 
                    });
                  
                  // Store in memory if enabled
                  let memoryStored = false;
                  if (memoryEnabled && node) {
                    memoryStored = await agent.storeStructuredMemory(node, formattedIntelligence);
                  }
                  
                  // Cache intelligence 
                  await agent.cacheIntelligence(intelligence.nodeId, formattedIntelligence);
                  
                  return { 
                    success: true, 
                    message: 'Intelligence stored successfully',
                    memoryStored: memoryStored,
                    timestamp: formattedIntelligence.timestamp
                  };
                } catch (error) {
                  console.error('Intelligence storage error:', error);
                  return { 
                    success: false, 
                    error: error instanceof Error ? error.message : 'Storage failed',
                    memoryStored: false
                  };
                }
              }
            })
          },
          prompt: `
            You are an advanced AI supply chain intelligence analyst with real-time access to web search and memory systems. 
            
            Current Task: ${query || 'Gather comprehensive supply chain intelligence'}
              Supply Chain Context:
            - Supply Chain ID: ${supply_chain_id}
            ${node ? `- Node: ${node.name} (${node.type}) in ${node.address || 'unknown location'}` : '- Analyzing entire supply chain'}
            ${supplyChain?.form_data ? `- Company: ${typeof supplyChain.form_data === 'string' ? JSON.parse(supplyChain.form_data).companyName : supplyChain.form_data.companyName || supplyChain.name}` : `- Organization: ${supplyChain.organisation || 'Unknown'}`}
            
            INSTRUCTIONS:
            
            1. USE TOOLS STRATEGICALLY:
               - Start with getNodeContext to understand historical patterns AND network relationships
               - Analyze the node's position in the supply chain network (critical path, dependencies)
               - Use search tools to find current events and disruptions
               - Use searchQNA for specific questions about supply chain impacts
               - Use storeIntelligence to save important findings
            
            2. INTELLIGENCE PRIORITIES:
               - Critical disruptions affecting operations (severity >70)
               - Network-level risks: disruptions that could cascade through connected nodes
               - Weather events impacting transportation routes to/from connected nodes
               - Port congestions, strikes, or closures affecting upstream/downstream flows
               - Regulatory changes affecting trade routes in the network
               - Market shifts and price fluctuations affecting connected suppliers/customers
               - Geopolitical events affecting supply routes and node connections
            
            3. NETWORK-AWARE ANALYSIS APPROACH:
               - Analyze how disruptions at THIS node would impact connected nodes
               - Consider upstream dependencies and potential bottlenecks
               - Evaluate downstream demand effects and customer impact
               - Assess transportation route risks between connected nodes
               - Focus on locations and industries relevant to this node AND its network connections
               - Cross-reference multiple sources for accuracy
               - Assess probability and impact of identified risks on the broader network
               - Provide actionable recommendations considering network effects
            
            4. COMMUNICATION STYLE:
               - Stream your analysis in real-time as you gather information
               - Explain your reasoning and search strategy
               - Highlight critical findings immediately
               - Provide confidence levels for your assessments
               - Summarize key takeaways at the end
            
            5. SEARCH STRATEGY:
               - Use domain-specific searches for different types of intelligence
               - Search news sites for breaking developments
               - Search logistics sites for industry-specific issues
               - Search government sites for regulatory changes
               - Search weather services for environmental impacts
            
            Begin your analysis now. Use the available tools to gather comprehensive intelligence and provide streaming updates on your findings. ALWAYS use Tavily search tools to gather evidence and base your responses on specific facts and data, not generic information.
          `,
          maxSteps: 25,
          temperature: 0.2
        });

        return result.toDataStreamResponse();
      }
    }

    // Non-streaming fallback - use existing GET logic
    const params = new URLSearchParams({
      supply_chain_id,
      force_refresh: 'false'
    });

    if (node_id) {
      params.append('node_id', node_id);
    }

    const response = await fetch(`${request.url}?${params}`, {
      method: 'GET',
      headers: request.headers
    });

    const result = await response.json();
    return NextResponse.json(result, { status: response.status });

  } catch (error) {
    console.error('POST Intelligence API error:', error);
    return NextResponse.json({
      error: 'Failed to process intelligence request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}