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

export function SectionTable(props: {
  sections: {
    crn: string;
    faculty: string;
    meetingTimes: meetingTime[];
    seatRemaining: number;
    seatCapacity: number;
  }[];
}) {
  return (
    <table className="w-full rounded-t overflow-clip">
      <thead className="bg-muted">
        <tr className="">
          <th className="font-medium text-sm text-left py-3 pl-3">CRN</th>
          <th className="font-medium text-sm text-left py-3">Professor</th>
          <th className="font-medium text-sm text-left py-3">Time</th>
          <th className="font-medium text-sm text-left py-3">Room</th>
          <th className="font-medium text-sm text-left py-3">Seats</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {props.sections.map((s, i) => (
          <tr key={i} className="h-16">
            <td className="pl-3">{s.crn}</td>
            <td>{s.faculty}</td>
            <td>
              <MeetingBlocks meetings={s.meetingTimes} crn={s.crn} />
            </td>
            <td>
              <RoomBlocks meetings={s.meetingTimes} crn={s.crn} />
            </td>
            <td>
              {s.seatRemaining} / {s.seatCapacity}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MeetingBlocks(props: { meetings: meetingTime[]; crn: string }) {
  const days = ["S", "M", "T", "W", "T", "F", "S"];

  if (!props.meetings || props.meetings[0].days.length === 0) {
    return <p className="text-sm">Online</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      {props.meetings.map((m, i) => (
        <span key={props.crn + i} className="flex gap-2 items-center">
          <span className="flex rounded justify-between bg-background w-28">
            {[...Array(7).keys()].map((j) => (
              <span
                key={props.crn + i + j}
                className={cn(
                  "text-xs w-4 text-center",
                  m.days.includes(j)
                    ? m.final
                      ? "bg-primary"
                      : "bg-accent"
                    : null,
                  m.days.includes(j)
                    ? "text-background rounded font-semibold"
                    : null,
                )}
              >
                {days[j]}
              </span>
            ))}
          </span>
          <p className="text-sm">
            {m.startTime} - {m.endTime}
          </p>
        </span>
      ))}
    </div>
  );
}

function RoomBlocks(props: { meetings: meetingTime[]; crn: string }) {
  return (
    <div className="flex flex-col gap-1">
      {props.meetings.map((m, i) => (
        <span key={props.crn + i} className="flex gap-2 items-center">
          {m.final ? <p className="font-semibold">Final Exam</p> : null}
          <p className="text-sm">
            {m.building} {m.room}
          </p>
        </span>
      ))}
    </div>
  );
}
