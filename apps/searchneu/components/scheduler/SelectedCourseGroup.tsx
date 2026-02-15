import { Course } from "@sneu/scraper/types";
import { DeleteIcon } from "../icons/Delete";

interface SelectedCourse {
  subject: string;
  courseNumber: string;
  title: string;
  handleDelete: () => void;
  isGrouped?: boolean;
}

const SelectedCourseItem = ({
  course,
  isCorequisite = false,
}: {
  course: SelectedCourse;
  isCorequisite?: boolean;
}) => {
  const containerClass = [
    "group text-neu6 hover:bg-neu2 bg-neu1 flex h-[50px] w-full flex-row items-center justify-between px-[16px] text-[12px] transition-colors",
    course.isGrouped ? "rounded-none" : "rounded-lg",
  ].join(" ");

  return (
    <div className={containerClass}>
      <p className="m-0 flex min-w-0 items-center gap-2">
        <span className="text-neu8 shrink-0 text-[14px] font-bold">
          {course.subject} {course.courseNumber}
        </span>
        <span className="truncate">
          {isCorequisite ? "Lab/Recitation for " : ""}
          {course.title}
        </span>
      </p>
      <button
        onClick={course.handleDelete}
        className="invisible cursor-pointer rounded-md p-1 group-hover:visible"
      >
        <DeleteIcon />
      </button>
    </div>
  );
};

const SelectedCourseGroup = ({
  parent,
  coreqs,
  onDeleteCourse,
}: {
  parent: Course;
  coreqs: Course[];
  onDeleteCourse: (course: Course, isCoreq: boolean) => void;
}) => {
  return (
    <div className="border-neu3 flex min-h-fit flex-col overflow-hidden rounded-lg border">
      {/* parent */}
      <SelectedCourseItem
        course={{
          subject: parent.subject,
          courseNumber: parent.courseNumber,
          title: parent.name,
          handleDelete: () => onDeleteCourse(parent, false),
          isGrouped: coreqs.length > 0,
        }}
      />

      {/* coreqs */}
      {coreqs.map((coreq, idx) => (
        <div key={idx} className="border-neu3 border-t">
          <SelectedCourseItem
            course={{
              subject: coreq.subject,
              courseNumber: coreq.courseNumber,
              title: coreq.name ?? "Corequisite",
              handleDelete: () => onDeleteCourse(coreq, true),
              isGrouped: true,
              // coreqs dont have individual lock state
            }}
            isCorequisite={true}
          />
        </div>
      ))}
    </div>
  );
};

export default SelectedCourseGroup;
