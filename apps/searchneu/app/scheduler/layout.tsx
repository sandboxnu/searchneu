import { Header } from "@/components/navigation/Header";

export default async function Layout({ children }: LayoutProps<"/rooms">) {
  return (
    <div className="flex h-screen flex-col overflow-hidden pt-4">
      <Header />
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
