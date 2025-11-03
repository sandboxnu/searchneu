import { Header } from "@/components/navigation/Header";
import { type ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col pt-4">
      <Header />
      {children}
    </div>
  );
}
