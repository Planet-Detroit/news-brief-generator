import { NextRequest, NextResponse } from 'next/server';

interface SearchRequest {
  query: string;
  page?: number;
}

interface GettyImage {
  id: string;
  title: string;
  display_sizes: Array<{
    name: string;
    uri: string;
  }>;
}

interface SearchResponse {
  success: boolean;
  images?: Array<{
    id: string;
    title: string;
    thumbUrl: string;
    previewUrl: string;
    artist?: string;
  }>;
  totalCount?: number;
  error?: string;
}

// Cache for OAuth token
let cachedToken: { token: string; expires: number } | null = null;

async function getOAuthToken(apiKey: string, apiSecret: string): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && cachedToken.expires > Date.now()) {
    return cachedToken.token;
  }

  const response = await fetch('https://authentication.gettyimages.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: apiKey,
      client_secret: apiSecret,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OAuth error:', errorText);
    throw new Error(`OAuth failed: ${response.status}`);
  }

  const data = await response.json();

  // Cache token (expires_in is in seconds, subtract 60s buffer)
  cachedToken = {
    token: data.access_token,
    expires: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

export async function POST(request: NextRequest): Promise<NextResponse<SearchResponse>> {
  try {
    const body = await request.json() as SearchRequest;
    const { query, page = 1 } = body;

    const apiKey = process.env.GETTY_API_KEY;
    const apiSecret = process.env.GETTY_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json({
        success: false,
        error: 'Getty API credentials not configured',
      }, { status: 500 });
    }

    if (!query) {
      return NextResponse.json({
        success: false,
        error: 'Search query is required',
      }, { status: 400 });
    }

    // Get OAuth token
    const accessToken = await getOAuthToken(apiKey, apiSecret);

    // Search Getty Images / iStock
    // Request display_sizes with specific size names
    const searchParams = new URLSearchParams({
      phrase: query,
      page: page.toString(),
      page_size: '20',
      fields: 'id,title,thumb,preview,display_sizes,artist',
      sort_order: 'best_match',
    });

    const response = await fetch(
      `https://api.gettyimages.com/v3/search/images/creative?${searchParams}`,
      {
        headers: {
          'Api-Key': apiKey,
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Getty API error:', errorText);
      return NextResponse.json({
        success: false,
        error: `Getty API error: ${response.status}`,
      }, { status: response.status });
    }

    const data = await response.json();

    // Transform the response - check multiple possible URL sources
    const images = (data.images || []).map((img: any) => {
      // Try different possible URL locations
      let thumbUrl = '';
      let previewUrl = '';

      // Check display_sizes array
      if (img.display_sizes && Array.isArray(img.display_sizes)) {
        const thumb = img.display_sizes.find((d: any) => d.name === 'thumb') || img.display_sizes[0];
        const preview = img.display_sizes.find((d: any) => d.name === 'comp') || img.display_sizes.find((d: any) => d.name === 'preview') || thumb;
        thumbUrl = thumb?.uri || '';
        previewUrl = preview?.uri || '';
      }

      // Check direct thumb/preview properties
      if (!thumbUrl && img.thumb) {
        thumbUrl = img.thumb;
      }
      if (!previewUrl && img.preview) {
        previewUrl = img.preview;
      }

      // Check display_set
      if (!thumbUrl && img.display_set) {
        thumbUrl = img.display_set.thumb?.uri || img.display_set[0]?.uri || '';
        previewUrl = img.display_set.comp?.uri || img.display_set.preview?.uri || thumbUrl;
      }

      // Fallback: construct Getty CDN URL directly
      if (!thumbUrl && img.id) {
        // Getty's public thumbnail URL format
        thumbUrl = `https://media.gettyimages.com/id/${img.id}/photo.jpg?s=612x612`;
        previewUrl = `https://media.gettyimages.com/id/${img.id}/photo.jpg?s=1024x1024`;
      }

      return {
        id: img.id,
        title: img.title,
        thumbUrl,
        previewUrl: previewUrl || thumbUrl,
        artist: img.artist || '',
      };
    });

    return NextResponse.json({
      success: true,
      images,
      totalCount: data.result_count || 0,
    });

  } catch (error) {
    console.error('iStock search error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Search failed',
    }, { status: 500 });
  }
}
