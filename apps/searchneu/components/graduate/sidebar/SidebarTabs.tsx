"use client";

export type SidebarTab = "general" | "majors" | "minors";

export function SidebarTabs({
  activeTab,
  onTabChange,
  hasMinors,
}: {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  hasMinors: boolean;
}) {
  const tabs: { key: SidebarTab; label: string }[] = [
    { key: "general", label: "General" },
    { key: "majors", label: "Majors" },
    ...(hasMinors ? [{ key: "minors" as const, label: "Minors" }] : []),
  ];

  return (
    <div className="border-neu2 flex border-b">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onTabChange(tab.key)}
          className={`flex-1 px-2 py-2 text-xs font-semibold tracking-wider uppercase transition-colors ${
            activeTab === tab.key
              ? "text-neu6 border-neu4 border-b"
              : "text-neu4 hover:text-neu6 border-b border-transparent"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
