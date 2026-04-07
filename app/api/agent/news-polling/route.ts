import { tavily } from '@tavily/core';
import { NextRequest, NextResponse } from 'next/server';

const tavilyClient = tavily({
  apiKey: process.env.TAVILY_API_KEY
});

// We want to fetch very recent news to simulate an active feed.
// Keeping track of a simulated timeline on the server could get complex,
// so we'll just fetch the absolute latest and let the frontend manage duplicates via URL matching.
// Basic in-memory cache to prevent exhausting Tavily quota
let cachedNews: any[] = [];
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(req: NextRequest) {
  try {
    const now = Date.now();
    
    // Return cached results if they're still fresh
    if (cachedNews.length > 0 && (now - lastFetchTime) < CACHE_TTL) {
      console.log('📡 Returning cached live news (TTL: 5m)');
      return NextResponse.json({ notifications: cachedNews, cached: true });
    }

    console.log('🔍 Fetching fresh news from Tavily...');
    const searchResult = await tavilyClient.search('latest world news and supply chain disruptions', {
      topic: 'news',
      days: 1, // Get news from the last day 
      maxResults: 5,
    });

    if (!searchResult.results || searchResult.results.length === 0) {
      return NextResponse.json({ notifications: cachedNews }); // Return last known good if empty
    }

    // Format the search results into our expected Notification schema structure
    const notifications = searchResult.results.map((result) => {
        const pseudoId = Buffer.from(result.url).toString('base64').substring(0, 30);
        
        return {
          notification_id: `live-news-${pseudoId}`,
          user_id: "live-feed",
          title: result.title,
          message: result.content.substring(0, 300) + (result.content.length > 300 ? '...' : ''),
          notification_type: 'live_news_alert',
          severity: 'HIGH',
          read_status: false,
          created_at: result.publishedDate || new Date().toISOString(),
          citations: {
            category: 'Live News',
            sources: [
              {
                title: result.title.substring(0, 30) + '...',
                url: result.url,
                publishedAt: result.publishedDate,
                credibility: 0.9,
              }
            ],
            affectedEntities: ['Global Supply Chain']
          }
        }
    });

    // Update cache
    cachedNews = notifications;
    lastFetchTime = now;

    return NextResponse.json({ notifications });
  } catch (error: any) {
    console.error('⚠️ News API polling failure (Graceful Fallback):', error?.message);
    
    // If it's a rate limit or any Tavily error, return cached or empty instead of 500
    return NextResponse.json({ 
      notifications: cachedNews, 
      error: 'Rate limit or service error',
      fallback: true 
    });
  }
} 
