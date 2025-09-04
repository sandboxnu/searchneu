import type { Metadata } from "next";
import { Geist_Mono, Lato } from "next/font/google";
import "./globals.css";
import { DebugTools } from "@/components/DebugTools";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth/client";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lato = Lato({
  variable: "--font-lato",
  weight: ["100", "300", "400", "700", "900"],
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
        className={`${lato.className} ${geistMono.variable} flex flex-col font-sans antialiased`}
      >
        <Analytics />
        <SpeedInsights />
        <AuthProvider>
          <DebugTools />
          <main className="min-h-screen w-screen grow">{children}</main>
          <Toaster closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
