"use client";

import { useState } from "react";
import { Audit, Major, Minor } from "@/lib/graduate/types";
import { creditsInAudit } from "@/lib/graduate/auditUtils";
import { SidebarContainer } from "./SidebarContainer";
import { SidebarTabs, SidebarTab } from "./SidebarTabs";
import { GeneralTab } from "./GeneralTab";
import { MajorsTab } from "./MajorsTab";
import { MinorsTab } from "./MinorsTab";

export function Sidebar({
  schedule,
  majors,
  minors,
  concentration,
}: {
  schedule: Audit;
  majors: Major[];
  minors: Minor[];
  concentration: string | null;
}) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("majors");
  const currentMajor = majors?.[0] ?? null;
  const creditsTotal = currentMajor?.totalCreditsRequired ?? 0;
  const creditsTaken = creditsInAudit(schedule);

  if (!schedule) {
    return (
      <SidebarContainer
        headerContent={
          <div className="px-4 pt-8 pb-4">
            <h1 className="text-navy text-2xl font-bold">
              Failed to load major
            </h1>
          </div>
        }
      >
        <div className="px-4 py-8 text-center">
          <span className="text-neu6 text-xs">
            Schedule data is unavailable
          </span>
        </div>
      </SidebarContainer>
    );
  }

  return (
    <SidebarContainer
      headerContent={
        <SidebarTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          hasMinors={minors.length > 0}
        />
      }
    >
      {activeTab === "general" && (
        <GeneralTab
          schedule={schedule}
          creditsTaken={creditsTaken}
          creditsTotal={creditsTotal}
        />
      )}
      {activeTab === "majors" && (
        <MajorsTab
          schedule={schedule}
          majors={majors}
          concentration={concentration}
          creditsTaken={creditsTaken}
          creditsTotal={creditsTotal}
        />
      )}
      {activeTab === "minors" && (
        <MinorsTab
          schedule={schedule}
          minors={minors}
          creditsTaken={creditsTaken}
          creditsTotal={creditsTotal}
        />
      )}
    </SidebarContainer>
  );
}
