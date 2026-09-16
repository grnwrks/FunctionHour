"use client";

import { use, useEffect, useMemo } from "react";
import Link from "next/link";
import ShareEventButton from "@/components/share/ShareEventButton";
import { useMutation, useQuery } from "convex/react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import EventLocationPreview from "@/components/events/EventLocationPreview";
import EventAnnouncements from "@/components/events/EventAnnouncements";

import type { Id } from "@/convex/_generated/dataModel";
import VenueRules from "@/components/functionhour/VenueRules";
import { getEventViewAttribution } from "@/lib/analytics/eventViewAttribution";
import { formatEventDate, isEventUpcoming } from "../eventPresentation";

function EventImage({
  storageId,
  name,
}: {
  storageId?: Id<"_storage">;
  name?: string;
}) {
  const imageUrl = useQuery(
    api.events.getImageUrl,
    storageId ? { storageId } : "skip",
  );

  if (!storageId) {
    return <div className="text-white/40">No Image</div>;
  }

  if (imageUrl === undefined) {
    return <div className="text-white/40">Loading image...</div>;
  }

  if (!imageUrl) {
    return <div className="text-white/40">Image unavailable</div>;
  }

  return (
    <img
      src={imageUrl}
      alt={name ? `${name} event` : "Event image"}
      className="h-full w-full object-cover"
    />
  );
}

function MerchImage({
  imageUrl,
  storageId,
  name,
}: {
  imageUrl?: string;
  storageId?: Id<"_storage">;
  name: string;
}) {
  const resolvedUrl = useQuery(
    api.events.getImageUrl,
    !imageUrl && storageId ? { storageId } : "skip",
  );

  const finalUrl = imageUrl || resolvedUrl;

  if (!imageUrl && !storageId) {
    return <span className="text-white/40">Merch Image</span>;
  }

  if (finalUrl === undefined) {
    return <span className="text-white/40">Loading image...</span>;
  }

  if (!finalUrl) {
    return <span className="text-white/40">Image unavailable</span>;
  }

  return (
    <img src={finalUrl} alt={name} className="h-full w-full object-cover" />
  );
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const eventId = id as Id<"events">;

  async function copyText(value?: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    alert("Copied to clipboard.");
  }

  const { isLoaded, isSignedIn } = useUser();

  const event = useQuery(api.events.getById, { eventId });
  const salesOpen = event ? isEventUpcoming(event) : false;
  const eventAccess = useQuery(
    api.eventAccess.getMyEventAccess,
    isLoaded && isSignedIn ? { eventId } : "skip",
  );
  const canManageEvent =
    eventAccess?.capabilities.includes("manage_event") === true;
  const canManageTickets =
    eventAccess?.capabilities.includes("manage_tickets") === true;

  const myTickets = useQuery(
    api.tickets.getUserTickets,
    isLoaded && isSignedIn ? {} : "skip",
  );

  const merch = useQuery(api.merch.getByEvent, { eventId });

  const ticketTypes = useQuery(api.ticketTypes.getByEvent, { eventId });
  const ticketAddOns = useQuery(api.ticketAddOns.getByEvent, { eventId });

  const activeTicketTypes = useMemo(
    () => ticketTypes?.filter((ticket) => ticket.isActive !== false) ?? [],
    [ticketTypes],
  );

  const startingPrice =
    ticketTypes === undefined
      ? null
      : activeTicketTypes.length > 0
        ? Math.min(...activeTicketTypes.map((ticket) => ticket.price))
        : (event?.price ?? 0);

  const savedCreative = useQuery(api.eventCreative.listPublishedByEvent, {
    eventId,
  });
  const announcements = useQuery(api.eventMessages.listPublishedForEvent, {
    eventId,
  });
  const organizerData = useQuery(
    api.organizers.getOrganizerByUserId,
    event?.userId ? { userId: event.userId } : "skip",
  );

  const trackView = useMutation(api.eventViews.trackEventView);

  const alreadyPurchased = useMemo(() => {
    if (!myTickets || !event) return false;
    return myTickets.some((ticket) => ticket.eventId === event._id);
  }, [myTickets, event]);

  useEffect(() => {
    if (!event?._id) return;

    trackView({
      eventId: event._id,
      ...getEventViewAttribution(),
    }).catch(() => {});
  }, [event?._id, trackView]);

  if (event === undefined) {
    return (
      <main className="safe-x min-h-screen pb-28 sm:pb-0 bg-black px-4 py-6 sm:px-6 sm:py-10 text-white">
        Loading event...
        <div className="h-10 sm:hidden" />
      </main>
    );
  }

  if (!event) {
    return (
      <main className="safe-x min-h-screen bg-black px-4 py-6 sm:px-6 sm:py-10 text-white">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl sm:text-3xl font-bold">Event not found</h1>
          <Link
            href="/events"
            className="mt-6 inline-block rounded-2xl sm:rounded-xl bg-white px-5 min-h-11 py-3.5 sm:py-3 font-semibold text-black"
          >
            Browse Events
          </Link>
        </div>
        <div className="h-10 sm:hidden" />
      </main>
    );
  }

  const eventDetails = event as typeof event & {
    entryPolicy?: string;
    reEntryPolicy?: string;
    isVenueVerified?: boolean;
  };
  const organizer = organizerData?.organizer;
  const organizerName =
    organizer?.organizerName || organizer?.name || "Organizer";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080808] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.12),transparent_34%),radial-gradient(circle_at_90%_30%,rgba(249,115,22,0.08),transparent_28%)]" />
      <section className="relative mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/events"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-white/60 transition hover:text-white"
          >
            ← All events
          </Link>
          <Link
            href="/"
            className="text-xs font-black tracking-[0.22em] text-white"
          >
            FUNCTION<span className="text-violet-400">HOUR</span>
          </Link>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(310px,0.7fr)] lg:items-start">
          <div className="contents lg:block">
            <div className="order-1 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#111] shadow-2xl sm:rounded-[2rem]">
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-zinc-900 sm:aspect-[16/10]">
                <EventImage
                  storageId={event.imageStorageId}
                  name={event.name}
                />
              </div>

              <div className="p-5 sm:p-7">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-300/80">
                  {event.category || "Experience"}
                </p>

                <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">
                  {event.name}
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-7 text-white/65 sm:text-lg">
                  {event.description}
                </p>

                <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2">
                  <EventSignalCard
                    label="Date"
                    value={formatEventDate(event)}
                  />
                  <EventSignalCard
                    label="Location"
                    value={
                      event.venueName ||
                      event.location ||
                      "Location coming soon"
                    }
                  />
                </div>
              </div>
            </div>

            <div className="order-3 mt-5 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#111] p-5 sm:mt-6 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/40">
                    Hosted By
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">
                    {organizerName}
                  </h2>
                  {organizer?.bio && (
                    <p className="mt-2 line-clamp-2 max-w-xl text-white/60">
                      {organizer.bio}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {organizer?.isVerifiedOrganizer && (
                      <span className="rounded-full border border-violet-300/20 bg-violet-500/10 px-3 py-1 text-[11px] sm:text-xs font-black text-violet-100">
                        Verified Organizer
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 text-xl font-black">
                  {organizer?.avatarUrl ? (
                    <img
                      src={organizer.avatarUrl}
                      alt={organizerName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    organizerName.charAt(0).toUpperCase()
                  )}
                </div>
              </div>

              {(canManageEvent || canManageTickets) && (
                <div className="mt-5 flex flex-wrap gap-3">
                  {canManageEvent ? (
                    <Link
                      href={`/host/events/${event._id}/edit`}
                      className="rounded-2xl sm:rounded-xl border border-white/10 px-5 min-h-11 py-3.5 sm:py-3 text-sm font-bold text-white hover:bg-white/10"
                    >
                      Edit Event
                    </Link>
                  ) : null}

                  {canManageTickets ? (
                    <Link
                      href={`/host/events/${event._id}/tickets`}
                      className="rounded-2xl sm:rounded-xl bg-orange-500 px-5 min-h-11 py-3.5 sm:py-3 text-sm font-black text-black hover:bg-orange-400"
                    >
                      Ticket Setup
                    </Link>
                  ) : null}
                </div>
              )}

              <Link
                href={`/organizers/${event.userId}`}
                className="mt-5 inline-flex min-h-11 items-center text-sm font-bold text-violet-200 transition hover:text-white"
              >
                View Organizer Profile →
              </Link>

              <div className="mt-6 sm:mt-8">
                <VenueRules
                  age={event.ageRequirement}
                  dressCode={event.dressCode}
                  parking={event.parkingInfo}
                  entryPolicy={event.entryNotes || eventDetails.entryPolicy}
                  refundPolicy={event.refundPolicy}
                  reEntry={eventDetails.reEntryPolicy}
                  isVerified={eventDetails.isVenueVerified === true}
                />
              </div>

              <EventAnnouncements announcements={announcements} />
            </div>

            {canManageEvent && savedCreative && savedCreative.length > 0 && (
              <div className="order-5 mt-5 rounded-[1.5rem] border border-white/10 bg-[#111] p-5 sm:mt-6 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-[11px] sm:text-xs font-black uppercase tracking-[0.3em] text-violet-300/70">
                      Launch Creative
                    </p>
                    <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-[-0.04em] sm:tracking-tight">
                      Saved Flyers & Captions
                    </h2>

                    <p className="mt-2 text-sm text-white/45">
                      {savedCreative.length} saved creative asset
                      {savedCreative.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-1 sm:grid-cols-2">
                  {savedCreative.slice(0, 4).map((creative) => (
                    <div
                      key={creative._id}
                      className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/40 p-5 transition duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:bg-zinc-950"
                    >
                      <div className="pointer-events-none absolute right-[-30px] top-[-30px] h-28 w-28 rounded-full bg-violet-500/10 blur-3xl transition group-hover:bg-orange-500/10" />

                      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="font-black text-white">
                          {creative.title || "Event Flyer"}
                        </h3>

                        <span className="rounded-full border border-violet-300/20 bg-gradient-to-r from-violet-500/20 to-orange-500/20 px-3 py-1 text-[11px] sm:text-xs font-black text-violet-100 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                          {creative.style || "Luxury"}
                        </span>
                      </div>

                      {creative.imageUrl && (
                        <img
                          src={creative.imageUrl}
                          alt={creative.title || "Saved creative"}
                          className="mt-4 h-40 w-full rounded-2xl object-cover"
                        />
                      )}

                      <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-white/30">
                        {creative.createdAt
                          ? new Date(creative.createdAt).toLocaleDateString()
                          : "Recently created"}
                      </p>

                      {creative.prompt && (
                        <p className="mt-3 line-clamp-2 text-sm text-white/55">
                          {creative.prompt}
                        </p>
                      )}

                      {creative.caption && (
                        <>
                          <pre className="mt-4 max-h-32 overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/50 p-4 text-[11px] sm:text-xs leading-relaxed text-white/60">
                            {creative.caption}
                          </pre>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => copyText(creative.caption)}
                              className="rounded-full border border-white/10 bg-white/[0.04] px-4 min-h-11 py-3.5 sm:py-3 sm:py-2 text-[11px] sm:text-xs font-black text-white hover:bg-white/[0.08]"
                            >
                              Copy Caption
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(canManageEvent || (merch && merch.length > 0)) && (
              <div className="order-4 mt-5 sm:mt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] sm:text-xs font-black uppercase tracking-[0.3em] text-orange-300/70">
                      Event Commerce
                    </p>
                    <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-[-0.04em] sm:tracking-tight">
                      Merch Drops
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">
                      Limited event merchandise, preorder items, and organizer
                      drops.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {merch && merch.length > 0 && (
                      <Link
                        href={`/events/${event._id}/merch`}
                        className="rounded-2xl bg-gradient-to-r from-violet-600 to-orange-500 px-5 min-h-11 py-3.5 sm:py-3 text-sm font-black text-white"
                      >
                        Shop Merch →
                      </Link>
                    )}
                    {canManageEvent && (
                      <Link
                        href={`/events/${event._id}/add-merch`}
                        className="rounded-2xl border border-orange-300/25 bg-orange-500/10 px-5 min-h-11 py-3.5 sm:py-3 text-sm font-black text-orange-100 hover:bg-orange-500/20"
                      >
                        Add Merch →
                      </Link>
                    )}
                  </div>
                </div>

                {merch === undefined ? (
                  <div className="mt-4 max-w-full rounded-[1.5rem] sm:rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 text-white/50">
                    Loading merch...
                  </div>
                ) : merch.length === 0 ? (
                  <div className="mt-4 max-w-full rounded-[1.5rem] sm:rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 text-white/50">
                    No merch added yet.
                  </div>
                ) : (
                  <div className="mt-4 grid gap-5 md:grid-cols-1 sm:grid-cols-2">
                    {merch.map((item) => (
                      <div
                        key={item._id}
                        className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.045] to-white/[0.02] shadow-2xl transition duration-300 hover:-translate-y-1 hover:border-orange-300/35 hover:shadow-[0_0_60px_rgba(249,115,22,0.12)]"
                      >
                        <div className="pointer-events-none absolute right-[-60px] top-[-60px] h-40 w-40 rounded-full bg-orange-500/10 blur-3xl transition group-hover:bg-violet-500/20" />
                        <div className="relative flex h-48 items-center justify-center overflow-hidden bg-white/10">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10" />
                          <MerchImage
                            imageUrl={item.imageUrl}
                            storageId={item.imageStorageId}
                            name={item.name}
                          />
                        </div>

                        <div className="p-5">
                          <h3 className="font-bold">{item.name}</h3>

                          {item.description && (
                            <p className="mt-2 line-clamp-3 text-sm text-white/60">
                              {item.description}
                            </p>
                          )}

                          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="font-bold">${item.price}</p>
                            <p className="text-sm text-white/50">
                              {(item.inventory ?? 0) > 0
                                ? `${item.inventory} left`
                                : "Sold out"}
                            </p>
                          </div>

                          {canManageEvent && (
                            <Link
                              href={`/host/events/${event._id}/merch/${item._id}/edit`}
                              className="mt-4 inline-flex rounded-2xl sm:rounded-xl border border-white/10 px-4 min-h-11 py-3.5 sm:py-3 sm:py-2 text-sm font-semibold text-white hover:bg-white/10"
                            >
                              Edit Merch
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="order-2 h-fit overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#141414] p-5 shadow-2xl lg:sticky lg:top-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/40">
              Tickets
            </p>

            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-white/45">Starting at</p>
                <p className="mt-1 text-4xl font-black tracking-[-0.05em]">
                  {startingPrice === null
                    ? "—"
                    : startingPrice > 0
                      ? `$${startingPrice.toLocaleString()}`
                      : "Free"}
                </p>
              </div>
              {event.totalTickets ? (
                <p className="pb-1 text-right text-xs font-semibold text-white/45">
                  {Math.max(event.totalTickets - (event.ticketsSold ?? 0), 0)}{" "}
                  remaining
                </p>
              ) : null}
            </div>

            {activeTicketTypes.length > 0 && (
              <div className="mt-5 space-y-2 border-t border-white/10 pt-5">
                {activeTicketTypes.map((ticket) => {
                  const soldOut =
                    ticket.isSoldOut ||
                    ticket.salesPaused ||
                    Boolean(
                      ticket.quantity && (ticket.sold ?? 0) >= ticket.quantity,
                    );

                  return (
                    <div
                      key={ticket._id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/30 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">
                          {ticket.name}
                        </p>
                        <p
                          className={`mt-0.5 text-xs ${soldOut ? "text-red-300" : "text-white/40"}`}
                        >
                          {soldOut ? "Sold out" : "Available"}
                        </p>
                      </div>
                      <p className="shrink-0 font-black">
                        {ticket.price > 0
                          ? `$${ticket.price.toLocaleString()}`
                          : "Free"}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {ticketAddOns &&
              ticketAddOns.some((addOn) => addOn.isActive !== false) && (
                <p className="mt-4 text-xs leading-5 text-white/45">
                  Optional upgrades are available during checkout.
                </p>
              )}

            <div className="mt-5">
              {!salesOpen ? (
                <div className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-center font-bold text-zinc-400">
                  Ticket sales ended
                </div>
              ) : !isLoaded ? (
                <button
                  disabled
                  className="w-full rounded-xl bg-white px-5 py-4 font-black text-black opacity-50"
                >
                  Loading…
                </button>
              ) : !isSignedIn ? (
                <SignInButton mode="modal">
                  <button className="w-full rounded-xl bg-white px-5 py-4 font-black text-black transition hover:bg-violet-100">
                    Sign in to get tickets
                  </button>
                </SignInButton>
              ) : alreadyPurchased ? (
                <Link
                  href="/my-tickets"
                  className="block w-full rounded-xl bg-emerald-400 px-5 py-4 text-center font-black text-black"
                >
                  View your ticket
                </Link>
              ) : (
                <Link
                  href={`/events/${event._id}/checkout`}
                  className="block w-full rounded-xl bg-gradient-to-r from-violet-500 to-orange-500 px-5 py-4 text-center font-black text-white transition hover:brightness-110"
                >
                  Get tickets
                </Link>
              )}
            </div>

            <p className="mt-4 text-center text-xs text-white/35">
              Secure checkout · Tickets appear in My Tickets
            </p>

            <div className="mt-5 border-t border-white/10 pt-5">
              <ShareEventButton
                eventId={event._id}
                title={event.name}
                location={event.location}
              />
            </div>
          </aside>
        </div>

        <details className="mt-5 rounded-[1.5rem] border border-white/10 bg-[#111] p-5 open:bg-[#141414] sm:mt-6 sm:p-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-black">
            <span>Refunds and purchase terms</span>
            <span className="text-sm font-semibold text-white/40">
              View details
            </span>
          </summary>
          <div className="mt-5 border-t border-white/10 pt-5">
            <p className="leading-7 text-white/65">
              {event.refundPolicy ||
                "All sales are final unless otherwise stated by the event host."}
            </p>

            {event.refundDeadline && (
              <p className="mt-4 text-sm text-white/50">
                Refund deadline:{" "}
                <span className="font-semibold text-white">
                  {event.refundDeadline}
                </span>
              </p>
            )}

            {event.refundContactEmail && (
              <a
                href={`mailto:${event.refundContactEmail}`}
                className="mt-3 inline-block text-sm font-semibold text-orange-300 hover:text-orange-200"
              >
                Contact {event.refundContactEmail}
              </a>
            )}
          </div>
        </details>

        <EventLocationPreview
          location={event.location}
          venueName={event.venueName}
          city={event.city}
          state={event.state}
        />
      </section>
      <div className="h-28 sm:hidden" />

      {/* Mobile Sticky Purchase Bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">
              Starting at
            </p>

            <p className="truncate text-2xl font-black text-white">
              {startingPrice === null
                ? "—"
                : startingPrice > 0
                  ? `$${startingPrice.toLocaleString()}`
                  : "Free"}
            </p>
          </div>

          {!salesOpen ? (
            <span className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-black text-zinc-400">
              Sales Ended
            </span>
          ) : !isLoaded ? (
            <button
              type="button"
              disabled
              className="shrink-0 rounded-2xl bg-white px-6 py-4 font-black text-black opacity-50"
            >
              Loading...
            </button>
          ) : !isSignedIn ? (
            <SignInButton mode="modal">
              <button
                type="button"
                className="shrink-0 rounded-2xl bg-gradient-to-r from-violet-500 to-orange-500 px-6 py-4 font-black text-white shadow-[0_0_30px_rgba(139,92,246,0.3)]"
              >
                Sign In
              </button>
            </SignInButton>
          ) : alreadyPurchased ? (
            <Link
              href="/my-tickets"
              className="shrink-0 rounded-2xl bg-green-500 px-6 py-4 font-black text-black shadow-[0_0_25px_rgba(34,197,94,0.2)]"
            >
              View Ticket
            </Link>
          ) : (
            <Link
              href={`/events/${event._id}/checkout`}
              className="shrink-0 rounded-2xl bg-gradient-to-r from-violet-500 to-orange-500 px-6 py-4 font-black text-white shadow-[0_0_30px_rgba(139,92,246,0.3)] transition active:scale-[0.98]"
            >
              Get Tickets →
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

function EventSignalCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-white/[0.04] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold leading-6 text-white">{value}</p>
    </div>
  );
}
