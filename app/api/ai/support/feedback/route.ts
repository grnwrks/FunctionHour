import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientKey } from "@/lib/supportRateLimit";

const feedbackSchema = z.object({
  helpful: z.boolean(),
  currentPath: z.string().trim().max(300).default("/"),
  hadEventResults: z.boolean().default(false),
  escalationRecommended: z.boolean().default(false),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    const rateLimit = checkRateLimit(
      "support-feedback",
      getClientKey(request, session.userId),
      { limit: 30, windowMs: 60_000 },
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many feedback requests. Try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const parsed = feedbackSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid feedback." }, { status: 400 });
    }

    console.info("Function Hour support feedback", {
      helpful: parsed.data.helpful,
      currentPath: parsed.data.currentPath,
      hadEventResults: parsed.data.hadEventResults,
      escalationRecommended: parsed.data.escalationRecommended,
      signedIn: Boolean(session.userId),
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Function Hour support feedback error:", error);
    return NextResponse.json({ error: "Unable to record feedback." }, { status: 500 });
  }
}
