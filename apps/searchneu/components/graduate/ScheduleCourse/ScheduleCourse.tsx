import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { forwardRef, PropsWithChildren, useState, useContext } from "react";
import {
  INEUReqError,
  IRequiredCourse,
  ScheduleCourse2,
  ScheduleTerm2,
  SeasonEnum,
} from "../../../app/graduate/common/types";
import { CourseDragIcon } from "./CourseDragIcon";

// Types and Contexts assumed to be available in your project scope
// import { TotalYearsContext, COOP_TITLE, FALL_1, SeasonEnum, ... } from "./constants";

interface DraggableScheduleCourseProps {
  scheduleCourse: ScheduleCourse2<string>;
  scheduleTerm?: ScheduleTerm2<string>;
  coReqErr?: INEUReqError;
  preReqErr?: INEUReqError;
  isInSidebar?: boolean;
  isChecked?: boolean;
  /** Function to remove the course from whatever the schedule it is part of. */
  removeCourse?: (course: ScheduleCourse2<unknown>) => void;
  isEditable?: boolean;
  isDisabled?: boolean;
  /** Only provide this prop to the overlay course being dragged around the screen. */
  setIsRemove?: (val: boolean) => void;
  isSharedPlan?: boolean;
}

/** This is the static course on the page that can be dragged around. */
export const DraggableScheduleCourse: React.FC<
  DraggableScheduleCourseProps
> = ({
  scheduleCourse,
  scheduleTerm,
  removeCourse,
  preReqErr = undefined,
  coReqErr = undefined,
  isInSidebar = false,
  isChecked = false,
  isEditable = false,
  isDisabled = false,
  isSharedPlan,
}) => {
  const { setNodeRef, transform, listeners, attributes, isDragging } =
    useDraggable({
      id: scheduleCourse.id,
      data: {
        course: scheduleCourse,
      },
      disabled: isDisabled,
    });

  return (
    <ScheduleCourse
      coReqErr={coReqErr}
      preReqErr={preReqErr}
      ref={setNodeRef}
      scheduleCourse={scheduleCourse}
      scheduleTerm={scheduleTerm}
      removeCourse={removeCourse}
      isInSidebar={isInSidebar}
      isChecked={isChecked}
      isEditable={isEditable}
      isDragging={isDragging}
      listeners={listeners}
      attributes={attributes}
      transform={CSS.Translate.toString(transform)}
      isDisabled={isDisabled}
      // isFromSidebar={isCourseFromSidebar(scheduleCourse.id)}
      isFromSidebar={true}
      isDraggable
      isSharedPlan={isSharedPlan}
    />
  );
};

interface DraggedScheduleCourseProps {
  /** The course being dragged around */
  activeCourse: ScheduleCourse2<string>;
  /** Is the course overlay being dragged over the delete course area? */
  isRemove: boolean;
}

/** The course overlay that is being dragged around the screen. */
export const DraggedScheduleCourse: React.FC<DraggedScheduleCourseProps> = ({
  activeCourse,
  isRemove,
}) => {
  return (
    <ScheduleCourse
      isDisabled={false}
      isOverlay
      scheduleCourse={activeCourse}
      isRemove={isRemove}
      // isFromSidebar={isCourseFromSidebar(activeCourse.id)}
      isFromSidebar={true}
      isDraggable
    />
  );
};

interface NonDraggableScheduleCourseProps {
  scheduleCourse: ScheduleCourse2<unknown>;
  removeCourse: (course: ScheduleCourse2<unknown>) => void;
}

export const NonDraggableScheduleCourse: React.FC<
  NonDraggableScheduleCourseProps
> = ({ scheduleCourse, removeCourse }) => {
  return (
    <ScheduleCourse
      scheduleCourse={scheduleCourse}
      isDisabled={false}
      isEditable={true}
      removeCourse={removeCourse}
      isDraggable={false}
    />
  );
};

interface PlaceholderScheduleCourseProps {
  course: IRequiredCourse;
}

export const PlaceholderScheduleCourse: React.FC<
  PlaceholderScheduleCourseProps
> = ({ course }) => {
  return (
    // <GraduateToolTip label={SEARCH_NEU_FETCH_COURSE_ERROR_MSG}>
    //   <div className="bg-white flex rounded-[5px] text-[14px] items-stretch mb-[6px] p-[6px] transition-transform duration-150 ease-out justify-between">
    //     <p className="font-bold">
    //       {course.subject}
    //       <span className="ml-[2px]">{course.classId}</span>
    //     </p>
    //   </div>
    // </GraduateToolTip>
    <p>empty</p>
  );
};

interface ScheduleCourseProps extends Omit<
  DraggableScheduleCourseProps,
  "scheduleCourse"
> {
  scheduleCourse: ScheduleCourse2<unknown>;
  isDragging?: boolean;
  listeners?: any;
  attributes?: any;
  transform?: string;
  isDisabled: boolean;
  isOverlay?: boolean;
  isRemove?: boolean;
  isFromSidebar?: boolean;
  isDraggable?: boolean;
  isSharedPlan?: boolean;
}

/** A ScheduleCourse is purely stylistic. */
// eslint-disable-next-line react/display-name
const ScheduleCourse = forwardRef<HTMLDivElement | null, ScheduleCourseProps>(
  (
    {
      coReqErr = undefined,
      preReqErr = undefined,
      scheduleCourse,
      scheduleTerm,
      removeCourse,
      isInSidebar = false,
      isChecked = false,
      isEditable = false,
      isDragging = false,
      listeners,
      attributes,
      transform,
      isOverlay = false,
      isRemove,
      isFromSidebar,
      isDraggable,
      isSharedPlan,
    },
    ref,
  ) => {
    const [hovered, setHovered] = useState(false);
    const isValidRemove = isRemove && !isFromSidebar;
    // const totalYears = useContext(TotalYearsContext);
    const totalYears = 2;
    const isFinalYear =
      scheduleTerm && parseInt(scheduleTerm.id[0]) === totalYears;

    const isCourseError = coReqErr !== undefined || preReqErr !== undefined;
    // (scheduleCourse.name === COOP_TITLE &&
    //   scheduleTerm !== undefined &&
    //   (scheduleTerm.id === FALL_1 ||
    //     (isFinalYear && scheduleTerm.season === SeasonEnum.SP)));

    const renderedScheduleCourse = (
      <div
        className={`mb-[6px] flex w-full items-stretch justify-between rounded-[10px] text-[14px] transition-all duration-150 ease-out ${isOverlay ? "bg-gray-300" : "bg-white"} ${isDragging && !isFromSidebar ? "invisible" : "visible"} ${hovered && isDraggable ? "scale-[1.04]" : "scale-100"} ${isValidRemove ? "opacity-50" : "opacity-100"} `}
        style={{ transform }}
        onMouseEnter={() => {
          !isSharedPlan && setHovered(true);
        }}
        onMouseLeave={() => {
          !isSharedPlan && setHovered(false);
        }}
        ref={ref}
        {...attributes}
      >
        <ScheduleCourseDraggedContents
          scheduleCourse={scheduleCourse}
          listeners={listeners}
          isOverlay={isOverlay}
          isDraggable={isDraggable}
          isSharedPlan={isSharedPlan}
        />
        <div className="flex items-center">
          {isCourseError &&
            /* <ReqErrorModal ... /> */
            null}
          {isEditable &&
            hovered &&
            !isSharedPlan &&
            /* <CourseTrashButton ... /> */
            null}
          {isInSidebar && isChecked && (
            <div className="relative m-2 flex h-[18px] w-[18px] items-center justify-center rounded-full border border-[#22c55e] bg-[#22c55e] text-white transition-all delay-100 duration-200">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="h-[9px] w-[9px]"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          )}

          {isEditable && !hovered && <ScheduleCourseSpacer />}

          {isOverlay && !isFromSidebar && (
            <>
              <ScheduleCourseSpacer />
              <ScheduleCourseSpacer />
            </>
          )}
        </div>
      </div>
    );

    return isValidRemove ? (
      <ScheduleCourseRemoveOverlay>
        {renderedScheduleCourse}
      </ScheduleCourseRemoveOverlay>
    ) : (
      renderedScheduleCourse
    );
  },
);

const ScheduleCourseRemoveOverlay: React.FC<PropsWithChildren> = ({
  children,
}) => {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 z-10 flex h-full w-full items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-[17.5px] w-[17.5px] text-[#ef4444]"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </div>
      {children}
    </div>
  );
};

interface ScheduleCourseDraggedContentsProps {
  scheduleCourse: ScheduleCourse2<unknown>;
  listeners: any;
  isOverlay: boolean;
  isDraggable?: boolean;
  isSharedPlan?: boolean;
}

const ScheduleCourseDraggedContents: React.FC<
  ScheduleCourseDraggedContentsProps
> = ({ scheduleCourse, listeners, isOverlay, isDraggable, isSharedPlan }) => {
  return (
    <div
      className={`flex-grow ${isDraggable ? "px-2 py-2" : "px-3 py-2"} ${isOverlay ? "cursor-grabbing" : isDraggable ? "cursor-grab" : "cursor-default"} `}
      {...listeners}
    >
      <div className="flex h-full w-full items-center">
        {isDraggable && !isSharedPlan && <CourseDragIcon />}
        <p className="leading-[1.3]">
          <span className="mr-[2px] font-bold">
            {/* {`${courseToString(scheduleCourse)} `} */}
            placeholder
          </span>
          <span>{scheduleCourse.name}</span>
        </p>
      </div>
    </div>
  );
};

const ScheduleCourseSpacer: React.FC = () => {
  return <div className="h-8 w-8 flex-shrink-0" />;
};

export function getSearchLink(
  catalogYear: number,
  szn: SeasonEnum,
  course: ScheduleCourse2<unknown>,
): string {
  let sznInt = -1;
  switch (szn) {
    case SeasonEnum.FL:
      sznInt = 1;
      break;
    case SeasonEnum.SP:
      sznInt = 3;
      break;
    case SeasonEnum.S1:
      sznInt = 4;
      break;
    case SeasonEnum.SM:
      sznInt = 5;
      break;
    case SeasonEnum.S2:
      sznInt = 6;
      break;
    default:
      sznInt = 1;
  }
  return `https://searchneu.com/NEU/${catalogYear}${sznInt}${0}/search/${
    course.name
  }`;
}
