import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth/client";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import FeedbackModal from "@/components/feedback/FeedbackModal";
import { VercelToolbar } from "@vercel/toolbar/next";
import Script from "next/script";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | SearchNEU",
    default: "SearchNEU",
  },
  description: "Search courses at Northeastern University",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        data-theme="neu"
        className={`font-sans ${geistMono.variable} flex flex-col antialiased`}
      >
        <Analytics />
        <SpeedInsights />
        {process.env.NODE_ENV === "development" && <VercelToolbar />}
        {process.env.REACT_SCAN && (
          <Script
            src="//unpkg.com/react-scan/dist/auto.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
        <AuthProvider>
          <main className="min-h-[100dvh] w-screen grow">{children}</main>

          <FeedbackModal />
          <Toaster closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
