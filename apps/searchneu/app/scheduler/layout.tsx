import { Header } from "@/components/navigation/Header";
import { FullScreenRequired } from "@/components/scheduler/FullScreenRequired";

export default async function Layout({ children }: LayoutProps<"/rooms">) {
  return (
    <div className="flex h-screen flex-col overflow-hidden pt-4">
      <FullScreenRequired />
      <Header />
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
