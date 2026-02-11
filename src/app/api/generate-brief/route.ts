import { NextRequest, NextResponse } from 'next/server';
import { fetchArticle } from '@/lib/services/article-fetcher';
import { extractContent } from '@/lib/services/content-extractor';
import { summarizeArticles, type ArticleForSummary } from '@/lib/services/summarizer';
import { generateBrief } from '@/lib/services/html-formatter';
import { validateUrl, getSourceName, isPaywalledSource } from '@/lib/utils/url-parser';
import { fetchWithBrowser, isBrowserAutomationAvailable } from '@/lib/services/browser-automation';
import type { ArticleInput, GenerateBriefResponse, SummarizedArticle } from '@/types';

interface GenerateBriefRequestBody {
  articles: ArticleInput[];
  apiKey?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as GenerateBriefRequestBody;
    const { articles, apiKey } = body;

    // Use provided API key or fall back to environment variable
    const effectiveApiKey = apiKey || process.env.ANTHROPIC_API_KEY;

    if (!effectiveApiKey) {
      return NextResponse.json(
        {
          success: false,
          errors: [{
            id: 'api-key',
            url: '',
            error: 'API key is required. Please set ANTHROPIC_API_KEY in your .env.local file.',
          }],
        } as GenerateBriefResponse,
        { status: 400 }
      );
    }

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          errors: [{
            id: 'input',
            url: '',
            error: 'At least one article is required',
          }],
        } as GenerateBriefResponse,
        { status: 400 }
      );
    }

    const errors: Array<{ id: string; url: string; error: string }> = [];
    const articlesToSummarize: ArticleForSummary[] = [];

    // Process each article sequentially to avoid overwhelming the browser
    for (const article of articles) {
      // Handle manual input
      if (article.isPaywalled && article.manualExcerpt) {
        articlesToSummarize.push({
          id: article.id,
          headline: article.manualHeadline || 'Untitled',
          content: article.manualExcerpt,
          sourceName: article.manualSourceName || getSourceName(article.url),
          url: article.url,
        });
        continue;
      }

      // Validate URL
      const validation = validateUrl(article.url);
      if (!validation.valid) {
        errors.push({
          id: article.id,
          url: article.url,
          error: validation.error || 'Invalid URL',
        });
        continue;
      }

      // Check if this is a paywalled source with browser automation available
      const isPaywalled = isPaywalledSource(article.url);
      const canUseBrowser = isBrowserAutomationAvailable(article.url);

      try {
        if (isPaywalled && canUseBrowser) {
          // Use Puppeteer for paywalled sites with credentials
          console.log(`Using browser automation for paywalled article: ${article.url}`);
          const browserResult = await fetchWithBrowser(article.url);

          if (browserResult.success && browserResult.content) {
            articlesToSummarize.push({
              id: article.id,
              headline: browserResult.headline || 'Untitled',
              content: browserResult.content,
              sourceName: browserResult.sourceName || getSourceName(article.url),
              url: article.url,
            });
            continue;
          } else {
            // Browser automation failed, add to errors
            errors.push({
              id: article.id,
              url: article.url,
              error: browserResult.error || 'Browser automation failed. Try marking as paywalled and pasting content manually.',
            });
            continue;
          }
        }

        // Standard fetch for non-paywalled sites
        const fetchResult = await fetchArticle(article.url);

        if (!fetchResult.success) {
          // If it's a paywall error and we don't have browser automation, give helpful message
          if (fetchResult.error?.type === 'PAYWALL_DETECTED' && !canUseBrowser) {
            errors.push({
              id: article.id,
              url: article.url,
              error: 'Paywall detected. Add site credentials to .env.local or mark as paywalled and paste content manually.',
            });
          } else {
            errors.push({
              id: article.id,
              url: article.url,
              error: fetchResult.error?.message || 'Failed to fetch article',
            });
          }
          continue;
        }

        const content = extractContent(fetchResult.html!, fetchResult.finalUrl);

        if (!content) {
          errors.push({
            id: article.id,
            url: article.url,
            error: 'Could not extract article content',
          });
          continue;
        }

        articlesToSummarize.push({
          id: article.id,
          headline: content.headline,
          content: content.content,
          sourceName: content.sourceName,
          url: article.url,
        });
      } catch (err) {
        console.error(`Error processing article ${article.url}:`, err);
        errors.push({
          id: article.id,
          url: article.url,
          error: 'Unexpected error processing article',
        });
      }
    }

    // If no articles to summarize, return errors
    if (articlesToSummarize.length === 0) {
      return NextResponse.json({
        success: false,
        errors,
      } as GenerateBriefResponse);
    }

    // Summarize all articles in one batch
    const summaryResult = await summarizeArticles(articlesToSummarize, effectiveApiKey);

    if (!summaryResult.success || !summaryResult.summaries) {
      return NextResponse.json({
        success: false,
        errors: [
          ...errors,
          {
            id: 'summarization',
            url: '',
            error: summaryResult.error?.message || 'Summarization failed',
          },
        ],
      } as GenerateBriefResponse);
    }

    // Combine summaries with article data
    const summarizedArticles: SummarizedArticle[] = articlesToSummarize.map((article) => {
      const summary = summaryResult.summaries!.find((s) => s.id === article.id);
      return {
        id: article.id,
        url: article.url,
        kicker: summary?.kicker || 'News:',
        summary: summary?.summary || 'Summary not available',
        emoji: summary?.suggestedEmoji || '📰',
        sourceName: article.sourceName,
        status: summary ? 'success' : 'failed',
      };
    });

    // Generate formatted output
    const brief = generateBrief(summarizedArticles);

    return NextResponse.json({
      success: true,
      brief,
      errors: errors.length > 0 ? errors : undefined,
    } as GenerateBriefResponse);

  } catch (error) {
    console.error('Generate brief error:', error);
    return NextResponse.json(
      {
        success: false,
        errors: [{
          id: 'system',
          url: '',
          error: 'An unexpected error occurred',
        }],
      } as GenerateBriefResponse,
      { status: 500 }
    );
  }
}
