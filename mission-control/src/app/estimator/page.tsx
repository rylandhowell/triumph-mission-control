import { AppShell } from "@/components/app-shell";
import { EstimatorClient } from "@/components/estimator-client";

export default function EstimatorPage() {
  return (
    <AppShell currentPath="/estimator">
      <EstimatorClient />
    </AppShell>
  );
}
