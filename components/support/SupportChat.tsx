"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  CalendarDays,
  Loader2,
  MapPin,
  MessageCircle,
  Send,
  Ticket,
  X,
} from "lucide-react";

type EventResult = {
  id: string;
  name: string;
  dateString?: string;
  eventDate: number;
  venueName?: string;
  location?: string;
  city?: string;
  state?: string;
  startingPrice: number;
  url: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  events?: EventResult[];
};

type SupportResponse = {
  answer: string;
  suggestedPrompts: string[];
  escalationRecommended: boolean;
  events: EventResult[];
};

const initialMessage: ChatMessage = {
  role: "assistant",
  content:
    "Hi — I’m Function Hour Help. I can help you find events, understand your tickets, and navigate the platform.",
};

const defaultPrompts = [
  "Find events this weekend",
  "Where are my tickets?",
  "How do refunds work?",
];

function formatEventDate(event: EventResult) {
  if (event.dateString?.trim()) return event.dateString;

  const date = new Date(event.eventDate);
  if (!Number.isFinite(date.getTime())) return "Date available on event page";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatLocation(event: EventResult) {
  const cityState = [event.city, event.state].filter(Boolean).join(", ");
  return event.venueName || cityState || event.location || "See event page";
}

function formatPrice(price: number) {
  if (!Number.isFinite(price) || price <= 0) return "See pricing";
  return `From $${price.toFixed(price % 1 === 0 ? 0 : 2)}`;
}

export default function SupportChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [suggestedPrompts, setSuggestedPrompts] = useState(defaultPrompts);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [escalationRecommended, setEscalationRecommended] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, loading]);

  const historyForApi = useMemo(
    () =>
      messages
        .filter((message) => message !== initialMessage)
        .map(({ role, content }) => ({ role, content }))
        .slice(-11),
    [messages],
  );

  async function sendMessage(rawMessage: string) {
    const text = rawMessage.trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    const nextHistory = [
      ...historyForApi,
      { role: userMessage.role, content: userMessage.content },
    ].slice(-12);

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);
    setSuggestedPrompts([]);
    setEscalationRecommended(false);

    try {
      const response = await fetch("/api/ai/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextHistory,
          currentPath: pathname || "/",
        }),
      });

      const payload = (await response.json()) as
        | SupportResponse
        | { error?: string };

      if (!response.ok || !("answer" in payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Support assistant request failed.",
        );
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: payload.answer,
          events: payload.events,
        },
      ]);
      setSuggestedPrompts(payload.suggestedPrompts);
      setEscalationRecommended(payload.escalationRecommended);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Function Hour Help is unavailable right now.";

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: `${message} You can also review your tickets in My Tickets or the Refund Policy for purchase questions.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <div className="fixed bottom-5 right-5 z-[70] sm:bottom-6 sm:right-6">
      {open ? (
        <section
          aria-label="Function Hour Help"
          className="mb-3 flex h-[min(620px,calc(100vh-7rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-950"
        >
          <header className="flex items-center justify-between border-b border-black/10 px-4 py-3 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-2xl bg-black text-white dark:bg-white dark:text-black">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                  Function Hour Help
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Support + event discovery
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-900 dark:hover:text-white"
              aria-label="Close Function Hour Help"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </header>

          <div
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
            aria-live="polite"
          >
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className="space-y-2">
                <div
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[86%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
                      message.role === "user"
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>

                {message.events?.length ? (
                  <div className="space-y-2">
                    {message.events.map((event) => (
                      <Link
                        key={event.id}
                        href={event.url}
                        className="block rounded-2xl border border-black/10 bg-white p-3 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                        onClick={() => setOpen(false)}
                      >
                        <p className="line-clamp-2 text-sm font-semibold text-zinc-950 dark:text-white">
                          {event.name}
                        </p>
                        <div className="mt-2 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                          <p className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>{formatEventDate(event)}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                            <span className="line-clamp-1">{formatLocation(event)}</span>
                          </p>
                          <p className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-200">
                            <Ticket className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>{formatPrice(event.startingPrice)}</span>
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}

            {loading ? (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-zinc-100 px-3.5 py-2.5 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Checking Function Hour…
                </div>
              </div>
            ) : null}

            {escalationRecommended ? (
              <div className="rounded-2xl border border-amber-300/70 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100">
                This looks like an issue that may need manual review. Have your
                order/event details ready when contacting Function Hour support or
                the event organizer.
              </div>
            ) : null}

            <div ref={endRef} />
          </div>

          {suggestedPrompts.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto border-t border-black/5 px-4 py-3 dark:border-white/5">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  className="shrink-0 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-zinc-900"
                >
                  {prompt}
                </button>
              ))}
            </div>
          ) : null}

          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 border-t border-black/10 p-3 dark:border-white/10"
          >
            <label htmlFor="function-hour-support-input" className="sr-only">
              Ask Function Hour Help
            </label>
            <textarea
              id="function-hour-support-input"
              rows={1}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Try: R&B in Dallas Saturday under $40"
              className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-black/10 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 dark:border-white/10 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-600"
              maxLength={2000}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-black text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-black"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="ml-auto flex h-14 items-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white shadow-xl transition hover:scale-[1.02] dark:bg-white dark:text-black"
        aria-expanded={open}
        aria-label={open ? "Close Function Hour Help" : "Open Function Hour Help"}
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        <span>Help</span>
      </button>
    </div>
  );
}
