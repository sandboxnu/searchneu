import { Header } from "@/components/navigation/Header";
import { ReactNode, Suspense } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="pt-4">
      <Header />
      <Suspense>{children}</Suspense>
    </div>
  );
}
