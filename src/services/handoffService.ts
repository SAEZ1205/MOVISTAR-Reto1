import { currentReceipt, customer } from "./billingService";
import type { HandoffCase, HandoffResponse } from "@/src/types/case";
import type { ChatMessage } from "@/src/types/lucia";

const STORAGE_KEY = "movistar-reto1-cases";

export function getCases(): HandoffCase[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as HandoffCase[]; } catch { return []; }
}

export function createCase(messages: ChatMessage[]): HandoffCase {
  const lastQuestion = [...messages].reverse().find((item) => item.role === "user")?.text ?? "Consulta de facturación";
  const handoffCase: HandoffCase = {
    id: `CASO-${Date.now().toString().slice(-6)}`,
    customerName: customer.fullName,
    line: customer.line,
    question: lastQuestion,
    receiptSlug: currentReceipt.slug,
    evidence: currentReceipt.evidence,
    conversation: messages.slice(-8),
    reason: "El cliente indicó que todavía necesita ayuda.",
    status: "new",
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([handoffCase, ...getCases()]));
  return handoffCase;
}

export async function sendHandoff(messages: ChatMessage[]): Promise<HandoffResponse> {
  const handoffCase = createCase(messages);
  const endpoint = import.meta.env.VITE_HANDOFF_API_URL?.trim();
  if (endpoint) {
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(handoffCase) });
      if (response.ok) return { ok: true, configured: true, message: "Resumen enviado al canal configurado del Call Center.", case: handoffCase };
    } catch { /* El caso local sigue disponible. */ }
  }
  return { ok: true, configured: false, message: `${handoffCase.id} guardado para la demo. Conecta el backend de mensajería para enviarlo por WhatsApp/SMS.`, case: handoffCase };
}

export function updateCaseStatus(id: string, status: HandoffCase["status"]) {
  const updated = getCases().map((item) => item.id === id ? { ...item, status } : item);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated.find((item) => item.id === id);
}
