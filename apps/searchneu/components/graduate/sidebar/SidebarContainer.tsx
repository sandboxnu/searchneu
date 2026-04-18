"use client";

export function SidebarContainer({
  headerContent,
  children,
}: {
  headerContent: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-neu25 flex h-full flex-col overflow-hidden border-r">
      <div className="shrink-0">{headerContent}</div>
      <div className="[&::-webkit-scrollbar-thumb]:bg-neu4 flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
        {children}
      </div>
    </div>
  );
}
