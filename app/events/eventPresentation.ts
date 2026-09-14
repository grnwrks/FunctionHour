import type { Id } from "@/convex/_generated/dataModel";

export type DiscoveryEvent = {
  _id: Id<"events">;
  name?: string;
  description?: string;
  category?: string;
  location?: string;
  venueName?: string;
  venueAddress?: string;
  city?: string;
  state?: string;
  dateString?: string;
  eventDate?: number;
  price?: number;
  startingPrice?: number;
  ticketsSold?: number;
  totalTickets?: number;
  isPromoted?: boolean;
  promotionEndsAt?: number;
  featuredWeight?: number;
  createdAt?: number;
  organizerId?: string;
  userId?: string;
  imageStorageId?: Id<"_storage">;
  isFeatured?: boolean;
};

export function getEventTimestamp(event: DiscoveryEvent) {
  if (Number.isFinite(event.eventDate)) return Number(event.eventDate);
  if (!event.dateString) return NaN;
  return Date.parse(event.dateString);
}

export function formatEventDate(event: DiscoveryEvent) {
  const timestamp = getEventTimestamp(event);
  if (!Number.isFinite(timestamp)) return event.dateString || "Date coming soon";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function getEventLocation(event: DiscoveryEvent) {
  return (
    event.venueName ||
    event.venueAddress ||
    [event.city, event.state].filter(Boolean).join(", ") ||
    event.location ||
    "Location coming soon"
  );
}

export function isTonight(event: DiscoveryEvent) {
  const timestamp = getEventTimestamp(event);
  if (!Number.isFinite(timestamp)) return false;

  const eventDate = new Date(timestamp);
  const now = new Date();
  return (
    eventDate.getFullYear() === now.getFullYear() &&
    eventDate.getMonth() === now.getMonth() &&
    eventDate.getDate() === now.getDate()
  );
}

export function isThisWeekend(event: DiscoveryEvent) {
  const timestamp = getEventTimestamp(event);
  if (!Number.isFinite(timestamp)) return false;

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const daysUntilFriday = (5 - start.getDay() + 7) % 7;
  start.setDate(start.getDate() + daysUntilFriday);

  const end = new Date(start);
  end.setDate(end.getDate() + 3);

  const eventDate = new Date(timestamp);
  return eventDate >= start && eventDate < end;
}

export function matchesCollection(event: DiscoveryEvent, collection: string) {
  if (collection === "all") return true;
  if (collection === "weekend") return isThisWeekend(event);

  const text = [
    event.category,
    event.name,
    event.description,
    event.location,
    event.venueName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (collection === "culture") {
    return ["food", "festival", "art", "culture", "community", "reunion"].some((term) =>
      text.includes(term),
    );
  }

  if (collection === "connect") {
    return ["network", "conference", "meetup", "professional", "business"].some((term) =>
      text.includes(term),
    );
  }

  return true;
}

export function discoveryScore(event: DiscoveryEvent) {
  const sold = event.ticketsSold ?? 0;
  const total = event.totalTickets ?? 0;
  const ratio = total > 0 ? sold / total : 0;
  const promoted =
    event.isPromoted && (!event.promotionEndsAt || event.promotionEndsAt > Date.now())
      ? 50
      : 0;

  return promoted + (event.featuredWeight ?? 0) + sold * 2 + Math.round(ratio * 100);
}
