import { Header } from "@/components/navigation/Header";
import { notificationsFlag } from "@/lib/flags";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

export default async function Layout({
  children,
}: LayoutProps<"/notifications">) {
  return (
    <div className="flex h-dvh flex-col pt-4">
      <Header />
      <Suspense>
        <FlagCheck>{children}</FlagCheck>
      </Suspense>
    </div>
  );
}

async function FlagCheck({ children }: { children: ReactNode }) {
  const notificationsPage = await notificationsFlag();

  if (!notificationsPage) {
    notFound();
  }

  return children;
}
