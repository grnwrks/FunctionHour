import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { POST as supportPost } from "../route";
import { checkRateLimit, getClientKey } from "@/lib/supportRateLimit";

export async function POST(request: Request) {
  const session = await auth();
  const rateLimit = checkRateLimit(
    "support-chat",
    getClientKey(request, session.userId),
    { limit: 20, windowMs: 60_000 },
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many support requests. Try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  return supportPost(request);
}
