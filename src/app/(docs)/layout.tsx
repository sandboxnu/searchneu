import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
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
  title: "SearchNEU | Docs",
  description: "Documentation for SearchNEU",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist} ${geistMono.variable} antialiased`}>
        <DebugTools />
        <AuthProvider>
          <main className="">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
