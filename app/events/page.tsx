"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import OrganizerPortalLink from "@/components/OrganizerPortalLink";
import ExperienceHero from "./components/ExperienceHero";
import TrendingCarousel from "./components/TrendingCarousel";
import DiscoveryCollections from "./components/DiscoveryCollections";
import LiveMapSection from "./components/LiveMapSection";
import FeaturedHosts from "./components/FeaturedHosts";
import EventGrid from "./components/EventGrid";
import {
  discoveryScore,
  matchesCollection,
  type DiscoveryEvent,
} from "./eventPresentation";

function eventMatchesCategory(event: DiscoveryEvent, category: string) {
  if (category === "All") return true;
  const text = [event.category, event.name, event.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return text.includes(category.toLowerCase());
}

function eventMatchesCity(event: DiscoveryEvent, city: string) {
  if (city === "All Cities") return true;
  const text = [event.city, event.state, event.location, event.venueName, event.venueAddress]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return text.includes(city.toLowerCase());
}

function eventMatchesSearch(event: DiscoveryEvent, search: string) {
  const query = search.trim().toLowerCase();
  if (!query) return true;

  return [
    event.name,
    event.description,
    event.category,
    event.location,
    event.venueName,
    event.venueAddress,
    event.city,
    event.state,
    event.dateString,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(query);
}

export default function EventsPage() {
  const [activeCollection, setActiveCollection] = useState("all");
  const [view, setView] = useState<"all" | "mine">("all");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [city, setCity] = useState("All Cities");

  const events = useQuery(api.events.getAll, {});
  const myEvents = useQuery(api.events.getMyEvents);
  const savedEventIds = useQuery(api.savedEvents.getSavedEventIds) || [];
  const toggleSaved = useMutation(api.savedEvents.toggleSavedEvent);

  const organizerStats = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of events ?? []) {
      const organizerKey = event.organizerId || event.userId;
      if (!organizerKey) continue;
      counts.set(organizerKey, (counts.get(organizerKey) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([userId, eventCount]) => ({ userId, eventCount }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 6);
  }, [events]);

  const displayedEvents = useMemo(() => {
    const baseEvents = (view === "mine" ? myEvents ?? [] : events ?? []) as DiscoveryEvent[];

    return baseEvents
      .filter((event) => eventMatchesCategory(event, category))
      .filter((event) => eventMatchesCity(event, city))
      .filter((event) => eventMatchesSearch(event, search))
      .filter((event) => matchesCollection(event, activeCollection))
      .sort((a, b) => {
        const scoreDifference = discoveryScore(b) - discoveryScore(a);
        if (scoreDifference !== 0) return scoreDifference;
        return (b.createdAt ?? 0) - (a.createdAt ?? 0);
      });
  }, [activeCollection, category, city, events, myEvents, search, view]);

  const trendingEvents = useMemo(
    () => displayedEvents.slice(0, Math.min(6, displayedEvents.length)),
    [displayedEvents],
  );

  const trendingIds = useMemo(
    () => new Set(trendingEvents.map((event) => event._id)),
    [trendingEvents],
  );

  const gridEvents = useMemo(() => {
    const withoutTrending = displayedEvents.filter((event) => !trendingIds.has(event._id));
    return withoutTrending.length > 0 ? withoutTrending : displayedEvents;
  }, [displayedEvents, trendingIds]);

  async function toggleSavedEvent(eventId: Id<"events">) {
    try {
      await toggleSaved({ eventId });
    } catch (error) {
      console.error("Failed to toggle saved event:", error);
    }
  }

  if (events === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-lg">Loading events...</div>
      </main>
    );
  }

  return (
    <main className="safe-x min-h-screen overflow-x-hidden bg-black text-white">
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-black/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="shrink-0 text-2xl font-extrabold tracking-[0.02em]" aria-label="Function Hour home">
            <span className="text-white">FUNCTION</span>
            <span className="text-violet-500">HOUR</span>
          </Link>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
            <div className="hidden items-center gap-3 md:flex">
              <Link href="/events" className="rounded-full border border-zinc-700 px-4 py-2 text-sm hover:border-white">Events</Link>
              <Link href="/map" className="rounded-full border border-zinc-700 px-4 py-2 text-sm hover:border-white">Map</Link>
              <Link href="/recommendations" className="rounded-full border border-orange-400/20 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-100">AI picks</Link>

              <SignedOut>
                <Link href="/explore" className="rounded-full border border-zinc-700 px-4 py-2 text-sm hover:border-white">Explore</Link>
                <Link href="/cities" className="rounded-full border border-zinc-700 px-4 py-2 text-sm hover:border-white">Cities</Link>
                <SignInButton mode="modal">
                  <button className="rounded-full border border-orange-400/40 px-4 py-2 text-sm font-semibold text-orange-300">Become a Host</button>
                </SignInButton>
              </SignedOut>

              <SignedIn>
                <Link href="/saved-events" className="rounded-full border border-zinc-700 px-4 py-2 text-sm hover:border-white">Saved</Link>
                <Link prefetch={false} href="/my-tickets" className="rounded-full border border-zinc-700 px-4 py-2 text-sm hover:border-white">My Tickets</Link>
                <OrganizerPortalLink className="rounded-full border border-zinc-700 px-4 py-2 text-sm hover:border-white" />
              </SignedIn>
            </div>

            <SignedOut>
              <SignInButton mode="modal">
                <button className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black sm:px-5">Sign In</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/events" />
            </SignedIn>
          </div>
        </div>

        <div className="border-t border-zinc-900 px-4 py-3 md:hidden">
          <div className="flex gap-3 overflow-x-auto pb-1">
            <Link href="/events" className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">Events</Link>
            <Link href="/map" className="shrink-0 rounded-full border border-zinc-700 px-4 py-2 text-sm">Map</Link>
            <Link href="/recommendations" className="shrink-0 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-sm text-orange-200">AI picks</Link>
            <SignedIn>
              <Link href="/saved-events" className="shrink-0 rounded-full border border-zinc-700 px-4 py-2 text-sm">Saved</Link>
              <Link prefetch={false} href="/my-tickets" className="shrink-0 rounded-full border border-zinc-700 px-4 py-2 text-sm">My Tickets</Link>
              <OrganizerPortalLink organizerLabel="Host" className="shrink-0 rounded-full border border-zinc-700 px-4 py-2 text-sm" />
            </SignedIn>
          </div>
        </div>
      </nav>

      <ExperienceHero
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
        city={city}
        setCity={setCity}
        view={view}
        setView={setView}
        totalEvents={displayedEvents.length}
      />

      {trendingEvents.length > 0 && (
        <TrendingCarousel
          city={city}
          events={trendingEvents}
          savedEventIds={savedEventIds}
          onToggleSave={toggleSavedEvent}
        />
      )}

      <DiscoveryCollections activeCollection={activeCollection} onSelect={setActiveCollection} />
      <LiveMapSection nearbyCount={displayedEvents.length} />
      <FeaturedHosts organizerStats={organizerStats} />

      {displayedEvents.length > 0 ? (
        <EventGrid
          events={gridEvents}
          savedEventIds={savedEventIds}
          onToggleSave={toggleSavedEvent}
        />
      ) : (
        <section className="mx-auto max-w-[1240px] px-5 pb-20 sm:px-7 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-10 text-center">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-orange-300">No matches</p>
            <h2 className="mt-3 text-3xl font-black">Try a broader search or another collection.</h2>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("All");
                setCity("All Cities");
                setActiveCollection("all");
                setView("all");
              }}
              className="mt-6 rounded-full bg-white px-6 py-3 text-sm font-black text-black"
            >
              Reset discovery
            </button>
          </div>
        </section>
      )}

      <footer className="border-t border-zinc-900 px-6 py-10 text-center text-sm text-zinc-500">
        <p className="font-black tracking-[0.25em] text-white">FUNCTION<span className="text-violet-500">HOUR</span></p>
        <p className="mt-4">© 2026 Function Hour. All rights reserved.</p>
      </footer>
    </main>
  );
}
