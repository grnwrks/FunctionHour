import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2_000),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(12),
  currentPath: z.string().trim().max(300).default("/"),
});

const handoffSchema = z.object({
  category: z.enum([
    "payment",
    "refund",
    "ticket_access",
    "account_access",
    "event_issue",
    "organizer_issue",
    "technical",
    "safety_or_fraud",
    "other",
  ]),
  destination: z.enum([
    "function_hour_support",
    "event_organizer",
    "function_hour_and_organizer",
  ]),
  summary: z.string(),
  details: z.array(z.string()).max(5),
  handoffText: z.string(),
});

const responseFormat = {
  type: "json_schema" as const,
  name: "function_hour_support_handoff",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      category: {
        type: "string",
        enum: [
          "payment",
          "refund",
          "ticket_access",
          "account_access",
          "event_issue",
          "organizer_issue",
          "technical",
          "safety_or_fraud",
          "other",
        ],
      },
      destination: {
        type: "string",
        enum: [
          "function_hour_support",
          "event_organizer",
          "function_hour_and_organizer",
        ],
      },
      summary: { type: "string" },
      details: {
        type: "array",
        maxItems: 5,
        items: { type: "string" },
      },
      handoffText: { type: "string" },
    },
    required: ["category", "destination", "summary", "details", "handoffText"],
  },
};

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Unable to prepare a support summary from this conversation." },
        { status: 400 },
      );
    }

    const session = await auth();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Function Hour support handoff is not configured." },
        { status: 503 },
      );
    }

    const transcript = parsed.data.messages
      .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
      .join("\n\n");

    const client = new OpenAI({ apiKey });
    const response = await client.responses.create({
      model:
        process.env.OPENAI_SUPPORT_MODEL ||
        process.env.OPENAI_ORGANIZER_MODEL ||
        "gpt-5.6-sol",
      reasoning: { effort: "low" },
      instructions: `You prepare concise, safe human-support handoffs for Function Hour.

Use only the supplied conversation and route. Do not invent purchases, refunds, ticket states, event facts, account facts, support actions, or contact information.

Privacy rules:
- Minimize personal data. Include only details necessary to understand the issue.
- Never repeat passwords, full payment-card numbers, CVVs, QR codes, authentication tokens, Stripe identifiers, or other secrets even if the user typed them.
- Do not include inferred sensitive information.
- Do not claim a case was created or submitted. This output is only a summary the user can copy.

Routing guidance:
- payment, account_access, technical, and safety_or_fraud generally go to function_hour_support.
- organizer-specific event operations or organizer decisions generally go to event_organizer.
- refunds or event issues can use function_hour_and_organizer when both may need to review.

handoffText should be a ready-to-copy plain-text note with a short subject-style first line, then the issue summary and key details. Keep it under 900 characters.`,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Current Function Hour route: ${parsed.data.currentPath}\nSigned in: ${Boolean(session.userId)}\n\nConversation to summarize:\n${transcript}`,
            },
          ],
        },
      ],
      text: {
        verbosity: "low",
        format: responseFormat,
      },
    });

    const handoff = handoffSchema.safeParse(JSON.parse(response.output_text));

    if (!handoff.success) {
      throw new Error("Support handoff returned an invalid response.");
    }

    return NextResponse.json(handoff.data);
  } catch (error) {
    console.error("Function Hour support handoff error:", error);

    return NextResponse.json(
      { error: "Unable to prepare a support summary right now." },
      { status: 500 },
    );
  }
}
