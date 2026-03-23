export function SeatPill({
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
        isFull ? "border-red-200 bg-red-50" : "border-[#d6f5e2] bg-[#eafbf0]"
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
      <span className={`text-xs ${isFull ? "text-red-600" : "text-[#178459]"}`}>
        {filled} / {capacity}
      </span>
    </div>
  );
}
