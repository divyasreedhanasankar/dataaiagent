import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ChatWindow } from "@/components/chat/ChatWindow";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DataMind AI — Conversational Database Intelligence" },
      {
        name: "description",
        content:
          "Ask questions in plain English and get SQL, charts, ER diagrams and business insights from your connected databases.",
      },
      { property: "og:title", content: "DataMind AI — Conversational Database Intelligence" },
      {
        property: "og:description",
        content:
          "Ask questions in plain English and get SQL, charts, ER diagrams and business insights from your connected databases.",
      },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  return (
    <AppShell>
      <ChatWindow />
    </AppShell>
  );
}
