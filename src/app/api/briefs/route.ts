import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

/**
 * Briefs API — stores and retrieves finished news briefs
 * so the newsletter builder can import them without copy/paste.
 *
 * Uses Upstash Redis (via Vercel Marketplace).
 * Env vars: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 *
 * POST /api/briefs  — save a brief
 * GET  /api/briefs  — list all briefs (most recent first)
 */

let _redis: Redis | null = null;
function getRedis(): Redis {
  if (!_redis) {
    _redis = Redis.fromEnv();
  }
  return _redis;
}

export interface BriefPacket {
  id: string;
  title: string;
  createdAt: string;
  postUrl: string | null;
  articles: {
    emoji: string;
    caption: string;
    summary: string;
    sourceName: string;
    url: string;
  }[];
}

// ── POST: Save a brief ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, postUrl, articles } = body;

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json(
        { error: "At least one article is required" },
        { status: 400 }
      );
    }

    const id = `brief-${Date.now()}`;
    const packet: BriefPacket = {
      id,
      title: title || `News brief — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
      createdAt: new Date().toISOString(),
      postUrl: postUrl || null,
      articles: articles.map((a: Record<string, string>) => ({
        emoji: a.emoji || "",
        caption: a.caption || "",
        summary: a.summary || "",
        sourceName: a.sourceName || "",
        url: a.url || "",
      })),
    };

    // Store the brief with a 30-day TTL
    await getRedis().set(id, JSON.stringify(packet), { ex: 60 * 60 * 24 * 30 });

    // Add to the index list (most recent first)
    await getRedis().lpush("briefs:index", id);

    // Trim index to last 50 briefs
    await getRedis().ltrim("briefs:index", 0, 49);

    return NextResponse.json({ success: true, id, brief: packet });
  } catch (error) {
    console.error("Failed to save brief:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── GET: List all briefs ────────────────────────────────────────────────

export async function GET() {
  try {
    // Get the index of brief IDs
    const ids: string[] = (await getRedis().lrange("briefs:index", 0, 49)) || [];

    if (ids.length === 0) {
      return NextResponse.json({ briefs: [] });
    }

    // Fetch all briefs in parallel
    const results = await Promise.all(
      ids.map(async (id) => {
        const raw = await getRedis().get(id);
        if (!raw) return null;
        try {
          return typeof raw === "string" ? JSON.parse(raw) : raw;
        } catch {
          return null;
        }
      })
    );

    const briefs = results.filter(Boolean) as BriefPacket[];

    return NextResponse.json({ briefs });
  } catch (error) {
    console.error("Failed to list briefs:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
