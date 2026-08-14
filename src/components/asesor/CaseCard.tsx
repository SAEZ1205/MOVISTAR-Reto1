import type { HandoffCase } from "@/src/types/case";

const callLabels: Record<string, string> = {
  CALLBACK_REQUESTED: "Llamada solicitada", CALLING_AGENT: "Llamando al asesor", AGENT_ANSWERED: "Asesor contestó", WAITING_AGENT_CONFIRMATION: "Esperando aceptación", AGENT_ACCEPTED: "Caso aceptado", CALLING_CUSTOMER: "Llamando al cliente", CUSTOMER_ANSWERED: "Cliente contestó", IN_CALL: "En llamada", CALL_COMPLETED: "Llamada completada", CALL_FAILED: "Llamada fallida", requested: "Llamada solicitada",
};

export default function CaseCard({ item, onOpen }: { item: HandoffCase; onOpen: () => void }) {
  const isIncoming = ["requested", "CALLBACK_REQUESTED", "CALLING_AGENT"].includes(item.callbackStatus);
  const phoneDigits = item.line.replace(/\D/g, "");
  const protectedPhone = item.customerPhoneMasked ?? (phoneDigits ? `••••••${phoneDigits.slice(-3)}` : "Línea protegida");
  return <button className={`advisor-case ${isIncoming ? "incoming" : ""}`} onClick={onOpen}><span><strong>{item.id}</strong><small>{item.customerName} · {protectedPhone}</small></span><p>{item.question}<small>{callLabels[item.callbackStatus] ?? (item.contactPreference === "callback" ? "Atención por llamada" : "Caso digital")} · {item.billingContext.evidenceStatus}</small></p><b className={item.status}>{item.status}</b>{isIncoming && <em>LLAMADA ENTRANTE</em>}</button>;
}
