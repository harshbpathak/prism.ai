import '@/lib/zod-patch';
import { tavily } from '@tavily/core';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

const tavilyClient = tavily({
  apiKey: process.env.TAVILY_API_KEY
});

const FETCH_COOLDOWN = 5 * 60 * 1000; // 5 minutes

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const now = Date.now();

    // Deterministic Database Cooldown Check
    const { data: recentNews } = await supabaseServer
      .from('notifications')
      .select('created_at')
      .eq('user_id', userId)
      .eq('notification_type', 'live_news_alert')
      .order('created_at', { ascending: false })
      .limit(1);

    let shouldFetch = true;
    if (recentNews && recentNews.length > 0) {
      const lastTime = new Date(recentNews[0].created_at).getTime();
      if (now - lastTime < FETCH_COOLDOWN) {
        shouldFetch = false;
      }
    }

    // Only call Tavily if cooldown has expired
    if (shouldFetch) {
      console.log('🔍 Fetching fresh generic news directly from Tavily (No AI)...');

      // 1. Fetch raw news directly from Tavily
      const searchResult = await tavilyClient.search('latest supply chain disruption logistics trade news', { 
        topic: 'news', 
        days: 2, 
        maxResults: 10 
      });

      if (!searchResult.results || searchResult.results.length === 0) {
        return NextResponse.json({ notifications: [] });
      }

      // 2. Fetch existing URLs from DB to deduplicate
      const { data: existingNews } = await supabaseServer
        .from('notifications')
        .select('citations')
        .eq('user_id', userId)
        .eq('notification_type', 'live_news_alert');

      const existingUrls = new Set((existingNews || []).map((n: any) => n.citations?.sources?.[0]?.url).filter(Boolean));
      
      // 3. Filter out redundant articles
      const newArticles = searchResult.results.filter((r: any) => !existingUrls.has(r.url));

      // 4. Save strictly new articles to DB
      if (newArticles.length > 0) {
        const inserts = newArticles.map((result: any) => ({
          user_id: userId,
          title: result.title,
          message: result.content ? result.content.substring(0, 500) + (result.content.length > 500 ? '...' : '') : 'No content available.',
          notification_type: 'live_news_alert',
          severity: 'MEDIUM' as const,
          read_status: false,
          created_at: result.publishedDate || new Date().toISOString(),
          citations: {
            category: 'Live News',
            sources: [{ title: result.title, url: result.url, publishedAt: result.publishedDate || new Date().toISOString(), credibility: 0.85 }],
            affectedEntities: ['Global Supply Chain'],
          },
        }));
        
        await supabaseServer.from('notifications').insert(inserts);
        
        console.log(`✅ Saved ${inserts.length} new generic news articles to DB.`);
        return NextResponse.json({ notifications: inserts });
      }
      
      console.log('✅ No net-new generic news articles found after deduplication.');
      return NextResponse.json({ notifications: [] });

    } else {
      console.log('📡 Cooldown active — skipping redundant news poll.');
      // Return empty array to prevent redundant data transfer
      return NextResponse.json({ notifications: [] });
    }

  } catch (error: any) {
    console.error('⚠️ News polling failure:', error?.message);
    return NextResponse.json({
      notifications: [],
      error: error?.message || 'Internal error',
      fallback: true
    });
  }
}
