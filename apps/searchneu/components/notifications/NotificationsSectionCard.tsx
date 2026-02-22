"use client";
import { BellIcon } from "@/components/icons/BellIcon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrackingSwitch } from "@/components/auth/TrackingSwitch";
import { MeetingBlocks } from "@/components/catalog/SectionTableBlocks";
import { TrackerSection } from "@/app/notifications/page";

export default function NotificationsSectionCard({
  section,
}: {
  section: TrackerSection;
}) {
  return (
    <div className="bg-neu2 border-neu2 flex min-h-[229.538px] max-w-[450px] min-w-[328px] flex-1 flex-col items-start justify-center gap-[10px] rounded-lg border p-3">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-neu7 text-sm leading-[130%] font-bold whitespace-nowrap">
            CRN {section.crn}
          </span>

          <NotificationBells
            messagesSent={section.messageCount}
            messageLimit={section.messageLimit}
            isSubscribed={true}
          />
        </div>

        <div className="ml-auto">
          <TrackingSwitch
            sectionId={section.id}
            inital={true}
            isTermActive={true}
          />
        </div>
      </div>
      <hr className="border-neu4 w-full border-t-[0.5px]" />

      <div className="grid w-full grid-cols-2 gap-x-6 gap-y-3">
        <InfoSection label="MEETING TIMES">
          <MeetingBlocks meetings={section.meetingTimes} crn={section.crn} />
        </InfoSection>

        <InfoSection label="PROFESSOR">
          <span className="text-neu9 text-base">{section.faculty}</span>
        </InfoSection>

        <InfoSection label="LOCATION">
          <span className="text-neu9 text-base">
            {section.meetingTimes?.[0]?.room?.building?.name ?? "TBA"}
          </span>
        </InfoSection>

        <InfoSection label="CAMPUS">
          <span className="text-neu9 text-base">{section.campus}</span>
        </InfoSection>

        <SeatCounter
          label="ENROLLMENT SEATS"
          current={section.seatRemaining}
          total={section.seatCapacity}
        />

        <SeatCounter
          label="WAITLIST SEATS"
          current={section.waitlistRemaining}
          total={section.waitlistCapacity}
        />
      </div>
    </div>
  );
}

function NotificationBells({
  messagesSent,
  messageLimit,
  isSubscribed,
}: {
  messagesSent: number;
  messageLimit: number;
  isSubscribed: boolean;
}) {
  const filledBells = messageLimit - messagesSent;
  const emptySlots = messagesSent;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-[4px]">
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div
              key={`diamond-${i}`}
              className="flex h-[10px] w-[10px] items-center justify-center rounded-sm"
            >
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path d="M5 0L10 5L5 10L0 5L5 0Z" className="fill-r1" />
              </svg>
            </div>
          ))}

          {Array.from({ length: filledBells }).map((_, i) => (
            <BellIcon
              key={`bell-${i}`}
              className="text-r4"
              opacity={isSubscribed ? 1 : 0.4}
            />
          ))}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {filledBells} notification{filledBells !== 1 ? "s" : ""} remaining
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function InfoSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-neu5 text-xs font-bold uppercase">{label}</span>
      {children}
    </div>
  );
}

function SeatCounter({
  label,
  current,
  total,
}: {
  label: string;
  current: number;
  total: number;
}) {
  const focused = current > 0;
  return (
    <div
      className={`flex h-[54px] flex-col justify-center gap-1 rounded-lg border bg-white px-3 ${
        focused ? "border-neu3" : "border-neu2"
      }`}
    >
      <span
        className={`text-xs font-bold uppercase ${
          focused ? "text-neu7" : "text-neu5"
        }`}
      >
        {label}
      </span>
      {total > 0 ? (
        <div className="text-base leading-[18.2px]">
          <span
            className={
              focused ? "text-neu9 font-bold" : "text-neu7 font-normal"
            }
          >
            {current}
          </span>
          <span className={focused ? "text-neu7" : "text-neu5"}>
            {" "}
            / {total}
          </span>
        </div>
      ) : (
        <span className="text-neu5 text-xs italic">None</span>
      )}
    </div>
  );
}
