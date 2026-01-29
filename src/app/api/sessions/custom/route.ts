import { NextRequest, NextResponse } from 'next/server';
import {
  addCustomSite,
  removeCustomSite,
  getCustomSites,
} from '@/lib/services/custom-sites';

// GET /api/sessions/custom - List all custom sites
export async function GET() {
  try {
    const sites = getCustomSites();
    return NextResponse.json({
      success: true,
      sites,
    });
  } catch (error) {
    console.error('Error getting custom sites:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get custom sites' },
      { status: 500 }
    );
  }
}

// POST /api/sessions/custom - Add a new custom site
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, domain, loginUrl } = body;

    if (!name || !domain || !loginUrl) {
      return NextResponse.json(
        { success: false, error: 'Name, domain, and loginUrl are required' },
        { status: 400 }
      );
    }

    const result = addCustomSite(name, domain, loginUrl);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      key: result.key,
      message: `Added ${name} successfully`,
    });
  } catch (error) {
    console.error('Error adding custom site:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add custom site' },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/custom - Remove a custom site
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { key } = body;

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Site key is required' },
        { status: 400 }
      );
    }

    // Only allow deletion of custom sites (those starting with "custom-")
    if (!key.startsWith('custom-')) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete built-in sites' },
        { status: 400 }
      );
    }

    const result = removeCustomSite(key);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Site removed successfully',
    });
  } catch (error) {
    console.error('Error removing custom site:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove custom site' },
      { status: 500 }
    );
  }
}
