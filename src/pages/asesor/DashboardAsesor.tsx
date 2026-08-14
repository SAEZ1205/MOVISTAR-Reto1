import CaseTable from "@/src/components/asesor/CaseTable";
import type { CallProvider, HandoffCase } from "@/src/types/case";
import Icon from "@/src/components/shared/Icon";

const activeCalls = new Set(["CALLING_AGENT", "AGENT_ANSWERED", "WAITING_AGENT_CONFIRMATION", "AGENT_ACCEPTED", "CALLING_CUSTOMER", "CUSTOMER_ANSWERED", "IN_CALL"]);

export default function DashboardAsesor({
  cases,
  provider,
  connected,
  onOpen = () => undefined,
  onRefresh = () => undefined,
  onExport = () => undefined,
}: {
  cases: HandoffCase[];
  provider: CallProvider;
  connected: boolean;
  onOpen?: (item: HandoffCase) => void;
  onRefresh?: () => void;
  onExport?: () => void;
}) {
  const pending = cases.filter((item) => item.status === "new").length;
  const inCall = cases.filter((item) => activeCalls.has(item.callbackStatus)).length;
  const resolved = cases.filter((item) => item.status === "resolved").length;
  const callbacks = cases.filter((item) => item.callbackRequested || item.contactPreference === "callback").length;

  return <section className="advisor-dashboard"><header><span><small>CALL CENTER · BANDEJA COMPARTIDA</small><h1>Casos derivados por LucIA</h1><p>El asesor recibe la consulta, la evidencia y la conversación antes de atender.</p><em className={`advisor-connection ${connected ? "online" : "fallback"}`}><i /> {connected ? `Backend conectado · ${provider}` : "Demo local · configura el backend para compartir casos"}</em></span><div className="advisor-header-actions"><button onClick={onExport}><Icon name="download" size={18} /> Exportar registro</button><button onClick={onRefresh}><Icon name="refresh" size={18} /> Actualizar</button></div></header><div className="advisor-metrics"><article><small>TOTAL</small><strong>{cases.length}</strong></article><article><small>POR ATENDER</small><strong>{pending}</strong></article><article><small>EN LLAMADA</small><strong>{inCall}</strong></article><article><small>RESUELTOS</small><strong>{resolved}</strong></article><article><small>CALLBACKS</small><strong>{callbacks}</strong></article></div><CaseTable cases={cases} onOpen={onOpen} /></section>;
}
