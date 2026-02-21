import { NextResponse } from "next/server";

const COOKIE_DOMAIN = ".tools.planetdetroit.org";
const isProduction = process.env.NODE_ENV === "production";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("pd_auth", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
    ...(isProduction && { domain: COOKIE_DOMAIN }),
  });
  response.cookies.set("pd_user", "", {
    httpOnly: false,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
    ...(isProduction && { domain: COOKIE_DOMAIN }),
  });
  return response;
}
