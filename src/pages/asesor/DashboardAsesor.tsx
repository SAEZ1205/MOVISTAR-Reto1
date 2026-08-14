import { useMemo, useState } from "react";
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
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const pending = cases.filter((item) => item.status === "new").length;
  const inCall = cases.filter((item) => activeCalls.has(item.callbackStatus)).length;
  const resolved = cases.filter((item) => item.status === "resolved").length;
  const callbacks = cases.filter((item) => item.callbackRequested || item.contactPreference === "callback").length;

  const filteredCases = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    return cases.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter || (statusFilter === "callback" && (item.callbackRequested || item.contactPreference === "callback"));
      const searchable = `${item.id} ${item.customerName} ${item.question} ${item.receiptSlug}`.toLowerCase();
      return matchesStatus && (!cleanQuery || searchable.includes(cleanQuery));
    });
  }, [cases, query, statusFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredCases.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleCases = filteredCases.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <section className="advisor-dashboard">
      <header>
        <span><small>CALL CENTER · BANDEJA OPERATIVA</small><h1>Casos de LucIA</h1><p>Busca, filtra y atiende sin abrir información innecesaria.</p><em className={`advisor-connection ${connected ? "online" : "fallback"}`}><i /> {connected ? `Backend conectado · ${provider}` : "Demo local · activa el backend para compartir casos"}</em></span>
        <div className="advisor-header-actions"><button onClick={onExport}><Icon name="download" size={17} /> Excel / CSV</button><button onClick={onRefresh}><Icon name="refresh" size={17} /> Actualizar</button></div>
      </header>
      <div className="advisor-metrics"><article><small>TOTAL</small><strong>{cases.length}</strong></article><article><small>PENDIENTES</small><strong>{pending}</strong></article><article><small>EN LLAMADA</small><strong>{inCall}</strong></article><article><small>RESUELTOS</small><strong>{resolved}</strong></article><article><small>CALLBACKS</small><strong>{callbacks}</strong></article></div>
      <section className="advisor-inbox">
        <div className="advisor-filters">
          <label><Icon name="sparkles" size={17} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Buscar caso, cliente o consulta" aria-label="Buscar casos" /></label>
          <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} aria-label="Filtrar por estado"><option value="all">Todos los estados</option><option value="new">Por atender</option><option value="in-progress">En atención</option><option value="resolved">Resueltos</option><option value="callback">Con callback</option></select>
          <small>{filteredCases.length} resultados</small>
        </div>
        <div className="advisor-list-heading"><span>CASO Y CLIENTE</span><span>CONSULTA</span><span>ESTADO</span></div>
        <CaseTable cases={visibleCases} onOpen={onOpen} />
        {pageCount > 1 && <nav className="advisor-pagination" aria-label="Páginas de casos"><button disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Anterior</button><span>Página {currentPage} de {pageCount}</span><button disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Siguiente</button></nav>}
      </section>
    </section>
  );
}
