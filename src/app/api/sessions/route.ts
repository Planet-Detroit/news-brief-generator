import { NextResponse } from 'next/server';
import { getSupportedSites } from '@/lib/services/browser-automation';

// GET /api/sessions - List all supported sites and their login status
export async function GET() {
  try {
    const sites = getSupportedSites();
    return NextResponse.json({
      success: true,
      sites,
    });
  } catch (error) {
    console.error('Error getting sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get sessions' },
      { status: 500 }
    );
  }
}
