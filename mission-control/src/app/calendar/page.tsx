import { AppShell } from "@/components/app-shell";
import { CalendarClient } from "@/components/calendar-client";
import { jobs, schedule } from "@/lib/mission-data";

export default function CalendarPage() {
  return (
    <AppShell currentPath="/calendar">
      <CalendarClient jobs={jobs} schedule={schedule} />
    </AppShell>
  );
}
