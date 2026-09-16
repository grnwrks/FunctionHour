export type EventAnnouncement = {
  id: string;
  subject: string;
  body: string;
  publishedAt: number;
};

export default function EventAnnouncements({
  announcements,
}: {
  announcements: EventAnnouncement[] | undefined;
}) {
  if (!announcements?.length) {
    return null;
  }

  return (
    <section className="mt-5 border-t border-white/10 pt-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300/70">
        Organizer updates
      </p>
      <h2 className="mt-2 text-xl font-black tracking-tight">
        Latest announcements
      </h2>

      <div className="mt-4 space-y-3">
        {announcements.map((announcement) => (
          <article key={announcement.id} className="rounded-xl bg-black/30 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <h3 className="font-black text-white">{announcement.subject}</h3>
              <time
                dateTime={new Date(announcement.publishedAt).toISOString()}
                className="shrink-0 text-[10px] font-bold text-white/30"
              >
                {formatPublishedDate(announcement.publishedAt)}
              </time>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-white/55">
              {announcement.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function formatPublishedDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}
