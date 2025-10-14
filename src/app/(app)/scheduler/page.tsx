import { generateSchedules } from "@/lib/scheduler/generateSchedules";
import type { ScheduleFilters } from "@/lib/scheduler/filters";

// Helper to convert time format (e.g., 1330 -> "1:30 PM")
function formatTime(time: number): string {
  const hours = Math.floor(time / 100);
  const minutes = time % 100;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

// Helper to convert day numbers to day names
// Days are stored as: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
function formatDays(days: number[]): string {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days.map((d) => dayNames[d]).join(", ");
}

export default async function Page() {
  // test since we don't have a testing library yet
  const filters: ScheduleFilters = {
      //startTime: 900,           // No classes before 9 AM
      //endTime: 1700,            // No classes after 5 PM
      //specificDaysFree: [5],    // No Friday classes
      //minDaysFree: 2,           // At least 2 days free
      //minSeatsLeft: 6,          // At least 5 seats available
      //minHonorsCourses: 1       // At least 1 honors course
  };
  
  const schedules = await generateSchedules(
    [
      17500,
      16048,
      15783,
      17501
    ],
    filters
  );

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Generated Schedules</h1>
      
      {/* Display active filters */}
      {filters && Object.keys(filters).length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-blue-900">Active Filters:</h2>
          <div className="space-y-1 text-sm text-blue-800">
            {filters.startTime && (
              <div>• Earliest start time: {formatTime(filters.startTime)}</div>
            )}
            {filters.endTime && (
              <div>• Latest end time: {formatTime(filters.endTime)}</div>
            )}
            {filters.specificDaysFree && filters.specificDaysFree.length > 0 && (
              <div>• Days with no classes: {formatDays(filters.specificDaysFree)}</div>
            )}
            {filters.minDaysFree !== undefined && (
              <div>• Minimum days free per week: {filters.minDaysFree}</div>
            )}
            {filters.minSeatsLeft !== undefined && (
              <div>• Minimum seats available: {filters.minSeatsLeft}</div>
            )}
            {filters.minHonorsCourses !== undefined && (
              <div>• Minimum honors courses: {filters.minHonorsCourses}</div>
            )}
          </div>
        </div>
      )}
      
      <p className="text-gray-600 mb-4">
        Found {schedules.length} valid schedule{schedules.length !== 1 ? "s" : ""} 
        (showing first 5)
      </p>

      <div className="space-y-8">
        {schedules.slice(0, 5).map((schedule, scheduleIndex) => (
          <div
            key={scheduleIndex}
            className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm"
          >
            <h2 className="text-xl font-semibold mb-4">
              Schedule {scheduleIndex + 1}
            </h2>

            <div className="space-y-4">
              {schedule.map((section, sectionIndex) => (
                <div
                  key={sectionIndex}
                  className="border-l-4 border-blue-500 pl-4 py-2"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {section.courseSubject} {section.courseNumber}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        {section.courseName}
                      </p>
                      <span className="text-sm text-gray-700">
                        CRN: {section.crn}
                      </span>
                      {section.honors && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Honors
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {section.classType}
                    </span>
                  </div>

                  {section.faculty && (
                    <p className="text-sm text-gray-700 mb-1">
                      Instructor: {section.faculty}
                    </p>
                  )}

                  {section.meetingTimes.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {section.meetingTimes.map((meeting, meetingIndex) => (
                        <div
                          key={meetingIndex}
                          className="text-sm text-gray-700 flex items-center gap-2"
                        >
                          <span className="font-medium">
                            {formatDays(meeting.days)}
                          </span>
                          <span>•</span>
                          <span>
                            {formatTime(meeting.startTime)} -{" "}
                            {formatTime(meeting.endTime)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No scheduled meeting times
                    </p>
                  )}

                  <div className="mt-2 text-xs text-gray-500">
                    Seats: {section.seatRemaining}/{section.seatCapacity} •
                    Campus: {section.campus}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

