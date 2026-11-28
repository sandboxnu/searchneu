import { Header } from "@/components/navigation/Header";
import { Suspense } from "react";
import { DesktopOnlyDialog } from "@/components/DesktopOnlyDialog";
import { SignInRequiredDialog } from "@/components/SignInRequiredDialog";

export default function Layout({ children }: LayoutProps<"/notifications">) {
  return (
    <div className="flex h-dvh flex-col pt-4">
      <Header />
      <DesktopOnlyDialog feature="Notifications" />
      <SignInRequiredDialog
          feature="Notifications"
          description={
            "SearchNEU Notifications lets you subscribe to full course sections and get a text the " +
              "moment a seat opens up, so you never have to keep refreshing the page yourself." +
              "\n\nSign in to subscribe to sections and manage your notifications."
          }
      />
      <Suspense>{children}</Suspense>
    </div>
  );
}
