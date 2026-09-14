"use client";

import { useRef } from "react";
import Link from "next/link";
import EventImage from "./EventImage";
import { formatEventDate, getEventLocation, type DiscoveryEvent } from "../eventPresentation";
import type { Id } from "@/convex/_generated/dataModel";

type Props = {
  city: string;
  events: DiscoveryEvent[];
  savedEventIds: Id<"events">[];
  onToggleSave: (id: Id<"events">) => void;
};

export default function TrendingCarousel({
  city,
  events,
  savedEventIds,
  onToggleSave,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: direction === "right" ? 360 : -360,
      behavior: "smooth",
    });
  };

  return (
    <section id="event-results" className="mx-auto max-w-[1240px] px-5 py-10 sm:px-7 lg:px-8">
      <div className="mb-6 flex items-end justify-between gap-6">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-violet-300">
            Trending Near You
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-white sm:text-3xl">
            Experiences people are watching.
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            {city === "All Cities" ? "Popular across Function Hour" : city}
          </p>
        </div>

        <div className="hidden gap-2 sm:flex">
          <button type="button" aria-label="Scroll trending events left" onClick={() => scroll("left")} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10">
            ←
          </button>
          <button type="button" aria-label="Scroll trending events right" onClick={() => scroll("right")} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10">
            →
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-5 scrollbar-hide sm:-mx-7 sm:px-7 lg:mx-0 lg:px-0">
        {events.map((event) => {
          const isSaved = savedEventIds.includes(event._id);
          const price = Number(event.startingPrice ?? event.price ?? 0);

          return (
            <article key={event._id} className="group min-w-[280px] max-w-[280px] snap-start overflow-hidden rounded-[1.35rem] border border-white/10 bg-zinc-950 transition duration-300 hover:-translate-y-1 hover:border-violet-400/45 sm:min-w-[310px] sm:max-w-[310px]">
              <div className="relative h-[190px] overflow-hidden">
                <Link href={`/events/${event._id}`}>
                  <EventImage storageId={event.imageStorageId} />
                </Link>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/15" />
                <button type="button" aria-label={isSaved ? "Remove saved event" : "Save event"} onClick={() => onToggleSave(event._id)} className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border text-lg backdrop-blur-xl ${isSaved ? "border-violet-300 bg-violet-600 text-white" : "border-white/20 bg-black/55 text-white hover:bg-white hover:text-black"}`}>
                  {isSaved ? "♥" : "♡"}
                </button>
              </div>

              <div className="p-4">
                <p className="truncate text-xs font-bold uppercase tracking-[0.12em] text-orange-300">
                  {formatEventDate(event)}
                </p>
                <Link href={`/events/${event._id}`}>
                  <h3 className="mt-2 line-clamp-2 min-h-[52px] text-xl font-black leading-tight tracking-[-0.025em] text-white">
                    {event.name || "Untitled event"}
                  </h3>
                </Link>
                <p className="mt-3 truncate text-sm text-zinc-400">{getEventLocation(event)}</p>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                  <p className="text-lg font-black text-white">{price > 0 ? `From $${price.toLocaleString()}` : "Free"}</p>
                  <Link href={`/events/${event._id}`} className="rounded-full bg-white px-4 py-2 text-xs font-black text-black">
                    View event
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
