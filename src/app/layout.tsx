import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/context/auth-context";
import { DebugTools } from "@/components/DebugTools";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${geistMono.variable} flex min-h-screen flex-col font-sans antialiased`}
      >
        <DebugTools />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
