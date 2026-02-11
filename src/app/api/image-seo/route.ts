import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getEnv } from '@/lib/env';

interface ImageSEORequest {
  imageTitle: string;
  articleTopics: string[];
  postTitle: string;
}

interface ImageSEOResponse {
  success: boolean;
  altText?: string;
  caption?: string;
  description?: string;
  error?: string;
}

const IMAGE_SEO_PROMPT = `You are an SEO expert for Planet Detroit, an environmental news outlet.

Generate SEO-optimized metadata for a featured image on a weekly news roundup post.

Guidelines:
- Alt text: 100-125 characters, describe the image for accessibility and SEO
- Caption: 1 short sentence that provides context for readers
- Description: Brief description for media library

Return ONLY valid JSON:
{
  "altText": "Descriptive alt text here",
  "caption": "Photo caption that appears under the image",
  "description": "Brief media library description"
}`;

export async function POST(request: NextRequest): Promise<NextResponse<ImageSEOResponse>> {
  try {
    const body = await request.json() as ImageSEORequest;
    const { imageTitle, articleTopics, postTitle } = body;

    const apiKey = getEnv().GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'GEMINI_API_KEY is not configured',
      }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `${IMAGE_SEO_PROMPT}

Image title from stock site: "${imageTitle}"
Post title: "${postTitle}"
Article topics covered: ${articleTopics.join(', ')}

Generate SEO-friendly metadata for this image.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

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
      altText: parsed.altText || imageTitle,
      caption: parsed.caption || '',
      description: parsed.description || '',
    });

  } catch (error) {
    console.error('Image SEO error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate image SEO',
    }, { status: 500 });
  }
}
