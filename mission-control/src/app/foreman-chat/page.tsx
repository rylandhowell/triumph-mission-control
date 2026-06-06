import { AppShell } from "@/components/app-shell";
import { ForemanChatClient } from "@/components/foreman-chat-client";

export default function ForemanChatPage() {
  return (
    <AppShell currentPath="/foreman-chat">
      <ForemanChatClient />
    </AppShell>
  );
}
