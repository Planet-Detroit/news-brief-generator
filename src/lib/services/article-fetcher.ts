import type { FetchError } from '@/types';

export interface FetchResult {
  success: boolean;
  html?: string;
  error?: FetchError;
  finalUrl: string;
}

// Paywall indicators in HTML
const PAYWALL_INDICATORS = [
  'paywall',
  'subscription-required',
  'subscribe-to-read',
  'premium-content',
  'meter-count',
  'pw-content',
  'subscriber-only',
  'regwall',
  'registration-wall',
];


export async function fetchArticle(url: string): Promise<FetchResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          finalUrl: url,
          error: {
            type: 'NOT_FOUND',
            message: 'Article not found (404)',
            requiresManualInput: true,
          },
        };
      }
      if (response.status === 403) {
        return {
          success: false,
          finalUrl: url,
          error: {
            type: 'BLOCKED',
            message: 'Access blocked by the website',
            requiresManualInput: true,
          },
        };
      }
      return {
        success: false,
        finalUrl: url,
        error: {
          type: 'NETWORK_ERROR',
          message: `HTTP error ${response.status}`,
          requiresManualInput: true,
        },
      };
    }

    const html = await response.text();

    // Check for paywall indicators
    const lowerHtml = html.toLowerCase();
    const hasPaywall = PAYWALL_INDICATORS.some(
      (indicator) =>
        lowerHtml.includes(indicator) ||
        lowerHtml.includes(`class="${indicator}"`) ||
        lowerHtml.includes(`id="${indicator}"`)
    );

    // Check for very short content (likely paywall truncation)
    const contentLength = html.length;
    const hasMinimalContent = contentLength < 5000;

    // Check for subscription prompts
    const hasSubscriptionPrompt =
      lowerHtml.includes('subscribe') &&
      (lowerHtml.includes('to continue reading') ||
        lowerHtml.includes('to read the full') ||
        lowerHtml.includes('for full access'));

    if (hasPaywall || (hasMinimalContent && hasSubscriptionPrompt)) {
      return {
        success: false,
        html,
        finalUrl: response.url,
        error: {
          type: 'PAYWALL_DETECTED',
          message:
            'This article appears to be behind a paywall. Please paste the article text manually.',
          requiresManualInput: true,
        },
      };
    }

    return {
      success: true,
      html,
      finalUrl: response.url,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          finalUrl: url,
          error: {
            type: 'TIMEOUT',
            message: 'Request timed out after 10 seconds',
            requiresManualInput: true,
          },
        };
      }
    }

    return {
      success: false,
      finalUrl: url,
      error: {
        type: 'NETWORK_ERROR',
        message: 'Failed to fetch article',
        requiresManualInput: true,
      },
    };
  }
}
