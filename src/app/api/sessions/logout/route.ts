import { NextRequest, NextResponse } from 'next/server';
import { clearSession } from '@/lib/services/browser-automation';

// POST /api/sessions/logout - Clear saved session for a site
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteKey } = body;

    if (!siteKey) {
      return NextResponse.json(
        { success: false, error: 'Site key is required' },
        { status: 400 }
      );
    }

    const cleared = clearSession(siteKey);

    return NextResponse.json({
      success: true,
      message: cleared ? 'Session cleared' : 'No session found to clear',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear session' },
      { status: 500 }
    );
  }
}
