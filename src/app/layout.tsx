import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import Script from "next/script";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SearchNEU",
  description: "Search courses at Northeastern University",
};

// enable react rerender indicators
const enableDebug = true;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geist} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
      >
        {enableDebug && (
          <Script
            src="//unpkg.com/react-scan/dist/auto.global.js"
            strategy="beforeInteractive"
            crossOrigin="anonymous"
          />
        )}
        <Header />
        <main className="h-[calc(100vh-56px)] w-screen grow">{children}</main>
      </body>
    </html>
  );
}
