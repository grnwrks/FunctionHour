"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { ReactNode, useEffect, useMemo, useState } from "react";

type NavItem = {
  label: string;
  description: string;
  href?: string;
  icon: IconName;
  accent?: "orange" | "violet";
  exact?: boolean;
  soon?: boolean;
};

type NavGroup = {
  label?: string;
  items: NavItem[];
};

type IconName =
  | "overview"
  | "events"
  | "drafts"
  | "calendar"
  | "sales"
  | "comp"
  | "checkin"
  | "members"
  | "permissions"
  | "flyer"
  | "library"
  | "boost"
  | "email"
  | "orders"
  | "merch"
  | "payouts"
  | "discounts"
  | "analytics"
  | "reports"
  | "audience";

const navigation: NavGroup[] = [
  {
    items: [
      {
        label: "Overview",
        description: "Command center",
        href: "/host",
        icon: "overview",
        exact: true,
      },
    ],
  },
  {
    label: "Events",
    items: [
      {
        label: "Event Calendar",
        description: "List & calendar views",
        href: "/host/events",
        icon: "events",
      },
    ],
  },
  {
    label: "Tickets",
    items: [
      {
        label: "Comp Tickets",
        description: "Complimentary tickets",
        href: "/host/comp-tickets",
        icon: "comp",
        accent: "orange",
      },
      {
        label: "Check In",
        description: "Scan & validate tickets",
        href: "/host/check-in",
        icon: "checkin",
      },
    ],
  },
  {
    label: "Team",
    items: [
      {
        label: "Team & Permissions",
        description: "Staff roles & access",
        href: "/host/team",
        icon: "members",
      },
    ],
  },
  {
    label: "Revenue",
    items: [
      {
        label: "Orders",
        description: "Ticket transactions",
        href: "/host/orders",
        icon: "orders",
      },
      {
        label: "Merch",
        description: "Products & fulfillment",
        href: "/host/merch",
        icon: "merch",
      },
      {
        label: "Discounts",
        description: "Promo codes & limits",
        href: "/host/discounts",
        icon: "discounts",
      },
      {
        label: "Payouts",
        description: "Banking & settlements",
        href: "/host/payouts",
        icon: "payouts",
      },
    ],
  },
  {
    label: "Marketing",
    items: [
      {
        label: "Email Guests",
        description: "Event communications",
        href: "/host/messages",
        icon: "email",
      },
      {
        label: "Flyer Studio",
        description: "Design & create",
        href: "/host/flyer-studio-v2",
        icon: "flyer",
      },
      {
        label: "Creative Library",
        description: "Assets & templates",
        href: "/host/creative-library",
        icon: "library",
      },
      {
        label: "Boosts",
        description: "Promote your events",
        href: "/host/boost",
        icon: "boost",
      },
    ],
  },
  {
    label: "Analytics",
    items: [
      {
        label: "Dashboard",
        description: "Performance overview",
        href: "/host/analytics",
        icon: "analytics",
      },
      {
        label: "Audience",
        description: "Guest relationships",
        href: "/host/audience",
        icon: "audience",
      },
      {
        label: "Reports",
        description: "Exportable insights",
        href: "/host/reports",
        icon: "reports",
      },
    ],
  },
];

const pageMetadata: Record<
  string,
  {
    title: string;
    description: string;
  }
> = {
  "/host": {
    title: "Overview",
    description: "Command center for all your events",
  },
  "/host/comp-tickets": {
    title: "Comp Tickets",
    description: "Issue and manage complimentary admission",
  },
  "/host/check-in": {
    title: "Check In",
    description: "Scan and validate attendee tickets",
  },
  "/host/create": {
    title: "Create Event",
    description: "Build and publish a new Function Hour event",
  },
  "/host/flyer-studio": {
    title: "Flyer Studio",
    description: "Create event marketing assets",
  },
  "/host/flyer-studio-v2": {
    title: "AI Studio",
    description: "Create event marketing assets",
  },
  "/host/creative-library": {
    title: "Creative Library",
    description: "Manage event assets and templates",
  },
  "/host/merch": {
    title: "Merch",
    description: "Manage products and merchandise",
  },
  "/host/analytics": {
    title: "Analytics",
    description: "Track performance across your events",
  },
  "/host/audience": {
    title: "Audience",
    description: "Understand your guests across every event",
  },
  "/host/reports": {
    title: "Reports",
    description: "Generate and export operational insights",
  },
  "/host/team": {
    title: "Team & Permissions",
    description: "Manage event staff roles and access",
  },
  "/host/discounts": {
    title: "Discounts",
    description: "Create and manage ticket promo codes",
  },
  "/host/payouts": {
    title: "Payouts",
    description: "Manage Stripe onboarding and settlements",
  },
  "/host/orders": {
    title: "Orders",
    description: "Review ticket transactions and refunds",
  },
  "/host/messages": {
    title: "Email Guests",
    description: "Manage event communications and campaigns",
  },
  "/host/events": {
    title: "Events",
    description: "Plan and manage your event schedule",
  },
};

export default function OrganizerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  const metadata = useMemo(() => {
    const exact = pageMetadata[pathname];

    if (exact) {
      return exact;
    }

    const matchedPath = Object.keys(pageMetadata)
      .filter((key) => key !== "/host" && pathname.startsWith(key))
      .sort((a, b) => b.length - a.length)[0];

    return (
      pageMetadata[matchedPath] ?? {
        title: "Organizer OS",
        description: "Manage your Function Hour operations",
      }
    );
  }, [pathname]);

  return (
    <div className="organizer-shell min-h-screen bg-[#07060c] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[10%] top-[-15%] h-[520px] w-[520px] rounded-full bg-violet-700/10 blur-[160px]" />

        <div className="absolute bottom-[-20%] right-[-10%] h-[580px] w-[580px] rounded-full bg-orange-500/[0.07] blur-[170px]" />

        <div className="absolute inset-0 opacity-[0.018]">
          <div className="h-full w-full bg-[linear-gradient(to_right,rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.18)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>
      </div>

      <Sidebar
        pathname={pathname}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCollapse={() => setCollapsed((current) => !current)}
        onMobileClose={() => setMobileOpen(false)}
      />

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close organizer menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <div
        className={[
          "relative min-h-screen transition-[padding] duration-300",
          collapsed ? "lg:pl-[92px]" : "lg:pl-[272px]",
        ].join(" ")}
      >
        <TopBar
          title={metadata.title}
          description={metadata.description}
          mobileOpen={mobileOpen}
          onOpenMenu={() => {
            setCollapsed(false);
            setMobileOpen(true);
          }}
        />

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

function Sidebar({
  pathname,
  collapsed,
  mobileOpen,
  onCollapse,
  onMobileClose,
}: {
  pathname: string;
  collapsed: boolean;
  mobileOpen: boolean;
  onCollapse: () => void;
  onMobileClose: () => void;
}) {
  return (
    <aside
      id="organizer-navigation"
      className={[
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.07] bg-[#090812]/95 shadow-[20px_0_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition-all duration-300",
        collapsed ? "lg:w-[92px]" : "lg:w-[272px]",
        mobileOpen
          ? "w-[min(290px,calc(100vw-24px))] translate-x-0"
          : "w-[min(290px,calc(100vw-24px))] -translate-x-full lg:translate-x-0",
      ].join(" ")}
    >
      <div className="flex min-h-[82px] items-center border-b border-white/[0.06] px-5">
        <Link href="/host" onClick={onMobileClose} className="min-w-0 flex-1">
          <div
            className={[
              "font-black tracking-[-0.06em]",
              collapsed ? "text-center text-xl" : "text-[24px]",
            ].join(" ")}
          >
            {collapsed ? (
              <span className="bg-gradient-to-r from-violet-400 to-orange-400 bg-clip-text text-transparent">
                FH
              </span>
            ) : (
              <>
                <span className="text-white">FUNCTION</span>

                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-orange-400 bg-clip-text text-transparent">
                  HOUR
                </span>
              </>
            )}
          </div>

          {!collapsed && (
            <p className="mt-1 text-center text-[9px] font-black uppercase tracking-[0.3em] text-violet-400">
              Organizer OS
            </p>
          )}
        </Link>

        <button
          type="button"
          onClick={onMobileClose}
          aria-label="Close menu"
          className="ml-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 lg:hidden"
        >
          <Icon name="close" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
        {navigation.map((group, groupIndex) => (
          <div
            key={`${group.label ?? "main"}-${groupIndex}`}
            className={groupIndex === 0 ? "" : "mt-5"}
          >
            {group.label && !collapsed && (
              <p className="mb-2 px-3 text-[9px] font-black uppercase tracking-[0.22em] text-zinc-600">
                {group.label}
              </p>
            )}

            <div className="space-y-1">
              {group.items.map((item) => (
                <SidebarItem
                  key={`${item.label}-${item.href ?? "soon"}`}
                  item={item}
                  pathname={pathname}
                  collapsed={collapsed}
                  onNavigate={onMobileClose}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/[0.06] p-3">
        <button
          type="button"
          onClick={onCollapse}
          className="hidden min-h-11 w-full items-center justify-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 text-xs font-bold text-zinc-400 transition hover:bg-white/[0.07] hover:text-white lg:flex"
        >
          <Icon name={collapsed ? "expand" : "collapse"} />

          {!collapsed && "Collapse sidebar"}
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({
  item,
  pathname,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const active =
    Boolean(item.href) &&
    (item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`));

  const content = (
    <>
      <span
        className={[
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition",
          active
            ? "bg-white/10 text-white"
            : item.accent === "orange"
              ? "text-orange-400"
              : "text-violet-300",
        ].join(" ")}
      >
        <Icon name={item.icon} />
      </span>

      {!collapsed && (
        <>
          <span className="min-w-0 flex-1">
            <span
              className={[
                "block truncate text-[13px] font-black",
                active
                  ? "text-white"
                  : item.accent === "orange"
                    ? "text-orange-300"
                    : "text-zinc-200",
              ].join(" ")}
            >
              {item.label}
            </span>

            <span
              className={[
                "mt-0.5 block truncate text-[10px]",
                active
                  ? "text-violet-100/70"
                  : item.accent === "orange"
                    ? "text-orange-300/60"
                    : "text-zinc-600",
              ].join(" ")}
            >
              {item.description}
            </span>
          </span>

          {item.soon ? (
            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[7px] font-black uppercase tracking-wider text-zinc-600">
              Soon
            </span>
          ) : active ? (
            <span className="text-violet-200">›</span>
          ) : null}
        </>
      )}
    </>
  );

  const classes = [
    "group flex min-h-[54px] w-full items-center gap-2 rounded-xl px-2 text-left transition",
    collapsed ? "justify-center" : "",
    active
      ? "border border-violet-400/30 bg-gradient-to-r from-violet-600/80 to-fuchsia-600/30 shadow-[0_0_28px_rgba(124,58,237,0.18)]"
      : item.soon
        ? "cursor-default opacity-60"
        : "border border-transparent hover:border-white/[0.06] hover:bg-white/[0.04]",
  ].join(" ");

  if (!item.href || item.soon) {
    return (
      <div
        className={classes}
        title={collapsed ? `${item.label} — Coming soon` : undefined}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={classes}
      title={collapsed ? item.label : undefined}
    >
      {content}
    </Link>
  );
}

function TopBar({
  title,
  description,
  mobileOpen,
  onOpenMenu,
}: {
  title: string;
  description: string;
  mobileOpen: boolean;
  onOpenMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#08070e]/85 backdrop-blur-2xl">
      <div className="flex min-h-[78px] items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open organizer menu"
          aria-controls="organizer-navigation"
          aria-expanded={mobileOpen}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] lg:hidden"
        >
          <Icon name="menu" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-black tracking-tight sm:text-xl">
            {title}
          </h1>

          <p className="hidden truncate text-xs text-zinc-500 sm:block">
            {description}
          </p>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/"
            aria-label="Return to Function Hour homepage"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-xs font-black transition hover:border-violet-400/40 hover:bg-white/[0.07]"
          >
            <span aria-hidden="true">←</span>
            Home
          </Link>

          <Link
            href="/host/events"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 text-xs font-black transition hover:bg-white/[0.07]"
          >
            My Events
          </Link>

          <Link
            href="/host/flyer-studio-v2"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 text-xs font-black transition hover:bg-white/[0.07]"
          >
            AI Studio
          </Link>

          <Link
            href="/host/create"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-500 px-5 text-xs font-black shadow-[0_0_30px_rgba(139,92,246,0.3)] transition hover:scale-[1.02]"
          >
            <span className="text-lg leading-none">+</span>
            Create Event
          </Link>
        </div>

        <div className="ml-1 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-9 w-9",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}

function Icon({ name }: { name: IconName | string }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  const paths: Record<string, ReactNode> = {
    overview: (
      <>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10v10h13V10" />
        <path d="M9.5 20v-6h5v6" />
      </>
    ),
    events: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </>
    ),
    drafts: (
      <>
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v5h5" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),
    sales: (
      <>
        <path d="M4 18 9 13l4 3 7-9" />
        <path d="M15 7h5v5" />
      </>
    ),
    comp: (
      <>
        <path d="M4 7a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2v-3a2 2 0 0 0 0-4z" />
        <path d="M12 8v8" />
      </>
    ),
    checkin: (
      <>
        <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    members: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20a6 6 0 0 1 12 0" />
        <circle cx="17" cy="9" r="2" />
        <path d="M16 15a5 5 0 0 1 5 5" />
      </>
    ),
    permissions: (
      <>
        <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6z" />
        <circle cx="12" cy="11" r="2" />
        <path d="M12 13v3" />
      </>
    ),
    flyer: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="m8 15 2.5-3 2 2 3.5-5 2 6" />
        <circle cx="9" cy="9" r="1" />
      </>
    ),
    library: (
      <>
        <rect x="3" y="5" width="18" height="15" rx="2" />
        <path d="m7 16 3-3 2 2 3-4 3 5" />
      </>
    ),
    boost: (
      <>
        <path d="M14 4c3 0 5-1 6-2 0 4-1 7-4 10l-3 3-4-4 3-3c1-1 2-3 2-4Z" />
        <path d="M8 12 4 13l-2 3 5 1M12 16l-1 4-3 2-1-5" />
      </>
    ),
    email: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    orders: (
      <>
        <path d="M6 7h12l1 14H5z" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </>
    ),
    merch: (
      <>
        <path d="m8 4 4 2 4-2 4 3-3 4v10H7V11L4 7z" />
        <path d="M9 5c.5 2 5.5 2 6 0" />
      </>
    ),
    payouts: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M15 8.5c-.7-.5-1.5-.7-2.5-.7-1.4 0-2.5.7-2.5 1.8 0 2.8 5.5 1.2 5.5 4 0 1.2-1.1 2-2.8 2-1 0-2-.3-2.7-.9M12.5 6v12" />
      </>
    ),
    discounts: (
      <>
        <path d="M20 13 13 20 4 11V4h7z" />
        <circle cx="8.5" cy="8.5" r="1.2" />
      </>
    ),
    analytics: (
      <>
        <path d="M12 3v9h9" />
        <path d="M20.5 15a9 9 0 1 1-11-11" />
      </>
    ),
    reports: (
      <>
        <path d="M5 20V10M10 20V4M15 20v-7M20 20V7" />
      </>
    ),
    audience: (
      <>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    collapse: (
      <>
        <path d="m14 7-5 5 5 5" />
      </>
    ),
    expand: (
      <>
        <path d="m10 7 5 5-5 5" />
      </>
    ),
  };

  return <svg {...common}>{paths[name] ?? paths.overview}</svg>;
}
