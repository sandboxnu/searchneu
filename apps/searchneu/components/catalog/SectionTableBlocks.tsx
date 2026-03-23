import type {
  SectionTableSection,
  SectionTableMeetingTime,
} from "./SectionTable";
import { cn } from "@/lib/cn";

export function RoomBlocks(props: { section: SectionTableSection }) {
  const building = props.section.meetingTimes[0]?.room?.building?.name;
  const room = props.section.meetingTimes[0]?.room?.number;
  const section = props.section;

  if (section.campus == "Online") {
    return (
      <div className="flex flex-col text-sm">
        <div className="flex flex-col gap-1 text-sm">
          <div className="font-bold">{section.campus}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col text-sm">
      {building ? (
        <div className="flex flex-col gap-1 text-sm">
          <div className="font-bold">{building}</div>
          <div>{room ?? "NA"}</div>
        </div>
      ) : (
        <p className="text-neu4 py-2 text-sm">TBA</p>
      )}
    </div>
  );
}

export function MeetingBlocks(props: {
  meetings: SectionTableMeetingTime[];
  crn: string;
}) {
  const days = ["S", "M", "T", "W", "T", "F", "S"];

  // always have the final be the last row
  props.meetings.sort((a) => (a.final ? 1 : -1));

  if (props.meetings.length === 0 || props.meetings[0].days.length === 0) {
    return <p className="text-neu4 py-2 text-sm">TBA</p>;
  }

  const hasWeekendEvents = props.meetings.some((meeting) =>
    meeting.days.some((day) => day === 0 || day === 6),
  );

  const getDaysToShow = () => {
    if (hasWeekendEvents) {
      return [...Array(7).keys()];
    } else {
      return [1, 2, 3, 4, 5];
    }
  };

  const daysToShow = getDaysToShow();

  return (
    <div className="flex w-full flex-col gap-2">
      {props.meetings.map((m, i) => (
        <div key={props.crn + i} className="flex w-full flex-col gap-1">
          <span className="flex items-center gap-1">
            {daysToShow.map((j) => (
              <span
                key={props.crn + i + j}
                className={cn(
                  "text-neu4 text-center text-sm font-bold",
                  m.days.includes(j) && "text-neu9",
                )}
              >
                {days[j]}
              </span>
            ))}
          </span>
          {/* TODO: this should be a hover i to say talk to the prof! */}
          <span className="flex items-center gap-1 text-sm">
            {m.final && <p className="font-semibold">Final Exam</p>}
            {m.final && <p className="">|</p>}
            <p className="text-neu9 font-medium">
              {formatTimeRange(m.startTime, m.endTime)}
            </p>
          </span>
        </div>
      ))}
    </div>
  );
}

function formatTimeRange(startTime: number, endTime: number) {
  const startHours = Math.floor(startTime / 100);
  const startMinutes = startTime % 100;
  const endHours = Math.floor(endTime / 100);
  const endMinutes = endTime % 100;

  const startIsPM = startHours >= 12;
  const endIsPM = endHours >= 12;

  const start12Hour = startHours % 12 || 12;
  const end12Hour = endHours % 12 || 12;

  const formattedStart = `${start12Hour}:${startMinutes.toString().padStart(2, "0")}`;
  const formattedEnd = `${end12Hour}:${endMinutes.toString().padStart(2, "0")}`;

  return `${formattedStart}${startIsPM ? "PM" : "AM"} — ${formattedEnd}${endIsPM ? "PM" : "AM"}`;
}
