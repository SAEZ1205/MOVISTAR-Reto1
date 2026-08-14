import type { ChatMessage } from "./lucia";
import type { EvidenceStatus } from "./billing";

export type WhatsAppState = "idle" | "sending" | "sent" | "error";
export type CallCenterState = "idle" | "sending" | "requested" | "sent" | "error";
export type CaseStatus = "new" | "assigned" | "in-progress" | "resolved";
export type ContactPreference = "dashboard" | "callback" | "whatsapp";
export type CallbackStatus =
  | "not-requested" | "requested" | "calling" | "completed" | "failed"
  | "CALLBACK_REQUESTED" | "CALLING_AGENT" | "AGENT_ANSWERED"
  | "WAITING_AGENT_CONFIRMATION" | "AGENT_ACCEPTED" | "CALLING_CUSTOMER"
  | "CUSTOMER_ANSWERED" | "IN_CALL" | "CALL_COMPLETED"
  | "AGENT_NO_ANSWER" | "CUSTOMER_NO_ANSWER" | "CALL_FAILED";
export type CallProvider = "local" | "simulation" | "telnyx";

export type BillingContext = {
  financialAccount: string;
  invoiceNumber: string;
  billingCycle: string;
  evidenceStatus: EvidenceStatus;
  chargeCodes: string[];
  dataSources: string[];
};

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
  billingContext: BillingContext;
  contactPreference: ContactPreference;
  callbackStatus: CallbackStatus;
  callbackRequested?: boolean;
  assignedAgent?: string | null;
  advisorPhoneMasked?: string;
  customerPhoneMasked?: string;
  advisorCallControlId?: string;
  customerCallControlId?: string;
  callStartedAt?: string | null;
  callAnsweredAt?: string | null;
  callEndedAt?: string | null;
  callDurationSeconds?: number | null;
  resolution?: string | null;
  advisorNotes?: string | null;
  callError?: string | null;
  updatedAt?: string;
};

export type HandoffResponse = {
  ok: boolean;
  configured?: boolean;
  message: string;
  case?: HandoffCase;
};
