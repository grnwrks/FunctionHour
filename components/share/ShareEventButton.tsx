"use client";

import { useState } from "react";

interface Props {
  eventId: string;
  title?: string;
  location?: string;
}

export default function ShareEventButton({
  eventId,
  title = "Check out this event",
  location,
}: Props) {
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/events/${eventId}`
      : "";

  const shareText = `${title}${location ? ` • ${location}` : ""}`;

  const shareEvent = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text: shareText, url });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={shareEvent}
      className="flex min-h-11 w-full items-center justify-center rounded-xl border border-white/15 px-4 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
    >
      {copied ? "Link copied" : "Share event"}
    </button>
  );
}
