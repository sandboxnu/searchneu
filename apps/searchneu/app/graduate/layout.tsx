import { Header } from "@/components/navigation/Header";
import { DesktopOnlyDialog } from "@/components/DesktopOnlyDialog";
import { SignInRequiredDialog } from "@/components/SignInRequiredDialog";

export default async function Layout({ children }: LayoutProps<"/graduate">) {
  return (
    <div className="flex h-screen flex-col overflow-hidden pt-4">
      <Header />
      <DesktopOnlyDialog feature="The graduate planner" />
      <SignInRequiredDialog
          feature="The graduate planner"
          description={
            "SearchNEU Graduate makes it easy to build your college schedule year by year. Track " +
              "your completed credits, plan future semesters, and stay on top of your degree " +
              "requirements.\n\nSign in to save your progress and pick up where you left off."
          }
      />
      <div className="hidden sm:contents">{children}</div>
    </div>
  );
}
