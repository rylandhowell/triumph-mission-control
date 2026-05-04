import { AppShell } from "@/components/app-shell";
import { SubsClient } from "@/components/subs-client";

export default function SubsPage() {
  return (
    <AppShell currentPath="/subs">
      <SubsClient />
    </AppShell>
  );
}
