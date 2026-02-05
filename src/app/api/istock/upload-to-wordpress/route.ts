import { NextRequest, NextResponse } from 'next/server';

interface UploadRequest {
  imageUrl: string;
  imageId: string;
  title: string;
  postId?: number; // Optional: attach to existing post
  altText?: string; // SEO alt text
  caption?: string; // Image caption
  description?: string; // Media description
  imageSize?: 'thumbnail' | 'medium' | 'large' | 'full'; // Featured image size
}

interface UploadResponse {
  success: boolean;
  mediaId?: number;
  mediaUrl?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    const body = await request.json() as UploadRequest;
    const { imageUrl, imageId, title, postId, altText, caption, description, imageSize = 'large' } = body;

    const wpUrl = process.env.WORDPRESS_URL;
    const wpUsername = process.env.WORDPRESS_USERNAME;
    const wpPassword = process.env.WORDPRESS_APP_PASSWORD;

    if (!wpUrl || !wpUsername || !wpPassword) {
      return NextResponse.json({
        success: false,
        error: 'WordPress credentials not configured',
      }, { status: 500 });
    }

    if (!imageUrl) {
      return NextResponse.json({
        success: false,
        error: 'Image URL is required',
      }, { status: 400 });
    }

    // Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json({
        success: false,
        error: 'Failed to download image from Getty',
      }, { status: 500 });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });

    // Create filename
    const filename = `getty-${imageId}-${Date.now()}.jpg`;

    // Upload to WordPress Media Library
    const formData = new FormData();
    formData.append('file', imageBlob, filename);

    const auth = Buffer.from(`${wpUsername}:${wpPassword}`).toString('base64');

    const uploadResponse = await fetch(`${wpUrl}/wp-json/wp/v2/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('WordPress upload error:', errorText);
      return NextResponse.json({
        success: false,
        error: `WordPress upload failed: ${uploadResponse.status}`,
      }, { status: uploadResponse.status });
    }

    const mediaData = await uploadResponse.json();

    // Update media title/alt text/caption with SEO-optimized values
    await fetch(`${wpUrl}/wp-json/wp/v2/media/${mediaData.id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title || `Getty Image ${imageId}`,
        alt_text: altText || title || `Getty Image ${imageId}`,
        caption: caption || `Image via Getty Images`,
        description: description || '',
      }),
    });

    // If postId provided, set as featured image with size preference
    if (postId) {
      await fetch(`${wpUrl}/wp-json/wp/v2/posts/${postId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          featured_media: mediaData.id,
          // Set featured image size via post meta (used by various themes/plugins)
          meta: {
            _thumbnail_id: mediaData.id,
            _featured_image_size: imageSize,           // Generic
            featured_image_size: imageSize,            // Some themes
            newspack_featured_image_position: imageSize, // Newspack
          },
        }),
      });
    }

    return NextResponse.json({
      success: true,
      mediaId: mediaData.id,
      mediaUrl: mediaData.source_url,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }, { status: 500 });
  }
}
