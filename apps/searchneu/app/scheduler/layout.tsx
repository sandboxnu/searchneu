import { Header } from "@/components/navigation/Header";
import { DesktopOnlyDialog } from "@/components/DesktopOnlyDialog";
import { SignInRequiredDialog } from "@/components/SignInRequiredDialog";

export default async function Layout({ children }: LayoutProps<"/rooms">) {
  return (
    <div className="flex h-screen flex-col overflow-hidden pt-4">
      <Header />
      <DesktopOnlyDialog feature="The scheduler" />
      <SignInRequiredDialog feature="The scheduler" redirectOnDismissTo="/" />
      <div className="hidden min-h-0 flex-1 sm:block">{children}</div>
    </div>
  );
}
