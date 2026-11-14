import { Header } from "@/components/navigation/Header";
import { Suspense } from "react";
import { DesktopOnlyDialog } from "@/components/DesktopOnlyDialog";

export default function Layout({ children }: LayoutProps<"/notifications">) {
  return (
    <div className="flex h-dvh flex-col pt-4">
      <Header />
      <DesktopOnlyDialog feature="Notifications" />
      <Suspense>{children}</Suspense>
    </div>
  );
}
