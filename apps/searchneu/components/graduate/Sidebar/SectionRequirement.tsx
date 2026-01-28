"use client";

import React from "react";
// import {
//   IAndCourse2,
//   ICourseRange2,
//   IOrCourse2,
//   IRequiredCourse,
//   IXofManyCourse,
//   Requirement2,
//   ScheduleCourse2,
//   Section,
// } from "@graduate/common";
import {
  DraggableScheduleCourse,
  PlaceholderScheduleCourse,
} from "../ScheduleCourse/ScheduleCourse";
import { SidebarValidationStatus } from "./Sidebar";
import SidebarSection from "./SidebarSection";
import {
  IAndCourse2,
  ICourseRange2,
  IOrCourse2,
  IRequiredCourse,
  IXofManyCourse,
  Requirement2,
  ScheduleCourse2,
  Section,
} from "../../../app/graduate/common/types";

interface SidebarRequirementProps {
  requirement: Requirement2;
  courseData: { [id: string]: ScheduleCourse2<null> };
  dndIdPrefix: string;
  coursesTaken: ScheduleCourse2<unknown>[];
  isSharedPlan?: boolean;
}

const SectionRequirement: React.FC<SidebarRequirementProps> = ({
  requirement,
  courseData,
  dndIdPrefix,
  coursesTaken,
  isSharedPlan,
}) => {
  const renderRequirement = () => {
    switch (requirement.type) {
      case "XOM":
        return renderXOM(requirement);
      case "AND":
        return renderAND(requirement);
      case "OR":
        return renderOR(requirement);
      case "RANGE":
        return renderRange(requirement);
      case "COURSE":
        return renderCourse(requirement);
      case "SECTION":
        return renderSection(requirement);
      default:
        throw new Error(`Unreachable code! Unknown sidebar section type.`);
    }
  };

  const isCourseInPlan = (requirement: Requirement2): boolean => {
    let isTrue = false;
    if (coursesTaken) {
      coursesTaken.forEach((course) => {
        if (
          requirement.type === "COURSE"
          //   && getCourseDisplayString(course) === getCourseDisplayString(requirement)
        ) {
          isTrue = true;
        }
      });
    }
    return isTrue;
  };

  const renderXOM = (requirement: IXofManyCourse) => {
    return (
      <div>
        <p className="text-sm italic">
          Complete {requirement.numCreditsMin} credits from the following:
        </p>
        {requirement.courses.map(
          (course: any, index: React.Key | null | undefined) => (
            <SectionRequirement
              requirement={course}
              courseData={courseData}
              coursesTaken={coursesTaken}
              dndIdPrefix={dndIdPrefix + "-" + index}
              key={index}
              isSharedPlan={isSharedPlan}
            />
          ),
        )}
      </div>
    );
  };

  const renderAND = (requirement: IAndCourse2) => {
    return (
      <div>
        <p className="text-sm italic">Complete all of the following:</p>
        {requirement.courses.map(
          (course: any, index: React.Key | null | undefined) => (
            <SectionRequirement
              requirement={course}
              courseData={courseData}
              coursesTaken={coursesTaken}
              dndIdPrefix={dndIdPrefix + "-" + index}
              key={index}
              isSharedPlan={isSharedPlan}
            />
          ),
        )}
      </div>
    );
  };

  const renderOR = (requirement: IOrCourse2) => {
    return (
      <div>
        <p className="text-sm italic">Complete 1 of the following:</p>
        {requirement.courses.map(
          (course: any, index: React.Key | null | undefined) => (
            <SectionRequirement
              requirement={course}
              courseData={courseData}
              coursesTaken={coursesTaken}
              dndIdPrefix={dndIdPrefix + "-" + index}
              key={index}
              isSharedPlan={isSharedPlan}
            />
          ),
        )}
      </div>
    );
  };

  const renderRange = (requirement: ICourseRange2) => {
    return (
      <p className="text-sm italic">
        Complete any course in range {requirement.subject}
        {requirement.idRangeStart} to {requirement.subject}
        {requirement.idRangeEnd}{" "}
        {requirement.exceptions.length > 0 && (
          <>
            except{" "}
            {/* {requirement.exceptions.map(getCourseDisplayString).join(", ")} */}
          </>
        )}
      </p>
    );
  };

  const renderCourse = (requirement: IRequiredCourse) => {
    const courseKey = `${requirement.subject}${requirement.classId}`;
    const scheduleCourse = courseData[courseKey];

    if (scheduleCourse) {
      return (
        <DraggableScheduleCourse
          scheduleCourse={{
            ...scheduleCourse,
            id: dndIdPrefix + "-" + courseKey,
          }}
          isInSidebar
          isChecked={isCourseInPlan(requirement)}
          isDisabled={false}
          isSharedPlan={isSharedPlan}
        />
      );
    }

    return <PlaceholderScheduleCourse course={requirement} />;
  };

  const renderSection = (requirement: Section) => {
    return (
      <SidebarSection
        validationStatus={SidebarValidationStatus.Complete}
        section={requirement}
        courseData={courseData}
        coursesTaken={coursesTaken}
        dndIdPrefix={dndIdPrefix + "-sec"}
        isSharedPlan={isSharedPlan}
      />
    );
  };

  return <div className="pt-2 pl-2">{renderRequirement()}</div>;
};

export default SectionRequirement;
