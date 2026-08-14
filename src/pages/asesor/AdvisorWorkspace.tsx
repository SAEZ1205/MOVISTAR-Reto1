import { useCallback, useEffect, useState } from "react";
import CasoDetalle from "./CasoDetalle";
import DashboardAsesor from "./DashboardAsesor";
import {
  buildAdvisorVoiceSummary,
  exportCasesCsv,
  fetchCallCenterCases,
  patchCallCenterCase,
  runSimulationAction,
  type SimulationAction,
} from "@/src/services/callCenterService";
import type { CallProvider, CaseStatus, HandoffCase } from "@/src/types/case";
import Icon from "@/src/components/shared/Icon";
import MovistarLogo from "@/src/components/shared/MovistarLogo";

export default function AdvisorWorkspace() {
  const [cases, setCases] = useState<HandoffCase[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [provider, setProvider] = useState<CallProvider>("local");
  const [connected, setConnected] = useState(false);
  const [working, setWorking] = useState(false);
  const selected = cases.find((item) => item.id === selectedId);

  const load = useCallback(async () => {
    const snapshot = await fetchCallCenterCases();
    setCases(snapshot.cases);
    setProvider(snapshot.provider);
    setConnected(snapshot.connected);
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 2000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function changeStatus(status: CaseStatus, patch: { resolution?: string; advisorNotes?: string } = {}) {
    if (!selected) return;
    setWorking(true);
    await patchCallCenterCase(selected.id, { status, ...patch });
    await load();
    setWorking(false);
  }

  async function callAction(action: SimulationAction) {
    if (!selected) return;
    setWorking(true);
    const updated = await runSimulationAction(selected.id, action);
    if (action === "answer" && updated && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const voice = new SpeechSynthesisUtterance(buildAdvisorVoiceSummary(updated));
      voice.lang = "es-PE";
      voice.rate = 0.96;
      window.speechSynthesis.speak(voice);
    }
    await load();
    setWorking(false);
  }

  return (
    <main className="advisor-workspace">
      <nav className="advisor-topbar"><div><MovistarLogo /><strong>LucIA · Consola de atención</strong></div><a href="/"><Icon name="phone" size={18} /> Volver a Mi Movistar</a></nav>
      {selected
        ? <CasoDetalle item={selected} provider={provider} working={working} onBack={() => setSelectedId(undefined)} onStatus={changeStatus} onCallAction={callAction} />
        : <DashboardAsesor cases={cases} provider={provider} connected={connected} onOpen={(item) => setSelectedId(item.id)} onRefresh={() => void load()} onExport={() => void exportCasesCsv(cases)} />}
    </main>
  );
}
