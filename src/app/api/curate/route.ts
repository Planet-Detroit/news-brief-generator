import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  WEEKLY_CURATION_SYSTEM_PROMPT,
  buildCurationPrompt,
} from '@/lib/constants/prompts';

export interface CurationRequest {
  mode: 'search' | 'curate';
  articles?: Array<{
    url: string;
    headline?: string;
    source?: string;
  }>;
}

export interface CurationResponse {
  success: boolean;
  content?: string;
  error?: {
    message: string;
    retryable: boolean;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<CurationResponse>> {
  try {
    const body = await request.json() as CurationRequest;
    const { mode, articles } = body;

    // Get API key from environment or request
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'ANTHROPIC_API_KEY is not configured',
          retryable: false,
        },
      }, { status: 500 });
    }

    if (mode !== 'search' && mode !== 'curate') {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Invalid mode. Use "search" or "curate".',
          retryable: false,
        },
      }, { status: 400 });
    }

    if (mode === 'curate' && (!articles || articles.length === 0)) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Articles are required for curate mode',
          retryable: false,
        },
      }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey });

    const userPrompt = buildCurationPrompt(mode, articles);

    // For search mode, we use extended thinking to help with research
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: WEEKLY_CURATION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Extract text content from response
    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({
        success: false,
        error: {
          message: 'No text content in response',
          retryable: true,
        },
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      content: textContent.text,
    });

  } catch (error) {
    console.error('Curation API error:', error);

    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Rate limited. Please wait a moment and try again.',
          retryable: true,
        },
      }, { status: 429 });
    }

    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Invalid API key. Please check your Anthropic API key.',
          retryable: false,
        },
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        retryable: true,
      },
    }, { status: 500 });
  }
}
