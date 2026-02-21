import { Header } from "@/components/navigation/Header";
import { schedulerFlag } from "@/lib/flags";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

export default async function Layout({ children }: LayoutProps<"/rooms">) {
  return (
    <div className="flex h-screen flex-col pt-4">
      <Header />
      <div className="min-h-0 flex-1">
        <Suspense>
          <FlagCheck>{children}</FlagCheck>
        </Suspense>
      </div>
    </div>
  );
}

async function FlagCheck({ children }: { children: ReactNode }) {
  const schedulerPage = await schedulerFlag();

  if (!schedulerPage) {
    notFound();
  }

  return children;
}
