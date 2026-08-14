import { currentReceipt, customer } from "./billingService";
import type { HandoffCase, HandoffResponse } from "@/src/types/case";
import type { ChatMessage } from "@/src/types/lucia";

const STORAGE_KEY = "movistar-reto1-cases";

function saveCases(cases: HandoffCase[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
}

export function getCases(): HandoffCase[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as HandoffCase[]; } catch { return []; }
}

export function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length > 3 ? `${"•".repeat(Math.max(4, digits.length - 3))}${digits.slice(-3)}` : "Número protegido";
}

export function upsertCase(nextCase: HandoffCase) {
  const cases = getCases();
  const found = cases.some((item) => item.id === nextCase.id);
  saveCases(found ? cases.map((item) => item.id === nextCase.id ? nextCase : item) : [nextCase, ...cases]);
  return nextCase;
}

type CaseOptions = Pick<HandoffCase, "contactPreference" | "callbackStatus">;

export function createCase(messages: ChatMessage[], options: Partial<CaseOptions> = {}): HandoffCase {
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
    billingContext: {
      financialAccount: customer.account,
      invoiceNumber: currentReceipt.code,
      billingCycle: currentReceipt.period,
      evidenceStatus: "VERIFIED",
      chargeCodes: ["PLAN_40GB", "PAQ_10GB", "MUSICA"],
      dataSources: ["FACTURACION-CLIENTES", "Ordenes", "CATALOGO-OFERTAS"],
    },
    contactPreference: options.contactPreference ?? "dashboard",
    callbackStatus: options.callbackStatus ?? "not-requested",
    callbackRequested: options.contactPreference === "callback",
    customerPhoneMasked: maskPhone(customer.line),
    advisorPhoneMasked: "Número protegido",
    assignedAgent: null,
    callDurationSeconds: null,
    resolution: null,
    advisorNotes: null,
    updatedAt: new Date().toISOString(),
  };
  upsertCase(handoffCase);
  return handoffCase;
}

export async function sendHandoff(messages: ChatMessage[]): Promise<HandoffResponse> {
  const handoffCase = createCase(messages, { contactPreference: "dashboard" });
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
  const updated = getCases().map((item) => item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item);
  saveCases(updated);
  return updated.find((item) => item.id === id);
}
