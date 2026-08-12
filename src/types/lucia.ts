export type Resolution = "pending" | "resolved" | "needs-help";

export type ChatMessage = {
  role: "user" | "bot";
  text: string;
  source?: string;
  suggestHuman?: boolean;
};

export type ServiceStatus = {
  gemini: boolean;
  geminiModel: string;
  whatsapp: boolean;
  receipts: number;
};

export type LuciaReply = {
  answer?: string;
  source?: string;
  intent?: string;
  needsResolutionCheck?: boolean;
};
