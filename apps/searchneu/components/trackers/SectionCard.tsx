// components/trackers/SectionCard.tsx
"use client";
import React from "react";

interface SectionCardProps {
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
  onToggleSubscription?: () => void;
}

export default function SectionCard({
  crn,
  messagesSent,
  messageLimit,
  isSubscribed,
  meetingTimes,
  professor,
  location,
  campus,
  enrollmentSeats,
  waitlistSeats,
  onToggleSubscription,
}: SectionCardProps) {
  return (
    <div className="flex min-h-[229.538px] max-w-[400px] min-w-[328px] flex-1 flex-col items-start justify-center gap-[10px] rounded-lg border border-[#F1F2F2] bg-[#F9F9F9] p-3">
      {/* Header: CRN, Bells, Toggle */}
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-utility-gray text-lg font-semibold">
            CRN {crn}
          </span>
          <NotificationBells
            messagesSent={messagesSent}
            messageLimit={messageLimit}
            isSubscribed={isSubscribed}
          />
        </div>
        <SubscriptionToggle
          isSubscribed={isSubscribed}
          onToggle={onToggleSubscription}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid w-full grid-cols-2 gap-x-6 gap-y-3">
        {/* Left Column */}
        <div className="flex flex-col gap-3">
          <InfoSection label="MEETING TIMES">
            <MeetingTimes days={meetingTimes.days} time={meetingTimes.time} />
          </InfoSection>

          <InfoSection label="LOCATION">
            <span className="text-utility-gray text-base">{location}</span>
          </InfoSection>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-3">
          <InfoSection label="PROFESSOR">
            <span className="text-utility-gray text-base">{professor}</span>
          </InfoSection>

          <InfoSection label="CAMPUS">
            <span className="text-utility-gray text-base">{campus}</span>
          </InfoSection>
        </div>

        {/* Seat Counters */}
        <SeatCounter
          label="ENROLLMENT SEATS"
          current={enrollmentSeats.current}
          total={enrollmentSeats.total}
        />

        <SeatCounter
          label="WAITLIST SEATS"
          current={waitlistSeats.current}
          total={waitlistSeats.total}
        />
      </div>
    </div>
  );
}

// Reusable sub-components
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
  const diamonds = messagesSent;

  const bellColor = isSubscribed ? "#EF4444" : "rgba(239, 68, 68, 0.35)"; // muted red like Figma

  const diamondColor = isSubscribed
    ? "rgba(241, 91, 80, 0.25)"
    : "rgba(241, 91, 80, 0.15)";

  return (
    <div className="flex items-center gap-1">
      {/* Diamonds */}
      {Array.from({ length: diamonds }).map((_, i) => (
        <svg key={`diamond-${i}`} width="6" height="6" viewBox="0 0 6 6">
          <path d="M3 0L6 3L3 6L0 3L3 0Z" fill={diamondColor} />
        </svg>
      ))}

      {/* Bells */}
      {Array.from({ length: filledBells }).map((_, i) => (
        <svg key={`filled-${i}`} width="12" height="12" viewBox="0 0 12 12">
          <path
            d="M6 1.5C4.75736 1.5 3.75 2.50736 3.75 3.75V5.69185C3.75 5.88825 3.67098 6.07652 3.53033 6.21718L2.47842 7.26909C2.17678 7.57073 2.38649 8.0625 2.8125 8.0625H9.1875C9.61351 8.0625 9.82322 7.57073 9.52158 7.26909L8.46967 6.21718C8.32902 6.07652 8.25 5.88825 8.25 5.69185V3.75C8.25 2.50736 7.24264 1.5 6 1.5Z"
            fill={bellColor}
          />
          <path
            d="M4.875 9.1875C4.875 9.6017 5.2108 9.9375 5.625 9.9375H6.375C6.7892 9.9375 7.125 9.6017 7.125 9.1875V8.8125H4.875V9.1875Z"
            fill={bellColor}
          />
        </svg>
      ))}
    </div>
  );
}

function SubscriptionToggle({
  isSubscribed,
  onToggle,
}: {
  isSubscribed: boolean;
  onToggle?: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`relative h-6 w-12 rounded-full transition-colors ${
        isSubscribed ? "bg-red-500" : "bg-gray-300"
      }`}
      aria-label={isSubscribed ? "Unsubscribe" : "Subscribe"}
    >
      <div
        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
          isSubscribed ? "translate-x-7" : "translate-x-1"
        }`}
      />
    </button>
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
      <span className="text-xs font-medium tracking-wide text-gray-400 uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

function MeetingTimes({ days, time }: { days: string[]; time: string }) {
  const allDays = ["M", "T", "W", "TH", "F"];

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1">
        {allDays.map((day) => (
          <span
            key={day}
            className={`text-sm ${
              days.includes(day)
                ? "text-utility-gray font-bold"
                : "text-gray-300"
            }`}
          >
            {day}
          </span>
        ))}
      </div>
      <span className="text-utility-gray text-base">{time}</span>
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
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium tracking-wide text-gray-400 uppercase">
        {label}
      </span>
      <div className="flex h-[54px] items-center rounded-lg border border-[#F1F2F2] bg-white px-3">
        <span className="text-utility-gray text-2xl font-normal">
          <span className="font-semibold">{current}</span>
          <span className="text-gray-400"> / {total}</span>
        </span>
      </div>
    </div>
  );
}
