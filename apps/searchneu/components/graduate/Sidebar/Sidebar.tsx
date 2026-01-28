"use client";

import { memo, useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import SidebarContainer from "./SidebarContainer";
import { RequirementTabPanel, RequirementType } from "./RequirementTabPabel";
import {
  NUPathEnum,
  ScheduleCourse2,
} from "../../../app/graduate/common/types";
import NUPathSection from "./NUPathSection";

export enum SidebarValidationStatus {
  Loading = "Loading",
  Error = "Error",
  Complete = "Complete",
  InProgress = "InProgress",
}

export const COOP_BLOCK: ScheduleCourse2<string> = {
  name: "Co-op Education",
  classId: "Experiential Learning",
  subject: "",
  numCreditsMax: 8,
  numCreditsMin: 0,
  // id: `${SIDEBAR_DND_ID_PREFIX}-co-op-block"`,
  id: `co-op-block"`,
  nupaths: [NUPathEnum.EX],
};

interface SidebarProps {
  selectedPlan: any;
  transferCourses: any[];
  isSharedPlan: boolean;
}

const Sidebar: React.FC<SidebarProps> = memo(
  ({ selectedPlan, transferCourses, isSharedPlan }) => {
    const router = useRouter();
    const [currentMajorIndex, setCurrentMajorIndex] = useState(0);
    const [currentMinorIndex, setCurrentMinorIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<"major" | "minor">("major");

    const {
      majors,
      isLoading: isMajorLoading,
      error: majorError,
      // } = useMajor(selectedPlan.catalogYear, selectedPlan.majors);
    } = { majors: [], isLoading: false, error: null }; // Placeholder for useMajor hook

    const concentration = undefined;
    // majors.length > 1
    //   ? undefined
    //   : majors[0]?.concentrations?.concentrationOptions.find(
    //       (c) => c.title === selectedPlan.concentration,
    //     );

    const {
      minors,
      isLoading: isMinorLoading,
      error: minorError,
      // } = useMinor(selectedPlan.catalogYear, selectedPlan.minors);
    } = { minors: [], isLoading: false, error: null }; // Placeholder for useMinor hook

    useEffect(() => {
      setCurrentMajorIndex(0);
      setCurrentMinorIndex(0);
      setActiveTab("major");
    }, [selectedPlan.id, majors.length, minors.length]);

    const currentMajor = majors[currentMajorIndex];
    const currentMinor = minors[currentMinorIndex];
    // const workerRef = useRef<Worker>();
    // const [validationStatus, setValidationStatus] =
    //   useState<// MajorValidationResult | undefined
    //   undefined>(undefined);

    const coursesTaken: ScheduleCourse2<unknown>[] = [
      // ...getAllCoursesFromPlan(selectedPlan),
      // ...transferCourses,
    ];

    const revalidateMajor = () => {
      // setValidationStatus(undefined);
      // if (!selectedPlan || !currentMajor || !workerRef.current) return;
      // currentRequestNum += 1;
      // const validationInfo: WorkerPostInfo = {
      //   major: currentMajor,
      //   minor: currentMinor,
      //   taken: coursesTaken,
      //   concentration: selectedPlan.concentration,
      //   requestNumber: currentRequestNum,
      // };

      // workerRef.current?.postMessage(validationInfo);
      return;
    };

    // Set up the web worker to handle major validation for us. This helps keep the
    // UI thread free to display our app, preventing UI freezes while our schedule
    // is being validated.
    // useEffect(() => {
    //   if (!workerRef.current) {
    //     workerRef.current = new Worker(
    //       new URL("../../validation-worker/worker.ts", import.meta.url),
    //     );
    //     workerRef.current.onmessage = (
    //       message: MessageEvent<WorkerMessage>,
    //     ) => {
    //       switch (message.data.type) {
    //         case WorkerMessageType.Loaded:
    //           revalidateMajor();
    //           break;
    //         case WorkerMessageType.ValidationResult:
    //           // Only update valdation information if it was from the latest request.
    //           // This helps us avoid displaying outdated information that could be sent
    //           // due to race conditions.
    //           if (message.data.requestNumber === currentRequestNum) {
    //             setValidationStatus(message.data.result);
    //           }

    //           break;
    //         default:
    //           throw new Error("Invalid worker message!");
    //       }
    //     };
    //   }
    //   return () => {
    //     workerRef.current?.terminate();
    //     workerRef.current = undefined;
    //   };
    //   // LINT NOTE: We don't actually want a dependency to the local function
    //   // revalidateMajor because it will change every time, so we're choosing
    //   // to omit it here:
    //   // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, []);

    // useEffect(
    //   () => revalidateMajor(),
    //   [selectedPlan, currentMajor, currentMinor],
    // );

    // const majorCourses = getAllCoursesInMajor(currentMajor, concentration);
    // const minorCourses = getAllCoursesInMinor(currentMinor);

    // const {
    //   courses,
    //   isLoading: isCoursesLoading,
    //   error: courseErrors,
    // } = useFetchCourses(
    //   majorCourses.concat(minorCourses),
    //   selectedPlan.catalogYear,
    // );

    // const courseData = createCourseMap(courses, courseErrors);

    // if (isMajorLoading || isMinorLoading)
    //   return <SidebarContainer title="Loading..." />;
    // if (!currentMajor)
    //   return <SidebarContainer title={majorError ? "Major not found" : ""} />;

    // const getSectionErrorByType = (
    //   requirementType: RequirementType,
    //   sectionIndex: number,
    //   status: any,
    // ) => {
    //   const andIndex = requirementType === "major" ? 0 : 1;
    //   return getSectionError(andIndex, sectionIndex, status);
    // };

    // const creditsTaken = totalCreditsInSchedule(
    //   selectedPlan.schedule,
    //   transferCourses,
    // );

    return (
      <SidebarContainer
        // title={currentMajor.name}
        title={"Test title for now"}
        subtitle={
          // selectedPlan.concentration === UNDECIDED_STRING
          //   ? UNDECIDED_CONCENTRATION
          //   : selectedPlan.concentration
          selectedPlan.concentration
        }
        // creditsTaken={creditsTaken}
        creditsTaken={100}
        // creditsToTake={currentMajor.totalCreditsRequired}
        creditsToTake={120}
        renderCoopBlock
        // renderBetaMajorBlock={currentMajor.metadata?.verified !== true}
        renderDropdownWarning={false}
        planId={selectedPlan.id}
        isSharedPlan={isSharedPlan}
      >
        {true /* {courseData && ( */}
        <div className="flex flex-col">
          {/* <GenericSection
              courseData={courseData}
              dndIdPrefix={`${SIDEBAR_DND_ID_PREFIX}-generic`}
              loading={isCoursesLoading}
              isSharedPlan={isSharedPlan}
            /> */}
          <NUPathSection
            coursesTaken={coursesTaken}
            // dndIdPrefix={`${SIDEBAR_DND_ID_PREFIX}-nupath`}
            dndIdPrefix={`nupath-section`}
            // loading={isCoursesLoading}
            loading={false}
          />

          {/* Tabs Container */}
          <div className="mt-3 bg-neutral-50">
            <div className="flex gap-2 border-b-2 border-neutral-200 px-4">
              <button
                onClick={() => setActiveTab("major")}
                className={`flex-1 rounded-t-lg p-2 text-sm font-bold transition-colors ${
                  activeTab === "major"
                    ? "bg-blue-800 text-white"
                    : "bg-transparent text-gray-600 hover:bg-neutral-100"
                }`}
              >
                MAJOR
              </button>
              {currentMinor && (
                <button
                  onClick={() => setActiveTab("minor")}
                  className={`flex-1 rounded-t-lg p-2 text-sm font-bold transition-colors ${
                    activeTab === "minor"
                      ? "bg-blue-800 text-white"
                      : "bg-transparent text-gray-600 hover:bg-neutral-100"
                  }`}
                >
                  MINOR
                </button>
              )}
            </div>

            <div className="py-4">
              {activeTab === "major" ? (
                <RequirementTabPanel
                  requirement={currentMajor}
                  currentIndex={currentMajorIndex}
                  totalCount={majors.length}
                  onPrevious={() =>
                    setCurrentMajorIndex((prev) =>
                      prev > 0 ? prev - 1 : majors.length - 1,
                    )
                  }
                  onNext={() =>
                    setCurrentMajorIndex((prev) =>
                      prev < majors.length - 1 ? prev + 1 : 0,
                    )
                  }
                  // courseData={courseData}
                  courseData={{}}
                  // dndIdPrefix={`${SIDEBAR_DND_ID_PREFIX}`}
                  dndIdPrefix={`major-requirement`}
                  // isCoursesLoading={isCoursesLoading}
                  isCoursesLoading={false}
                  coursesTaken={coursesTaken}
                  // validationStatus={validationStatus}
                  validationStatus={SidebarValidationStatus.Complete}
                  // getSectionError={getSectionErrorByType}
                  getSectionError={() => null}
                  requirementType="major"
                  concentration={concentration}
                  isSharedPlan={isSharedPlan}
                  getSidebarValidationStatus={function (error?: any) {
                    throw new Error("Function not implemented.");
                  }}
                />
              ) : (
                currentMinor && (
                  <RequirementTabPanel
                    requirement={currentMinor}
                    currentIndex={currentMinorIndex}
                    totalCount={minors.length}
                    onPrevious={() =>
                      setCurrentMinorIndex((prev) =>
                        prev > 0 ? prev - 1 : minors.length - 1,
                      )
                    }
                    onNext={() =>
                      setCurrentMinorIndex((prev) =>
                        prev < minors.length - 1 ? prev + 1 : 0,
                      )
                    }
                    // courseData={courseData}
                    courseData={{}}
                    // dndIdPrefix={`${SIDEBAR_DND_ID_PREFIX}-minor`}
                    dndIdPrefix={`minor-requirement`}
                    // isCoursesLoading={isCoursesLoading}
                    isCoursesLoading={false}
                    coursesTaken={coursesTaken}
                    // validationStatus={validationStatus}
                    validationStatus={SidebarValidationStatus.Complete}
                    // getSectionError={getSectionErrorByType}
                    getSectionError={() => null}
                    requirementType="minor"
                    isSharedPlan={isSharedPlan}
                    getSidebarValidationStatus={function (error?: any) {
                      throw new Error("Function not implemented.");
                    }}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </SidebarContainer>
    );
  },
);

interface NoMajorSidebarProps {
  selectedPlan: any;
  transferCourses: any[];
  isSharedPlan: boolean;
}

export const NoMajorSidebar: React.FC<NoMajorSidebarProps> = ({
  selectedPlan,
  transferCourses,
  isSharedPlan,
}) => {
  // const creditsTaken = totalCreditsInSchedule(
  //   selectedPlan.schedule,
  //   transferCourses,
  // );
  const creditsTaken = 100;
  return (
    <SidebarContainer
      title="No Major"
      creditsTaken={creditsTaken}
      renderCoopBlock
      renderDropdownWarning={false}
      planId={selectedPlan.id}
      isSharedPlan={isSharedPlan}
    >
      <div className="mb-3 flex flex-col gap-3 px-4">
        <p className="text-gray-700">
          A major has not been selected for this plan. Please select one if you
          would like to see major requirements. If we do not support your major,
          you can{" "}
          <a
            className="font-bold text-blue-600 hover:underline"
            href="https://forms.gle/o5AHSuFSwDJREEPp7"
            target="_blank"
            rel="noopener noreferrer"
          >
            request it here
          </a>
          .
        </p>
        <p className="text-gray-700">
          Use the “Add Course” button in the schedule to add a course to a
          semester.
        </p>
      </div>
    </SidebarContainer>
  );
};

export { Sidebar };
