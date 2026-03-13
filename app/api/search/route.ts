import { tavily } from '@tavily/core';
import { NextRequest, NextResponse } from 'next/server';

const tavilyClient = tavily({
  apiKey: process.env.TAVILY_API_KEY
});

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const searchResult = await tavilyClient.search(query, {
      searchDepth: "advanced",
      includeAnswer: true,
      maxResults: 5,
    });

    return NextResponse.json(searchResult);
  } catch (error) {
    console.error('Search API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to perform search', details: errorMessage }, { status: 500 });
  }
} 