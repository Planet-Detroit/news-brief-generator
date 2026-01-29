import Anthropic from '@anthropic-ai/sdk';
import {
  SUMMARIZATION_SYSTEM_PROMPT,
  buildSummarizationPrompt,
} from '@/lib/constants/prompts';

export interface ArticleForSummary {
  id: string;
  headline: string;
  content: string;
  sourceName: string;
  url: string;
}

export interface SummaryResult {
  id: string;
  kicker: string;
  summary: string;
  suggestedEmoji: string;
}

export interface SummarizationResult {
  success: boolean;
  summaries?: SummaryResult[];
  error?: {
    message: string;
    retryable: boolean;
  };
}

export async function summarizeArticles(
  articles: ArticleForSummary[],
  apiKey: string
): Promise<SummarizationResult> {
  if (!apiKey) {
    return {
      success: false,
      error: {
        message: 'API key is required',
        retryable: false,
      },
    };
  }

  if (articles.length === 0) {
    return {
      success: true,
      summaries: [],
    };
  }

  const anthropic = new Anthropic({
    apiKey,
  });

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SUMMARIZATION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildSummarizationPrompt(articles),
        },
      ],
    });

    // Extract text content from response
    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return {
        success: false,
        error: {
          message: 'No text content in response',
          retryable: true,
        },
      };
    }

    // Parse JSON from response
    const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('Failed to parse JSON from response:', textContent.text);
      return {
        success: false,
        error: {
          message: 'Could not parse JSON from response',
          retryable: true,
        },
      };
    }

    try {
      const summaries = JSON.parse(jsonMatch[0]) as SummaryResult[];

      // Validate response structure
      const validSummaries = summaries.filter(
        (s) =>
          s &&
          typeof s.id === 'string' &&
          typeof s.summary === 'string' &&
          typeof s.suggestedEmoji === 'string'
      ).map(s => ({
        ...s,
        kicker: s.kicker || '', // Ensure kicker exists
      }));

      return {
        success: true,
        summaries: validSummaries,
      };
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return {
        success: false,
        error: {
          message: 'Invalid JSON in response',
          retryable: true,
        },
      };
    }
  } catch (error) {
    console.error('Anthropic API error:', error);

    if (error instanceof Anthropic.RateLimitError) {
      return {
        success: false,
        error: {
          message: 'Rate limited. Please wait a moment and try again.',
          retryable: true,
        },
      };
    }

    if (error instanceof Anthropic.AuthenticationError) {
      return {
        success: false,
        error: {
          message: 'Invalid API key. Please check your Anthropic API key.',
          retryable: false,
        },
      };
    }

    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
        retryable: true,
      },
    };
  }
}
