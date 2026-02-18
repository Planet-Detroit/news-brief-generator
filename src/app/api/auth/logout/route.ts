import { NextResponse } from "next/server";

const COOKIE_DOMAIN = ".tools.planetdetroit.org";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("pd_auth", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
    domain: COOKIE_DOMAIN,
  });
  response.cookies.set("pd_user", "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
    domain: COOKIE_DOMAIN,
  });
  return response;
}
