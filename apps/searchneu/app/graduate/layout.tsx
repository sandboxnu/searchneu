import { Header } from "@/components/navigation/Header";
import { DesktopOnlyDialog } from "@/components/DesktopOnlyDialog";

export default async function Layout({ children }: LayoutProps<"/graduate">) {
  return (
    <div className="flex h-screen flex-col overflow-hidden pt-4">
      <Header />
      <DesktopOnlyDialog feature="The graduate planner" />
      <div className="hidden sm:contents">{children}</div>
    </div>
  );
}
