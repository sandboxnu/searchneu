import React, { type PropsWithChildren } from "react";

const UNDECIDED_CONCENTRATION = "Concentration Undecided";

export interface SidebarContainerProps {
  title: string;
  subtitle?: string;
  creditsTaken?: number;
  creditsToTake?: number;
  renderBetaMajorBlock?: boolean;
}

const SidebarContainer: React.FC<PropsWithChildren<SidebarContainerProps>> = ({
  title,
  subtitle,
  creditsTaken,
  creditsToTake,
  renderBetaMajorBlock,
  children,
}) => {
  const isUndecided = subtitle === UNDECIDED_CONCENTRATION;

  return (
    <div className="flex h-full flex-col overflow-hidden border-r border-neutral-200">
      <div className="shrink-0 px-4 pt-8 pb-4">
        {renderBetaMajorBlock && (
          <div className="flex items-center pb-2">
            <span className="rounded-md border border-red-500 px-2 py-0.5 text-sm font-bold text-red-600">
              BETA MAJOR
            </span>
          </div>
        )}
        <div className="pb-2">
          <h1 className="text-2xl font-bold text-blue-900">{title}</h1>
          {subtitle && (
            <p
              className={`text-sm ${isUndecided ? "text-red-500 italic" : "text-blue-900"}`}
            >
              {subtitle}
            </p>
          )}
        </div>
        {creditsTaken !== undefined && (
          <div className="mb-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-blue-900">
              {creditsTaken}
              {creditsToTake !== undefined ? `/${creditsToTake}` : ""}
            </span>
            <span className="text-blue-900">Credits Completed</span>
          </div>
        )}
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300 [&::-webkit-scrollbar-track]:bg-transparent">
        {children}
      </div>
    </div>
  );
};

export default SidebarContainer;
