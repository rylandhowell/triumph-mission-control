import { AppShell } from "@/components/app-shell";
import { QuotesClient } from "@/components/quotes-client";
import { quotes } from "@/lib/mission-data";

export default function QuotesPage() {
  return (
    <AppShell currentPath="/quotes">
      <QuotesClient quotes={quotes} />
    </AppShell>
  );
}
