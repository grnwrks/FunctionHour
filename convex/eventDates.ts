type EventDateFields = {
  dateString?: string;
  eventDate?: number;
};

export function getEventEndTimestamp(event: EventDateFields) {
  if (event.dateString && /^\d{4}-\d{2}-\d{2}$/.test(event.dateString)) {
    return new Date(`${event.dateString}T23:59:59.999`).getTime();
  }

  if (Number.isFinite(event.eventDate)) return Number(event.eventDate);
  if (!event.dateString) return Number.NaN;
  return Date.parse(event.dateString);
}

export function isEventUpcoming(
  event: EventDateFields,
  referenceTime = Date.now(),
) {
  const timestamp = getEventEndTimestamp(event);
  return !Number.isFinite(timestamp) || timestamp >= referenceTime;
}

export function requireEventSalesOpen(event: EventDateFields) {
  if (!isEventUpcoming(event)) {
    throw new Error("Ticket sales have ended for this event.");
  }
}
