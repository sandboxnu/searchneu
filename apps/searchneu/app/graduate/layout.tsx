import { Header } from "@/components/navigation/Header";
import { graduateFlag, schedulerFlag } from "@/lib/flags";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

export default async function Layout({ children }: LayoutProps<"/graduate">) {
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
  const graduatePage = await graduateFlag();

  if (!graduatePage) {
    notFound();
  }

  return children;
}
