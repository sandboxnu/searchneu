import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "search2",
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
        className={`${geist} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <Header />
        <main className="h-[calc(100vh-56px)] w-screen grow">{children}</main>
        {/* <Footer /> */}
      </body>
    </html>
  );
}
