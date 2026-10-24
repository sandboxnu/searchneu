"use client";

export function SidebarContainer({
  headerContent,
  children,
}: {
  headerContent: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-neu2 bg-neu0 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-lg border">
      <div className="shrink-0 px-6 pt-6 pb-5">{headerContent}</div>
      <div className="[&::-webkit-scrollbar-thumb]:bg-neu4 flex-1 overflow-y-auto px-6 pb-6 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
        {children}
      </div>
    </div>
  );
}
