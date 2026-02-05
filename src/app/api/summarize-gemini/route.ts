import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface SummarizeRequest {
  url: string;
  headline: string;
  content: string;
  sourceName: string;
}

interface SummarizeResponse {
  success: boolean;
  emoji?: string;
  caption?: string;
  summary?: string;
  sourceName?: string;
  error?: string;
}

const GEMINI_FORMAT_PROMPT = `You are summarizing a news article for Planet Detroit's weekly environmental news roundup.

Create a summary in this EXACT format:
- emoji: A single relevant emoji (⚡💧🌊🏭🌳⚖️🚆💡🧑‍⚕️ etc.)
- caption: A short 2-5 word attention-grabbing caption (will be bold)
- summary: 1-3 sentences summarizing the key facts in your own words

Guidelines:
- Focus on Michigan/Detroit relevance and community impact
- Use active voice, be factual and neutral
- Include specific facts, numbers, locations from the article
- No speculation or editorializing
- Caption should grab attention - can be a question, exclamation, or punchy statement

Examples of good captions:
- "Bills going up"
- "PFAS levels spike"
- "Major cleanup success!"
- "DTE rate hike ahead"
- "Clean energy incoming?"

Return ONLY valid JSON with these exact fields:
{
  "emoji": "⚡",
  "caption": "Your caption here",
  "summary": "Your 1-3 sentence summary here."
}`;

export async function POST(request: NextRequest): Promise<NextResponse<SummarizeResponse>> {
  try {
    const body = await request.json() as SummarizeRequest;
    const { url, headline, content, sourceName } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'GEMINI_API_KEY is not configured. Add it to your .env.local file.',
      }, { status: 500 });
    }

    if (!content) {
      return NextResponse.json({
        success: false,
        error: 'Article content is required',
      }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const headlineSection = headline
      ? `Headline: ${headline}`
      : 'Headline: (Extract from the article content below)';

    const prompt = `${GEMINI_FORMAT_PROMPT}

Summarize this article:

${headlineSection}
Source: ${sourceName}
URL: ${url}

Content:
${content.slice(0, 4000)}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({
        success: false,
        error: 'Could not parse AI response',
      }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      emoji: parsed.emoji || '📰',
      caption: parsed.caption || (headline ? headline.slice(0, 30) : 'News update'),
      summary: parsed.summary || '',
      sourceName: sourceName,
    });

  } catch (error) {
    console.error('Summarize error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to summarize',
    }, { status: 500 });
  }
}
