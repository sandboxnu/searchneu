import { Footer } from "@/components/navigation/Footer";
import { Header } from "@/components/navigation/Header";
import { type ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <div className="prose [&_ol]:marker:text-neu9 max-w-full p-4 [&_ol]:list-[lower-alpha]">
        {children}
      </div>

      <Footer />
    </>
  );
}
