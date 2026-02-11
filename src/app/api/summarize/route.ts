import { NextRequest, NextResponse } from 'next/server';
import { summarizeArticles } from '@/lib/services/summarizer';
import { getEnv } from '@/lib/env';
import type { SummarizeRequest, SummarizeResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SummarizeRequest & { apiKey?: string };
    const { articles, apiKey } = body;

    // Use provided API key or fall back to environment variable
    const effectiveApiKey = apiKey || getEnv().ANTHROPIC_API_KEY;

    if (!effectiveApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'API key is required. Please provide an API key or set ANTHROPIC_API_KEY environment variable.',
          },
        } as SummarizeResponse,
        { status: 400 }
      );
    }

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'At least one article is required',
          },
        } as SummarizeResponse,
        { status: 400 }
      );
    }

    // Validate articles have required fields
    const validArticles = articles.filter(
      (a) =>
        a.id &&
        a.headline &&
        a.content &&
        a.sourceName &&
        a.content.length > 50
    );

    if (validArticles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'No valid articles to summarize. Each article needs an id, headline, content, and sourceName.',
          },
        } as SummarizeResponse,
        { status: 400 }
      );
    }

    // Summarize articles
    const result = await summarizeArticles(validArticles, effectiveApiKey);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        } as SummarizeResponse,
        { status: result.error?.retryable ? 503 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      summaries: result.summaries,
    } as SummarizeResponse);

  } catch (error) {
    console.error('Summarize error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'An unexpected error occurred during summarization',
        },
      } as SummarizeResponse,
      { status: 500 }
    );
  }
}
