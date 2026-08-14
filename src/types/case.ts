import type { ChatMessage } from "./lucia";

export type WhatsAppState = "idle" | "sending" | "sent" | "error";
export type CaseStatus = "new" | "assigned" | "in-progress" | "resolved";

export type HandoffCase = {
  id: string;
  customerName: string;
  line: string;
  question: string;
  receiptSlug: string;
  evidence: string[];
  conversation: ChatMessage[];
  reason: string;
  status: CaseStatus;
  createdAt: string;
};

export type HandoffResponse = {
  ok: boolean;
  configured?: boolean;
  message: string;
  case?: HandoffCase;
};
