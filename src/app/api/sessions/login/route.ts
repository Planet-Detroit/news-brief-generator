import { NextRequest, NextResponse } from 'next/server';
import { openLoginWindow } from '@/lib/services/browser-automation';

// POST /api/sessions/login - Open login window for a site
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

    const result = await openLoginWindow(siteKey);

    return NextResponse.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to open login window' },
      { status: 500 }
    );
  }
}
