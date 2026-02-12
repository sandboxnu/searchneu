"use client";

import { SeasonEnum, StatusEnum } from "@/lib/graduate/types";
import { useSupportedMajors } from "../../lib/graduate/useGraduateApi";
import { Plan } from "./frontend/components/Plan/Plan";
import { ScheduleTerm } from "./frontend/components/Plan/ScheduleTerm";

export default function Page() {
  const { data, error } = useSupportedMajors();

  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data available</div>;

  return (
    <div>
      <h1>Hello graduates!</h1>
      <h2>Supported Majors:</h2>
      {/* <pre>{JSON.stringify(data.supportedMajors, null, 2)}</pre> */}
      <ScheduleTerm
        scheduleTerm={{
          season: SeasonEnum.FL,
          status: StatusEnum.CLASSES,
          classes: [
            {
              subject: "CS",
              classId: "5000",
              name: "",
              numCreditsMin: 4,
              numCreditsMax: 4,
              id: ""
            },  
            {
              subject: "MATH",
              classId: "3000",
              name: "",
              numCreditsMin: 4,
              numCreditsMax: 4,
              id: ""
            },
          ],
          id: "1",
        }}
        catalogYear={2023}
        yearNum={1}
        addClassesToTermInCurrPlan={() => {}}
        removeCourseFromTermInCurrPlan={() => {}}
       />
       
      {/* <Plan 
        plan={{
          catalogYear: 2023,
          major: "",
          schedule: { years: [] },  
        }} 
          mutateStudentWithUpdatedPlan={function (updatedPlan: PlanModel<string>): void {
            throw new Error("Function not implemented.");
        }} 
      /> */}
    </div>
  );
}
