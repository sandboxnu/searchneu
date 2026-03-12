import { Header } from "@/components/navigation/Header";
import { type ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[100dvh] flex-col pt-4 xl:h-screen">
      <Header />
      {children}
    </div>
  );
}
