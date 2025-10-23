import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { source } from "@/lib/source";
import { DocsLayout, DocsLayoutProps } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";
import { Banner } from "fumadocs-ui/components/banner";
import { Suspense } from "react";

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

const baseOptions: BaseLayoutProps = {
  nav: {
    title: "SearchNEU",
  },
  githubUrl: "https://github.com/sandboxnu/search2",
};

const docsOptions: DocsLayoutProps = {
  ...baseOptions,
  tree: source.pageTree,
  sidebar: {
    tabs: {
      transform: (option, node) => ({
        ...option,
        icon: <div className="[&>svg]:size-5">{node.icon}</div>,
      }),
    },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geist} ${geistMono.variable} flex flex-col antialiased`}
      >
        {/* these className overrides required b/c of a bug in the Banner component */}
        <Banner>
          Heads up! These docs are still in development! Mind our mess 🏗️
        </Banner>
        <RootProvider>
          <Suspense>
            <DocsLayout {...docsOptions}>{children}</DocsLayout>
          </Suspense>
        </RootProvider>
      </body>
    </html>
  );
}
