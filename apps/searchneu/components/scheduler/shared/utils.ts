// Helper to convert time format (e.g., 1330 -> "1:30 PM")
export function formatTime(time: number): string {
  const hours = Math.floor(time / 100);
  const minutes = time % 100;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

// Convert military time to minutes from midnight for positioning
export function timeToMinutes(time: number): number {
  const hours = Math.floor(time / 100);
  const minutes = time % 100;
  return hours * 60 + minutes;
}
