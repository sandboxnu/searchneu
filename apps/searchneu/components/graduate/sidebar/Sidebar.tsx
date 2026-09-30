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
