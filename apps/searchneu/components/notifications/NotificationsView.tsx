"use client";

import NotificationsCourseCard from "./NotificationsCourseCard";

export function NotificationsView() {
  const mockCourses = [
    {
      courseName: "CHEM 2311",
      courseTitle: "Organic Chemistry 1",
      sections: [
        {
          crn: "10563",
          messagesSent: 0,
          messageLimit: 3,
          isSubscribed: true,
          meetingTimes: [
            {
              days: [3],
              startTime: 1030,
              endTime: 1325,
              final: false,
            },
          ],
          professor: "Full Name Doe",
          location: "Shillman Hall",
          campus: "Online",
          enrollmentSeats: { current: 1, total: 15 },
          waitlistSeats: { current: 1, total: 15 },
        },
        {
          crn: "10564",
          messagesSent: 2,
          messageLimit: 3,
          isSubscribed: false,
          meetingTimes: [
            {
              days: [1, 3, 5],
              startTime: 900,
              endTime: 1005,
              final: false,
            },
          ],
          professor: "Full Name Doe",
          location: "Shillman Hall",
          campus: "Online",
          enrollmentSeats: { current: 0, total: 15 },
          waitlistSeats: { current: 1, total: 15 },
        },
        {
          crn: "10565",
          messagesSent: 3,
          messageLimit: 3,
          isSubscribed: false,
          meetingTimes: [
            {
              days: [2, 4],
              startTime: 1400,
              endTime: 1530,
              final: false,
            },
          ],
          professor: "Full Name Doe",
          location: "Shillman Hall",
          campus: "Online",
          enrollmentSeats: { current: 0, total: 15 },
          waitlistSeats: { current: 0, total: 15 },
        },
        {
          crn: "10566",
          messagesSent: 1,
          messageLimit: 3,
          isSubscribed: true,
          meetingTimes: [
            {
              days: [1, 4],
              startTime: 1600,
              endTime: 1730,
              final: false,
            },
          ],
          professor: "Another Professor",
          location: "Richards Hall",
          campus: "Boston",
          enrollmentSeats: { current: 10, total: 25 },
          waitlistSeats: { current: 0, total: 5 },
        },
      ],
    },
    {
      courseName: "CS 3500",
      courseTitle: "Object-Oriented Design",
      sections: [
        {
          crn: "20123",
          messagesSent: 0,
          messageLimit: 3,
          isSubscribed: true,
          meetingTimes: [
            {
              days: [1, 3],
              startTime: 1145,
              endTime: 1325,
              final: false,
            },
          ],
          professor: "Jane Smith",
          location: "Snell Library",
          campus: "Boston",
          enrollmentSeats: { current: 5, total: 20 },
          waitlistSeats: { current: 2, total: 10 },
        },
        {
          crn: "20124",
          messagesSent: 2,
          messageLimit: 3,
          isSubscribed: false,
          meetingTimes: [
            {
              days: [2, 4],
              startTime: 1530,
              endTime: 1710,
              final: false,
            },
          ],
          professor: "Jane Smith",
          location: "Snell Library",
          campus: "Boston",
          enrollmentSeats: { current: 3, total: 20 },
          waitlistSeats: { current: 1, total: 10 },
        },
      ],
    },
  ];

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-6 pb-6">
        {mockCourses.map((course, index) => (
          <NotificationsCourseCard
            key={index}
            {...course}
            onToggleSubscription={(crn) =>
              console.log("Toggle subscription", crn)
            }
          />
        ))}
      </div>
    </div>
  );
}
