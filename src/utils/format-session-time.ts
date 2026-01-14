/**
 * Format session time from start date and duration
 * @param startDate - ISO date string
 * @param duration - Duration in minutes as string
 * @returns Formatted string like "15 January 2024, 10:00 AM - 11:30 AM"
 */
export function formatSessionTime(startDate: string, duration: string): string {
  const start = new Date(startDate);

  // Convert duration string to number of minutes
  const durationInMinutes = parseInt(duration, 10);
  const end = new Date(start.getTime() + durationInMinutes * 60000);

  const formatOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  const dateString = start.toLocaleDateString("en-GB", formatOptions);

  const formatTime = (date: Date): string => {
    let hrs = date.getHours();
    const mins = date.getMinutes().toString().padStart(2, "0");
    const ampm = hrs >= 12 ? "PM" : "AM";
    hrs = hrs % 12 || 12;
    return `${hrs}:${mins} ${ampm}`;
  };

  return `${dateString}, ${formatTime(start)} - ${formatTime(end)}`;
}

