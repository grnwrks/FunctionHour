import type { Metadata } from "next";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getConvexClient } from "@/lib/convex";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const event = await getConvexClient().query(api.events.getById, {
      eventId: id as Id<"events">,
    });

    if (!event) return { title: "Event Not Found" };

    const title = event.name || "Function Hour Event";
    const description = event.description || `View ${title} on Function Hour.`;
    const canonical = `/events/${id}`;

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        type: "website",
        title,
        description,
        url: canonical,
        images: event.imageUrl ? [{ url: event.imageUrl, alt: title }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: event.imageUrl ? [event.imageUrl] : undefined,
      },
    };
  } catch {
    return { title: "Event", alternates: { canonical: `/events/${id}` } };
  }
}

export default function EventLayout({ children }: { children: React.ReactNode }) {
  return children;
}
