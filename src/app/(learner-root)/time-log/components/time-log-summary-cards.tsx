"use client";

interface TimeLogSummaryCardsProps {
  thisWeek?: string; // Format: "HH:MM"
  thisMonth?: string; // Format: "HH:MM"
  total?: string; // Format: "HH:MM"
}

export function TimeLogSummaryCards({
  thisWeek = "0:0",
  thisMonth = "0:0",
  total = "0:0",
}: TimeLogSummaryCardsProps) {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    return { hours: hours || "0", minutes: minutes || "0" };
  };

  const weekTime = formatTime(thisWeek);
  const monthTime = formatTime(thisMonth);
  const totalTime = formatTime(total);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
      <div className="rounded-lg border border-border bg-card">
        <div className="p-3 bg-muted border-b">
          <h4 className="text-sm font-light">This Week:</h4>
        </div>
        <div className="p-5">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold">{weekTime.hours}</span>
            <span className="text-lg font-semibold">: {weekTime.minutes}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="p-3 bg-muted border-b">
          <h4 className="text-sm font-light">This Month:</h4>
        </div>
        <div className="p-5">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold">{monthTime.hours}</span>
            <span className="text-lg font-semibold">: {monthTime.minutes}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="p-3 bg-muted border-b">
          <h4 className="text-sm font-light">Total:</h4>
        </div>
        <div className="p-5">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold">{totalTime.hours}</span>
            <span className="text-lg font-semibold">: {totalTime.minutes}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
