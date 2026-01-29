import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

interface SuggestTitleRequest {
  articles: Array<{
    kicker: string;
    summary: string;
    sourceName: string;
  }>;
}

interface SuggestTitleResponse {
  success: boolean;
  title?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SuggestTitleResponse>> {
  try {
    const body = await request.json() as SuggestTitleRequest;
    const { articles } = body;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API key not configured',
      });
    }

    if (!articles || articles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No articles provided',
      });
    }

    const client = new Anthropic({ apiKey });

    // Format articles for the prompt
    const articleList = articles
      .map((a, i) => `${i + 1}. ${a.kicker} ${a.summary}`)
      .join('\n');

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: `Based on these news summaries, suggest a short, compelling headline topic (2-5 words) that would be trending on Google right now. Focus on the most newsworthy or attention-grabbing topic from the list.

Articles:
${articleList}

Return ONLY the headline topic in sentence case (e.g., "Polar vortex", "Water main breaks", "Utility rate hikes"). No quotes, no explanation, just the topic phrase.`,
        },
      ],
    });

    const titleTopic = (message.content[0] as { type: string; text: string }).text.trim();
    const fullTitle = `What we're reading: ${titleTopic}`;

    return NextResponse.json({
      success: true,
      title: fullTitle,
    });

  } catch (error) {
    console.error('Suggest title error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to suggest title',
    });
  }
}
