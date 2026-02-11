// components/trackers/CourseCard.tsx
"use client";
import React from "react";
import SectionCard from "./SectionCard";

interface Section {
  crn: string;
  messagesSent: number;
  messageLimit: number;
  isSubscribed: boolean;
  meetingTimes: {
    days: string[];
    time: string;
  };
  professor: string;
  location: string;
  campus: string;
  enrollmentSeats: {
    current: number;
    total: number;
  };
  waitlistSeats: {
    current: number;
    total: number;
  };
}

interface CourseCardProps {
  courseName: string;
  courseTitle: string;
  sections: Section[];
  onToggleSubscription?: (crn: string) => void;
}

export default function CourseCard({
  courseName,
  courseTitle,
  sections,
  onToggleSubscription,
}: CourseCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4">
      {/* Course Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-utility-gray text-2xl font-bold">{courseName}</h3>
          <p className="text-base text-gray-600">{courseTitle}</p>
        </div>
        <button className="text-sm text-gray-600 hover:text-gray-800">
          View all sections
        </button>
      </div>

      {/* Sections Grid - Using flex with tighter spacing */}
      <div className="flex flex-wrap gap-5">
        {sections.map((section) => (
          <SectionCard
            key={section.crn}
            {...section}
            onToggleSubscription={() => onToggleSubscription?.(section.crn)}
          />
        ))}
      </div>
    </div>
  );
}
