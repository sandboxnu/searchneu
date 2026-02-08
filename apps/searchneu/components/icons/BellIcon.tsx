import { Bell } from "lucide-react";

interface BellIconProps {
  className?: string;
  opacity?: number;
}

export function BellIcon({
  className = "text-r4",
  opacity = 1,
}: BellIconProps) {
  return (
    <Bell
      size={12}
      className={className}
      fill="currentColor"
      style={{ opacity }}
      strokeWidth={0}
    />
  );
}
