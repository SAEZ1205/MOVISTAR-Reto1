import EvidencePanel from "@/src/components/asesor/EvidencePanel";
import type { HandoffCase } from "@/src/types/case";

export default function CasoDetalle({ item }: { item?: HandoffCase }) {
  if (!item) return <p>Selecciona un caso para revisar su contexto.</p>;
  return <main className="advisor-detail"><header><small>{item.id}</small><h1>{item.customerName}</h1><p>{item.question}</p></header><EvidencePanel item={item} /></main>;
}
