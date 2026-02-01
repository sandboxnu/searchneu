import { Course } from "@sneu/scraper/types";
import { DeleteIcon } from "../icons/Delete";
import { LockIcon } from "../icons/Lock";

interface SelectedCourse {
  subject: string;
  courseNumber: string;
  title: string;
  handleDelete: () => void;
  isGrouped?: boolean;
}

const SelectedCourseItem = ({
  course,
  onToggleLock,
  isLocked,
  canLock = true,
}: {
  course: SelectedCourse;
  onToggleLock: () => void;
  isLocked: boolean;
  canLock?: boolean;
}) => {
  const containerClass = [
    "group text-neu6 hover:bg-neu2 bg-neu1 flex h-[50px] w-full flex-row items-center justify-between px-[16px] text-[12px] transition-colors",
    course.isGrouped ? "rounded-none" : "rounded-lg",
  ].join(" ");

  return (
    <div className={containerClass}>
      <p className="m-0 flex min-w-0 items-center gap-[8px]">
        {canLock && (
          <button
            onClick={onToggleLock}
            className="cursor-pointer rounded-md p-1"
          >
            <LockIcon isLocked={isLocked} />
          </button>
        )}
        <span className="text-neu8 shrink-0 text-[14px] font-bold">
          {course.subject} {course.courseNumber}
        </span>
        <span className="truncate">{course.title}</span>
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
  onDelete,
  onToggleLock,
  isLocked,
}: {
  parent: Course;
  coreqs: Course[];
  onDelete: () => void;
  onToggleLock: () => void;
  isLocked: boolean;
}) => {
  return (
    <div className="border-neu3 flex flex-col overflow-hidden rounded-lg border">
      {/* parent */}
      <SelectedCourseItem
        course={{
          subject: parent.subject,
          courseNumber: parent.courseNumber,
          title: parent.name,
          handleDelete: onDelete,
          isGrouped: coreqs.length > 0,
        }}
        onToggleLock={onToggleLock}
        isLocked={isLocked}
        canLock={true}
      />

      {/* coreqs */}
      {coreqs.map((coreq, idx) => (
        <div key={idx} className="border-neu3 border-t">
          <SelectedCourseItem
            course={{
              subject: coreq.subject,
              courseNumber: coreq.courseNumber,
              title: coreq.name ?? "Corequisite",
              handleDelete: onDelete, // deleting parent deletes whole group
              isGrouped: true,
              // coreqs dont have individual lock state
            }}
            onToggleLock={onToggleLock}
            isLocked={isLocked}
            canLock={false}
          />
        </div>
      ))}
    </div>
  );
};

export default SelectedCourseGroup;
