import type { HandoffCase } from "@/src/types/case";

export default function EvidencePanel({ item }: { item: HandoffCase }) {
  return <section className="advisor-evidence"><h3>Evidencia entregada al asesor</h3><ul>{item.evidence.map((source) => <li key={source}>{source}</li>)}</ul><h3>Conversación previa</h3>{item.conversation.map((message, index) => <p key={index}><strong>{message.role === "user" ? "Cliente" : "LucIA"}:</strong> {message.text}</p>)}</section>;
}
