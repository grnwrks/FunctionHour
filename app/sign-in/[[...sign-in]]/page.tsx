import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-10 text-white">
      <div className="w-full max-w-md text-center">
        <p className="mb-6 text-2xl font-black tracking-[0.18em]">FUNCTION<span className="text-violet-500">HOUR</span></p>
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/onboarding"
        />
        <p className="mt-6 text-xs leading-5 text-zinc-500">
          By continuing, you agree to the <Link href="/terms" className="text-zinc-300 underline">Terms</Link> and acknowledge the <Link href="/privacy" className="text-zinc-300 underline">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}
