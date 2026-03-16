"use client";
import { type PropsWithChildren } from "react";
import { UNDECIDED_CONCENTRATION } from "@/lib/graduate/auditUtils";

export interface SidebarContainerProps {
  title: string;
  subtitle?: string;
  creditsTaken?: number;
  creditsToTake?: number;
  renderBetaMajorBlock?: boolean;
}

export function SidebarContainer({
  title,
  subtitle,
  creditsTaken,
  creditsToTake,
  renderBetaMajorBlock,
  children,
}: PropsWithChildren<SidebarContainerProps>) {
  const isUndecided = subtitle === UNDECIDED_CONCENTRATION;

  return (
    <div className="border-neu25 flex h-full flex-col overflow-hidden border-r">
      <div className="shrink-0 px-4 pt-8 pb-4">
        {renderBetaMajorBlock && (
          <div className="flex items-center pb-2">
            <span className="border-red text-red rounded-md border px-2 py-0.5 text-sm font-bold">
              BETA MAJOR
            </span>
          </div>
        )}
        <div className="pb-2">
          <h1 className="text-navy text-2xl font-bold">{title}</h1>
          {subtitle && (
            <p
              className={`text-sm ${isUndecided ? "text-red italic" : "text-navy"}`}
            >
              {subtitle}
            </p>
          )}
        </div>
        {creditsTaken !== undefined && (
          <div className="mb-2 flex items-baseline gap-1">
            <span className="text-navy text-2xl font-bold">
              {creditsTaken}
              {creditsToTake !== undefined ? `/${creditsToTake}` : ""}
            </span>
            <span className="text-navy">Credits Completed</span>
          </div>
        )}
      </div>

      {/* Scrollable content area */}
      <div className="[&::-webkit-scrollbar-thumb]:bg-neu4 flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
        {children}
      </div>
    </div>
  );
}

export default SidebarContainer;
