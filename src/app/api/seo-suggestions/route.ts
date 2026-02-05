import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Article {
  emoji: string;
  caption: string;
  summary: string;
  sourceName: string;
}

interface SEORequest {
  articles: Article[];
  currentTitle: string;
}

interface SEOSuggestion {
  headline: string;
  metaDescription: string;
}

interface SEOResponse {
  success: boolean;
  suggestions?: SEOSuggestion[];
  imageSearchTerms?: string[];
  error?: string;
}

const SEO_PROMPT = `You are an SEO expert for Planet Detroit, an environmental news outlet covering Michigan.

Analyze these news article summaries and generate SEO-optimized suggestions for a weekly news roundup post.

Guidelines:
- Headlines should be 50-60 characters max
- IMPORTANT: Use sentence case for headlines (capitalize the first word AND all proper nouns like Michigan, Detroit, Great Lakes, DTE, etc.), NOT Title Case where every word is capitalized
- Example of correct sentence case: "Michigan faces new water quality challenges" (Michigan capitalized as proper noun)
- Example of incorrect Title Case: "Michigan Faces New Water Quality Challenges" (don't do this)
- Include relevant keywords naturally
- Make headlines compelling and click-worthy
- Meta descriptions should be 150-160 characters, also in sentence case with proper nouns capitalized
- Focus on Michigan/Detroit environmental topics
- Consider what people might search for

Return ONLY valid JSON with this exact structure:
{
  "suggestions": [
    {
      "headline": "Michigan news: environmental updates this week",
      "metaDescription": "This week's roundup covers water quality, renewable energy, and more environmental news from Detroit and Michigan."
    },
    {
      "headline": "Another headline example in sentence case",
      "metaDescription": "Another meta description example in sentence case."
    },
    {
      "headline": "Third headline option here",
      "metaDescription": "Third meta description option."
    }
  ],
  "imageSearchTerms": ["term1", "term2", "term3", "term4", "term5"]
}

The imageSearchTerms should be good search terms for finding a relevant stock photo for this roundup (e.g., "detroit skyline", "solar panels michigan", "great lakes water").`;

export async function POST(request: NextRequest): Promise<NextResponse<SEOResponse>> {
  try {
    const body = await request.json() as SEORequest;
    const { articles, currentTitle } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'GEMINI_API_KEY is not configured',
      }, { status: 500 });
    }

    if (!articles || articles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Articles are required',
      }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Format articles for the prompt
    const articlesSummary = articles.map((a, i) =>
      `${i + 1}. ${a.emoji} ${a.caption}: ${a.summary} (Source: ${a.sourceName})`
    ).join('\n');

    const prompt = `${SEO_PROMPT}

Current post title: "${currentTitle}"

Articles in this roundup:
${articlesSummary}`;

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
      suggestions: parsed.suggestions || [],
      imageSearchTerms: parsed.imageSearchTerms || [],
    });

  } catch (error) {
    console.error('SEO suggestions error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate SEO suggestions',
    }, { status: 500 });
  }
}
