import type { ChatMessage } from "@/src/types/lucia";
import type { CallProvider, HandoffCase, HandoffResponse } from "@/src/types/case";
import { createCase, getCases, upsertCase } from "./handoffService";

type CasePatch = Partial<Pick<HandoffCase, "status" | "resolution" | "advisorNotes">>;
export type SimulationAction = "answer" | "accept" | "finish";

function baseUrl() {
  return import.meta.env.VITE_CALLCENTER_API_URL?.trim().replace(/\/$/, "") ?? "";
}

function handoffUrl() {
  return import.meta.env.VITE_HANDOFF_API_URL?.trim() || (baseUrl() ? `${baseUrl()}/api/handoff` : "");
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(`Call Center respondió ${response.status}`);
  return response.json() as Promise<T>;
}

export async function requestCallback(messages: ChatMessage[]): Promise<HandoffResponse> {
  const handoffCase = createCase(messages, {
    contactPreference: "callback",
    callbackStatus: "CALLBACK_REQUESTED",
  });
  const endpoint = handoffUrl();

  if (endpoint) {
    try {
      const payload = await readJson<{ ok: boolean; message?: string; case?: HandoffCase }>(await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(handoffCase),
      }));
      const saved = payload.case ? upsertCase(payload.case) : handoffCase;
      return {
        ok: payload.ok,
        configured: true,
        message: payload.message ?? `${saved.id}: LucIA ya envió el contexto al Call Center.`,
        case: saved,
      };
    } catch { /* Conserva el caso local para que la demo nunca se rompa. */ }
  }

  return {
    ok: true,
    configured: false,
    message: `${handoffCase.id}: solicitud guardada. Abre la consola del asesor para continuar la simulación.`,
    case: handoffCase,
  };
}

export async function fetchCallCenterCases(): Promise<{ cases: HandoffCase[]; provider: CallProvider; connected: boolean }> {
  if (!baseUrl()) return { cases: getCases(), provider: "local", connected: false };
  try {
    const payload = await readJson<{ cases: HandoffCase[]; provider?: CallProvider }>(await fetch(`${baseUrl()}/api/cases`));
    payload.cases.forEach(upsertCase);
    return { cases: payload.cases, provider: payload.provider ?? "simulation", connected: true };
  } catch {
    return { cases: getCases(), provider: "local", connected: false };
  }
}

export async function patchCallCenterCase(id: string, patch: CasePatch): Promise<HandoffCase | undefined> {
  if (baseUrl()) {
    try {
      const payload = await readJson<{ case: HandoffCase }>(await fetch(`${baseUrl()}/api/cases/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }));
      return upsertCase(payload.case);
    } catch { /* Fallback local. */ }
  }
  const current = getCases().find((item) => item.id === id);
  return current ? upsertCase({ ...current, ...patch, updatedAt: new Date().toISOString() }) : undefined;
}

export async function runSimulationAction(id: string, action: SimulationAction): Promise<HandoffCase | undefined> {
  if (baseUrl()) {
    try {
      const payload = await readJson<{ case: HandoffCase }>(await fetch(`${baseUrl()}/api/cases/${encodeURIComponent(id)}/simulation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      }));
      return upsertCase(payload.case);
    } catch { /* Fallback local. */ }
  }

  const item = getCases().find((candidate) => candidate.id === id);
  if (!item) return undefined;
  const now = new Date().toISOString();
  if (action === "answer") return upsertCase({ ...item, callbackStatus: "WAITING_AGENT_CONFIRMATION", callAnsweredAt: now, assignedAgent: "Asesor Demo", updatedAt: now });
  if (action === "accept") {
    const connecting = upsertCase({ ...item, status: "assigned", callbackStatus: "CALLING_CUSTOMER", assignedAgent: "Asesor Demo", updatedAt: now });
    window.setTimeout(() => {
      const current = getCases().find((candidate) => candidate.id === id);
      if (current?.callbackStatus === "CALLING_CUSTOMER") upsertCase({ ...current, status: "in-progress", callbackStatus: "IN_CALL", callStartedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }, 2200);
    return connecting;
  }
  const started = item.callStartedAt ? new Date(item.callStartedAt).getTime() : Date.now();
  return upsertCase({ ...item, callbackStatus: "CALL_COMPLETED", callEndedAt: now, callDurationSeconds: Math.max(1, Math.round((Date.now() - started) / 1000)), updatedAt: now });
}

export function buildAdvisorVoiceSummary(item: HandoffCase) {
  const evidence = item.evidence.slice(0, 2).join(". ");
  return `LucIA Call Center. Nuevo caso ${item.id}. Cliente ${item.customerName}. La consulta es: ${item.question}. Motivo: ${item.reason}. Evidencia disponible: ${evidence}. Presione aceptar para tomar el caso.`;
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export async function exportCasesCsv(cases: HandoffCase[]) {
  let blob: Blob;
  if (baseUrl()) {
    try {
      const response = await fetch(`${baseUrl()}/api/cases/export.csv`);
      if (!response.ok) throw new Error();
      blob = await response.blob();
    } catch { blob = localCsv(cases); }
  } else blob = localCsv(cases);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "lucia-callcenter-casos.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

function localCsv(cases: HandoffCase[]) {
  const headers = ["case_id", "created_at", "customer_name", "line_masked", "receipt", "question", "handoff_reason", "evidence", "status", "callback_status", "assigned_agent", "call_duration_seconds", "resolution", "advisor_notes"];
  const rows = cases.map((item) => [item.id, item.createdAt, item.customerName, item.customerPhoneMasked ?? item.line, item.receiptSlug, item.question, item.reason, item.evidence.join(" | "), item.status, item.callbackStatus, item.assignedAgent, item.callDurationSeconds, item.resolution, item.advisorNotes].map(csvCell).join(","));
  return new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
}
