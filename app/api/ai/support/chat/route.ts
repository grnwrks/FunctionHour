import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { POST as supportPost } from "../route";
import { checkRateLimit, getClientKey } from "@/lib/supportRateLimit";
import {
  recordChatFailure,
  recordChatRequest,
  recordChatSuccess,
  recordRateLimit,
} from "@/lib/supportObservability";

export async function POST(request: Request) {
  const session = await auth();
  const rateLimit = checkRateLimit(
    "support-chat",
    getClientKey(request, session.userId),
    { limit: 20, windowMs: 60_000 },
  );

  if (!rateLimit.allowed) {
    recordRateLimit();
    return NextResponse.json(
      { error: "Too many support requests. Try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  recordChatRequest();

  try {
    const response = await supportPost(request);

    if (!response.ok) {
      recordChatFailure();
      return response;
    }

    const cloned = response.clone();
    const payload = (await cloned.json().catch(() => null)) as
      | { escalationRecommended?: boolean }
      | null;
    recordChatSuccess(Boolean(payload?.escalationRecommended));
    return response;
  } catch (error) {
    recordChatFailure();
    throw error;
  }
}
