import { AppShell } from "@/components/app-shell";
import { FilesClient } from "@/components/files-client";

export default function FilesPage() {
  return (
    <AppShell currentPath="/files">
      <FilesClient />
    </AppShell>
  );
}
