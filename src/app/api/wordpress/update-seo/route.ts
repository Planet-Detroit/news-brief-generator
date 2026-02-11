import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/env';

interface UpdateSEORequest {
  postId: number;
  title?: string;           // Page title
  seoTitle?: string;        // SEO/meta title (for Yoast etc)
  metaDescription?: string; // Meta description
  excerpt?: string;         // Post excerpt
}

interface UpdateSEOResponse {
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<UpdateSEOResponse>> {
  try {
    const body = await request.json() as UpdateSEORequest;
    const { postId, title, seoTitle, metaDescription, excerpt } = body;

    const env = getEnv();
    const wpUrl = env.WORDPRESS_URL;
    const wpUsername = env.WORDPRESS_USERNAME;
    const wpPassword = env.WORDPRESS_APP_PASSWORD;

    if (!wpUrl || !wpUsername || !wpPassword) {
      return NextResponse.json({
        success: false,
        error: 'WordPress credentials not configured',
      }, { status: 500 });
    }

    if (!postId) {
      return NextResponse.json({
        success: false,
        error: 'Post ID is required',
      }, { status: 400 });
    }

    const auth = Buffer.from(`${wpUsername}:${wpPassword}`).toString('base64');

    // Build the update payload
    const updateData: Record<string, any> = {};

    if (title) {
      updateData.title = title;
    }

    if (excerpt) {
      updateData.excerpt = excerpt;
    }

    // SEO meta fields - support multiple plugins
    const metaFields: Record<string, string> = {};

    if (seoTitle) {
      // Yoast SEO
      metaFields._yoast_wpseo_title = seoTitle;
      // All in One SEO
      metaFields._aioseo_title = seoTitle;
      // Rank Math
      metaFields.rank_math_title = seoTitle;
      // Generic SEO title meta
      metaFields._seo_title = seoTitle;
    }

    if (metaDescription) {
      // Yoast SEO
      metaFields._yoast_wpseo_metadesc = metaDescription;
      // All in One SEO
      metaFields._aioseo_description = metaDescription;
      // Rank Math
      metaFields.rank_math_description = metaDescription;
      // Generic meta description
      metaFields._meta_description = metaDescription;
    }

    if (Object.keys(metaFields).length > 0) {
      updateData.meta = metaFields;
    }

    // Update the post
    const response = await fetch(`${wpUrl}/wp-json/wp/v2/posts/${postId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WordPress update error:', errorText);
      return NextResponse.json({
        success: false,
        error: `WordPress update failed: ${response.status}`,
      }, { status: response.status });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Update SEO error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update SEO',
    }, { status: 500 });
  }
}
