import { notFound } from "next/navigation";
import {
  db,
  roomsT,
  buildingsT,
  meetingTimesT,
  sectionsT,
  coursesT,
} from "@/lib/db";
import { eq, and } from "drizzle-orm";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => i + 7);

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ term: string; room: string }>;
}) {
  const roomId = parseInt((await params).room);
  const term = (await params).term;

  if (isNaN(roomId)) {
    notFound();
  }

  const roomData = await db
    .select({
      roomNumber: roomsT.code,
      buildingName: buildingsT.name,
    })
    .from(roomsT)
    .innerJoin(buildingsT, eq(roomsT.buildingId, buildingsT.id))
    .where(eq(roomsT.id, roomId))
    .limit(1);

  if (roomData.length === 0) {
    notFound();
  }

  const room = roomData[0];

  // Get meeting times with course information
  const meetings = await db
    .select({
      days: meetingTimesT.days,
      startTime: meetingTimesT.startTime,
      endTime: meetingTimesT.endTime,
      sectionId: meetingTimesT.sectionId,
      crn: sectionsT.crn,
      courseName: coursesT.name,
      subject: coursesT.subject,
      courseNumber: coursesT.courseNumber,
    })
    .from(meetingTimesT)
    .innerJoin(sectionsT, eq(meetingTimesT.sectionId, sectionsT.id))
    .innerJoin(coursesT, eq(sectionsT.courseId, coursesT.id))
    .where(and(eq(meetingTimesT.roomId, roomId), eq(meetingTimesT.term, term)));

  const meetingsWithMinutes = meetings.map((meeting) => ({
    ...meeting,
    startMinutes:
      Math.floor(meeting.startTime / 100) * 60 + (meeting.startTime % 100),
    endMinutes:
      Math.floor(meeting.endTime / 100) * 60 + (meeting.endTime % 100),
  }));

  // Group meetings by day
  const meetingsByDay = meetingsWithMinutes.reduce(
    (acc, meeting) => {
      meeting.days.forEach((day) => {
        if (!acc[day]) {
          acc[day] = [];
        }
        acc[day].push(meeting);
      });
      return acc;
    },
    {} as Record<number, typeof meetingsWithMinutes>,
  );

  return (
    <div className="bg-secondary min-h-[calc(100vh-56px)] px-6 pt-4 pb-4">
      <div className="bg-background flex items-center gap-4 rounded-full px-4 py-3">
        {/* <Link href={`/rooms/${term}`} className="flex items-center gap-2"> */}
        {/*   Back */}
        {/* </Link> */}
        <h1 className="text-xl font-bold">
          {room.buildingName} {room.roomNumber}
        </h1>
      </div>

      <div className="p-4">
        <div className="overflow-hidden rounded-lg">
          <div className="grid grid-cols-8 border-b">
            <div className="bg-background text-neu6 p-2 text-center font-medium">
              Time
            </div>
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="bg-background text-neu6 border-l p-2 text-center font-medium"
              >
                {day}
              </div>
            ))}
          </div>

          {TIME_SLOTS.map((hour) => (
            <div
              key={hour}
              className="relative grid grid-cols-8 border-b"
              style={{ height: "60px" }}
            >
              <div className="text-neu6 p-2 text-sm font-bold">
                {hour % 24}:00
              </div>
              {DAYS_OF_WEEK.map((_, dayIndex) => (
                <div key={dayIndex} className="relative border-l">
                  {meetingsByDay[dayIndex + 1]?.map((meeting, idx) => {
                    const startHour = Math.floor(meeting.startMinutes / 60);
                    const startMinute = meeting.startMinutes % 60;

                    // Check if this meeting occurs in this hour slot
                    if (startHour === hour) {
                      const duration =
                        meeting.endMinutes - meeting.startMinutes;
                      const heightInSlots = duration / 60;
                      const topOffset = (startMinute / 60) * 60;

                      return (
                        <div
                          key={idx}
                          className="bg-neu absolute right-1 left-1 z-10 overflow-hidden rounded-lg p-2"
                          style={{
                            top: `${topOffset}px`,
                            height: `${heightInSlots * 60 - 4}px`,
                          }}
                        >
                          <div className="text-background text-xs font-bold">
                            {formatTimeRange(
                              meeting.startTime,
                              meeting.endTime,
                            )}
                          </div>
                          <div className="text-background/80 text-xs">
                            {meeting.subject}
                            {meeting.courseNumber}
                          </div>
                          <div className="text-background/90 truncate text-xs">
                            {meeting.courseName}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatTimeRange(startMinutes: number, endMinutes: number): string {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const displayHours = hours > 12 ? hours - 12 : hours || 12;
    return `${displayHours}:${mins.toString().padStart(2, "0")}`;
  };

  return `${formatTime(startMinutes)}-${formatTime(endMinutes)}`;
}
