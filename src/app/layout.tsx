import type { Metadata } from "next";
import "./globals.css";
import { PostHogWrapper } from "@/components/PostHogWrapper";

export const metadata: Metadata = {
  title: "Willpowered | Strengthen Your Willpower",
  description: "Learn the science of willpower through the stories of heroes who overcame extraordinary challenges. Meet your AI willpower coach.",
  keywords: ["willpower", "self-improvement", "habits", "grit", "perseverance", "personal development"],
  authors: [{ name: "Colin Robertson" }],
  openGraph: {
    title: "Willpowered | Strengthen Your Willpower",
    description: "Learn the science of willpower through the stories of heroes who overcame extraordinary challenges.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Willpowered | Strengthen Your Willpower",
    description: "Learn the science of willpower through the stories of heroes who overcame extraordinary challenges.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <PostHogWrapper>
          {children}
        </PostHogWrapper>
      </body>
    </html>
  );
}
