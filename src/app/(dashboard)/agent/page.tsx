import type { Metadata } from "next";
import { ChatLayout } from "@/components/chat/chat-layout"

export const metadata: Metadata = {
  title: "Agent",
  description: "Chat with the Synapse AI agent about your workspace.",
}

export default function ChatPage() {
  return <ChatLayout />
}
