import { Header } from "@/components/navigation/Header";
import { DesktopOnlyDialog } from "@/components/DesktopOnlyDialog";
import { SignInRequiredDialog } from "@/components/SignInRequiredDialog";

export default async function Layout({ children }: LayoutProps<"/graduate">) {
  return (
    <div className="flex h-screen flex-col overflow-hidden pt-4">
      <Header />
      <DesktopOnlyDialog feature="The graduate planner" />
      <SignInRequiredDialog feature="The graduate planner" />
      <div className="hidden sm:contents">{children}</div>
    </div>
  );
}
