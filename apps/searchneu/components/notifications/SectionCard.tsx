"use client";
import React from "react";
import { Bell } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrackingSwitch } from "@/components/auth/TrackingSwitch";

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
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-utility-gray text-lg font-semibold whitespace-nowrap">
            CRN {crn}
          </span>

          <NotificationBells
            messagesSent={messagesSent}
            messageLimit={messageLimit}
            isSubscribed={isSubscribed}
          />
        </div>

        <TrackingSwitch
          sectionId={parseInt(crn)}
          inital={isSubscribed}
          disabled={false}
          onCheckedChange={() => {
            onToggleSubscription?.();
          }}
          isTermActive={true}
        />
      </div>

      <div className="grid w-full grid-cols-2 gap-x-6 gap-y-3">
        <div className="flex flex-col gap-3">
          <InfoSection label="MEETING TIMES">
            <MeetingTimes days={meetingTimes.days} time={meetingTimes.time} />
          </InfoSection>

          <InfoSection label="LOCATION">
            <span className="text-utility-gray text-base">{location}</span>
          </InfoSection>
        </div>

        <div className="flex flex-col gap-3">
          <InfoSection label="PROFESSOR">
            <span className="text-utility-gray text-base">{professor}</span>
          </InfoSection>

          <InfoSection label="CAMPUS">
            <span className="text-utility-gray text-base">{campus}</span>
          </InfoSection>
        </div>

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
  const emptySlots = messagesSent;

  const bellColor = isSubscribed ? "#F15B50" : "rgba(241, 91, 80, 0.35)";
  const diamondOpacity = isSubscribed ? 0.35 : 0.2;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: emptySlots }).map((_, i) => (
        <Tooltip key={`diamond-${i}`}>
          <TooltipTrigger asChild>
            <div className="flex h-[9px] w-[9px] items-center justify-center">
              <svg width="9" height="9" viewBox="0 0 9 9">
                <path
                  d="M4.5 0L9 4.5L4.5 9L0 4.5L4.5 0Z"
                  fill="#F15B50"
                  fillOpacity={diamondOpacity}
                />
              </svg>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Notification sent</p>
          </TooltipContent>
        </Tooltip>
      ))}

      {Array.from({ length: filledBells }).map((_, i) => (
        <Tooltip key={`bell-${i}`}>
          <TooltipTrigger asChild>
            <div className="flex h-[13px] w-[13px] items-center justify-center">
              <Bell
                className="h-[14px] w-[14px]"
                fill={bellColor}
                stroke={bellColor}
                strokeWidth={1.25}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {filledBells} notification{filledBells !== 1 ? "s" : ""} remaining
            </p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
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
    <div className="flex h-[54px] flex-col justify-center gap-1 rounded-lg border border-[#F1F2F2] bg-white px-3">
      <span className="text-xs font-medium tracking-wide text-gray-400 uppercase">
        {label}
      </span>
      <div
        className="text-[#212121]"
        style={{ fontSize: "16px", fontWeight: 700, lineHeight: "18.2px" }}
      >
        <span>{current}</span>
        <span className="text-gray-400"> / {total}</span>
      </div>
    </div>
  );
}
