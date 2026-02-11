import { NextResponse } from 'next/server';

interface WPUser {
  id: number;
  name: string;
  slug: string;
}

export async function GET(): Promise<NextResponse> {
  try {
    const wpUrl = process.env.WORDPRESS_URL;
    const wpUsername = process.env.WORDPRESS_USERNAME;
    const wpAppPassword = process.env.WORDPRESS_APP_PASSWORD;

    if (!wpUrl || !wpUsername || !wpAppPassword) {
      return NextResponse.json({
        success: false,
        error: 'WordPress credentials not configured',
      }, { status: 500 });
    }

    const authString = Buffer.from(`${wpUsername}:${wpAppPassword}`).toString('base64');

    const response = await fetch(
      `${wpUrl.replace(/\/$/, '')}/wp-json/wp/v2/users?per_page=20&context=edit`,
      {
        headers: {
          'Authorization': `Basic ${authString}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `WordPress API error: ${response.status}`,
      }, { status: response.status });
    }

    const data = await response.json();

    const users: WPUser[] = data.map((u: { id: number; name: string; slug: string }) => ({
      id: u.id,
      name: u.name,
      slug: u.slug,
    }));

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching WordPress users:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch users',
    }, { status: 500 });
  }
}
