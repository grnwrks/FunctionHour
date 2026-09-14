"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const customerRoutes = [
  "/events",
  "/map",
  "/saved-events",
  "/my-tickets",
  "/recommendations",
  "/cities",
  "/explore",
  "/organizers",
  "/tickets",
  "/onboarding/attendee",
];

export default function BackToHome() {
  const pathname = usePathname();
  const isCustomerPage = customerRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!isCustomerPage) return null;

  return (
    <Link
      href="/"
      aria-label="Back to Function Hour home"
      className="fixed bottom-24 left-4 z-[80] inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-black/80 px-4 py-3 text-xs font-black text-white shadow-2xl backdrop-blur-xl transition hover:border-violet-300/50 hover:bg-zinc-900 sm:bottom-6 sm:left-6"
    >
      <span aria-hidden="true">←</span>
      Home
    </Link>
  );
}
