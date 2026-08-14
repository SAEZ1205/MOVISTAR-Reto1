import { useEffect, useState } from "react";
import EvidencePanel from "@/src/components/asesor/EvidencePanel";
import type { CallProvider, CaseStatus, HandoffCase } from "@/src/types/case";
import type { SimulationAction } from "@/src/services/callCenterService";
import Icon from "@/src/components/shared/Icon";

const labels: Record<string, string> = {
  "not-requested": "Sin llamada solicitada", requested: "Llamada solicitada", calling: "Llamando", completed: "Llamada completada", failed: "Llamada fallida",
  CALLBACK_REQUESTED: "Llamada solicitada", CALLING_AGENT: "Llamando al asesor", AGENT_ANSWERED: "Asesor contestó", WAITING_AGENT_CONFIRMATION: "Esperando aceptación", AGENT_ACCEPTED: "Caso aceptado", CALLING_CUSTOMER: "Llamando al cliente", CUSTOMER_ANSWERED: "Cliente contestó", IN_CALL: "Asesor y cliente conectados", CALL_COMPLETED: "Llamada finalizada", AGENT_NO_ANSWER: "Asesor no contestó", CUSTOMER_NO_ANSWER: "Cliente no contestó", CALL_FAILED: "Error de llamada",
};

function CallTimer({ startedAt }: { startedAt?: string | null }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const seconds = startedAt ? Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000)) : 0;
  return <b>{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</b>;
}

export default function CasoDetalle({
  item,
  provider,
  working,
  onBack = () => undefined,
  onStatus = () => undefined,
  onCallAction = () => undefined,
}: {
  item?: HandoffCase;
  provider: CallProvider;
  working?: boolean;
  onBack?: () => void;
  onStatus?: (status: CaseStatus, patch?: { resolution?: string; advisorNotes?: string }) => void;
  onCallAction?: (action: SimulationAction) => void;
}) {
  const [notes, setNotes] = useState(item?.advisorNotes ?? "");
  const [resolution, setResolution] = useState(item?.resolution ?? "");
  useEffect(() => { setNotes(item?.advisorNotes ?? ""); setResolution(item?.resolution ?? ""); }, [item]);
  if (!item) return <p>Selecciona un caso para revisar su contexto.</p>;

  const simulationControls = provider !== "telnyx";
  const canAnswer = simulationControls && ["requested", "CALLBACK_REQUESTED", "CALLING_AGENT"].includes(item.callbackStatus);
  const canAccept = simulationControls && ["AGENT_ANSWERED", "WAITING_AGENT_CONFIRMATION"].includes(item.callbackStatus);
  const canFinish = simulationControls && item.callbackStatus === "IN_CALL";

  return <section className="advisor-detail"><button className="advisor-back" onClick={onBack}><Icon name="arrow-left" size={18} /> Volver a la bandeja</button><header><div><small>{item.id} · {item.billingContext.evidenceStatus}</small><h1>{item.customerName}</h1><p>{item.question}</p></div><span className={`advisor-status ${item.status}`}>{item.status}</span></header><section className={`advisor-call-card ${item.callbackStatus === "IN_CALL" ? "live" : ""}`}><div className="advisor-call-icon"><Icon name="headset" /></div><span><small>{provider === "telnyx" ? "TELNYX VOICE" : "SIMULACIÓN SEGURA"}</small><strong>{labels[item.callbackStatus] ?? item.callbackStatus}</strong><p>Asesor: {item.assignedAgent ?? "Pendiente"} · Cliente: {item.customerPhoneMasked ?? "Número protegido"}</p>{item.callError && <em>{item.callError}</em>}</span>{item.callbackStatus === "IN_CALL" && <CallTimer startedAt={item.callStartedAt} />}<div className="advisor-call-actions">{canAnswer && <button disabled={working} onClick={() => onCallAction("answer")}><Icon name="phone" size={18} /> Atender llamada</button>}{canAccept && <button disabled={working} onClick={() => onCallAction("accept")}><Icon name="check" size={18} /> Aceptar y conectar</button>}{canFinish && <button disabled={working} onClick={() => onCallAction("finish")}><Icon name="close" size={18} /> Finalizar llamada</button>}</div></section><div className="advisor-actionbar"><button onClick={() => onStatus("assigned")}>Tomar caso</button><button onClick={() => onStatus("in-progress")}>Iniciar atención</button><button onClick={() => onStatus("resolved", { resolution, advisorNotes: notes })}>Marcar resuelto</button></div><EvidencePanel item={item} /><section className="advisor-resolution"><small>CIERRE DEL CASO</small><h2>Notas y solución</h2><label>Notas internas<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Qué revisó el asesor…" /></label><label>Solución entregada<textarea value={resolution} onChange={(event) => setResolution(event.target.value)} placeholder="Cómo se resolvió la consulta…" /></label><button onClick={() => onStatus(item.status, { resolution, advisorNotes: notes })}>Guardar notas</button></section></section>;
}
