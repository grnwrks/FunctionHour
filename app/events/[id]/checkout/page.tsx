"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { isEventUpcoming } from "../../eventPresentation";

export default function EventCheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const eventId = id as Id<"events">;
  const router = useRouter();
  const searchParams = useSearchParams();

  const { user, isLoaded, isSignedIn } = useUser();

  const event = useQuery(api.events.getById, { eventId });
  const ticketTypes = useQuery(api.ticketTypes.getByEvent, { eventId });
  const addOns = useQuery(api.ticketAddOns.getByEvent, { eventId });

  const myTicket = useQuery(
    api.tickets.getMyTicketForEvent,
    isLoaded && isSignedIn ? { eventId } : "skip"
  );

  const createTicket = useMutation(api.tickets.createTicket);

  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [message, setMessage] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoToValidate, setPromoToValidate] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    setBuyerName((current) =>
      current || user.fullName?.trim() || ""
    );
    setBuyerEmail((current) =>
      current ||
      user.primaryEmailAddress?.emailAddress.trim().toLowerCase() ||
      ""
    );
  }, [user]);

  const activeTicketTypes = useMemo(
    () => ticketTypes?.filter((ticket) => ticket.isActive !== false) ?? [],
    [ticketTypes],
  );

  const activeAddOns = useMemo(
    () => addOns?.filter((addOn) => addOn.isActive !== false) ?? [],
    [addOns],
  );

  useEffect(() => {
    const requestedTicketType = searchParams.get("ticketType");
    if (
      requestedTicketType &&
      activeTicketTypes.some((ticket) => ticket._id === requestedTicketType)
    ) {
      setSelectedTicketTypeId(requestedTicketType);
    }
  }, [activeTicketTypes, searchParams]);

  const selectedTicketType = useMemo(() => {
    return activeTicketTypes.find(
      (ticket) => ticket._id === selectedTicketTypeId
    );
  }, [activeTicketTypes, selectedTicketTypeId]);

  const selectedAddOns = useMemo(() => {
    return activeAddOns.filter((addOn) =>
      selectedAddOnIds.includes(addOn._id)
    );
  }, [activeAddOns, selectedAddOnIds]);

  const basePrice = selectedTicketType?.price ?? event?.price ?? 0;

  const addOnTotal = selectedAddOns.reduce(
    (sum, addOn) => sum + Number(addOn.price ?? 0),
    0
  );

  const total = Number(basePrice) * quantity + addOnTotal;

  const selectedInventory = selectedTicketType?.quantity
    ? Math.max(selectedTicketType.quantity - (selectedTicketType.sold ?? 0), 0)
    : 10;
  const maxQuantity = Number(basePrice) <= 0
    ? 1
    : Math.max(1, Math.min(10, selectedInventory));

  useEffect(() => {
    setQuantity((current) => Math.min(current, maxQuantity));
  }, [maxQuantity]);

  const discount = useQuery(
    api.discountCodes.validate,
    promoToValidate && Number(basePrice) > 0
      ? {
          eventId,
          code: promoToValidate,
          subtotal: Number(basePrice) * quantity,
          quantity,
          ticketTypeId: selectedTicketType?._id,
        }
      : "skip"
  );
  const appliedDiscountAmount =
    discount?.valid === true ? discount.discountAmount ?? 0 : 0;

  function toggleAddOn(addOnId: string) {
    setSelectedAddOnIds((current) =>
      current.includes(addOnId)
        ? current.filter((id) => id !== addOnId)
        : [...current, addOnId]
    );
  }

  async function handleReserveTicket() {
    setMessage("");

    if (!isLoaded) return;

    if (!isSignedIn) {
      setMessage("Please sign in before checkout.");
      return;
    }

    if (myTicket) {
      setMessage("You already have a ticket for this event.");
      return;
    }

    if (activeTicketTypes.length > 0 && !selectedTicketType) {
      setMessage("Please select a ticket option.");
      return;
    }

    try {
      setSubmitting(true);

      const paidCheckout = Number(total) > 0;

      if (!buyerEmail.trim()) {
        setMessage("Email address is required.");
        return;
      }

      if (!paidCheckout) {
        await createTicket({
          eventId,
        });

        router.push("/onboarding/attendee?checkout=success");
        return;
      }

      const response = await fetch("/api/stripe/ticket-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          tickets: [
            {
              ticketTypeId: selectedTicketType?._id,
              quantity,
            },
          ],
          successPath: "/onboarding/attendee",
          cancelPath: `/events/${eventId}/checkout`,
          promoCode: discount?.valid ? promoToValidate : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to start checkout.");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      setMessage(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (event === undefined || ticketTypes === undefined || addOns === undefined) {
    return (
      <main className="min-h-screen bg-black p-4 sm:p-6 text-white">
        Loading checkout...
        <div className="mx-auto mt-6 max-w-6xl px-4 text-center text-[11px] uppercase tracking-[0.3em] text-white/35 sm:px-6">
        Secure checkout powered by Function Hour
      </div>
      <div className="h-10 sm:hidden" />
    </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-black p-4 sm:p-6 text-white">
        Event not found.
        <div className="mx-auto mt-6 max-w-6xl px-4 text-center text-[11px] uppercase tracking-[0.3em] text-white/35 sm:px-6">
        Secure checkout powered by Function Hour
      </div>
      <div className="h-10 sm:hidden" />
    </main>
    );
  }

  if (!isEventUpcoming(event)) {
    return (
      <main className="min-h-screen bg-black px-4 py-16 text-white">
        <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <h1 className="text-3xl font-black">Ticket sales have ended</h1>
          <p className="mt-3 text-zinc-400">This event is no longer accepting ticket orders.</p>
          <Link href={`/events/${eventId}`} className="mt-6 inline-flex rounded-2xl bg-white px-5 py-3 font-black text-black">
            Return to event
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-20%] top-[-10%] h-[420px] w-full lg:w-[420px] rounded-full bg-orange-500 shadow-lg shadow-orange-500/20 transition hover:scale-[1.01] hover:bg-orange-400/20 blur-[120px]" />
        <div className="absolute right-[-20%] top-[20%] h-[420px] w-full lg:w-[420px] rounded-full bg-violet-500/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[30%] h-[360px] w-[360px] rounded-full bg-fuchsia-500/10 blur-[120px]" />
      </div>
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href={`/events/${event._id}`}
          className="text-sm text-white/50 hover:text-white"
        >
          ← Back to event
        </Link>

        <div className="mt-6 grid gap-5 sm:p-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-orange-400">
                Secure Checkout
              </p>
              <h1 className="mt-3 text-2xl sm:text-3xl sm:text-4xl font-black">{event.name}</h1>
              <p className="mt-2 text-white/50">
                Choose your ticket experience and optional add-ons.
              </p>
            </div>

            <section className="max-w-full rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 sm:p-6">
              <h2 className="text-2xl font-black">Ticket Option</h2>

              <div className="mt-5 space-y-4">
                {activeTicketTypes.length === 0 ? (
                  <div className="max-w-full rounded-2xl border border-white bg-white p-5 text-black">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-black">Standard Admission</p>
                        <p className="mt-1 text-sm text-black/60">
                          General event access
                        </p>
                      </div>
                      <p className="text-xl font-black">${event.price ?? 0}</p>
                    </div>
                  </div>
                ) : (
                  activeTicketTypes.map((ticket) => {
                    const soldOut =
                      ticket.isSoldOut ||
                      ticket.salesPaused ||
                      (ticket.quantity &&
                        (ticket.sold ?? 0) >= ticket.quantity);

                    const selected = selectedTicketTypeId === ticket._id;

                    return (
                      <button
                        key={ticket._id}
                        type="button"
                        disabled={!!soldOut}
                        onClick={() => setSelectedTicketTypeId(ticket._id)}
                        className={`w-full rounded-2xl border p-5 text-left transition ${
                          selected
                            ? "border-orange-400 bg-orange-500 shadow-lg shadow-orange-500/20 transition hover:scale-[1.01] hover:bg-orange-400/10"
                            : "border-white/10 bg-black hover:border-white/30"
                        } ${soldOut ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-black">{ticket.name}</p>
                            {ticket.description && (
                              <p className="mt-1 text-sm text-white/50">
                                {ticket.description}
                              </p>
                            )}
                          </div>
                          <p className="text-xl font-black">${ticket.price}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            {activeAddOns.length > 0 && (
              <section className="max-w-full rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 sm:p-6">
                <h2 className="text-2xl font-black">Add-ons</h2>

                <div className="mt-5 space-y-4">
                  {activeAddOns.map((addOn) => {
                    const selected = selectedAddOnIds.includes(addOn._id);

                    return (
                      <button
                        key={addOn._id}
                        type="button"
                        disabled={!!addOn.isSoldOut}
                        onClick={() => toggleAddOn(addOn._id)}
                        className={`w-full rounded-2xl border p-5 text-left transition ${
                          selected
                            ? "border-orange-400 bg-orange-500 shadow-lg shadow-orange-500/20 transition hover:scale-[1.01] hover:bg-orange-400/10"
                            : "border-white/10 bg-black hover:border-white/30"
                        } ${addOn.isSoldOut ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-black">
                              {addOn.name}
                              {addOn.isRequired ? " · Required" : ""}
                            </p>
                            {addOn.description && (
                              <p className="mt-1 text-sm text-white/50">
                                {addOn.description}
                              </p>
                            )}
                          </div>
                          <p className="text-xl font-black">+${addOn.price}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          <aside className="h-fit rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 sm:p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-white/40">
              Order Summary
            </p>

            <div className="mt-5 space-y-4">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-white/50">
                  {selectedTicketType?.name || "Standard Admission"} × {quantity}
                </span>
                <span>${(Number(basePrice) * quantity).toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/35 p-3">
                <div>
                  <p className="text-sm font-black">Ticket quantity</p>
                  <p className="mt-1 text-xs text-white/45">Up to {maxQuantity} per order</p>
                </div>
                <div className="flex items-center overflow-hidden rounded-full border border-white/15 bg-black">
                  <button
                    type="button"
                    aria-label="Remove one ticket"
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    disabled={quantity <= 1}
                    className="grid h-11 w-11 place-items-center text-xl font-black hover:bg-white/10 disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="min-w-10 text-center font-black" aria-live="polite">{quantity}</span>
                  <button
                    type="button"
                    aria-label="Add one ticket"
                    onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
                    disabled={quantity >= maxQuantity}
                    className="grid h-11 w-11 place-items-center text-xl font-black hover:bg-white/10 disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>

              {selectedAddOns.map((addOn) => (
                <div key={addOn._id} className="flex justify-between gap-4 text-sm">
                  <span className="text-white/50">{addOn.name}</span>
                  <span>${addOn.price}</span>
                </div>
              ))}

              <div className="border-t border-white/10 pt-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40" htmlFor="promo-code">Promo code</label>
                <div className="mt-2 flex gap-2">
                  <input id="promo-code" value={promoCode} onChange={(event) => { setPromoCode(event.target.value.toUpperCase().replace(/\s/g, "")); setPromoToValidate(""); }} placeholder="ENTER CODE" className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 text-sm font-black uppercase outline-none focus:border-orange-400/50" />
                  <button type="button" onClick={() => setPromoToValidate(promoCode)} disabled={!promoCode} className="rounded-xl border border-white/10 px-3 text-xs font-black disabled:opacity-40">Apply</button>
                </div>
                {promoToValidate && discount === undefined && <p className="mt-2 text-xs text-zinc-500">Checking code…</p>}
                {discount && <p className={`mt-2 text-xs ${discount.valid ? "text-emerald-400" : "text-red-300"}`}>{discount.message}</p>}
              </div>

              {discount?.valid && (
                <div className="flex justify-between gap-4 text-sm text-emerald-400">
                  <span>Discount ({discount.code})</span>
                  <span>-${appliedDiscountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between text-xl font-black">
                  <span>Total</span>
                  <span>${Math.max(0, total - appliedDiscountAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              {!isLoaded ? (
                <button
                  disabled
                  className="min-h-12 w-full rounded-2xl bg-white px-5 py-4 font-black text-black opacity-50"
                >
                  Loading...
                </button>
              ) : !isSignedIn ? (
                <div>
                  <SignInButton mode="modal">
                    <button className="min-h-12 w-full rounded-2xl bg-white px-5 py-4 font-black text-black">
                      Sign in to Checkout
                    </button>
                  </SignInButton>
                  <p className="mt-3 text-center text-[10px] leading-4 text-white/40">
                    Your account keeps tickets, entry details, and event updates together.
                  </p>
                </div>
              ) : myTicket ? (
                <Link
                  href="/my-tickets"
                  className="block w-full rounded-2xl bg-green-500 px-5 py-4 text-center font-black text-black"
                >
                  View My Ticket
                </Link>
              ) : (
                <>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-white/40"
                    />

                    <input
                      type="email"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="Email Address"
                      required
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-white/40"
                    />
                  </div>

                  <button
                    onClick={handleReserveTicket}
                    disabled={submitting}
                    className="mt-3 min-h-12 w-full rounded-2xl bg-white px-5 py-4 font-black text-black hover:bg-zinc-200 disabled:opacity-50"
                  >
                    {submitting
                      ? "Processing..."
                      : `Add ${quantity} Ticket${quantity === 1 ? "" : "s"} & Continue`}
                  </button>
                </>
              )}
            </div>

            {message && (
              <p className="mt-4 rounded-2xl border border-white/10 bg-black p-4 text-sm text-white/70">
                {message}
              </p>
            )}
          </aside>
        </div>
      </section>
      <div className="mx-auto mt-6 max-w-6xl px-4 text-center text-[11px] uppercase tracking-[0.3em] text-white/35 sm:px-6">
        Secure checkout powered by Function Hour
      </div>
      <div className="h-10 sm:hidden" />
    </main>
  );
}
