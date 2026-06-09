import { ModalCourse } from "@/lib/scheduler/types";
import { DeleteIcon } from "../../../icons/Delete";
import { Button } from "@/components/ui/button";

interface SelectedCourse {
  subject: string;
  courseNumber: string;
  title: string;
  handleDelete: () => void;
  isGrouped?: boolean;
}

const SelectedCourseItem = ({ course }: { course: SelectedCourse }) => {
  const containerClass = [
    "group text-neu6 bg-neu0 flex h-[50px] w-full flex-row items-center justify-between px-[16px] text-[12px] transition-colors",
    course.isGrouped ? "rounded-none" : "rounded-lg",
  ].join(" ");

  return (
    <div className={containerClass}>
      <p className="m-0 flex min-w-0 items-center gap-2">
        <span className="text-neu8 shrink-0 text-[14px] font-bold">
          {course.subject} {course.courseNumber}
        </span>
        <span className="truncate">{course.title}</span>
      </p>
      <Button
        onClick={course.handleDelete}
        variant="ghost"
        size="icon"
        className="hidden group-hover:flex"
      >
        <DeleteIcon />
      </Button>
    </div>
  );
};

const SelectedCourseGroup = ({
  parent,
  coreqs,
  onDeleteCourse,
}: {
  parent: ModalCourse;
  coreqs: ModalCourse[];
  onDeleteCourse: (course: ModalCourse, isCoreq: boolean) => void;
}) => {
  return (
    <div className="border-neu2 flex min-h-fit flex-col overflow-hidden rounded-lg border">
      {/* parent */}
      <SelectedCourseItem
        course={{
          subject: parent.subjectCode,
          courseNumber: parent.courseNumber,
          title: parent.name,
          handleDelete: () => onDeleteCourse(parent, false),
          isGrouped: coreqs.length > 0,
        }}
      />

      {/* coreqs */}
      {coreqs.map((coreq, idx) => (
        <div key={idx} className="border-neu2 border-t">
          <SelectedCourseItem
            course={{
              subject: coreq.subjectCode,
              courseNumber: coreq.courseNumber,
              title: coreq.name ?? "Corequisite",
              handleDelete: () => onDeleteCourse(coreq, true),
              isGrouped: true,
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default SelectedCourseGroup;
