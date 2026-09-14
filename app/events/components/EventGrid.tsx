"use client";

import { Id } from "@/convex/_generated/dataModel";
import DiscoveryEventCard from "./DiscoveryEventCard";
import type { DiscoveryEvent } from "../eventPresentation";

type EventGridProps = {
  events: DiscoveryEvent[];
  savedEventIds: Id<"events">[];
  onToggleSave: (eventId: Id<"events">) => void;
};

export default function EventGrid({
  events,
  savedEventIds,
  onToggleSave,
}: EventGridProps) {
  return (
    <section
      id="all-experiences"
      className="mx-auto max-w-[1240px] px-5 pb-16 sm:px-7 lg:px-8"
    >
      <div className="mb-7 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-violet-300">
            All Experiences
          </p>

          <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
            Keep exploring.
          </h2>
        </div>

        <p className="text-sm text-zinc-500">
          {events.length} event{events.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <DiscoveryEventCard
            key={event._id}
            event={event}
            isSaved={savedEventIds.includes(event._id)}
            onToggleSave={() => onToggleSave(event._id)}
          />
        ))}
      </div>
    </section>
  );
}
