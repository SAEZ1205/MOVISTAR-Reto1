export type WhatsAppState = "idle" | "sending" | "sent" | "error";

export type HandoffResponse = {
  ok: boolean;
  configured?: boolean;
  message?: string;
};
