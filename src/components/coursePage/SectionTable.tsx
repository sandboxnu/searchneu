import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";

interface meetingTime {
  building: string;
  room: string;
  days: number[];
  startTime: number;
  endTime: number;
  final: boolean;
  finalDate?: string;
}

interface section {
  crn: string;
  faculty: string;
  meetingTimes: meetingTime[];
  campus: string;
  honors: boolean;
  seatRemaining: number;
  seatCapacity: number;
  waitlistCapacity: number;
  waitlistRemaining: number;
}

export function SectionTable(props: { sections: section[] }) {
  return (
    <table className="w-full overflow-x-scroll rounded-t">
      <thead className="bg-muted shadow-sm">
        <tr className="">
          <th className="w-16 py-3 pl-3 text-left text-sm font-medium">CRN</th>
          <th className="w-12 py-3 text-left text-sm font-medium">NOTIF</th>
          <th className="w-20 py-3 text-left text-sm font-medium">SEATS</th>
          <th className="w-72 py-3 text-left text-sm font-medium">MEETINGS</th>
          <th className="w-36 py-3 text-left text-sm font-medium">ROOM</th>
          <th className="w-36 py-3 text-left text-sm font-medium">PROFESSOR</th>
          <th className="w-28 py-3 text-left text-sm font-medium">CAMPUS</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {props.sections.map((s, i) => (
          <SectionRow key={i} section={s} />
        ))}
      </tbody>
    </table>
  );
}

function SectionRow(props: { section: section }) {
  const seatDelta = props.section.seatRemaining / props.section.seatCapacity;

  return (
    <tr className="h-16">
      <td className="pl-3">
        <span>
          <p className="text-accent underline">{props.section.crn}</p>
          {props.section.honors && <p>honors</p>}
        </span>
      </td>
      <td className="">
        <Switch disabled={seatDelta > 0} />
      </td>
      <td className="">
        <div className="flex flex-col">
          <span className="flex items-center gap-1">
            <p
              className={cn(
                "text-md",
                seatDelta > 0.2
                  ? "text-green-500"
                  : seatDelta > 0.05
                    ? "text-yellow-500"
                    : "text-red-500",
              )}
            >
              {props.section.seatRemaining} / {props.section.seatCapacity}
            </p>
            {/* TODO: this should be a hover i for neg seat counts */}
            {/* {seatDelta < 0 && <p className="text-sm">i</p>} */}
          </span>
          {props.section.waitlistCapacity > 0 && (
            <p className="text-sm">
              {props.section.waitlistRemaining} /{" "}
              {props.section.waitlistCapacity} waitlist
            </p>
          )}
        </div>
      </td>
      <td>
        <MeetingBlocks
          meetings={props.section.meetingTimes}
          crn={props.section.crn}
        />
      </td>
      <td>
        <RoomBlocks
          meetings={props.section.meetingTimes}
          crn={props.section.crn}
        />
      </td>
      <td>{props.section.faculty}</td>
      <td>{props.section.campus}</td>
    </tr>
  );
}

function MeetingBlocks(props: { meetings: meetingTime[]; crn: string }) {
  const days = ["S", "M", "T", "W", "T", "F", "S"];

  // always have the final be the last row
  props.meetings.sort((a) => (a.final ? 1 : -1));

  if (!props.meetings || props.meetings[0].days.length === 0) {
    return <p className="text-sm">Online</p>;
  }

  return (
    <div className="flex flex-col gap-3 py-2">
      {props.meetings.map((m, i) => (
        <span key={props.crn + i} className="flex gap-2">
          <span className="flex items-center gap-1">
            <span className="bg-background flex h-5 w-[140px] items-center justify-between rounded">
              {[...Array(7).keys()].map((j) => (
                <span
                  key={props.crn + i + j}
                  className={cn(
                    "h-full w-5 py-0.5 text-center text-xs",
                    m.days.includes(j)
                      ? m.final
                        ? "bg-primary"
                        : "bg-accent"
                      : null,
                    m.days.includes(j) && "text-background font-semibold",
                    m.days.includes(j + 1) &&
                      !m.days.includes(j - 1) &&
                      "rounded-l",
                    m.days.includes(j - 1) &&
                      !m.days.includes(j + 1) &&
                      "rounded-r",
                    !m.days.includes(j - 1) &&
                      !m.days.includes(j + 1) &&
                      "rounded",
                  )}
                >
                  {days[j]}
                </span>
              ))}
            </span>
            {/* TODO: this should be a hover i to say talk to the prof! */}
            {/* {m.final ? <p className="text-sm">i</p> : null} */}
          </span>
          <span className="flex items-center gap-1 text-sm">
            {m.final && <p className="font-semibold">Final Exam</p>}
            {m.final && <p className="">|</p>}
            <p className="">{formatTimeRange(m.startTime, m.endTime)}</p>
            {/* <p className="">|</p> */}
            {/* <p className=""> */}
            {/*   {m.building} {m.room} */}
            {/* </p> */}
          </span>
        </span>
      ))}
    </div>
  );
}

function RoomBlocks(props: { meetings: meetingTime[]; crn: string }) {
  return (
    <div className="flex flex-col gap-2">
      {props.meetings.map((m, i) => (
        <span key={props.crn + i} className="flex items-center gap-2">
          <p className="text-sm">
            {m.building} {m.room}
          </p>
        </span>
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

  let formattedStart = `${start12Hour}:${startMinutes.toString().padStart(2, "0")}`;
  let formattedEnd = `${end12Hour}:${endMinutes.toString().padStart(2, "0")}`;

  formattedStart = formattedStart.replace(":00", "").replace(":0", ":");
  formattedEnd = formattedEnd.replace(":00", "").replace(":0", ":");

  if (startIsPM === endIsPM) {
    return `${formattedStart} - ${formattedEnd}${endIsPM ? "pm" : "am"}`;
  } else {
    return `${formattedStart}${startIsPM ? "pm" : "am"} - ${formattedEnd}${endIsPM ? "pm" : "am"}`;
  }
}
