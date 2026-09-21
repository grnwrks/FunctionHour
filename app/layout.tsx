import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "./ConvexClientProvider";
import SyncUserWithConvex from "@/components/SyncUserWithConvex";
import BackToHome from "@/components/navigation/BackToHome";
import ThemeToggle from "@/components/navigation/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://functionhour.com"),
  title: {
    default: "Function Hour | Find Your Function",
    template: "%s | Function Hour",
  },
  description: "Find events, make plans, and host unforgettable functions near you.",
  applicationName: "Function Hour",
  icons: {
    icon: "/function-hour-mark.svg",
    shortcut: "/function-hour-mark.svg",
    apple: "/function-hour-mark.svg",
  },
  openGraph: {
    type: "website",
    siteName: "Function Hour",
    url: "https://functionhour.com",
    title: "Function Hour | Find Your Function",
    description: "Good events. Better hours. Find your next function.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Function Hour" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Function Hour | Find Your Function",
    description: "Good events. Better hours. Find your next function.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
      <html lang="en" className="light" suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('function-hour-theme');if(t!=='light'&&t!=='dark')t='light';var r=document.documentElement;r.classList.remove('light','dark');r.classList.add(t);r.dataset.theme=t;r.style.colorScheme=t}catch(e){}})();`,
            }}
          />
        </head>
        <body>
          <a className="skip-link" href="#main-content">
            Skip to main content
          </a>
          <ConvexClientProvider>
            <SyncUserWithConvex />
            <BackToHome />
            <ThemeToggle />
            <div id="main-content" tabIndex={-1}>
              {children}
            </div>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
