import {ClerkProvider} from "@clerk/nextjs";
import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import PostHogProvider from "@/components/PostHogProvider";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Crowns Enchanted — Luxury Hair & Wellness Salon | Marietta, GA",
  description:
    "Holistic hair care, scalp science, and spiritual wellness by Ashley in Marietta, GA. Book your transformative experience at Crowns Enchanted.",
  keywords: ["natural hair salon", "holistic hair care", "scalp therapy", "Marietta GA", "Crowns Enchanted"],
  openGraph: {
    title: "Crowns Enchanted",
    description: "Luxury holistic hair & wellness salon in Marietta, GA",
    siteName: "Crowns Enchanted",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background font-[family-name:var(--font-sans)] text-text-primary">
        <ClerkProvider>
          <PostHogProvider>{children}</PostHogProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}