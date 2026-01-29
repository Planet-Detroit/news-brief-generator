import { NextRequest, NextResponse } from 'next/server';
import { fetchArticle } from '@/lib/services/article-fetcher';
import { extractContent } from '@/lib/services/content-extractor';
import { validateUrl } from '@/lib/utils/url-parser';
import type { FetchArticleResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'INVALID_URL',
            message: 'URL is required',
            requiresManualInput: true,
          },
        } as FetchArticleResponse,
        { status: 400 }
      );
    }

    // Validate URL
    const validation = validateUrl(url);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'INVALID_URL',
            message: validation.error || 'Invalid URL',
            requiresManualInput: true,
          },
        } as FetchArticleResponse,
        { status: 400 }
      );
    }

    // Fetch the article
    const fetchResult = await fetchArticle(url);

    if (!fetchResult.success) {
      return NextResponse.json({
        success: false,
        error: fetchResult.error,
      } as FetchArticleResponse);
    }

    // Extract content from HTML
    const content = extractContent(fetchResult.html!, fetchResult.finalUrl);

    if (!content) {
      return NextResponse.json({
        success: false,
        error: {
          type: 'NO_CONTENT',
          message: 'Could not extract article content. Please paste the text manually.',
          requiresManualInput: true,
        },
      } as FetchArticleResponse);
    }

    return NextResponse.json({
      success: true,
      data: content,
    } as FetchArticleResponse);

  } catch (error) {
    console.error('Fetch article error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          type: 'NETWORK_ERROR',
          message: 'An unexpected error occurred',
          requiresManualInput: true,
        },
      } as FetchArticleResponse,
      { status: 500 }
    );
  }
}
