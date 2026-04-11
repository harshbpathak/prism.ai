import { tavily } from '@tavily/core';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

const tavilyClient = tavily({
  apiKey: process.env.TAVILY_API_KEY
});

// In-memory rate-limit guard — avoid hammering Tavily on every request
let lastFetchTime = 0;
const FETCH_COOLDOWN = 5 * 60 * 1000; // 5 minutes

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const now = Date.now();

    // Only call Tavily if cooldown has expired
    if (now - lastFetchTime > FETCH_COOLDOWN) {
      console.log('🔍 Fetching fresh news from Tavily...');

      const searchResult = await tavilyClient.search(
        'latest supply chain disruption logistics trade news',
        { topic: 'news', days: 2, maxResults: 10 }
      );

      if (searchResult.results && searchResult.results.length > 0) {
        // Fetch all existing live_news URLs for this user to dedup
        const { data: existingNews } = await supabaseServer
          .from('notifications')
          .select('citations')
          .eq('user_id', userId)
          .eq('notification_type', 'live_news_alert');

        const existingUrls = new Set(
          (existingNews || [])
            .map((n: any) => n.citations?.sources?.[0]?.url)
            .filter(Boolean)
        );

        const newArticles = searchResult.results.filter(
          (r) => !existingUrls.has(r.url)
        );

        if (newArticles.length > 0) {
          const inserts = newArticles.map((result) => ({
            user_id: userId,
            title: result.title,
            message: result.content
              ? result.content.substring(0, 500) + (result.content.length > 500 ? '...' : '')
              : 'No content available.',
            notification_type: 'live_news_alert',
            severity: 'MEDIUM' as const,
            read_status: false,
            created_at: result.publishedDate
              ? new Date(result.publishedDate).toISOString()
              : new Date().toISOString(),
            citations: {
              category: 'Live News',
              sources: [
                {
                  title: result.title,
                  url: result.url,
                  publishedAt: result.publishedDate || new Date().toISOString(),
                  credibility: 0.85,
                },
              ],
              affectedEntities: ['Global Supply Chain'],
            },
          }));

          const { error: insertError } = await supabaseServer
            .from('notifications')
            .insert(inserts);

          if (insertError) {
            console.error('⚠️ Failed to persist news to notifications:', insertError.message);
          } else {
            console.log(`✅ Saved ${inserts.length} new news articles to Supabase.`);
          }
        } else {
          console.log('📡 No new articles to save — all already persisted.');
        }

        lastFetchTime = now;
      }
    } else {
      console.log('📡 Tavily cooldown active — serving news from Supabase only.');
    }

    // Always return the 5 most recent live_news_alert notifications from DB
    const { data: latestNews, error: fetchError } = await supabaseServer
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('notification_type', 'live_news_alert')
      .order('created_at', { ascending: false })
      .limit(5);

    if (fetchError) {
      console.error('⚠️ Failed to fetch news from Supabase:', fetchError.message);
      return NextResponse.json({ notifications: [] });
    }

    return NextResponse.json({ notifications: latestNews || [] });

  } catch (error: any) {
    console.error('⚠️ News polling failure:', error?.message);
    return NextResponse.json({
      notifications: [],
      error: error?.message || 'Internal error',
      fallback: true
    });
  }
}
