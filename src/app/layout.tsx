import type { Metadata } from "next";
import { Crimson_Pro, DM_Sans } from "next/font/google";
import "./globals.css";

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-crimson-pro",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://willpowered.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Willpowered | Strengthen Your Willpower",
    template: "%s | Willpowered",
  },
  description: "Build a system for becoming who you want to be. Discover your purpose, set your principles, and track progress with an AI willpower coach.",
  keywords: ["willpower", "self-improvement", "habits", "grit", "perseverance", "personal development", "purpose", "goals", "AI coach"],
  authors: [{ name: "Colin Robertson" }],
  creator: "Colin Robertson",
  publisher: "Willpowered",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Willpowered | Strengthen Your Willpower",
    description: "Build a system for becoming who you want to be. Purpose → Principles → Scorecard.",
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Willpowered",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Willpowered - Strengthen Your Willpower",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Willpowered | Strengthen Your Willpower",
    description: "Build a system for becoming who you want to be. Purpose → Principles → Scorecard.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes when ready
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${crimsonPro.variable} ${dmSans.variable} font-sans min-h-screen flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
