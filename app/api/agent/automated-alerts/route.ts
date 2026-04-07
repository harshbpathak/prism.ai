import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { tavily } from '@tavily/core';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { getAIKeyForModule, AI_MODELS } from '@/lib/ai-config';

// Define the expected structure from Gemini when evaluating news against a supply chain
const alertSchema = z.object({
  alerts: z.array(z.object({
    node_id: z.string().describe("The ID of the specific supply chain node affected by the news"),
    title: z.string().describe("A concise, alarming title for the notification"),
    message: z.string().describe("A detailed summary of the threat and its specific implication for the node"),
    severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).describe("The absolute risk severity"),
    news_url: z.string().describe("The URL of the source article"),
    source_title: z.string().describe("The title of the source article"),
    published_at: z.string().describe("The publication date of the article")
  }))
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const supplyChainId = searchParams.get('supplyChainId');
  const userId = searchParams.get('userId');

  if (!supplyChainId || !userId) {
    return NextResponse.json({ error: "Missing supplyChainId or userId" }, { status: 400 });
  }

  try {
    // 1. Fetch Supply Chain Data
    const { data: nodes, error: nodeError } = await supabaseServer
      .from('nodes')
      .select('*')
      .eq('supply_chain_id', supplyChainId);

    if (nodeError || !nodes || nodes.length === 0) {
       return NextResponse.json({ error: "Supply chain nodes not found" }, { status: 404 });
    }

    // 2. Extract key locations/keywords to build a targeted search query
    // To avoid massive queries, we'll take top 5 nodes based on risk or just the first few if no risk is defined
    const topNodes = [...nodes].sort((a, b) => (b.risk_level || 0) - (a.risk_level || 0)).slice(0, 5);
    
    // Create a location string: "Shanghai, Los Angeles, Berlin"
    const locationKeywords = topNodes
      .filter(n => n.name || n.address)
      .map(n => n.name ? (n.name + (n.address ? ` ${n.address}` : '')) : n.address)
      .join(' OR ');

    const searchQuery = `supply chain disruption AND (${locationKeywords})`;
    console.log(`[ALERT-AGENT] Searching Tavily for: ${searchQuery}`);

    // 3. Query Tavily 
    const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });
    const searchResult = await tavilyClient.search(searchQuery, {
      topic: 'news',
      days: 3, // Look at recent news
      maxResults: 5,
    });

    if (!searchResult.results || searchResult.results.length === 0) {
      return NextResponse.json({ success: true, alertsGenerated: 0, message: "No relevant supply chain news found." });
    }

    // 4. Evaluate Threats using Gemini
    const google = createGoogleGenerativeAI({
      apiKey: getAIKeyForModule("agents"),
    });

    const prompt = `
      You are an expert AI Supply Chain Risk Analyst.
      
      I have a specific supply chain with the following critical nodes:
      ${JSON.stringify(topNodes.map(n => ({ id: n.node_id, name: n.name, address: n.address, type: n.type })))}

      I have just pulled the latest live news potentially affecting these regions/components:
      ${JSON.stringify(searchResult.results.map(r => ({ title: r.title, content: r.content, url: r.url, date: r.publishedDate })))}

      Your task is to cross-reference the news with the supply chain nodes. 
      IF, and ONLY IF, a news article poses a direct or highly credible indirect threat to one or more of these specific nodes, generate an alert.
      If the news is general and doesn't clearly map to these specific nodes, do NOT generate an alert for it.
      
      Only return HIGH or CRITICAL severity alerts. If it's a minor delay, ignore it.
    `;

    const { object } = await generateObject({
      model: google(AI_MODELS.agents),
      schema: alertSchema,
      prompt: prompt,
    });

    // 5. Save generated alerts to the database
    if (object.alerts && object.alerts.length > 0) {
      console.log(`[ALERT-AGENT] Gemini found ${object.alerts.length} threats! Saving to DB...`);
      
      const insertPromises = object.alerts.map(async (alert) => {
        // Find the node name for the UI message
        const affectedNode = nodes.find(n => n.node_id === alert.node_id);
        const nodeName = affectedNode?.name || 'Unknown Node';

        return supabaseServer.from('notifications').insert({
           user_id: userId,
           title: `⚠️ ${alert.severity} THREAT: ${nodeName}`,
           message: alert.message,
           notification_type: 'supply_chain_alert',
           severity: alert.severity,
           read_status: false,
           citations: {
              category: 'AI Threat Intelligence',
              affectedNodes: [alert.node_id],
              sources: [
                {
                  title: alert.source_title,
                  url: alert.news_url,
                  publishedAt: alert.published_at,
                  credibility: 0.95
                }
              ]
           }
        });
      });

      await Promise.all(insertPromises);
      return NextResponse.json({ success: true, alertsGenerated: object.alerts.length, data: object.alerts });
    }

    return NextResponse.json({ success: true, alertsGenerated: 0, message: "News evaluated; no direct threats matched critical nodes." });

  } catch (error) {
    console.error('Automated Alert Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal Error" 
    }, { status: 500 });
  }
}
