import { Header } from "@/components/navigation/Header";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <div className="">{children}</div>
    </>
  );
}
