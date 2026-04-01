import { Header } from "@/components/navigation/Header";
import { Suspense } from "react";

export default function Layout({ children }: LayoutProps<"/notifications">) {
  return (
    <div className="flex h-dvh flex-col pt-4">
      <Header />
      <Suspense>{children}</Suspense>
    </div>
  );
}
