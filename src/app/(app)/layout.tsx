import type { Metadata } from "next";
import { Geist_Mono, Lato } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/navigation/Header";
import { DebugTools } from "@/components/DebugTools";

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
        className={`${lato.className} ${geistMono.variable} flex min-h-screen flex-col font-sans antialiased`}
      >
        <DebugTools />
        <Header />
        <main className="h-[calc(100vh-56px)] w-screen grow">{children}</main>
      </body>
    </html>
  );
}
