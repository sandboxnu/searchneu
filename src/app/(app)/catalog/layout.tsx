import { Header } from "@/components/navigation/Header";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen">
      <Header />
      <div className="">{children}</div>
    </div>
  );
}
