import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getConvexClient } from "@/lib/convex";
import { getStripeClient } from "@/lib/stripe/server";

type CheckoutTicketRequest = {
  ticketTypeId?: string;
  quantity?: number;
};

export async function POST(req: Request) {
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
      const existingSession = await getStripeClient().checkout.sessions.retrieve(
        reservation.stripeCheckoutSessionId
      );

      if (existingSession.status === "open" && existingSession.url) {
        return NextResponse.json({ url: existingSession.url });
      }

      await convex.mutation(api.tickets.releaseCheckoutReservation, {
        checkoutSecret,
        reservationId: reservation.reservationId,
      });

      return NextResponse.json(
        { error: "Your previous checkout expired. Please try again." },
        { status: 409 }
      );
    }

    const activeReservationId = reservation.reservationId;
    const ticketSubtotal = reservation.unitPrice * quantity;
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
      await convex.mutation(api.tickets.releaseCheckoutReservation, {
        checkoutSecret,
        reservationId: activeReservationId,
      });
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
      await convex.mutation(api.tickets.releaseCheckoutReservation, {
        checkoutSecret,
        reservationId: activeReservationId,
      });
      throw error;
    }

    await convex.mutation(api.tickets.attachCheckoutSession, {
      checkoutSecret,
      reservationId: activeReservationId,
      stripeCheckoutSessionId: session.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Ticket checkout error:", error);

    const message = error instanceof Error ? error.message : "";
    const salesEnded = message.includes("Ticket sales have ended");

    return NextResponse.json(
      {
        error: salesEnded
          ? "Ticket sales have ended for this event."
          : "Unable to create ticket checkout session.",
      },
      { status: salesEnded ? 409 : 500 }
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
