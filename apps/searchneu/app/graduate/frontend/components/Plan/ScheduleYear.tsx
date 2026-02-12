import { ScheduleCourse2, ScheduleYear2, SeasonEnum, YearError } from "@/lib/graduate/types";
import { useEffect, useState } from "react";

interface ToggleYearProps {
  isExpanded: boolean;
  toggleExpanded: () => void;
}

interface ScheduleYearProps extends ToggleYearProps {
  scheduleYear: ScheduleYear2<string>;
  catalogYear: number;
  yearCoReqError?: YearError;
  yearPreReqError?: YearError;
  isSharedPlan?: boolean;

  /** Function to add classes to a given term in the plan being displayed. */
  addClassesToTermInCurrPlan: (
    classes: ScheduleCourse2<null>[],
    termYear: number,
    termSeason: SeasonEnum
  ) => void;

  /** Function to remove a course from a given term in the plan being displayed. */
  removeCourseFromTermInCurrPlan: (
    course: ScheduleCourse2<unknown>,
    courseIndex: number,
    termYear: number,
    termSeason: SeasonEnum
  ) => void;

  /** Function to remove the curr year from the plan */
  removeYearFromCurrPlan: () => void;
  setIsRemove?: (val: boolean) => void;
}

export const ScheduleYear: React.FC<ScheduleYearProps> = ({
  scheduleYear,
  catalogYear,
  addClassesToTermInCurrPlan,
  removeCourseFromTermInCurrPlan,
  isExpanded,
  toggleExpanded,
  removeYearFromCurrPlan,
  setIsRemove,
  yearCoReqError = undefined,
  yearPreReqError = undefined,
  isSharedPlan = false,
}) => {
  const totalCreditsThisYear = totalCreditsInYear(scheduleYear);
  const [displayReqErrors, setDisplayReqErrors] = useState(false);

  useEffect(() => {
    const classes = [];
    classes.push(...Object.values(yearPreReqError?.fall ?? {}));
    classes.push(...Object.values(yearPreReqError?.spring ?? {}));
    classes.push(...Object.values(yearPreReqError?.summer1 ?? {}));
    classes.push(...Object.values(yearPreReqError?.summer2 ?? {}));
    classes.push(...Object.values(yearCoReqError?.fall ?? {}));
    classes.push(...Object.values(yearCoReqError?.spring ?? {}));
    classes.push(...Object.values(yearCoReqError?.summer1 ?? {}));
    classes.push(...Object.values(yearCoReqError?.summer2 ?? {}));
    setDisplayReqErrors(classes.filter((c) => c != undefined).length > 0);
  }, [yearCoReqError, yearPreReqError]);

  return (
    <Flex flexDirection="column">
      <YearHeader
        year={scheduleYear}
        totalCreditsTaken={totalCreditsThisYear}
        isExpanded={isExpanded}
        toggleExpanded={toggleExpanded}
        removeYearFromCurrPlan={removeYearFromCurrPlan}
        displayReqErrors={displayReqErrors}
        isSharedPlan={isSharedPlan}
      />

      {isExpanded && (
        <Grid templateColumns="repeat(4, 1fr)" minHeight="220px">
          <ScheduleTerm
            yearNum={scheduleYear.year}
            catalogYear={catalogYear}
            termCoReqErr={yearCoReqError?.fall}
            termPreReqErr={yearPreReqError?.fall}
            scheduleTerm={scheduleYear.fall}
            addClassesToTermInCurrPlan={addClassesToTermInCurrPlan}
            removeCourseFromTermInCurrPlan={removeCourseFromTermInCurrPlan}
            setIsRemove={setIsRemove}
            isSharedPlan={isSharedPlan}
          />
          <ScheduleTerm
            yearNum={scheduleYear.year}
            catalogYear={catalogYear}
            termCoReqErr={yearCoReqError?.spring}
            termPreReqErr={yearPreReqError?.spring}
            scheduleTerm={scheduleYear.spring}
            addClassesToTermInCurrPlan={addClassesToTermInCurrPlan}
            removeCourseFromTermInCurrPlan={removeCourseFromTermInCurrPlan}
            setIsRemove={setIsRemove}
            isSharedPlan={isSharedPlan}
          />
          {/* TODO: support summer full term */}
          <ScheduleTerm
            catalogYear={catalogYear}
            yearNum={scheduleYear.year}
            termCoReqErr={yearCoReqError?.summer1}
            termPreReqErr={yearPreReqError?.summer1}
            scheduleTerm={scheduleYear.summer1}
            addClassesToTermInCurrPlan={addClassesToTermInCurrPlan}
            removeCourseFromTermInCurrPlan={removeCourseFromTermInCurrPlan}
            setIsRemove={setIsRemove}
            isSharedPlan={isSharedPlan}
          />
          <ScheduleTerm
            catalogYear={catalogYear}
            yearNum={scheduleYear.year}
            termCoReqErr={yearCoReqError?.summer2}
            termPreReqErr={yearPreReqError?.summer2}
            scheduleTerm={scheduleYear.summer2}
            addClassesToTermInCurrPlan={addClassesToTermInCurrPlan}
            removeCourseFromTermInCurrPlan={removeCourseFromTermInCurrPlan}
            setIsRemove={setIsRemove}
            isSharedPlan={isSharedPlan}
          />
        </Grid>
      )}
    </Flex>
  );
};