"use client";

import CourseCard from "./CourseCard";

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
          meetingTimes: {
            days: ["W"],
            time: "10:30 AM–1:25 PM",
          },
          professor: "Full Name Doe",
          location: "Shillman Hall",
          campus: "Online",
          enrollmentSeats: { current: 1, total: 15 },
          waitlistSeats: { current: 1, total: 15 },
        },
        {
          crn: "10563",
          messagesSent: 2,
          messageLimit: 3,
          isSubscribed: false,
          meetingTimes: {
            days: ["W"],
            time: "10:30 AM–1:25 PM",
          },
          professor: "Full Name Doe",
          location: "Shillman Hall",
          campus: "Online",
          enrollmentSeats: { current: 0, total: 15 },
          waitlistSeats: { current: 1, total: 15 },
        },
        {
          crn: "10563",
          messagesSent: 3,
          messageLimit: 3,
          isSubscribed: false,
          meetingTimes: {
            days: ["W"],
            time: "10:30 AM–1:25 PM",
          },
          professor: "Full Name Doe",
          location: "Shillman Hall",
          campus: "Online",
          enrollmentSeats: { current: 0, total: 15 },
          waitlistSeats: { current: 0, total: 15 },
        },
      ],
    },
    {
      courseName: "CHEM 2311",
      courseTitle: "Organic Chemistry 1",
      sections: [
        {
          crn: "10563",
          messagesSent: 0,
          messageLimit: 3,
          isSubscribed: true,
          meetingTimes: {
            days: ["W"],
            time: "10:30 AM–1:25 PM",
          },
          professor: "Full Name Doe",
          location: "Shillman Hall",
          campus: "Online",
          enrollmentSeats: { current: 1, total: 15 },
          waitlistSeats: { current: 1, total: 15 },
        },
        {
          crn: "10563",
          messagesSent: 2,
          messageLimit: 3,
          isSubscribed: false,
          meetingTimes: {
            days: ["W"], 
            time: "10:30 AM–1:25 PM",
          },
          professor: "Full Name Doe",
          location: "Shillman Hall",
          campus: "Online",
          enrollmentSeats: { current: 0, total: 15 },
          waitlistSeats: { current: 1, total: 15 },
        },
      ],
    },
    {
      courseName: "CHEM 2311",
      courseTitle: "Organic Chemistry 1",
      sections: [
        {
          crn: "10563",
          messagesSent: 2,
          messageLimit: 3,
          isSubscribed: true,
          meetingTimes: {
            days: ["W"],
            time: "10:30 AM–1:25 PM",
          },
          professor: "Full Name Doe",
          location: "Shillman Hall",
          campus: "Online",
          enrollmentSeats: { current: 1, total: 15 },
          waitlistSeats: { current: 1, total: 15 },
        },
        {
          crn: "10563",
          messagesSent: 2,
          messageLimit: 3,
          isSubscribed: false,
          meetingTimes: {
            days: ["W"],
            time: "10:30 AM–1:25 PM",
          },
          professor: "Full Name Doe",
          location: "Shillman Hall",
          campus: "Online",
          enrollmentSeats: { current: 0, total: 15 },
          waitlistSeats: { current: 1, total: 15 },
        },
        {
          crn: "10563",
          messagesSent: 3,
          messageLimit: 3,
          isSubscribed: false,
          meetingTimes: {
            days: ["W"],
            time: "10:30 AM–1:25 PM",
          },
          professor: "Full Name Doe",
          location: "Shillman Hall",
          campus: "Online",
          enrollmentSeats: { current: 0, total: 15 },
          waitlistSeats: { current: 0, total: 15 },
        },
      ],
    },
  ];

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-6 pb-6">
        {mockCourses.map((course, index) => (
          <CourseCard
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
