"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";
import Map, {
  Marker,
  NavigationControl,
  Popup,
  type ViewState,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

export type MapEvent = {
  _id: string;
  name?: string;
  description?: string;
  location?: string;
  venueName?: string;
  venueAddress?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  dateString?: string;
  eventDate?: number;
  price?: number;
  imageUrl?: string | null;
};

export type TimeMode = "all" | "tonight" | "weekend";

const DEFAULT_VIEW: ViewState = {
  longitude: -90.0715,
  latitude: 29.9511,
  zoom: 10,
  bearing: 0,
  pitch: 0,
  padding: { top: 0, bottom: 0, left: 0, right: 0 },
};

const timestamp = (event: MapEvent) =>
  event.eventDate ?? (event.dateString ? Date.parse(event.dateString) : NaN);

function formatDate(event: MapEvent) {
  const raw = timestamp(event);
  if (!Number.isFinite(raw)) return event.dateString || "Date coming soon";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(raw));
}

function locationLabel(event: MapEvent) {
  return (
    event.venueName ||
    event.venueAddress ||
    [event.city, event.state].filter(Boolean).join(", ") ||
    event.location ||
    "Location coming soon"
  );
}

function matchesTime(event: MapEvent, mode: TimeMode) {
  if (mode === "all") return true;
  const raw = timestamp(event);
  if (!Number.isFinite(raw)) return false;
  const date = new Date(raw);
  const now = new Date();
  if (mode === "tonight") {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + ((5 - start.getDay() + 7) % 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 3);
  return date >= start && date < end;
}

export default function MapCanvas({
  events = [],
  timeMode,
}: {
  events: MapEvent[];
  timeMode: TimeMode;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewState, setViewState] = useState<ViewState>(DEFAULT_VIEW);
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [mapSupported, setMapSupported] = useState<boolean | null>(null);

  const visibleEvents = useMemo(
    () => events.filter((event) => matchesTime(event, timeMode)),
    [events, timeMode],
  );
  const mappedEvents = useMemo(
    () =>
      visibleEvents.filter(
        (event) =>
          Number.isFinite(event.latitude) &&
          Number.isFinite(event.longitude) &&
          Math.abs(Number(event.latitude)) <= 90 &&
          Math.abs(Number(event.longitude)) <= 180,
      ),
    [visibleEvents],
  );
  const selectedEvent =
    mappedEvents.find((event) => event._id === selectedId) ?? null;
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const options = { failIfMajorPerformanceCaveat: true };
    const context = (canvas.getContext("webgl2", options) ||
      canvas.getContext("webgl", options)) as
      | WebGL2RenderingContext
      | WebGLRenderingContext
      | null;

    setMapSupported(Boolean(context));
    context?.getExtension("WEBGL_lose_context")?.loseContext();
  }, []);

  const focusEvent = (event: MapEvent) => {
    setSelectedId(event._id);
    setViewState((current) => ({
      ...current,
      longitude: Number(event.longitude),
      latitude: Number(event.latitude),
      zoom: Math.max(current.zoom, 12),
    }));
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setViewState((current) => ({
          ...current,
          longitude: coords.longitude,
          latitude: coords.latitude,
          zoom: 12,
        }));
        setLocationStatus("idle");
      },
      () => setLocationStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  if (!mapboxToken || mapSupported === false) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-950 p-6">
        <div className="max-w-md rounded-3xl border border-orange-400/20 bg-black/80 p-6 text-center">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">
            Map unavailable
          </p>
          <h2 className="mt-3 text-2xl font-black">Switch to the event list</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            This browser cannot safely load the interactive map right now. Every
            event is still available in list view.
          </p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/events"
            className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-black"
          >
            Browse event list
          </a>
        </div>
      </div>
    );
  }

  if (mapSupported === null) {
    return <div className="h-full bg-zinc-950" aria-label="Loading map" />;
  }

  return (
    <div className="relative h-full overflow-hidden bg-zinc-950">
      <Map
        {...viewState}
        onMove={(event) => setViewState(event.viewState)}
        onClick={() => setSelectedId(null)}
        onError={(event) => {
          const message = String(event.error?.message ?? event.error ?? "");
          if (/webgl|context/i.test(message)) setMapSupported(false);
        }}
        mapboxAccessToken={mapboxToken}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        attributionControl={false}
      >
        <NavigationControl position="bottom-right" showCompass={false} />
        {mappedEvents.map((event) => {
          const active = selectedId === event._id;
          return (
            <Marker
              key={event._id}
              longitude={Number(event.longitude)}
              latitude={Number(event.latitude)}
              anchor="bottom"
            >
              <button
                type="button"
                aria-label={`Show ${event.name || "event"}`}
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation();
                  focusEvent(event);
                }}
                className={`group relative grid h-11 w-11 place-items-center rounded-full border-2 border-black shadow-[0_0_24px_rgba(249,115,22,.65)] transition hover:scale-110 ${active ? "bg-violet-500" : "bg-orange-500"}`}
              >
                <MapPin className="h-5 w-5 text-white" aria-hidden="true" />
                {!active && (
                  <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-orange-400/25" />
                )}
              </button>
            </Marker>
          );
        })}

        {selectedEvent && (
          <Popup
            longitude={Number(selectedEvent.longitude)}
            latitude={Number(selectedEvent.latitude)}
            anchor="top"
            offset={14}
            closeOnClick={false}
            onClose={() => setSelectedId(null)}
            maxWidth="320px"
          >
            <article className="overflow-hidden rounded-2xl bg-zinc-950 text-white">
              {selectedEvent.imageUrl && (
                <img
                  src={selectedEvent.imageUrl}
                  alt=""
                  className="h-32 w-full object-cover"
                />
              )}
              <div className="p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                  {formatDate(selectedEvent)}
                </p>
                <h2 className="mt-2 line-clamp-2 text-lg font-black">
                  {selectedEvent.name || "Untitled event"}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
                  {locationLabel(selectedEvent)}
                </p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-sm font-bold">
                    {Number(selectedEvent.price ?? 0) > 0
                      ? `From $${Number(selectedEvent.price).toFixed(0)}`
                      : "Free"}
                  </span>
                  <Link
                    href={`/events/${selectedEvent._id}`}
                    className="rounded-full bg-white px-4 py-2 text-xs font-black text-black"
                  >
                    View event
                  </Link>
                </div>
              </div>
            </article>
          </Popup>
        )}
      </Map>

      <button
        type="button"
        onClick={useMyLocation}
        className="absolute bottom-40 right-3 z-10 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-black/85 px-4 text-xs font-black text-white shadow-xl backdrop-blur-xl hover:bg-zinc-900 sm:bottom-20 sm:right-5"
      >
        <LocateFixed
          className={`h-4 w-4 ${locationStatus === "loading" ? "animate-pulse text-orange-300" : ""}`}
          aria-hidden="true"
        />
        {locationStatus === "loading"
          ? "Locating…"
          : locationStatus === "error"
            ? "Location blocked"
            : "Near me"}
      </button>

      {mappedEvents.length === 0 && (
        <div className="absolute inset-x-3 bottom-36 z-10 rounded-2xl border border-white/10 bg-black/85 p-4 text-center text-sm text-zinc-300 backdrop-blur-xl sm:bottom-5 sm:left-auto sm:right-5 sm:max-w-sm">
          No mapped events match these filters. Try another category, date, or
          location.
        </div>
      )}

      {mappedEvents.length > 0 && (
        <div className="absolute inset-x-0 bottom-0 z-10 flex gap-3 overflow-x-auto border-t border-white/10 bg-black/80 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:hidden">
          {mappedEvents.slice(0, 10).map((event) => (
            <button
              key={event._id}
              type="button"
              onClick={() => focusEvent(event)}
              className={`min-w-[235px] rounded-2xl border p-3 text-left ${selectedId === event._id ? "border-orange-400 bg-orange-500/15" : "border-white/10 bg-zinc-950"}`}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">
                {formatDate(event)}
              </p>
              <p className="mt-1 line-clamp-1 font-black text-white">
                {event.name || "Untitled event"}
              </p>
              <p className="mt-1 line-clamp-1 text-xs text-zinc-400">
                {locationLabel(event)}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
