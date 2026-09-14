"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  Church,
  Handshake,
  LayoutGrid,
  Music2,
  PartyPopper,
  Presentation,
  Sparkles,
  Trophy,
  Users,
  Utensils,
} from "lucide-react";

type EventsView = "all" | "mine";
export type QuickFilter = "" | "tonight" | "weekend";

type ExperienceHeroProps = {
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  category: string;
  setCategory: Dispatch<SetStateAction<string>>;
  city: string;
  setCity: Dispatch<SetStateAction<string>>;
  view: EventsView;
  setView: Dispatch<SetStateAction<EventsView>>;
  totalEvents: number;
  quickFilter: QuickFilter;
  setQuickFilter: Dispatch<SetStateAction<QuickFilter>>;
};

const categories = [
  { label: "All", icon: LayoutGrid },
  { label: "Concert", icon: Music2 },
  { label: "Reunion", icon: Users },
  { label: "Conference", icon: Presentation },
  { label: "Party", icon: PartyPopper },
  { label: "Religious", icon: Church },
  { label: "Festival", icon: Sparkles },
  { label: "Food", icon: Utensils },
  { label: "Networking", icon: Handshake },
  { label: "Sports", icon: Trophy },
];

const cities = [
  "All Cities",
  "New Orleans",
  "Baton Rouge",
  "Houston",
  "Atlanta",
  "Slidell",
  "Algiers",
];

const universeNodes = [
  {
    label: "Music",
    icon: "♪",
    position: "left-[16%] top-[3%]",
    size: "h-[92px] w-[92px]",
    background:
      "bg-[radial-gradient(circle_at_35%_30%,rgba(151,88,255,0.75),rgba(51,23,80,0.96)_58%,rgba(10,7,16,1))]",
  },
  {
    label: "Nightlife",
    icon: "▽",
    position: "right-[9%] top-[7%]",
    size: "h-[98px] w-[98px]",
    background:
      "bg-[radial-gradient(circle_at_35%_30%,rgba(193,91,58,0.72),rgba(83,36,29,0.96)_58%,rgba(12,7,7,1))]",
  },
  {
    label: "Festivals",
    icon: "✺",
    position: "left-[6%] top-[41%]",
    size: "h-[96px] w-[96px]",
    background:
      "bg-[radial-gradient(circle_at_35%_30%,rgba(166,118,45,0.72),rgba(66,44,16,0.96)_58%,rgba(10,8,5,1))]",
  },
  {
    label: "Arts",
    icon: "◉",
    position: "right-[22%] top-[48%]",
    size: "h-[94px] w-[94px]",
    background:
      "bg-[radial-gradient(circle_at_35%_30%,rgba(170,78,197,0.74),rgba(74,31,86,0.96)_58%,rgba(10,6,13,1))]",
  },
  {
    label: "Food",
    icon: "Ψ",
    position: "left-[28%] bottom-[3%]",
    size: "h-[94px] w-[94px]",
    background:
      "bg-[radial-gradient(circle_at_35%_30%,rgba(164,99,42,0.76),rgba(75,43,17,0.96)_58%,rgba(11,8,5,1))]",
  },
  {
    label: "Networking",
    icon: "◇",
    position: "right-[3%] bottom-[3%]",
    size: "h-[100px] w-[100px]",
    background:
      "bg-[radial-gradient(circle_at_35%_30%,rgba(75,101,190,0.75),rgba(31,43,91,0.96)_58%,rgba(7,8,15,1))]",
  },
];

export default function ExperienceHero({
  search,
  setSearch,
  category,
  setCategory,
  city,
  setCity,
  view,
  setView,
  totalEvents,
  quickFilter,
  setQuickFilter,
}: ExperienceHeroProps) {
  const resetFilters = () => {
    setSearch("");
    setCategory("All");
    setCity("All Cities");
    setView("all");
    setQuickFilter("");
  };

  const activateQuickFilter = (chip: string) => {
    if (chip === "Near Me") {
      window.location.assign("/map");
      return;
    }
    setView("all");
    if (chip === "Tonight") {
      setSearch("");
      setCategory("All");
      setQuickFilter(quickFilter === "tonight" ? "" : "tonight");
      return;
    }
    if (chip === "This Weekend") {
      setSearch("");
      setCategory("All");
      setQuickFilter(quickFilter === "weekend" ? "" : "weekend");
      return;
    }
    setQuickFilter("");
    if (chip === "Food" || chip === "Sports" || chip === "Networking") {
      setCategory(chip);
      setSearch("");
    } else {
      setCategory("All");
      setSearch(chip);
    }
  };

  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-black">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[9%] top-[-12rem] h-[34rem] w-[34rem] rounded-full bg-violet-600/20 blur-[140px]" />
        <div className="absolute right-[9%] top-[-8rem] h-[34rem] w-[34rem] rounded-full bg-orange-600/15 blur-[145px]" />
        <div className="absolute bottom-[-15rem] left-1/2 h-[28rem] w-[52rem] -translate-x-1/2 rounded-full bg-fuchsia-700/10 blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-[1240px] px-5 pb-7 pt-8 sm:px-7 lg:px-8 lg:pb-9 lg:pt-10">
        <div className="grid gap-9 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-violet-400/35 bg-violet-500/10 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.26em] text-violet-200 shadow-[0_0_28px_rgba(139,92,246,0.15)]">
              <span className="text-violet-300">✦</span>
              Discover experiences
            </div>

            <h1 className="mt-5 text-[3.7rem] font-black leading-[0.9] tracking-[-0.065em] text-white sm:text-[4.7rem] lg:text-[5.25rem]">
              Find your
              <span className="mt-1 block bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-400 bg-clip-text text-transparent">
                next event.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-[15px] leading-7 text-zinc-300 sm:text-base">
              Search concerts, festivals, nightlife, pop-ups, networking events,
              and local experiences.
            </p>

            <div className="mt-7 max-w-[620px]">
  <div className="flex h-[68px] items-center rounded-[1.5rem] border border-violet-400/40 bg-black/75 p-2 shadow-[0_0_40px_rgba(139,92,246,0.22)] backdrop-blur-xl transition focus-within:border-violet-300">
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-lg text-violet-200">
      🔍
    </div>

    <input
      value={search}
      onChange={(event) => setSearch(event.target.value)}
      placeholder="Search events, artists, venues, neighborhoods..."
      className="flex-1 bg-transparent px-4 text-white outline-none placeholder:text-zinc-500"
    />

    {search ? (
      <button
        type="button"
        onClick={() => setSearch("")}
        className="rounded-xl px-4 py-2 text-sm font-bold text-zinc-400 transition hover:bg-white/10 hover:text-white"
      >
        Clear
      </button>
    ) : (
      <button
        type="button"
        onClick={() => document.getElementById("event-filters")?.scrollIntoView({ behavior: "smooth", block: "center" })}
        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-300"
      >
        Filters
      </button>
    )}
  </div>

  <div className="mt-5 flex flex-wrap gap-3">
    {[
      "Near Me",
      "Tonight",
      "This Weekend",
      "Music",
      "Comedy",
      "Food",
      "Sports",
      "Networking",
    ].map((chip) => (
      <button
        key={chip}
        type="button"
        onClick={() => activateQuickFilter(chip)}
        aria-pressed={(chip === "Tonight" && quickFilter === "tonight") || (chip === "This Weekend" && quickFilter === "weekend")}
        className={`rounded-full border px-4 py-2 text-sm font-medium transition hover:border-violet-400 hover:text-white ${
          (chip === "Tonight" && quickFilter === "tonight") || (chip === "This Weekend" && quickFilter === "weekend")
            ? "border-violet-400 bg-violet-500/25 text-white"
            : "border-white/10 bg-white/5 text-zinc-300 hover:bg-violet-500/10"
        }`}
      >
        {chip}
      </button>
    ))}
  </div>

  <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
    <span className="font-bold text-zinc-500">
      Trending
    </span>

    {[
      "Essence",
      "Jazz Fest",
      "Brunch",
      "Live Music",
      "Happy Hour",
    ].map((term) => (
      <button
        key={term}
        type="button"
        onClick={() => {
          setSearch(term);
          setCategory("All");
          setQuickFilter("");
          document.getElementById("event-results")?.scrollIntoView({ behavior: "smooth" });
        }}
        className="rounded-full bg-white/5 px-3 py-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
      >
        {term}
      </button>
    ))}
  </div>
</div>
          </div>

          <div className="relative mx-auto hidden h-[380px] w-full max-w-[630px] lg:block">
            <div className="absolute inset-[7%_3%_3%_4%] rounded-[50%] border border-violet-500/35 [transform:rotate(-9deg)]" />
            <div className="absolute inset-[14%_3%_8%_2%] rounded-[50%] border border-fuchsia-500/30 [transform:rotate(10deg)]" />
            <div className="absolute inset-[20%_9%_5%_10%] rounded-[50%] border border-orange-500/25 [transform:rotate(4deg)]" />
            <div className="absolute inset-[11%_11%_13%_16%] rounded-[50%] border border-violet-500/30 [transform:rotate(-18deg)]" />

            <div className="absolute left-[9%] top-[36%] h-3 w-3 rounded-full bg-violet-500 shadow-[0_0_20px_rgba(139,92,246,1)]" />
            <div className="absolute right-[9%] top-[24%] h-3 w-3 rounded-full bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,1)]" />
            <div className="absolute bottom-[17%] left-[20%] h-2.5 w-2.5 rounded-full bg-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,1)]" />

            <div className="absolute left-1/2 top-1/2 z-20 flex h-[150px] w-[150px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-[9px] border-black bg-[radial-gradient(circle_at_35%_28%,rgba(184,99,255,0.9),rgba(70,28,77,0.98)_48%,rgba(25,14,14,1)_76%)] text-center shadow-[0_0_75px_rgba(168,85,247,0.35)]">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-rose-400 text-xl">
                ✦
              </div>

              <span className="text-[9px] font-black uppercase tracking-[0.34em] text-zinc-300">
                Function
              </span>

              <span className="text-[21px] font-black leading-none text-white">
                HOUR
              </span>

              <span className="mt-3 text-[9px] font-black uppercase leading-tight tracking-[0.25em] text-orange-300">
                Experience
                <br />
                Universe
              </span>
            </div>

            {universeNodes.map((node) => (
              <div
                key={node.label}
                className={`absolute ${node.position} ${node.size} z-10 flex flex-col items-center justify-center rounded-full border border-white/15 ${node.background} text-center shadow-[0_0_35px_rgba(255,255,255,0.08)]`}
              >
                <span className="text-2xl text-white">{node.icon}</span>
                <span className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                  {node.label}
                </span>
              </div>
            ))}

            <div className="absolute bottom-[4%] right-[16%] z-20 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-xl">
              <span className="text-orange-400">⌖</span>
              Live around you
              <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-violet-200">
                {totalEvents}
              </span>
            </div>
          </div>
        </div>

        <div id="event-filters" className="mt-8 scroll-mt-28 overflow-hidden rounded-[1.65rem] border border-white/15 bg-white/[0.045] shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="grid grid-cols-5 gap-1 p-2 sm:grid-cols-10">
            {categories.map((item) => {
              const isActive = category === item.label;
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setCategory(item.label)}
                  className={`group flex min-h-[76px] flex-col items-center justify-center rounded-[1.15rem] px-2 py-3 text-center transition ${
                    isActive
                      ? "bg-gradient-to-br from-violet-600 to-violet-500 text-white shadow-[0_0_30px_rgba(124,58,237,0.38)]"
                      : "text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
                  <span className="mt-2 text-[11px] font-black">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-3 py-3">
            {cities.map((item) => {
              const isActive = city === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCity(item)}
                  className={`rounded-full border px-5 py-2.5 text-xs font-black transition ${
                    isActive
                      ? "border-violet-500 bg-violet-600 text-white shadow-[0_0_22px_rgba(124,58,237,0.28)]"
                      : "border-white/15 bg-white/[0.025] text-zinc-300 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {item}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setView(view === "mine" ? "all" : "mine")}
              className={`rounded-full border px-5 py-2.5 text-xs font-black transition ${
                view === "mine"
                  ? "border-orange-500 bg-orange-500/20 text-orange-200"
                  : "border-orange-500/45 bg-orange-500/5 text-orange-200 hover:bg-orange-500/15"
              }`}
            >
              My Events
            </button>

            {(search ||
              category !== "All" ||
              city !== "All Cities" ||
              view !== "all" ||
              quickFilter) && (
              <button
                type="button"
                onClick={resetFilters}
                className="ml-auto rounded-full px-4 py-2.5 text-xs font-bold text-zinc-500 transition hover:text-white"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
