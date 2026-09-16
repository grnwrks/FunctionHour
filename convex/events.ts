import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireEventCapability } from "./eventAccess";
import { isEventUpcoming } from "./eventDates";

export type Metrics = {
  soldTickets: number;
  refundedTickets: number;
  revenue: number;
};

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("You must be signed in.");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

export const getImageUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const createEvent = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),

    location: v.optional(v.string()),

    // Maps + venue discovery
    venueName: v.optional(v.string()),
    venueAddress: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),

    dateString: v.optional(v.string()),
    eventDate: v.optional(v.float64()),

    price: v.optional(v.float64()),
    totalTickets: v.optional(v.float64()),

    imageStorageId: v.optional(v.id("_storage")),

    refundPolicy: v.optional(v.string()),
    refundDeadline: v.optional(v.string()),
    refundContactEmail: v.optional(v.string()),

    dressCode: v.optional(v.string()),
    ageRequirement: v.optional(v.string()),
    parkingInfo: v.optional(v.string()),
    entryNotes: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("You must be signed in.");
    }

    const [organizerProfileByClerk, organizerProfileByUserId, existingEvent] = await Promise.all([
      ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .first(),
      ctx.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
        .first(),
      ctx.db
        .query("events")
        .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
        .first(),
    ]);
    const organizerProfile = organizerProfileByClerk ?? organizerProfileByUserId;

    if (organizerProfile?.isOrganizer !== true && !existingEvent) {
      throw new Error("Complete organizer onboarding before creating an event.");
    }

    const eventId = await ctx.db.insert("events", {
      name: args.name,
      description: args.description ?? "",
      category: args.category ?? "",

      location: args.location ?? "",

      venueName: args.venueName ?? "",
      venueAddress: args.venueAddress ?? "",
      city: args.city ?? "",
      state: args.state ?? "",
      latitude: args.latitude,
      longitude: args.longitude,

      dateString: args.dateString ?? "",
      eventDate: args.eventDate ?? Date.now(),

      price: args.price ?? 0,
      totalTickets: args.totalTickets ?? 0,
      ticketsSold: 0,

      imageStorageId: args.imageStorageId,

      refundPolicy:
        args.refundPolicy ??
        "All sales are final unless otherwise stated by the event host.",
      refundDeadline: args.refundDeadline ?? "",
      refundContactEmail: args.refundContactEmail ?? "",

      dressCode: args.dressCode ?? "",
      ageRequirement: args.ageRequirement ?? "",
      parkingInfo: args.parkingInfo ?? "",
      entryNotes: args.entryNotes ?? "",

      userId: identity.subject,
      organizerId: identity.subject,

      createdAt: Date.now(),
    });

    return eventId;
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const events = (await ctx.db.query("events").collect()).filter((event) =>
      isEventUpcoming(event),
    );

    return await Promise.all(
      events.map(async (event) => {
        const [imageUrl, ticketTypes] = await Promise.all([
          event.imageStorageId
            ? ctx.storage.getUrl(event.imageStorageId)
            : Promise.resolve(null),
          ctx.db
            .query("ticketTypes")
            .withIndex("by_event", (q) => q.eq("eventId", event._id))
            .take(100),
        ]);

        const activeTicketPrices = ticketTypes
          .filter((ticketType) => ticketType.isActive !== false)
          .map((ticketType) => ticketType.price);

        const startingPrice =
          activeTicketPrices.length > 0
            ? Math.min(...activeTicketPrices)
            : (event.price ?? 0);

        return {
          ...event,
          imageUrl,
          startingPrice,
        };
      }),
    );
  },
});

export const getMapEvents = query({
  args: {},
  handler: async (ctx) => {
    const events = (await ctx.db.query("events").collect()).filter((event) =>
      isEventUpcoming(event),
    );

    return await Promise.all(
      events.map(async (event) => {
        const imageUrl = event.imageStorageId
          ? await ctx.storage.getUrl(event.imageStorageId)
          : null;

        return {
          _id: event._id,
          name: event.name,
          description: event.description,
          location: event.location,

          venueName: event.venueName,
          venueAddress: event.venueAddress,
          city: event.city,
          state: event.state,
          latitude: event.latitude,
          longitude: event.longitude,

          dateString: event.dateString,
          eventDate: event.eventDate,

          price: event.price,
          totalTickets: event.totalTickets,
          ticketsSold: event.ticketsSold,

          imageUrl,
        };
      }),
    );
  },
});

export const getById = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);

    if (!event) {
      return null;
    }

    const imageUrl = event.imageStorageId
      ? await ctx.storage.getUrl(event.imageStorageId)
      : null;

    return {
      ...event,
      imageUrl,
    };
  },
});

export const getMyEvents = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return [];
    }

    const events = await ctx.db
      .query("events")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();

    return await Promise.all(
      events.map(async (event) => {
        const imageUrl = event.imageStorageId
          ? await ctx.storage.getUrl(event.imageStorageId)
          : null;

        return {
          ...event,
          imageUrl,
        };
      }),
    );
  },
});

export const verifyOrganizerEventForServer = query({
  args: {
    serverSecret: v.string(),
    eventId: v.id("events"),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    if (
      !process.env.STRIPE_WEBHOOK_SHARED_SECRET ||
      args.serverSecret !== process.env.STRIPE_WEBHOOK_SHARED_SECRET
    )
      throw new Error("Unauthorized server request.");
    const event = await ctx.db.get(args.eventId);
    if (
      !event ||
      (event.userId !== args.clerkId && event.organizerId !== args.clerkId)
    )
      return null;
    return { eventId: event._id, name: event.name };
  },
});

export const getEventsByCity = query({
  args: {
    city: v.string(),
  },
  handler: async (ctx, args) => {
    const city = args.city.trim();

    const events = (await ctx.db
      .query("events")
      .withIndex("by_city", (q) => q.eq("city", city))
      .collect()).filter((event) => isEventUpcoming(event));

    return await Promise.all(
      events.map(async (event) => {
        const imageUrl = event.imageStorageId
          ? await ctx.storage.getUrl(event.imageStorageId)
          : null;

        return {
          ...event,
          imageUrl,
        };
      }),
    );
  },
});

export const getEventsByVenue = query({
  args: {
    venueName: v.string(),
  },
  handler: async (ctx, args) => {
    const venueName = args.venueName.trim();

    const events = await ctx.db
      .query("events")
      .withIndex("by_venueName", (q) => q.eq("venueName", venueName))
      .collect();

    return await Promise.all(
      events.map(async (event) => {
        const imageUrl = event.imageStorageId
          ? await ctx.storage.getUrl(event.imageStorageId)
          : null;

        return {
          ...event,
          imageUrl,
        };
      }),
    );
  },
});

export const updateEvent = mutation({
  args: {
    eventId: v.id("events"),

    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),

    location: v.optional(v.string()),

    venueName: v.optional(v.string()),
    venueAddress: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),

    dateString: v.optional(v.string()),
    eventDate: v.optional(v.float64()),

    price: v.optional(v.float64()),
    totalTickets: v.optional(v.float64()),

    imageStorageId: v.optional(v.id("_storage")),
    removeImage: v.optional(v.boolean()),

    refundPolicy: v.optional(v.string()),
    refundDeadline: v.optional(v.string()),
    refundContactEmail: v.optional(v.string()),

    dressCode: v.optional(v.string()),
    ageRequirement: v.optional(v.string()),
    parkingInfo: v.optional(v.string()),
    entryNotes: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    await requireEventCapability(ctx, args.eventId, "manage_event");

    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new Error("Event not found.");
    }

    await ctx.db.patch(args.eventId, {
      ...(args.name !== undefined && { name: args.name }),
      ...(args.description !== undefined && { description: args.description }),
      ...(args.category !== undefined && { category: args.category }),

      ...(args.location !== undefined && { location: args.location }),

      ...(args.venueName !== undefined && { venueName: args.venueName }),
      ...(args.venueAddress !== undefined && {
        venueAddress: args.venueAddress,
      }),
      ...(args.city !== undefined && { city: args.city }),
      ...(args.state !== undefined && { state: args.state }),
      ...(args.latitude !== undefined && { latitude: args.latitude }),
      ...(args.longitude !== undefined && { longitude: args.longitude }),

      ...(args.dateString !== undefined && { dateString: args.dateString }),
      ...(args.eventDate !== undefined && { eventDate: args.eventDate }),

      ...(args.price !== undefined && { price: args.price }),
      ...(args.totalTickets !== undefined && {
        totalTickets: args.totalTickets,
      }),

      ...(args.removeImage
        ? { imageStorageId: undefined }
        : args.imageStorageId !== undefined
          ? { imageStorageId: args.imageStorageId }
          : {}),

      ...(args.refundPolicy !== undefined && {
        refundPolicy: args.refundPolicy,
      }),
      ...(args.refundDeadline !== undefined && {
        refundDeadline: args.refundDeadline,
      }),
      ...(args.refundContactEmail !== undefined && {
        refundContactEmail: args.refundContactEmail,
      }),
    });

    const imageWasReplaced =
      args.imageStorageId !== undefined &&
      args.imageStorageId !== event.imageStorageId;

    if (
      event.imageStorageId &&
      (args.removeImage === true || imageWasReplaced)
    ) {
      await ctx.storage.delete(event.imageStorageId);
    }

    return args.eventId;
  },
});

export const deleteEvent = mutation({
  args: {
    eventId: v.id("events"),
    confirmationName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("You must be signed in.");
    }

    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new Error("Event not found.");
    }

    if (event.userId !== identity.subject) {
      throw new Error("You do not have permission to delete this event.");
    }

    if (args.confirmationName.trim() !== event.name.trim()) {
      throw new Error("Enter the event name exactly to confirm deletion.");
    }

    const [ticket, ticketOrder, merchOrder, boostOrder] = await Promise.all([
      ctx.db.query("tickets").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).first(),
      ctx.db.query("ticketOrders").withIndex("by_event_and_paidAt", (q) => q.eq("eventId", args.eventId)).first(),
      ctx.db.query("merchOrders").withIndex("by_eventId", (q) => q.eq("eventId", args.eventId)).first(),
      ctx.db.query("boostOrders").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).first(),
    ]);

    if (ticket || ticketOrder || merchOrder || boostOrder) {
      throw new Error(
        "This event has ticket, merchandise, or promotion history and cannot be permanently deleted."
      );
    }

    const [
      ticketTypes,
      ticketAddOns,
      teamMembers,
      compTickets,
      compAudit,
      creative,
      messages,
      discountCodes,
      ratings,
      waitingList,
      views,
      savedEvents,
      budgetItems,
      interactions,
      ticketReservations,
      merchReservations,
      products,
    ] = await Promise.all([
      ctx.db.query("ticketTypes").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).collect(),
      ctx.db.query("ticketAddOns").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).collect(),
      ctx.db.query("eventTeamMembers").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).collect(),
      ctx.db.query("compTickets").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).collect(),
      ctx.db.query("compTicketAudit").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).collect(),
      ctx.db.query("eventCreative").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).collect(),
      ctx.db.query("eventMessages").withIndex("by_event_created", (q) => q.eq("eventId", args.eventId)).collect(),
      ctx.db.query("discountCodes").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).collect(),
      ctx.db.query("eventRatings").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).collect(),
      ctx.db.query("waitingList").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).collect(),
      ctx.db.query("eventViews").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).collect(),
      ctx.db.query("savedEvents").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).collect(),
      ctx.db.query("budgetItems").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).collect(),
      ctx.db.query("eventInteractions").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).collect(),
      ctx.db.query("ticketCheckoutReservations").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).collect(),
      ctx.db.query("merchCheckoutReservations").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).collect(),
      ctx.db.query("merch").withIndex("by_eventId", (q) => q.eq("eventId", args.eventId)).collect(),
    ]);

    for (const product of products) {
      const variants = await ctx.db
        .query("merchVariants")
        .withIndex("by_merchId", (q) => q.eq("merchId", product._id))
        .collect();
      for (const variant of variants) await ctx.db.delete(variant._id);
      if (product.imageStorageId) await ctx.storage.delete(product.imageStorageId);
      await ctx.db.delete(product._id);
    }

    for (const reservation of merchReservations) {
      const reservationItems = await ctx.db
        .query("merchReservationItems")
        .withIndex("by_reservationId", (q) => q.eq("reservationId", reservation._id))
        .collect();
      for (const item of reservationItems) await ctx.db.delete(item._id);
    }

    const dependentRecords = [
      ...ticketTypes, ...ticketAddOns, ...teamMembers, ...compTickets, ...compAudit,
      ...creative, ...messages, ...discountCodes, ...ratings, ...waitingList,
      ...views, ...savedEvents, ...budgetItems, ...interactions,
      ...ticketReservations, ...merchReservations,
    ];

    for (const record of creative) {
      if (record.imageStorageId) await ctx.storage.delete(record.imageStorageId);
    }
    for (const record of dependentRecords) await ctx.db.delete(record._id);
    if (event.imageStorageId) await ctx.storage.delete(event.imageStorageId);
    await ctx.db.delete(args.eventId);

    return true;
  },
});

export const getEventDeletionImpact = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("You must be signed in.");
    const event = await ctx.db.get(args.eventId);
    if (!event || event.userId !== identity.subject) return null;

    const [tickets, ticketOrders, merchOrders, boostOrders] = await Promise.all([
      ctx.db.query("tickets").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).collect(),
      ctx.db.query("ticketOrders").withIndex("by_event_and_paidAt", (q) => q.eq("eventId", args.eventId)).collect(),
      ctx.db.query("merchOrders").withIndex("by_eventId", (q) => q.eq("eventId", args.eventId)).collect(),
      ctx.db.query("boostOrders").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).collect(),
    ]);
    const protectedRecords = tickets.length + ticketOrders.length + merchOrders.length + boostOrders.length;

    return {
      canDelete: protectedRecords === 0,
      tickets: tickets.length,
      ticketOrders: ticketOrders.length,
      merchOrders: merchOrders.length,
      boostOrders: boostOrders.length,
    };
  },
});

export const promoteEvent = mutation({
  args: {
    eventId: v.id("events"),
    promotionTier: v.optional(v.string()),
    durationDays: v.optional(v.float64()),
    featuredWeight: v.optional(v.float64()),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("You must be signed in.");
    }

    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new Error("Event not found.");
    }

    if (
      event.userId !== identity.subject &&
      event.organizerId !== identity.subject
    ) {
      throw new Error("You do not have permission to promote this event.");
    }

    const durationDays = args.durationDays ?? 7;
    const promotionTier = args.promotionTier ?? "spotlight";
    const featuredWeight = args.featuredWeight ?? 100;

    const currentWeight = event.featuredWeight ?? 0;

    if (event.isPromoted && currentWeight > featuredWeight) {
      throw new Error("This event already has a higher boost tier active.");
    }

    const amount =
      promotionTier === "city_takeover"
        ? 75
        : promotionTier === "weekend_push"
          ? 35
          : 15;

    await ctx.db.insert("boostOrders", {
      eventId: args.eventId,
      organizerId: identity.subject,

      tier: promotionTier,
      amount,

      status: "manual_activated",

      durationDays,
      featuredWeight,

      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.patch(args.eventId, {
      isPromoted: true,
      promotionTier,
      featuredWeight,

      promotionEndsAt: Date.now() + durationDays * 24 * 60 * 60 * 1000,
    });

    return true;
  },
});

export const unpromoteEvent = mutation({
  args: {
    eventId: v.id("events"),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("You must be signed in.");
    }

    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new Error("Event not found.");
    }

    if (
      event.userId !== identity.subject &&
      event.organizerId !== identity.subject
    ) {
      throw new Error("You do not have permission to update this event.");
    }

    await ctx.db.patch(args.eventId, {
      isPromoted: false,
      promotionTier: undefined,
      promotionEndsAt: undefined,
      featuredWeight: 0,
    });

    return true;
  },
});

export const getBoostOrdersForMyEvents = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return [];
    }

    return await ctx.db
      .query("boostOrders")
      .withIndex("by_organizer", (q) => q.eq("organizerId", identity.subject))
      .collect();
  },
});

export const activateBoostAfterPayment = mutation({
  args: {
    webhookSecret: v.string(),
    eventId: v.id("events"),
    tier: v.string(),
    durationDays: v.float64(),
    featuredWeight: v.float64(),
    stripeCheckoutSessionId: v.string(),
  },

  handler: async (ctx, args) => {
    if (args.webhookSecret !== process.env.STRIPE_WEBHOOK_SHARED_SECRET) {
      throw new Error("Unauthorized webhook activation.");
    }

    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new Error("Event not found.");
    }

    const amount =
      args.tier === "city_takeover"
        ? 75
        : args.tier === "weekend_push"
          ? 35
          : 15;

    await ctx.db.insert("boostOrders", {
      eventId: args.eventId,
      organizerId: event.organizerId || event.userId,
      tier: args.tier,
      amount,
      status: "paid",
      durationDays: args.durationDays,
      featuredWeight: args.featuredWeight,
      stripeCheckoutSessionId: args.stripeCheckoutSessionId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.patch(args.eventId, {
      isPromoted: true,
      promotionTier: args.tier,
      featuredWeight: args.featuredWeight,
      promotionEndsAt: Date.now() + args.durationDays * 24 * 60 * 60 * 1000,
    });

    return true;
  },
});

export const seedBoostTestEvent = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.insert("events", {
      name: "Test Boost Event",
      description: "Testing Function Hour boost checkout",
      category: "Party",
      location: "New Orleans, LA",
      dateString: "2026-06-30",
      eventDate: 1782777600000,
      price: 20,
      totalTickets: 100,
      ticketsSold: 0,
      userId: "local-test-organizer",
      organizerId: "local-test-organizer",
      createdAt: Date.now(),
    });
  },
});

export const getTrendingEvents = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("events").collect();

    const enriched = await Promise.all(
      events.map(async (event) => {
        const imageUrl = event.imageStorageId
          ? await ctx.storage.getUrl(event.imageStorageId)
          : null;

        const score =
          (event.ticketsSold || 0) * 2 +
          (event.isPromoted ? 50 : 0) +
          (event.totalTickets || 0) * 0.1;

        return {
          ...event,
          imageUrl,
          trendingScore: score,
        };
      }),
    );

    return enriched
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 20);
  },
});

export const getSellerEvents = query({
  args: {
    userId: v.string(),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return [];
    }

    /*
     * SellerEventList historically supplied the Clerk user ID.
     * Use the authenticated identity as the source of truth.
     */
    if (args.userId && args.userId !== identity.subject) {
      throw new Error("You cannot view another organizer's events.");
    }

    const events = await ctx.db
      .query("events")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();

    return await Promise.all(
      events.map(async (event) => {
        const tickets = await ctx.db
          .query("tickets")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .collect();

        const refundedTickets = tickets.filter(
          (ticket) => ticket.status === "refunded",
        ).length;

        const soldTickets = tickets.filter(
          (ticket) =>
            ticket.status !== "refunded" &&
            ticket.status !== "revoked" &&
            ticket.status !== "cancelled" &&
            ticket.status !== "canceled",
        ).length;

        const imageUrl = event.imageStorageId
          ? await ctx.storage.getUrl(event.imageStorageId)
          : null;

        const metrics: Metrics = {
          soldTickets,
          refundedTickets,
          revenue: soldTickets * (event.price ?? 0),
        };

        return {
          ...event,
          imageUrl,
          metrics,

          /*
           * Compatibility field for the existing seller UI.
           * This will be replaced by the real cancellation field
           * when event cancellation is implemented.
           */
          is_cancelled: false,
        };
      }),
    );
  },
});

export const getMyEventRating = query({
  args: {
    eventId: v.id("events"),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    const rating = await ctx.db
      .query("eventRatings")
      .withIndex("by_event_and_userId", (q) =>
        q.eq("eventId", args.eventId).eq("userId", identity.tokenIdentifier),
      )
      .unique();

    if (!rating) {
      return null;
    }

    return {
      rating: rating.rating,
      updatedAt: rating.updatedAt,
    };
  },
});

export const submitEventRating = mutation({
  args: {
    eventId: v.id("events"),
    rating: v.number(),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("You must be signed in to rate an event.");
    }

    if (!Number.isInteger(args.rating) || args.rating < 1 || args.rating > 5) {
      throw new Error("Choose a rating from 1 to 5 stars.");
    }

    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new Error("Event not found.");
    }

    const attendeeIdentifiers = [
      identity.subject,
      identity.email?.trim().toLowerCase(),
    ].filter((value): value is string => Boolean(value));

    let hasCheckedInTicket = false;

    for (const attendeeId of new Set(attendeeIdentifiers)) {
      const tickets = await ctx.db
        .query("tickets")
        .withIndex("by_event_user", (q) =>
          q.eq("eventId", args.eventId).eq("userId", attendeeId),
        )
        .take(25);

      if (tickets.some((ticket) => ticket.checkedIn)) {
        hasCheckedInTicket = true;
        break;
      }
    }

    if (!hasCheckedInTicket) {
      throw new Error("Only checked-in attendees can rate this event.");
    }

    const existing = await ctx.db
      .query("eventRatings")
      .withIndex("by_event_and_userId", (q) =>
        q.eq("eventId", args.eventId).eq("userId", identity.tokenIdentifier),
      )
      .unique();
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        rating: args.rating,
        updatedAt: now,
      });

      await ctx.db.patch(event._id, {
        ratingTotal: Math.max(
          0,
          (event.ratingTotal ?? existing.rating) -
            existing.rating +
            args.rating,
        ),
        ratingCount: Math.max(1, event.ratingCount ?? 1),
      });
    } else {
      await ctx.db.insert("eventRatings", {
        eventId: event._id,
        userId: identity.tokenIdentifier,
        rating: args.rating,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.patch(event._id, {
        ratingTotal: (event.ratingTotal ?? 0) + args.rating,
        ratingCount: (event.ratingCount ?? 0) + 1,
      });
    }

    return {
      rating: args.rating,
      updatedAt: now,
    };
  },
});
