import { PropsWithChildren } from "react";
import { DraggableScheduleCourse } from "../ScheduleCourse/ScheduleCourse";

interface SidebarContainerProps {
  title: string;
  subtitle?: string;
  creditsTaken?: number;
  creditsToTake?: number;
  renderCoopBlock?: boolean;
  renderBetaMajorBlock?: boolean;
  renderDropdownWarning?: boolean;
  planId?: string | number;
  isSharedPlan?: boolean;
}

const SidebarContainer: React.FC<PropsWithChildren<SidebarContainerProps>> = ({
  title,
  subtitle,
  creditsTaken,
  creditsToTake,
  renderCoopBlock,
  renderBetaMajorBlock,
  renderDropdownWarning = true,
  planId,
  children,
  isSharedPlan,
}) => {
  return (
    <div className="min-h-full border-r border-neutral-200 pt-8">
      <div className="px-4 pb-4">
        <div className="pb-2">
          {renderBetaMajorBlock && (
            <div className="flex items-center pb-2">
              <span className="mr-2 rounded-md border border-red-500 px-2 py-0.5 text-sm font-bold text-red-600 uppercase">
                Beta Major
              </span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <h1 className="text-2xl leading-tight font-bold text-blue-900">
              {title}
            </h1>
          </div>
        </div>
        {creditsTaken !== undefined && (
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-900">
              {creditsTaken}
              {creditsToTake !== undefined && `/${creditsToTake}`}
            </span>
            <span className="text-blue-900">Credits Completed</span>
          </div>
        )}

        {renderCoopBlock && (
          <div className="mt-2">
            <DraggableScheduleCourse
              isDisabled={false}
              isSharedPlan={isSharedPlan}
              scheduleCourse={null as any} // placeholder
            />
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
};

export default SidebarContainer;
