import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { isEventUpcoming } from "./eventDates";

async function getCurrentUserDoc(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  const subject = identity.subject;
  const tokenIdentifier = identity.tokenIdentifier;

  let user =
    (await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) =>
        q.eq("clerkId", subject)
      )
      .first()) ||
    (await ctx.db
      .query("users")
      .withIndex("by_userId", (q: any) =>
        q.eq("userId", subject)
      )
      .first()) ||
    (tokenIdentifier
      ? await ctx.db
          .query("users")
          .withIndex("by_tokenIdentifier", (q: any) =>
            q.eq("tokenIdentifier", tokenIdentifier)
          )
          .first()
      : null);

  return {
    identity,
    user,
  };
}

export const generateOrganizerUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("You must be signed in.");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

export const getMyOrganizerProfile = query({
  args: {},
  handler: async (ctx) => {
    const result = await getCurrentUserDoc(ctx);

    if (!result) {
      return null;
    }

    return result.user;
  },
});

export const updateMyOrganizerProfile = mutation({
  args: {
    organizerName: v.optional(v.string()),
    bio: v.optional(v.string()),
    website: v.optional(v.string()),
    instagram: v.optional(v.string()),

    avatarStorageId: v.optional(v.id("_storage")),
    bannerStorageId: v.optional(v.id("_storage")),
  },

  handler: async (ctx, args) => {
    const result = await getCurrentUserDoc(ctx);

    if (!result) {
      throw new Error("You must be signed in.");
    }

    const { identity, user } = result;

    const patch: any = {
      updatedAt: Date.now(),
      isOrganizer: true,
    };

    if (args.organizerName !== undefined) {
      patch.organizerName = args.organizerName;

      // Keep legacy/shared name field synced
      patch.name = args.organizerName;
    }

    if (args.bio !== undefined) {
      patch.bio = args.bio;
    }

    if (args.website !== undefined) {
      patch.website = args.website;
    }

    if (args.instagram !== undefined) {
      patch.instagram = args.instagram;
    }

    if (args.avatarStorageId !== undefined) {
      patch.avatarStorageId = args.avatarStorageId;

      const avatarUrl = await ctx.storage.getUrl(
        args.avatarStorageId
      );

      patch.avatarUrl = avatarUrl;
    }

    if (args.bannerStorageId !== undefined) {
      patch.bannerStorageId = args.bannerStorageId;

      const bannerUrl = await ctx.storage.getUrl(
        args.bannerStorageId
      );

      patch.bannerUrl = bannerUrl;
    }

    // Existing user: patch every matching user record to avoid stale duplicate profiles
    if (user) {
      const matches: any[] = [];

      const byUserId = await ctx.db
        .query("users")
        .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
        .collect();

      const byClerkId = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
        .collect();

      const byToken = identity.tokenIdentifier
        ? await ctx.db
            .query("users")
            .withIndex("by_tokenIdentifier", (q: any) =>
              q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .collect()
        : [];

      for (const item of [...byUserId, ...byClerkId, ...byToken]) {
        if (!matches.find((m: any) => m._id === item._id)) {
          matches.push(item);
        }
      }

      for (const item of matches) {
        await ctx.db.patch(item._id, {
          ...patch,
          clerkId: identity.subject,
          userId: identity.subject,
          tokenIdentifier: identity.tokenIdentifier,
        });
      }

      return user._id;
    }

    // Create user safely if missing
    return await ctx.db.insert("users", {
      clerkId: identity.subject,
      userId: identity.subject,
      tokenIdentifier: identity.tokenIdentifier,

      email: identity.email ?? "",
      name: identity.name ?? "",

      role: "organizer",
      onboardingComplete: true,

      createdAt: Date.now(),

      ...patch,
    });
  },
});

export const getOrganizerByUserId = query({
  args: {
    userId: v.string(),
  },

  handler: async (ctx, args) => {
    const rawEvents = await ctx.db
      .query("events")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const events = await Promise.all(
      rawEvents.filter((event) => isEventUpcoming(event)).map(async (event) => {
        const ticketTypes = await ctx.db
          .query("ticketTypes")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .take(100);
        const activePrices = ticketTypes
          .filter((ticketType) => ticketType.isActive !== false)
          .map((ticketType) => ticketType.price);

        return {
          ...event,
          startingPrice: activePrices.length
            ? Math.min(...activePrices)
            : (event.price ?? 0),
        };
      }),
    );

    const organizer =
      (await ctx.db
        .query("users")
        .withIndex("by_userId", (q) =>
          q.eq("userId", args.userId)
        )
        .first()) ||
      (await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) =>
          q.eq("clerkId", args.userId)
        )
        .first());

    if (!organizer && rawEvents.length === 0) return null;

    return {
      organizer: organizer ?? {
        userId: args.userId,
        organizerName: "Function Hour Organizer",
        name: "Function Hour Organizer",
        bio: "",
        avatarUrl: "",
        bannerUrl: "",
        website: "",
        instagram: "",
        isVerifiedOrganizer: false,
      },
      events,
    };
  },
});

export const requestOrganizerVerification = mutation({
  args: {},

  handler: async (ctx) => {
    const result = await getCurrentUserDoc(ctx);

    if (!result?.user) {
      throw new Error("You must be signed in.");
    }

    await ctx.db.patch(result.user._id, {
      verificationRequested: true,
      updatedAt: Date.now(),
    });

    return true;
  },
});

export const setOrganizerVerified = mutation({
  args: {
    userId: v.string(),
    verified: v.boolean(),
  },

  handler: async (ctx, args) => {
    const organizer =
      (await ctx.db
        .query("users")
        .withIndex("by_userId", (q) =>
          q.eq("userId", args.userId)
        )
        .first()) ||
      (await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) =>
          q.eq("clerkId", args.userId)
        )
        .first());

    if (!organizer) {
      throw new Error("Organizer not found.");
    }

    await ctx.db.patch(organizer._id, {
      isVerifiedOrganizer: args.verified,
      updatedAt: Date.now(),
    });

    return true;
  },
});
