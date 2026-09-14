"use client";

import Link from "next/link";
import EventImage from "./EventImage";
import { getEventTimestamp } from "../eventPresentation";

type DiscoveryEventCardProps = {
  event: any;
  isSaved: boolean;
  onToggleSave: () => void;
};

function getEventCategory(event: any) {
  return (
    event.category ||
    event.eventType ||
    event.type ||
    event.tags?.[0] ||
    "Experience"
  );
}

function getOrganizerName(event: any) {
  return (
    event.organizerName ||
    event.hostName ||
    event.creatorName ||
    event.organizer?.name ||
    null
  );
}

function getEventPrice(event: any) {
  const price = Number(event.startingPrice ?? event.price ?? 0);

  if (!Number.isFinite(price) || price <= 0) {
    return "Free";
  }

  return `$${price.toLocaleString()}`;
}

function getEventSchedule(event: any) {
  const timestamp = getEventTimestamp(event);
  if (!Number.isFinite(timestamp)) {
    return { date: event.dateString || event.formattedDate || "Date coming soon", time: "Time TBA" };
  }
  const date = new Intl.DateTimeFormat("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  }).format(new Date(timestamp));
  const hasTime = Boolean(event.eventDate) || /T\d{2}:\d{2}/.test(event.dateString || "");
  const time = hasTime
    ? new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(timestamp))
    : "Time TBA";
  return { date, time };
}

export default function DiscoveryEventCard({
  event,
  isSaved,
  onToggleSave,
}: DiscoveryEventCardProps) {
  const category = getEventCategory(event);
  const organizerName = getOrganizerName(event);
  const priceLabel = getEventPrice(event);

  const location =
    event.location ||
    event.venueName ||
    event.city ||
    "Location coming soon";

  const schedule = getEventSchedule(event);

  return (
    <article className="group relative overflow-hidden rounded-[1.65rem] border border-white/10 bg-[#0d0d11] shadow-[0_20px_60px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1.5 hover:border-violet-400/40 hover:shadow-[0_28px_80px_rgba(76,29,149,0.22)]">
      <div className="relative h-[230px] overflow-hidden bg-zinc-900">
        <Link
          href={`/events/${event._id}`}
          aria-label={`View ${event.name}`}
          className="block h-full"
        >
          <div className="h-full transition duration-500 group-hover:scale-[1.045]">
            <EventImage storageId={event.imageStorageId} />
          </div>
        </Link>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/5 to-black/25" />

        <div className="pointer-events-none absolute left-4 top-4 flex max-w-[calc(100%-5rem)] flex-wrap gap-2">
          <span className="rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-xl">
            {category}
          </span>

          {event.isFeatured && (
            <span className="rounded-full border border-orange-300/30 bg-orange-500/85 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-xl">
              Featured
            </span>
          )}
        </div>

        <button
          type="button"
          aria-label={isSaved ? "Remove saved event" : "Save event"}
          aria-pressed={isSaved}
          onClick={(clickEvent) => {
            clickEvent.preventDefault();
            clickEvent.stopPropagation();
            onToggleSave();
          }}
          className={`absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border text-xl shadow-lg backdrop-blur-xl transition duration-200 active:scale-90 ${
            isSaved
              ? "scale-105 border-violet-300/70 bg-violet-600 text-white"
              : "border-white/20 bg-black/55 text-white hover:scale-105 hover:bg-white hover:text-black"
          }`}
        >
          <span
            className={`transition-transform duration-200 ${
              isSaved ? "scale-110" : ""
            }`}
          >
            {isSaved ? "â¥" : "â¡"}
          </span>
        </button>

        <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <div className="max-w-[72%] rounded-xl border border-white/20 bg-black/85 px-3 py-2 text-white shadow-lg backdrop-blur-xl">
            <p className="truncate text-xs font-black leading-4">{schedule.date}</p>
            <p className="mt-0.5 text-[11px] font-bold text-violet-200">{schedule.time}</p>
          </div>

          <div
            className={`rounded-full px-3 py-2 text-xs font-black backdrop-blur-xl ${
              priceLabel === "Free"
                ? "bg-emerald-400 text-black"
                : "bg-white text-black"
            }`}
          >
            {priceLabel}
          </div>
        </div>
      </div>

      <div className="p-5">
        <Link href={`/events/${event._id}`} className="block">
          <h3 className="line-clamp-2 min-h-[58px] text-[1.35rem] font-black leading-[1.18] tracking-[-0.035em] text-white transition group-hover:text-violet-200">
            {event.name}
          </h3>
        </Link>

        <div className="mt-4 space-y-2">
          <p className="flex min-w-0 items-center gap-2 text-sm text-zinc-400">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs"
            >
              â
            </span>

            <span className="truncate">{location}</span>
          </p>

          {organizerName && (
            <p className="flex min-w-0 items-center gap-2 text-sm text-zinc-500">
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs"
              >
                â
              </span>

              <span className="truncate">Hosted by {organizerName}</span>
            </p>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
              Starting at
            </p>

            <p
              className={`mt-1 text-lg font-black ${
                priceLabel === "Free"
                  ? "text-emerald-300"
                  : "text-white"
              }`}
            >
              {priceLabel}
            </p>
          </div>

          <Link
            href={`/events/${event._id}`}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-black text-black transition duration-200 hover:scale-[1.03] hover:bg-violet-200 active:scale-95"
          >
            View event
            <span aria-hidden="true">â</span>
          </Link>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent opacity-0 transition group-hover:opacity-100" />
    </article>
  );
}
