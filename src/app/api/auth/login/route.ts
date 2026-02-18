import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";

const COOKIE_DOMAIN = ".tools.planetdetroit.org";

export async function POST(request: NextRequest) {
  try {
    const { password, userId } = await request.json();

    const authPassword = process.env.AUTH_PASSWORD;
    const authSecret = process.env.AUTH_SECRET;

    if (!authPassword || !authSecret) {
      return NextResponse.json(
        { error: "Auth not configured" },
        { status: 500 }
      );
    }

    if (!password || password !== authPassword) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    const token = await signToken(authSecret);

    const response = NextResponse.json({ success: true });
    response.cookies.set("pd_auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
      domain: COOKIE_DOMAIN,
    });

    // Store userId in a non-httpOnly cookie so the client can read it
    if (userId) {
      response.cookies.set("pd_user", userId, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
        domain: COOKIE_DOMAIN,
      });
    }

    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
