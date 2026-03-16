import { Header } from "@/components/navigation/Header";
import { Suspense } from "react";

export default function Layout({ children }: LayoutProps<"/faq">) {
  return (
    <div className="pt-4">
      <Header />
      <Suspense>{children}</Suspense>
    </div>
  );
}
