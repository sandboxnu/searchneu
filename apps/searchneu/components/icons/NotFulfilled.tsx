/** Gray circle with a white "x", used for unfulfilled requirements (from Figma). */
export function NotFulfilledIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="8" cy="8" r="8" fill="#B4BBC8" />
      <path
        d="M5.86 5.86L10.14 10.14M10.14 5.86L5.86 10.14"
        stroke="white"
        strokeWidth="1.43"
        strokeLinecap="round"
      />
    </svg>
  );
}
