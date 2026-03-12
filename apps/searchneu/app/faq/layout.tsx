import { Header } from "@/components/navigation/Header";
import { faqFlag } from "@/lib/flags";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

export default async function Layout({ children }: LayoutProps<"/faq">) {
  return (
    <div className="pt-4">
      <Header />
      <Suspense>
        <FlagCheck>{children}</FlagCheck>
      </Suspense>
    </div>
  );
}

async function FlagCheck({ children }: { children: ReactNode }) {
  const faqPage = await faqFlag();

  if (!faqPage) {
    notFound();
  }

  return children;
}
