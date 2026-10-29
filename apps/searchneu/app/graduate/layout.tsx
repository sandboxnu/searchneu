import { Header } from "@/components/navigation/Header";

export default async function Layout({ children }: LayoutProps<"/graduate">) {
  return (
    <div className="flex h-screen flex-col overflow-hidden pt-4">
      <Header />
      {children}
    </div>
  );
}
