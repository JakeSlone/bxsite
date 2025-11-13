import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "bxsite",
    template: "%s | bxsite",
  },
  description:
    "Create a free website in minutes. Write your content in Markdown, choose your domain name, and deploy instantly. No git pushes, no deploy scripts needed.",
  keywords: [
    "website builder",
    "markdown CMS",
    "free website",
    "static site generator",
    "instant deploy",
  ],
  authors: [{ name: "bxsite" }],
  creator: "bxsite",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bxsite.com",
    siteName: "bxsite",
    title: "bxsite - The fastest and easiest way to build a website",
    description:
      "Create a free website in minutes. Write your content in Markdown, choose your domain name, and deploy instantly.",
  },
  twitter: {
    card: "summary_large_image",
    title: "bxsite - The fastest and easiest way to build a website",
    description:
      "Create a free website in minutes. Write your content in Markdown, choose your domain name, and deploy instantly.",
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
  verification: {},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
