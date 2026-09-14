"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ShareEventButton from "@/components/share/ShareEventButton";
import NotificationPulse from "@/components/notifications/NotificationPulse";
import { useMutation, useQuery } from "convex/react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import EventLocationPreview from "@/components/events/EventLocationPreview";
import EventAnnouncements from "@/components/events/EventAnnouncements";

import type { Id } from "@/convex/_generated/dataModel";
import VenueRules from "@/components/functionhour/VenueRules";
import { getEventViewAttribution } from "@/lib/analytics/eventViewAttribution";

function EventImage({ storageId }: { storageId?: Id<"_storage"> }) {
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
    <img src={imageUrl} alt="Event" className="h-full w-full object-cover" />
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
  const eventAccess = useQuery(
    api.eventAccess.getMyEventAccess,
    isLoaded && isSignedIn ? { eventId } : "skip",
  );
  const canManageEvent = eventAccess?.capabilities.includes("manage_event") === true;
  const canManageTickets = eventAccess?.capabilities.includes("manage_tickets") === true;

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

  const savedCreative = useQuery(
    api.eventCreative.listPublishedByEvent,
    { eventId }
  );
  const announcements = useQuery(
    api.eventMessages.listPublishedForEvent,
    { eventId }
  );
  const attendees = useQuery(api.tickets.getAttendeesByEvent, { eventId });

  const organizerData = useQuery(
    api.organizers.getOrganizerByUserId,
    event?.userId ? { userId: event.userId } : "skip",
  );

  const createTicket = useMutation(api.tickets.createTicket);
  const trackView = useMutation(api.eventViews.trackEventView);

  const [buying, setBuying] = useState(false);
  const [message, setMessage] = useState("");

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

  async function handleBuyTicket() {
    if (!event) return;

    try {
      setBuying(true);
      setMessage("");

      if (!isLoaded) return;

      if (!isSignedIn) {
        alert("Please sign in before purchasing tickets.");
        return;
      }

      await createTicket({
        eventId: event._id,
      });

      setMessage("Ticket purchased successfully.");
    } catch (error: any) {
      console.error(error);

      if (String(error?.message || "").includes("already have a ticket")) {
        setMessage("You already purchased a ticket for this event.");
      } else {
        setMessage("Something went wrong purchasing your ticket.");
      }
    } finally {
      setBuying(false);
    }
  }

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

  const organizer = organizerData?.organizer;
  const organizerName =
    organizer?.organizerName || organizer?.name || "Organizer";

  return (
    <main className="oc-page relative min-h-screen overflow-hidden text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-18%] top-[-10%] h-[420px] w-full lg:w-[420px] rounded-full bg-violet-600/20 blur-[120px]" />

        <div className="absolute right-[-15%] top-[20%] h-[70vh] sm:h-[520px] w-full sm:w-[520px] rounded-full bg-orange-500/15 blur-[140px]" />

        <div className="absolute bottom-[-20%] left-[20%] h-[70vh] sm:h-[520px] w-full sm:w-[520px] rounded-full bg-violet-500/10 blur-[150px]" />

        <div className="absolute inset-0 opacity-[0.03]">
          <div className="h-full w-full bg-[linear-gradient(to_right,rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.16)_1px,transparent_1px)] bg-[size:72px_72px]" />
        </div>

        <div className="absolute left-[15%] top-[25%] h-3 w-3 animate-pulse rounded-full bg-orange-300 shadow-[0_0_18px_rgba(251,146,60,.9)]" />

        <div className="absolute right-[18%] top-[38%] h-2 w-2 animate-pulse rounded-full bg-violet-300 shadow-[0_0_18px_rgba(167,139,250,.9)]" />
      </div>
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <Link href="/events" className="text-sm text-white/50 hover:text-white">
          ← Back to events
        </Link>

        <div className="mt-6 grid gap-5 sm:p-8 lg:grid-cols-[1.4fr_0.8fr]">
          <div>
            <div className="overflow-hidden max-w-full rounded-[1.5rem] sm:rounded-3xl border border-white/10 bg-white/[0.03]">
              <div className="relative flex h-[420px] items-center justify-center overflow-hidden bg-white/10">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />

                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-orange-500/10 z-10" />

                <div className="pointer-events-none absolute right-[-80px] top-[-80px] z-10 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />

                <div className="pointer-events-none absolute left-[-80px] bottom-[-80px] z-10 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />

                {/* FUNCTION HOUR WATERMARK */}
                <div className="absolute left-5 top-5 z-20">
                  <div className="rounded-full border border-white/10 bg-black/50 px-5 py-2 backdrop-blur-md shadow-[0_0_30px_rgba(139,92,246,0.18)]">
                    <span className="text-[11px] sm:text-xs font-black tracking-[0.35em]">
                      <span className="text-white">FUNCTION</span>
                      <span className="text-violet-500">HOUR</span>
                    </span>
                  </div>
                </div>

                <EventImage storageId={event.imageStorageId} />
              </div>

              <div className="p-4 sm:p-6">
                <p className="text-sm font-black uppercase tracking-[0.35em] text-violet-300/70">
                  Event Details
                </p>

                <h1 className="mt-3 max-w-4xl text-2xl sm:text-3xl sm:text-5xl leading-[1.05] sm:leading-tight font-black leading-[0.95] tracking-[-0.04em] sm:tracking-tight sm:text-6xl lg:text-7xl">
                  {event.name}
                </h1>

                <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/70">
                  {event.description}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="flex flex-wrap items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 min-h-11 py-3.5 sm:py-3 sm:py-2 text-[11px] sm:text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                    Live Event
                  </div>

                  <div className="flex flex-wrap items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 min-h-11 py-3.5 sm:py-3 sm:py-2 text-[11px] sm:text-xs font-black uppercase tracking-[0.22em] text-violet-200">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-violet-300" />
                    Crowd Active
                  </div>

                  <div className="flex flex-wrap items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-4 min-h-11 py-3.5 sm:py-3 sm:py-2 text-[11px] sm:text-xs font-black uppercase tracking-[0.22em] text-orange-100">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-orange-300" />
                    Function Hour Signal
                  </div>
                </div>

                <div className="mt-6 sm:mt-8 grid gap-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl md:grid-cols-1 sm:grid-cols-2">
                  <EventSignalCard
                    label="Date"
                    value={event.dateString || "Date pending"}
                  />
                  <EventSignalCard
                    label="Location"
                    value={event.location || "Location pending"}
                  />

                  {event.venueName && (
                    <EventSignalCard label="Venue" value={event.venueName} />
                  )}

                  {(event.city || event.state) && (
                    <EventSignalCard
                      label="City"
                      value={[event.city, event.state]
                        .filter(Boolean)
                        .join(", ")}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="relative mt-6 sm:mt-8 overflow-hidden rounded-[2.25rem] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.025] p-4 sm:p-6 shadow-2xl backdrop-blur-2xl sm:p-5 sm:p-8">
              <div className="pointer-events-none absolute right-[-80px] top-[-80px] h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />

              <div className="pointer-events-none absolute left-[-80px] bottom-[-80px] h-56 w-56 rounded-full bg-orange-500/10 blur-3xl" />

              <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between gap-5">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.35em] text-violet-300/70">
                    Hosted By
                  </p>
                  <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-[-0.04em] sm:tracking-tight">
                    {organizerName}
                  </h2>
                  {organizer?.bio && (
                    <p className="mt-2 line-clamp-2 max-w-xl text-white/60">
                      {organizer.bio}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-violet-300/20 bg-violet-500/10 px-3 py-1 text-[11px] sm:text-xs font-black text-violet-100">
                      Verified Organizer
                    </span>
                    <span className="rounded-full border border-orange-300/20 bg-orange-500/10 px-3 py-1 text-[11px] sm:text-xs font-black text-orange-100">
                      Function Hour Host
                    </span>
                  </div>
                </div>

                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.75rem] border border-violet-300/20 bg-zinc-900 text-2xl font-black shadow-[0_0_40px_rgba(139,92,246,0.18)]">
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
                className="mt-6 inline-flex rounded-2xl border border-white/10 bg-white/[0.04] px-5 min-h-11 py-3.5 sm:py-3 font-bold text-white transition hover:border-violet-400/30 hover:bg-white/[0.08]"
              >
                View Organizer Profile →
              </Link>

              <div className="mt-6 sm:mt-8">
                <VenueRules
                  age={event.ageRequirement || "21+"}
                  dressCode={
                    event.dressCode || "Upscale nightlife attire encouraged"
                  }
                  parking={
                    event.parkingInfo ||
                    "Street parking & nearby garages available"
                  }
                  entryPolicy={
                    event.entryNotes ||
                    (event as any).entryPolicy ||
                    "Government-issued ID required"
                  }
                  refundPolicy={
                    event.refundPolicy || "All sales final unless canceled"
                  }
                  reEntry={
                    (event as any).reEntryPolicy ||
                    "Re-entry allowed before midnight"
                  }
                />
              </div>

              <EventAnnouncements
                announcements={announcements}
              />
            </div>

            {savedCreative && savedCreative.length > 0 && (
              <div className="oc-card mt-6 sm:mt-8 p-4 sm:p-6 sm:p-5 sm:p-8">
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

            <div className="mt-6 sm:mt-8">
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
                  <Link
                    href={`/events/${event._id}/merch`}
                    className="rounded-2xl bg-gradient-to-r from-violet-600 to-orange-500 px-5 min-h-11 py-3.5 sm:py-3 text-sm font-black text-white"
                  >
                    Shop Merch →
                  </Link>
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
                            {item.inventory ?? 0} left
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
          </div>

          <aside className="sticky top-4 sm:p-6 h-fit overflow-hidden rounded-[2.25rem] border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.025] p-4 shadow-[0_0_90px_rgba(139,92,246,0.14)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute right-[-80px] top-[-80px] h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />

            <div className="pointer-events-none absolute left-[-80px] bottom-[-80px] h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />

            <div className="relative z-10">
              <p className="text-sm font-black uppercase tracking-[0.35em] text-violet-300/70">
                Tickets
              </p>

              <div className="mt-5 text-6xl font-black tracking-[-0.06em]">
                {startingPrice === null
                  ? "—"
                  : startingPrice > 0
                  ? `$${startingPrice.toLocaleString()}`
                  : "Free"}
              </div>

              <p className="mt-2 text-sm text-white/50">
                {event.totalTickets
                  ? `${event.totalTickets} total tickets`
                  : "Limited availability"}
              </p>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/35 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-[11px] sm:text-xs font-black uppercase tracking-[0.2em] text-white/35">
                  <span>Crowd Momentum</span>
                  <span>{event.ticketsSold || 0} sold</span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-orange-400 shadow-[0_0_20px_rgba(249,115,22,.35)]"
                    style={{
                      width: `${
                        event.totalTickets
                          ? Math.min(
                              100,
                              Math.round(
                                ((event.ticketsSold || 0) /
                                  event.totalTickets) *
                                  100,
                              ),
                            )
                          : event.ticketsSold
                            ? 35
                            : 8
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-6">
                {!isLoaded ? (
                  <button
                    disabled
                    className="w-full rounded-2xl bg-white px-5 py-4 font-black text-black opacity-50"
                  >
                    Loading...
                  </button>
                ) : !isSignedIn ? (
                  <SignInButton mode="modal">
                    <button className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-orange-500 px-5 py-4 font-black text-white shadow-[0_0_35px_rgba(139,92,246,0.35)]">
                      Sign in to Buy Ticket
                    </button>
                  </SignInButton>
                ) : alreadyPurchased ? (
                  <Link
                    href="/my-tickets"
                    className="block w-full rounded-2xl bg-green-500 px-5 py-4 text-center font-black text-black shadow-[0_0_30px_rgba(34,197,94,0.25)]"
                  >
                    Already Purchased — View Ticket
                  </Link>
                ) : (
                  <Link
                    href={`/events/${event._id}/checkout`}
                    className="block w-full rounded-2xl bg-gradient-to-r from-violet-500 to-orange-500 px-5 py-4 text-center font-black text-white shadow-[0_0_35px_rgba(139,92,246,0.35)] transition hover:scale-[1.01]"
                  >
                    Continue to Checkout
                  </Link>
                )}
              </div>

              {message && (
                <p className="mt-4 text-sm text-white/70">{message}</p>
              )}

              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/50 p-5 text-sm leading-relaxed text-white/55 backdrop-blur-xl">
                Your ticket will appear under{" "}
                <Link
                  prefetch={false}
                  href="/my-tickets"
                  className="text-white underline"
                >
                  My Tickets
                </Link>{" "}
                after purchase.
              </div>
            </div>
          </aside>
        </div>

        <section className="relative mt-6 sm:mt-8 overflow-hidden rounded-[2.25rem] border border-white/10 bg-gradient-to-br from-white/[0.055] to-white/[0.02] p-4 sm:p-6 shadow-2xl backdrop-blur-2xl sm:p-5 sm:p-8">
          <div className="pointer-events-none absolute right-[-90px] top-[-90px] h-60 w-60 rounded-full bg-violet-500/15 blur-3xl" />

          <div className="relative z-10">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-violet-300/70">
              Ticket Options
            </p>

            <h2 className="mt-2 text-2xl sm:text-3xl sm:text-4xl font-black tracking-[-0.04em] sm:tracking-tight">
              Choose Your Experience
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
              Pick the access level that matches your night, from standard
              admission to premium event experiences.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-1 sm:grid-cols-2">
              {ticketTypes === undefined ? (
                <div className="rounded-2xl border border-white/10 bg-black p-5 text-white/50">
                  Loading ticket options...
                </div>
              ) : ticketTypes.filter((ticket) => ticket.isActive !== false)
                  .length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black p-5 text-white/50">
                  Standard admission available.
                </div>
              ) : (
                ticketTypes
                  .filter((ticket) => ticket.isActive !== false)
                  .map((ticket) => {
                    const soldOut =
                      ticket.isSoldOut ||
                      ticket.salesPaused ||
                      (ticket.quantity &&
                        (ticket.sold ?? 0) >= ticket.quantity);

                    return (
                      <div
                        key={ticket._id}
                        className={`group relative overflow-hidden rounded-[2rem] border p-4 sm:p-6 transition duration-300 hover:-translate-y-1 ${
                          soldOut
                            ? "border-red-500/20 bg-red-500/5"
                            : "border-white/10 bg-black/60 backdrop-blur-xl hover:border-violet-400/30 hover:bg-zinc-950"
                        }`}
                      >
                        <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-700 group-hover:opacity-100">
                          <div className="absolute -left-1/2 top-0 h-full w-1/2 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_ease-in-out_infinite]" />
                        </div>

                        <div className="relative flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-2xl font-black tracking-[-0.04em] sm:tracking-tight">
                              {ticket.name}
                            </h3>

                            {ticket.description && (
                              <p className="mt-2 text-sm text-white/50">
                                {ticket.description}
                              </p>
                            )}
                          </div>

                          <p className="text-2xl sm:text-3xl font-black tracking-[-0.04em] sm:tracking-tight text-violet-200">
                            ${ticket.price}
                          </p>
                        </div>

                        {ticket.perks && ticket.perks.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {ticket.perks.map((perk) => (
                              <span
                                key={perk}
                                className="rounded-full border border-violet-300/20 bg-violet-500/15 px-3 py-1 text-[11px] sm:text-xs font-black text-violet-100"
                              >
                                {perk}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm text-white/45">
                            {ticket.quantity
                              ? `${Math.max(ticket.quantity - (ticket.sold ?? 0), 0)} left`
                              : "Available"}
                          </p>

                          {soldOut ? (
                            <span className="rounded-full bg-red-500 px-4 min-h-11 py-3.5 sm:py-3 sm:py-2 text-sm font-black text-white">
                              Sold Out
                            </span>
                          ) : (
                            <Link
                              href={`/events/${event._id}/checkout?ticketType=${ticket._id}`}
                              className="inline-flex min-h-11 items-center rounded-full bg-white px-4 py-3 text-sm font-black text-black transition hover:bg-violet-200"
                            >
                              Select tickets →
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {ticketAddOns &&
              ticketAddOns.filter((addOn) => addOn.isActive !== false).length >
                0 && (
                <div className="mt-6 sm:mt-8">
                  <p className="text-sm uppercase tracking-[0.25em] text-orange-400">
                    Add-ons
                  </p>

                  <div className="mt-4 grid gap-4 md:grid-cols-1 sm:grid-cols-2">
                    {ticketAddOns
                      .filter((addOn) => addOn.isActive !== false)
                      .map((addOn) => (
                        <div
                          key={addOn._id}
                          className="rounded-2xl border border-white/10 bg-black/55 p-5 backdrop-blur-xl transition hover:border-orange-300/30 hover:bg-white/[0.05]"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-black">{addOn.name}</h3>

                              {addOn.description && (
                                <p className="mt-2 text-sm text-white/50">
                                  {addOn.description}
                                </p>
                              )}

                              {addOn.isRequired && (
                                <p className="mt-3 text-[11px] sm:text-xs font-bold text-orange-300">
                                  Required add-on
                                </p>
                              )}
                            </div>

                            <p className="font-black">${addOn.price}</p>
                          </div>

                          {addOn.isSoldOut && (
                            <span className="mt-4 inline-flex rounded-full bg-red-500 px-3 py-1 text-[11px] sm:text-xs font-black text-white">
                              Sold Out
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
          </div>
          <div className="mt-6 flex justify-end">
            <NotificationPulse />
          </div>

          <div className="mt-6">
            <ShareEventButton
              eventId={event?._id || ""}
              title={event?.name}
              location={event?.location}
            />
          </div>
        </section>

        <section className="relative mt-6 sm:mt-8 overflow-hidden rounded-[2.25rem] border border-white/10 bg-gradient-to-br from-white/[0.055] to-white/[0.02] p-4 sm:p-6 shadow-2xl backdrop-blur-2xl sm:p-5 sm:p-8">
          <div className="pointer-events-none absolute left-[-90px] bottom-[-90px] h-60 w-60 rounded-full bg-orange-500/15 blur-3xl" />

          <div className="relative z-10">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-orange-300/70">
              Crowd Signal
            </p>

            <h2 className="mt-2 text-2xl sm:text-3xl sm:text-4xl font-black tracking-[-0.04em] sm:tracking-tight">
              Who’s Going
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
              See the crowd forming before doors open.
            </p>

            <div className="mt-5 rounded-[2rem] border border-white/10 bg-black/40 p-5 backdrop-blur-xl">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center">
                  {attendees?.slice(0, 6).map((attendee, index) => (
                    <div
                      key={attendee.id}
                      className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-black bg-zinc-900 text-lg font-black shadow-xl"
                      style={{ marginLeft: index === 0 ? 0 : -12 }}
                    >
                      {attendee.avatarUrl ? (
                        <img
                          src={attendee.avatarUrl}
                          alt={attendee.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        attendee.name.charAt(0).toUpperCase()
                      )}
                    </div>
                  ))}

                  {!attendees?.length && (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-violet-300/20 bg-violet-500/15 text-lg font-black text-violet-100">
                      OC
                    </div>
                  )}
                </div>

                <div className="sm:text-right">
                  <p className="text-2xl sm:text-3xl font-black tracking-[-0.04em] sm:tracking-tight">
                    {event.ticketsSold || 0}
                  </p>

                  <p className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-white/45">
                    Crowd Momentum
                  </p>
                </div>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-orange-500"
                  style={{
                    width: `${
                      event.totalTickets
                        ? Math.min(
                            100,
                            Math.round(
                              ((event.ticketsSold || 0) / event.totalTickets) *
                                100,
                            ),
                          )
                        : event.ticketsSold
                          ? 35
                          : 8
                    }%`,
                  }}
                />
              </div>

              <p className="mt-4 text-sm leading-relaxed text-white/55">
                See who’s attending, feel the momentum, and connect with the
                crowd before the event starts.
              </p>
            </div>
          </div>

        </section>

        <section className="relative mt-6 sm:mt-8 overflow-hidden rounded-[2.25rem] border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 sm:p-6 shadow-2xl backdrop-blur-2xl sm:p-5 sm:p-8">
          <div className="pointer-events-none absolute right-[-90px] top-[-90px] h-60 w-60 rounded-full bg-violet-500/15 blur-3xl" />

          <div className="relative z-10">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-violet-300/70">
              Refund Policy
            </p>

            <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-[-0.04em] sm:tracking-tight">
              Purchase Protection
            </h2>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/45 p-5 backdrop-blur-xl">
              <p className="text-base leading-relaxed text-white/75">
                {event.refundPolicy ||
                  "All sales are final unless otherwise stated by the event host."}
              </p>

              {event.refundDeadline && (
                <div className="mt-5">
                  <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-white/40">
                    Refund Deadline
                  </p>

                  <p className="mt-1 font-semibold text-white">
                    {event.refundDeadline}
                  </p>
                </div>
              )}

              {event.refundContactEmail && (
                <div className="mt-5">
                  <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-white/40">
                    Refund Contact
                  </p>

                  <a
                    href={`mailto:${event.refundContactEmail}`}
                    className="mt-1 inline-block font-semibold text-orange-400 hover:text-orange-300"
                  >
                    {event.refundContactEmail}
                  </a>
                </div>
              )}
            </div>
          </div>

        </section>

        <section className="relative mt-6 sm:mt-8 overflow-hidden rounded-[2.5rem] border border-orange-300/20 bg-gradient-to-r from-violet-500/15 via-white/[0.035] to-orange-500/15 p-7 shadow-[0_0_90px_rgba(249,115,22,0.12)] backdrop-blur-2xl sm:p-9">
          <div className="pointer-events-none absolute right-[-90px] top-[-90px] h-60 w-60 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="pointer-events-none absolute left-[-90px] bottom-[-90px] h-60 w-60 rounded-full bg-violet-500/20 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-black uppercase tracking-[0.32em] text-orange-200/70">
                Event Signal
              </p>

              <h2 className="mt-3 max-w-3xl text-2xl sm:text-3xl sm:text-4xl font-black tracking-[-0.04em] sm:tracking-tight sm:text-2xl sm:text-5xl">
                Don’t just hear about it later.
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
                Join the crowd before doors open. Tickets, merch, venue details,
                and event updates are all connected here.
              </p>
            </div>

            <Link
              href={`/events/${event._id}/checkout`}
              className="rounded-2xl bg-white px-6 py-4 text-center text-sm font-black uppercase tracking-wide text-black transition hover:bg-orange-200"
            >
              Secure Ticket →
            </Link>
          </div>

        </section>

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

          {!isLoaded ? (
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
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:border-orange-300/30 hover:bg-white/[0.055]">
      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition group-hover:opacity-100" />

      <p className="text-[11px] sm:text-xs uppercase tracking-[0.24em] text-white/35">
        {label}
      </p>

      <p className="mt-2 font-black text-white">{value}</p>
    </div>
  );
}
