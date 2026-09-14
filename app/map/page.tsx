"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { ArrowLeft, List, RotateCcw, Search } from "lucide-react";
import { api } from "@/convex/_generated/api";
import MapCanvas, { type MapEvent, type TimeMode } from "./components/MapCanvas";

const categories = ["All", "Music", "Nightlife", "Festival", "Food", "Networking", "Free"];

export default function MapPage() {
  const events = useQuery(api.events.getMapEvents);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [timeMode, setTimeMode] = useState<TimeMode>("all");

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    const term = search.trim().toLowerCase();
    return events.filter((event: MapEvent) => {
      const searchable = [event.name, event.description, event.location, event.venueName, event.venueAddress, event.city, event.state]
        .filter(Boolean).join(" ").toLowerCase();
      if (term && !searchable.includes(term)) return false;
      if (activeCategory === "Free") return Number(event.price ?? 0) <= 0;
      return activeCategory === "All" || searchable.includes(activeCategory.toLowerCase());
    });
  }, [activeCategory, events, search]);

  const resetFilters = () => {
    setSearch("");
    setActiveCategory("All");
    setTimeMode("all");
  };

  return (
    <main className="relative h-[100dvh] overflow-hidden bg-black text-white">
      <MapCanvas events={filteredEvents} timeMode={timeMode} />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 p-3 sm:p-5">
        <Link href="/" aria-label="Back to Function Hour home" className="pointer-events-auto inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-black/80 px-4 py-2 text-sm font-black shadow-xl backdrop-blur-xl transition hover:bg-zinc-900">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Function Hour</span><span className="sm:hidden">Home</span>
        </Link>
        <Link href="/events" className="pointer-events-auto inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-black/80 px-4 py-2 text-sm font-black shadow-xl backdrop-blur-xl transition hover:bg-zinc-900">
          <List className="h-4 w-4" aria-hidden="true" />List view
        </Link>
      </header>

      <section className="absolute left-3 right-3 top-16 z-20 rounded-3xl border border-white/15 bg-black/85 p-3 shadow-2xl backdrop-blur-2xl sm:left-5 sm:right-auto sm:top-20 sm:w-[390px] sm:p-5">
        <div className="hidden sm:block">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Explore the city</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Find events near you.</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Search by event, venue, neighborhood, or city.</p>
        </div>

        <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 sm:mt-4">
          <Search className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
          <span className="sr-only">Search events</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search events or places" className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-zinc-500" />
          {(search || activeCategory !== "All" || timeMode !== "all") && (
            <button type="button" onClick={resetFilters} aria-label="Reset map filters" className="rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </label>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {categories.map((category) => (
            <button key={category} type="button" onClick={() => setActiveCategory(category)}
              className={`min-h-10 shrink-0 rounded-full px-4 text-xs font-black transition ${activeCategory === category ? "bg-gradient-to-r from-violet-600 to-orange-500 text-white" : "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"}`}>
              {category}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-3 rounded-2xl border border-white/10 bg-white/5 p-1">
          {([["all", "Any date"], ["tonight", "Tonight"], ["weekend", "Weekend"]] as const).map(([value, label]) => (
            <button key={value} type="button" onClick={() => setTimeMode(value)}
              className={`min-h-10 rounded-xl px-2 text-[11px] font-black transition sm:text-xs ${timeMode === value ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}>
              {label}
            </button>
          ))}
        </div>

        <p className="mt-3 hidden text-xs font-bold text-zinc-400 sm:block">
          {events === undefined ? "Loading events…" : `${filteredEvents.length} event${filteredEvents.length === 1 ? "" : "s"} match your search`}
        </p>
      </section>
    </main>
  );
}
