"use client";

import { use } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import EventImage from "@/components/events/EventImage";
import { formatEventDate } from "@/app/events/eventPresentation";

export default function OrganizerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const data = useQuery(api.organizers.getOrganizerByUserId, {
    userId: id,
  });

  const isFollowing = useQuery(api.followedOrganizers.isFollowingOrganizer, {
    organizerUserId: id,
  });

  const followerCount = useQuery(api.followedOrganizers.getFollowerCount, {
    organizerUserId: id,
  });

  const toggleFollow = useMutation(
    api.followedOrganizers.toggleFollowOrganizer
  );

  if (data === undefined) {
    return (
      <main className="safe-x min-h-screen bg-black px-6 py-10 text-white">
        Loading organizer profile...
      </main>
    );
  }

  if (!data || !data.organizer) {
    return (
      <main className="safe-x min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-black">Organizer not found</h1>

          <Link
            href="/events"
            className="mt-6 inline-flex rounded-2xl bg-white px-5 py-3 font-bold text-black"
          >
            Browse Events
          </Link>
        </div>
      </main>
    );
  }

  const { organizer, events } = data;

  const displayName =
    organizer.organizerName || organizer.name || "Organizer";

  return (
    <main className="safe-x min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute right-[-10%] top-[10%] h-[420px] w-[420px] rounded-full bg-orange-500/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[30%] h-[520px] w-[520px] rounded-full bg-white/5 blur-[150px]" />
      </div>

      <section className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/70 shadow-2xl backdrop-blur-xl">
          <div
            className="relative h-[260px] overflow-hidden sm:h-[340px]"
            style={{
              backgroundImage: organizer.bannerUrl
                ? `url(${organizer.bannerUrl})`
                : "linear-gradient(135deg, #0f0f10, #27272a)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />

            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-6">
              <div className="flex items-end gap-5">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] border border-white/20 bg-zinc-900 text-4xl font-black shadow-2xl sm:h-36 sm:w-36">
                  {organizer.avatarUrl ? (
                    <img
                      src={organizer.avatarUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="pb-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
                      {displayName}
                    </h1>

                    {organizer.isVerifiedOrganizer && (
                      <div className="rounded-full border border-violet-300/30 bg-violet-500/20 px-4 py-1 text-xs font-black uppercase tracking-wider text-violet-100 backdrop-blur">
                        Verified Organizer
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-white/60">
                    <span>
                      {events.length} Event{events.length === 1 ? "" : "s"}
                    </span>

                    <span>•</span>

                    <span>
                      {followerCount ?? 0} Follower
                      {followerCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              </div>

              {organizer.isVerifiedOrganizer && <div className="hidden lg:flex lg:flex-col lg:items-end">
                <div className="rounded-3xl border border-white/10 bg-black/40 px-6 py-4 backdrop-blur-xl">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                    Organizer Rank
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-white">
                    Verified
                  </h2>
                </div>
              </div>}
            </div>
          </div>

          <div className="px-6 py-8">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => toggleFollow({ organizerUserId: id })}
                className={`rounded-2xl px-6 py-3 font-black transition ${
                  isFollowing
                    ? "bg-orange-500 text-black hover:bg-orange-400"
                    : "bg-white text-black hover:bg-zinc-200"
                }`}
              >
                {isFollowing ? "Following" : "Follow Organizer"}
              </button>

              <Link
                href="/events"
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 font-bold text-white hover:bg-white/[0.08]"
              >
                Discover Events
              </Link>
            </div>

            {organizer.bio && (
              <p className="mt-8 max-w-4xl text-lg leading-relaxed text-white/70">
                {organizer.bio}
              </p>
            )}

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Upcoming Events"
                value={events.length.toString()}
              />

              <StatCard
                label="Community Reach"
                value={`${followerCount ?? 0}`}
              />

              <StatCard
                label="Status"
                value={
                  organizer.isVerifiedOrganizer ? "Verified" : "Rising"
                }
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {organizer.website && (
                <a
                  href={organizer.website}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white/70 hover:bg-white/[0.06]"
                >
                  Website
                </a>
              )}

              {organizer.instagram && (
                <a
                  href={
                    organizer.instagram.startsWith("http")
                      ? organizer.instagram
                      : `https://instagram.com/${organizer.instagram.replace(
                          "@",
                          ""
                        )}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white/70 hover:bg-white/[0.06]"
                >
                  Instagram
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-violet-300/60">
              Curated by {displayName}
            </p>

            <h2 className="mt-2 text-4xl font-black tracking-tight">
              Upcoming Experiences
            </h2>
          </div>

          <Link
            href="/events"
            className="hidden rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white hover:bg-white/[0.08] md:inline-flex"
          >
            Explore More
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.03] p-10 text-white/50">
            No public events yet.
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event._id}
                href={`/events/${event._id}`}
                className="group overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/70 transition duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:bg-zinc-900"
              >
                <div className="relative h-56 overflow-hidden">
                  {event.imageStorageId ? (
                    <EventImage
                      storageId={event.imageStorageId}
                      alt={event.name}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-zinc-900 text-sm text-white/40">
                      No Image
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

                  <div className="absolute left-5 top-5 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-black uppercase tracking-wide text-white backdrop-blur">
                    Featured
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-2xl font-black tracking-tight">
                    {event.name}
                  </h3>

                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-white/60">
                    {event.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3 text-sm text-white/50">
                    <span>{event.location}</span>
                    <span>•</span>
                    <span>{formatEventDate(event)}</span>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black">
                      {(event.startingPrice ?? event.price)
                        ? `From $${event.startingPrice ?? event.price}`
                        : "Free RSVP"}
                    </div>

                    <div className="text-sm font-bold text-violet-200 transition group-hover:text-white">
                      View Event →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.25em] text-white/40">
        {label}
      </p>

      <h3 className="mt-3 text-3xl font-black tracking-tight">
        {value}
      </h3>
    </div>
  );
}
