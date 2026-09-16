import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-black">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-6 py-10 text-center sm:flex-row sm:text-left">
        <div>
          <p className="font-black tracking-[0.2em] text-white">
            FUNCTION<span className="text-violet-500">HOUR</span>
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            © {new Date().getFullYear()} Function Hour. All rights reserved.
          </p>
        </div>
        <nav aria-label="Legal and support" className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-zinc-400">
          <Link href="/refund-policy" className="hover:text-white">Refunds</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <a href="mailto:support@functionhour.com" className="hover:text-white">Support</a>
        </nav>
      </div>
    </footer>
  );
}
