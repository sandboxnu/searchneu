"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { type SectionWithCourse } from "@/lib/scheduler/filters";
import { type CourseColor } from "@/lib/scheduler/courseColors";

interface CourseInfoPopupProps {
  section: SectionWithCourse;
  color: CourseColor | undefined;
  anchorRect: DOMRect;
  onClose: () => void;
}

function formatTime(time: number): string {
  const hours = Math.floor(time / 100);
  const minutes = time % 100;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

const DAY_ABBREVS = ["S", "M", "T", "W", "R", "F", "S"];
const POPUP_WIDTH = 320;
const ANIM_DURATION = 150;

export function CourseInfoPopup({
  section,
  color,
  anchorRect,
  onClose,
}: CourseInfoPopupProps) {
  const popupNodeRef = useRef<HTMLDivElement | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => onClose(), ANIM_DURATION);
  }, [onClose]);

  // Ref callback: position the popup once it mounts, using its measured height
  const popupRef = useCallback(
    (node: HTMLDivElement | null) => {
      popupNodeRef.current = node;
      if (!node) return;

      const popupRect = node.getBoundingClientRect();

      let left = anchorRect.right + 8;
      if (left + POPUP_WIDTH > window.innerWidth - 16) {
        left = anchorRect.left - POPUP_WIDTH - 8;
      }
      if (left < 8) left = 8;

      let top = anchorRect.top;
      if (top + popupRect.height > window.innerHeight - 16) {
        top = window.innerHeight - popupRect.height - 16;
      }
      if (top < 8) top = 8;

      node.style.left = `${left}px`;
      node.style.top = `${top}px`;
      node.style.visibility = "visible";
    },
    [anchorRect],
  );

  // Close on click outside or Escape
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (
        popupNodeRef.current &&
        !popupNodeRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose]);

  const seatsFilled = section.seatCapacity - section.seatRemaining;
  const waitlistFilled = section.waitlistCapacity - section.waitlistRemaining;

  const meetingTimesWithDays =
    section.meetingTimes?.filter((mt) => mt.days && mt.days.length > 0) ?? [];

  const roomDisplay =
    section.meetingTimes
      ?.filter((mt) => mt.room)
      .map((mt) => {
        const building = mt.room?.building?.name ?? "";
        const room = mt.room?.number ?? "";
        return `${building} ${room}`.trim();
      })
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(", ") || "TBA";

  const popup = (
    <>
      <style>{`
        @keyframes popupIn {
          from { opacity: 0; transform: scale(0.96) translateY(4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes popupOut {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.96) translateY(4px); }
        }
      `}</style>
      <div
        ref={popupRef}
        className="fixed z-50 rounded-lg border border-neu25 bg-white"
        style={{
          left: -9999,
          top: 0,
          width: POPUP_WIDTH,
          visibility: "hidden",
          animation: `${isClosing ? "popupOut" : "popupIn"} ${ANIM_DURATION}ms ease-out ${isClosing ? "forwards" : ""}`,
        }}
      >
        <div className="flex gap-1.5 p-2 pr-0">
          {/* Accent bar */}
          <div className="flex items-stretch">
            <div
              className="w-1 rounded-full"
              style={{ backgroundColor: color?.accent }}
            />
          </div>

          {/* Content */}
          <div className="flex min-w-0 flex-1 flex-col gap-3 pt-1 pb-2">
            {/* Header */}
            <div className="pr-6">
              <p className="text-xs font-bold text-black">
                {section.courseSubject} {section.courseNumber}
              </p>
              <p className="truncate text-xs text-neu6">
                {section.courseName}
              </p>
            </div>

            {/* Detail rows */}
            <div className="flex flex-col gap-1.5">
              <InfoRow label="CRN" value={section.crn} />

              <div className="flex items-center gap-2 pr-6">
                <div className="w-[90px] shrink-0 py-1">
                  <span className="text-[10px] font-bold text-neu4">
                    SEATS | WAITLIST
                  </span>
                </div>
                <div className="flex gap-1">
                  <SeatPill
                    filled={seatsFilled}
                    capacity={section.seatCapacity}
                    isFull={section.seatRemaining <= 0}
                  />
                  <SeatPill
                    filled={waitlistFilled}
                    capacity={section.waitlistCapacity}
                    isFull={section.waitlistRemaining <= 0}
                  />
                </div>
              </div>

              {meetingTimesWithDays.map((mt, i) => (
                <div key={i} className="flex items-center gap-2 pr-6">
                  <div className="w-[90px] shrink-0 py-1">
                    {i === 0 && (
                      <span className="text-[10px] font-bold text-neu4">
                        MEETING TIMES
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5 text-xs">
                    <span className="font-semibold text-neu8">
                      {mt.days.map((d) => DAY_ABBREVS[d]).join(" ")}
                    </span>
                    <span className="text-neu6">
                      {formatTime(mt.startTime)} – {formatTime(mt.endTime)}
                    </span>
                  </div>
                </div>
              ))}

              <InfoRow label="ROOM" value={roomDisplay} />

              {section.faculty && (
                <InfoRow label="PROFESSOR" value={section.faculty} />
              )}
            </div>

            {/* Footer link */}
            <div className="flex items-center justify-center py-1">
              <span className="text-[10px] text-neu5">
                Looking for more info?
              </span>
              <a href="/catalog" className="ml-1 flex items-center gap-1 text-[10px] text-neu7 hover:underline">
                Visit our catalog
                <svg
                  width="6"
                  height="6"
                  viewBox="0 0 6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <path d="M1 5L5 1M5 1H2M5 1V4" />
                </svg>
              </a>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="absolute right-1.5 top-1.5 flex h-5 w-5 cursor-pointer items-center justify-center rounded text-neu5 hover:text-neu8"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M1 1L9 9M9 1L1 9" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );

  if (typeof document === "undefined") return null;
  return createPortal(popup, document.body);
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 pr-6">
      <div className="w-[90px] shrink-0 py-1">
        <span className="text-[10px] font-bold text-neu4">{label}</span>
      </div>
      <span className="text-xs text-neu8">{value}</span>
    </div>
  );
}

function SeatPill({
  filled,
  capacity,
  isFull,
}: {
  filled: number;
  capacity: number;
  isFull: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1 rounded-full border px-2 py-1 ${
        isFull
          ? "border-red-200 bg-red-50"
          : "border-[#d6f5e2] bg-[#eafbf0]"
      }`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke={isFull ? "#dc2626" : "#178459"}
        strokeWidth="2"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
      <span
        className={`text-xs ${isFull ? "text-red-600" : "text-[#178459]"}`}
      >
        {filled} / {capacity}
      </span>
    </div>
  );
}
