import { MouseEventHandler } from "react";

interface CourseTrashButtonProps {
  onClick: MouseEventHandler<HTMLDivElement> | undefined;
}

export const CourseTrashButton: React.FC<CourseTrashButtonProps> = ({
  onClick,
}) => {
  return (
    <div
      className="group flex w-8 flex-shrink-0 cursor-pointer items-center justify-center self-stretch rounded-r-[5px] transition-colors duration-150 ease-in-out hover:bg-blue-900 active:bg-blue-950"
      onClick={onClick}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 text-blue-300 transition-colors duration-100 ease-in-out group-hover:text-white"
      >
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      </svg>
    </div>
  );
};
