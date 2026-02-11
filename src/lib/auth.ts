const AUTH_PAYLOAD = "pd-newsbriefs-auth";

/**
 * Generate a signed auth token using HMAC-SHA256.
 * Uses Web Crypto API for Edge runtime compatibility (Vercel middleware).
 */
export async function signToken(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(AUTH_PAYLOAD)
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Verify a token by recomputing the HMAC and comparing.
 * Constant-time comparison via character comparison.
 */
export async function verifyToken(
  token: string,
  secret: string
): Promise<boolean> {
  const expected = await signToken(secret);
  if (token.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < token.length; i++) {
    mismatch |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}
