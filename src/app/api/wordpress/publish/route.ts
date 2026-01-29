import { NextRequest, NextResponse } from 'next/server';

interface PublishRequest {
  title: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'publish';
  categories?: number[];
  tags?: number[];
}

interface PublishResponse {
  success: boolean;
  postId?: number;
  postUrl?: string;
  editUrl?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<PublishResponse>> {
  try {
    const body = await request.json() as PublishRequest;
    const { title, content, excerpt, status = 'draft', categories, tags } = body;

    // Get WordPress credentials from environment
    const wpUrl = process.env.WORDPRESS_URL;
    const wpUsername = process.env.WORDPRESS_USERNAME;
    const wpAppPassword = process.env.WORDPRESS_APP_PASSWORD;

    if (!wpUrl || !wpUsername || !wpAppPassword) {
      return NextResponse.json({
        success: false,
        error: 'WordPress credentials not configured. Add WORDPRESS_URL, WORDPRESS_USERNAME, and WORDPRESS_APP_PASSWORD to your .env.local file.',
      }, { status: 400 });
    }

    if (!title || !content) {
      return NextResponse.json({
        success: false,
        error: 'Title and content are required',
      }, { status: 400 });
    }

    // Create the post via WordPress REST API
    const apiUrl = `${wpUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts`;

    // Build Basic Auth header
    const authString = Buffer.from(`${wpUsername}:${wpAppPassword}`).toString('base64');

    const postData: Record<string, unknown> = {
      title,
      content,
      status,
    };

    // Add excerpt/subtitle if provided
    if (excerpt) {
      postData.excerpt = excerpt;
      // Also set subtitle meta fields used by various themes/plugins
      postData.meta = {
        newspack_post_subtitle: excerpt,  // Newspack theme
        _subtitle: excerpt,               // Developer theme
        wps_subtitle: excerpt,            // WP Subtitle plugin
        subtitle: excerpt,                // Generic
      };
    }

    if (categories && categories.length > 0) {
      postData.categories = categories;
    }

    if (tags && tags.length > 0) {
      postData.tags = tags;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`,
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WordPress API error:', response.status, errorText);

      if (response.status === 401) {
        return NextResponse.json({
          success: false,
          error: 'WordPress authentication failed. Check your username and application password.',
        });
      }

      if (response.status === 403) {
        return NextResponse.json({
          success: false,
          error: 'Permission denied. Make sure your WordPress user has permission to create posts.',
        });
      }

      return NextResponse.json({
        success: false,
        error: `WordPress API error: ${response.status}`,
      });
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      postId: result.id,
      postUrl: result.link,
      editUrl: `${wpUrl.replace(/\/$/, '')}/wp-admin/post.php?post=${result.id}&action=edit`,
    });

  } catch (error) {
    console.error('WordPress publish error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to publish to WordPress',
    }, { status: 500 });
  }
}
