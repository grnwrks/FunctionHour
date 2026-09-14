"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import OrganizerPortalLink from "@/components/OrganizerPortalLink";
import ExperienceHero from "./events/components/ExperienceHero";
import EventGrid from "./events/components/EventGrid";
import TrendingCarousel from "./events/components/TrendingCarousel";
import { discoveryScore, type DiscoveryEvent } from "./events/eventPresentation";

function matches(event: DiscoveryEvent, search: string, category: string, city: string) {
  const searchable = [event.name, event.description, event.category, event.location, event.venueName, event.venueAddress, event.city, event.state, event.dateString]
    .filter(Boolean).join(" ").toLowerCase();
  return (!search.trim() || searchable.includes(search.trim().toLowerCase())) &&
    (category === "All" || searchable.includes(category.toLowerCase())) &&
    (city === "All Cities" || searchable.includes(city.toLowerCase()));
}

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [city, setCity] = useState("All Cities");
  const [view, setView] = useState<"all" | "mine">("all");
  const events = useQuery(api.events.getAll, {});
  const myEvents = useQuery(api.events.getMyEvents);
  const savedEventIds = useQuery(api.savedEvents.getSavedEventIds) || [];
  const toggleSaved = useMutation(api.savedEvents.toggleSavedEvent);

  const displayedEvents = useMemo(() => {
    const source = (view === "mine" ? myEvents ?? [] : events ?? []) as DiscoveryEvent[];
    return source.filter((event) => matches(event, search, category, city))
      .sort((a, b) => discoveryScore(b) - discoveryScore(a));
  }, [category, city, events, myEvents, search, view]);

  async function toggleSavedEvent(eventId: Id<"events">) {
    try { await toggleSaved({ eventId }); }
    catch (error) { console.error("Failed to toggle saved event:", error); }
  }

  return (
    <main className="safe-x min-h-screen overflow-x-hidden bg-black text-white">
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-black/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="shrink-0 text-2xl font-extrabold tracking-[0.02em]" aria-label="Function Hour home">
            <span className="text-white">FUNCTION</span><span className="text-violet-500">HOUR</span>
          </Link>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
            <div className="hidden items-center gap-3 md:flex">
              <Link href="/events" className="rounded-full border border-zinc-700 px-4 py-2 text-sm hover:border-white">Events</Link>
              <Link href="/map" className="rounded-full border border-zinc-700 px-4 py-2 text-sm hover:border-white">Map</Link>
              <Link href="/recommendations" className="rounded-full border border-orange-400/20 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-100">AI picks</Link>
              <SignedIn>
                <Link href="/saved-events" className="rounded-full border border-zinc-700 px-4 py-2 text-sm hover:border-white">Saved</Link>
                <Link href="/my-tickets" className="rounded-full border border-zinc-700 px-4 py-2 text-sm hover:border-white">My Tickets</Link>
                <OrganizerPortalLink className="rounded-full border border-zinc-700 px-4 py-2 text-sm hover:border-white" />
              </SignedIn>
            </div>
            <SignedOut><SignInButton mode="modal"><button className="shrink-0 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black">Sign In</button></SignInButton></SignedOut>
            <SignedIn><UserButton afterSignOutUrl="/" /></SignedIn>
          </div>
        </div>
        <div className="border-t border-zinc-900 px-4 py-3 md:hidden">
          <div className="flex gap-3 overflow-x-auto pb-1">
            <Link href="/events" className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">Events</Link>
            <Link href="/map" className="shrink-0 rounded-full border border-zinc-700 px-4 py-2 text-sm">Map</Link>
            <Link href="/recommendations" className="shrink-0 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-sm text-orange-200">AI picks</Link>
            <SignedIn><Link href="/saved-events" className="shrink-0 rounded-full border border-zinc-700 px-4 py-2 text-sm">Saved</Link><Link href="/my-tickets" className="shrink-0 rounded-full border border-zinc-700 px-4 py-2 text-sm">My Tickets</Link></SignedIn>
          </div>
        </div>
      </nav>

      <ExperienceHero search={search} setSearch={setSearch} category={category} setCategory={setCategory} city={city} setCity={setCity} view={view} setView={setView} totalEvents={displayedEvents.length} />

      {events === undefined ? (
        <section className="mx-auto max-w-[1240px] px-5 py-20 text-center text-zinc-400">Loading events…</section>
      ) : displayedEvents.length > 0 ? (
        <>
          <TrendingCarousel city={city} events={displayedEvents.slice(0, 6)} savedEventIds={savedEventIds} onToggleSave={toggleSavedEvent} />
          <EventGrid events={displayedEvents} savedEventIds={savedEventIds} onToggleSave={toggleSavedEvent} />
        </>
      ) : (
        <section className="mx-auto max-w-[1240px] px-5 py-16 sm:px-7 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-10 text-center">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-orange-300">No matches</p>
            <h2 className="mt-3 text-3xl font-black">Try another search, category, or city.</h2>
            <button type="button" onClick={() => { setSearch(""); setCategory("All"); setCity("All Cities"); setView("all"); }} className="mt-6 rounded-full bg-white px-6 py-3 text-sm font-black text-black">Reset discovery</button>
          </div>
        </section>
      )}

      <section className="border-y border-white/10 bg-white/[0.025] px-5 py-12 text-center">
        <h2 className="text-3xl font-black">Want the full discovery experience?</h2>
        <p className="mx-auto mt-3 max-w-xl text-zinc-400">Explore collections, hosts, the live map, and every Function Hour event.</p>
        <Link href="/events" className="mt-6 inline-flex min-h-12 items-center rounded-full bg-gradient-to-r from-violet-500 to-orange-500 px-7 font-black">Open all events →</Link>
      </section>
      <footer className="px-6 py-10 text-center text-sm text-zinc-500"><p className="font-black tracking-[0.25em] text-white">FUNCTION<span className="text-violet-500">HOUR</span></p><p className="mt-4">© 2026 Function Hour. All rights reserved.</p></footer>
    </main>
  );
}
