import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY?.trim());
  const hasConvexUrl = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL?.trim());
  const configured = hasOpenAIKey && hasConvexUrl;

  return NextResponse.json(
    {
      status: configured ? "ok" : "degraded",
      service: "functionhour-support-assistant",
      checks: {
        openaiConfigured: hasOpenAIKey,
        convexConfigured: hasConvexUrl,
        supportModelConfigured: Boolean(process.env.OPENAI_SUPPORT_MODEL?.trim()),
        adminAllowlistConfigured: Boolean(process.env.SUPPORT_ADMIN_USER_IDS?.trim()),
      },
      version:
        process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "development",
      timestamp: new Date().toISOString(),
    },
    {
      status: configured ? 200 : 503,
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );
}
