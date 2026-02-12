"use client";
import SectionCard from "./SectionCard";
import { Trash2 } from "lucide-react";

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
  const unsubscribedCount = sections.filter((s) => !s.isSubscribed).length;
  const totalSections = sections.length;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-utility-gray text-2xl font-bold">{courseName}</h3>
          <p className="text-base text-gray-600">{courseTitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex h-9 items-center gap-2.5 rounded-3xl border border-[#F1F2F2] bg-[#F9F9F9] px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-200"
            onClick={() => console.log("View all sections")}
          >
            View all sections
          </button>
          <button
            className="flex h-9 w-9 items-center justify-center gap-2.5 rounded-3xl border border-[#F1F2F2] bg-[#F9F9F9] text-gray-400 transition hover:bg-gray-200 hover:text-gray-600"
            onClick={() => console.log("Delete course")}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {sections.map((section, index) => (
          <SectionCard
            key={`${section.crn}-${index}`}
            {...section}
            onToggleSubscription={() => onToggleSubscription?.(section.crn)}
          />
        ))}
      </div>

      {unsubscribedCount > 0 && (
        <p className="text-sm text-gray-500 italic">
          {unsubscribedCount}/{totalSections} unsubscribed sections available
        </p>
      )}
    </div>
  );
}
