import type { HandoffResponse } from "@/src/types/case";
import type { ChatMessage } from "@/src/types/lucia";

export async function sendHandoff(messages: ChatMessage[]): Promise<HandoffResponse> {
  const response = await fetch("/api/whatsapp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversation: messages.map(({ role, text }) => ({ role, text })) }),
  });

  return response.json();
}
