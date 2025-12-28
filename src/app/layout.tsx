import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PostHogWrapper } from "@/components/PostHogWrapper";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "Willpowered | Strengthen Your Willpower",
  description: "Meet Willson, your AI coach for building discipline through purpose, principles, and daily action.",
  keywords: ["willpower", "self-improvement", "habits", "grit", "perseverance", "personal development", "AI coach"],
  authors: [{ name: "Colin Robertson" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Willpowered",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Willpowered | Strengthen Your Willpower",
    description: "Meet Willson, your AI coach for building discipline through purpose, principles, and daily action.",
    type: "website",
    locale: "en_US",
    siteName: "Willpowered",
  },
  twitter: {
    card: "summary_large_image",
    title: "Willpowered | Strengthen Your Willpower",
    description: "Meet Willson, your AI coach for building discipline through purpose, principles, and daily action.",
  },
};

export const viewport: Viewport = {
  themeColor: "#E85A3C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* PWA Meta Tags */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-152x152.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Willpowered" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#E85A3C" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className="min-h-screen font-sans">
        <PostHogWrapper>
          <ServiceWorkerRegistration />
          {children}
          <InstallPrompt />
        </PostHogWrapper>
      </body>
    </html>
  );
}
