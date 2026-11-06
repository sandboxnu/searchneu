import { Header } from "@/components/navigation/Header";
import { DesktopOnlyDialog } from "@/components/DesktopOnlyDialog";
import { graduateFlag } from "@/lib/flags";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

export default async function Layout({ children }: LayoutProps<"/graduate">) {
  return (
    <div className="flex h-screen flex-col overflow-hidden pt-4">
      <Header />
      <DesktopOnlyDialog feature="The graduate planner" />
      <div className="hidden sm:contents">
        <Suspense>
          <FlagCheck>{children}</FlagCheck>
        </Suspense>
      </div>
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
