import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getConvexClient } from "@/lib/convex";
import { getStripeClient } from "@/lib/stripe/server";
import { createHash } from "node:crypto";
import Stripe from "stripe";

type CheckoutTicketRequest = {
  ticketTypeId?: string;
  quantity?: number;
};

function redactCheckoutErrorMessage(message: string): string {
  return message
    .replace(/(?:sk|rk)_(?:live|test)_[A-Za-z0-9]+/g, "[REDACTED_STRIPE_KEY]")
    .replace(/whsec_[A-Za-z0-9]+/g, "[REDACTED_WEBHOOK_SECRET]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]");
}

function getStripeKeyProfile() {
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!stripeKey) {
    return {
      configured: false,
      mode: "missing",
      fingerprint: null,
      length: 0,
    };
  }

  const mode = stripeKey.startsWith("sk_live_")
    ? "live"
    : stripeKey.startsWith("sk_test_")
      ? "test"
      : stripeKey.startsWith("rk_live_") || stripeKey.startsWith("rk_test_")
        ? "restricted"
        : "unknown";

  return {
    configured: true,
    mode,
    fingerprint: createHash("sha256").update(stripeKey).digest("hex").slice(0, 12),
    length: stripeKey.length,
  };
}

function logCheckoutDiagnostic(
  diagnosticId: string,
  checkoutStage: string,
  error: unknown,
) {
  const stripeError = error instanceof Stripe.errors.StripeError;

  const diagnostic = {
    diagnosticId,
    route: "/api/stripe/ticket-checkout",
    stage: checkoutStage,
    timestamp: new Date().toISOString(),
    error: {
      name: error instanceof Error ? error.name : typeof error,
      message:
        error instanceof Error
          ? redactCheckoutErrorMessage(error.message)
          : "Non-Error value thrown",
      stripe: stripeError
        ? {
            type: error.type,
            code: error.code ?? null,
            statusCode: error.statusCode ?? null,
            requestId: error.requestId ?? null,
            param: error.param ?? null,
            declineCode: error.decline_code ?? null,
            docUrl: error.doc_url ?? null,
          }
        : null,
    },
    stripeConfiguration: getStripeKeyProfile(),
    deployment: {
      vercelEnvironment: process.env.VERCEL_ENV ?? null,
      gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      nodeEnvironment: process.env.NODE_ENV ?? null,
    },
  };

  // Intentionally server-only. Never include raw errors, credentials, buyer
  // details, or payment data in this diagnostic.
  console.error("Ticket checkout diagnostic:", JSON.stringify(diagnostic));
}

async function releaseReservationSafely(
  reservationId: string,
  checkoutSecret: string,
) {
  try {
    await getConvexClient().mutation(api.tickets.releaseCheckoutReservation, {
      checkoutSecret,
      reservationId,
    });
  } catch (releaseError) {
    // Preserve the original checkout error. The scheduled Convex cleanup remains
    // a backstop if an immediate release cannot be completed.
    console.error("Ticket checkout reservation release error:", releaseError);
  }
}

export async function POST(req: Request) {
  let checkoutStage = "request-validation";
  const diagnosticId = crypto.randomUUID();

  try {
    const body = await req.json();

    const {
      eventId,
      tickets,
      successPath,
      cancelPath,
      promoCode,
    } = body;

    if (!eventId || !Array.isArray(tickets) || tickets.length !== 1) {
      return NextResponse.json(
        { error: "Missing ticket checkout details." },
        { status: 400 }
      );
    }

    checkoutStage = "authentication";
    const user = await currentUser();
    const buyerEmail = user?.primaryEmailAddress?.emailAddress
      .trim()
      .toLowerCase();

    if (!user || !buyerEmail) {
      return NextResponse.json(
        { error: "Please sign in with a verified email before checkout." },
        { status: 401 }
      );
    }

    const requestedTicket = tickets[0] as CheckoutTicketRequest;
    const quantity = Number(requestedTicket.quantity);

    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10) {
      return NextResponse.json(
        { error: "Ticket quantity must be between 1 and 10." },
        { status: 400 }
      );
    }

    checkoutStage = "configuration";
    const convex = getConvexClient();
    const buyerName =
      user.fullName?.trim() ||
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

    const checkoutSecret = process.env.STRIPE_WEBHOOK_SHARED_SECRET;
    if (!checkoutSecret) {
      return NextResponse.json(
        { error: "Ticket checkout is not configured." },
        { status: 500 }
      );
    }

    checkoutStage = "ticket-reservation";
    const reservationId = crypto.randomUUID();
    const reservation = await convex.mutation(
      api.tickets.reserveTicketsForCheckout,
      {
        checkoutSecret,
        reservationId,
        eventId,
        ticketTypeId: requestedTicket.ticketTypeId as
          | Id<"ticketTypes">
          | undefined,
        buyerEmail,
        buyerName: buyerName || undefined,
        quantity,
      }
    );

    if (reservation.stripeCheckoutSessionId) {
      checkoutStage = "existing-stripe-session";
      const existingSession = await getStripeClient().checkout.sessions.retrieve(
        reservation.stripeCheckoutSessionId
      );

      if (existingSession.status === "open" && existingSession.url) {
        return NextResponse.json({ url: existingSession.url });
      }

      await releaseReservationSafely(
        reservation.reservationId,
        checkoutSecret,
      );

      return NextResponse.json(
        { error: "Your previous checkout expired. Please try again." },
        { status: 409 }
      );
    }

    const activeReservationId = reservation.reservationId;
    const ticketSubtotal = reservation.unitPrice * quantity;
    checkoutStage = "discount-validation";
    const discount = promoCode
      ? await convex.query(api.discountCodes.validate, {
          eventId: eventId as Id<"events">,
          code: String(promoCode),
          subtotal: ticketSubtotal,
          quantity,
          ticketTypeId: requestedTicket.ticketTypeId as Id<"ticketTypes"> | undefined,
        })
      : null;

    if (discount && !discount.valid) {
      await releaseReservationSafely(activeReservationId, checkoutSecret);
      return NextResponse.json({ error: discount.message }, { status: 400 });
    }

    const validDiscount = discount?.valid === true ? discount : null;
    const checkoutTotal = validDiscount?.finalTotal ?? ticketSubtotal;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const authoritativeTickets = [
      {
        ticketTypeId: requestedTicket.ticketTypeId,
        quantity,
      },
    ];
    const lineItems = [
      {
        quantity,
        price_data: {
          currency: "usd",
          unit_amount: Math.round((checkoutTotal / quantity) * 100),
          product_data: {
            name: `${reservation.eventName} — ${reservation.ticketTypeName || "Standard Admission"}`,
            description: reservation.ticketTypeDescription || "Event ticket",
          },
        },
      },
    ];

    const successUrl = buildReturnUrl(
      appUrl,
      successPath,
      "/onboarding/attendee",
      "success"
    );
    const cancelUrl = buildReturnUrl(
      appUrl,
      cancelPath,
      `/events/${eventId}/checkout`,
      "cancelled"
    );

    checkoutStage = "stripe-session-creation";
    let session;
    try {
      session = await getStripeClient().checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: buyerEmail,
        line_items: lineItems,
        metadata: {
          checkoutType: "ticket",
          eventId,
          buyerEmail,
          buyerName: buyerName || "",
          reservationId: activeReservationId,
          tickets: JSON.stringify(authoritativeTickets),
          discountCodeId: validDiscount?.discountCodeId
            ? String(validDiscount.discountCodeId)
            : "",
          discountCode: validDiscount?.code ?? "",
          discountAmount: String(validDiscount?.discountAmount ?? 0),
        },
        expires_at: Math.floor(reservation.expiresAt / 1000),
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
    } catch (error) {
      await releaseReservationSafely(activeReservationId, checkoutSecret);
      throw error;
    }

    checkoutStage = "checkout-finalization";
    await convex.mutation(api.tickets.attachCheckoutSession, {
      checkoutSecret,
      reservationId: activeReservationId,
      stripeCheckoutSessionId: session.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    logCheckoutDiagnostic(diagnosticId, checkoutStage, error);

    const message = error instanceof Error ? error.message : "";
    const salesEnded = message.includes("Ticket sales have ended");
    const unavailable = [
      "Event not found",
      "Ticket type not found",
      "not currently available",
      "not enough tickets remaining",
      "checkout in progress",
      "checkout is already being prepared",
      "previous checkout expired",
    ].some((knownMessage) => message.includes(knownMessage));
    const configurationError =
      message.includes("Unauthorized checkout request") ||
      message.includes("STRIPE_SECRET_KEY") ||
      message.includes("NEXT_PUBLIC_CONVEX_URL");
    const stripeError = error instanceof Stripe.errors.StripeError;

    let publicMessage = "Unable to create ticket checkout session.";
    let status = 500;

    if (salesEnded) {
      publicMessage = "Ticket sales have ended for this event.";
      status = 409;
    } else if (unavailable) {
      publicMessage = message;
      status = 409;
    } else if (stripeError) {
      publicMessage =
        "The payment provider could not start checkout. Please try again.";
      status = 502;
    } else if (configurationError) {
      publicMessage =
        "Ticket checkout is temporarily unavailable. Please contact support.";
      status = 503;
    }

    return NextResponse.json(
      {
        error: publicMessage,
        diagnostic: `Temporary checkout diagnostic: ${checkoutStage}`,
      },
      {
        status,
        headers: {
          "X-Checkout-Diagnostic-Id": diagnosticId,
        },
      }
    );
  }
}

function buildReturnUrl(
  appUrl: string,
  requestedPath: string | undefined,
  fallbackPath: string,
  checkoutStatus: "success" | "cancelled"
): string {
  const safePath =
    requestedPath?.startsWith("/") &&
    !requestedPath.startsWith("//")
      ? requestedPath
      : fallbackPath;
  const url = new URL(safePath, appUrl);

  url.searchParams.set("checkout", checkoutStatus);

  return url.toString();
}
