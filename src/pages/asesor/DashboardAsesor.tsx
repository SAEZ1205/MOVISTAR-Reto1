import CaseTable from "@/src/components/asesor/CaseTable";
import { getCases } from "@/src/services/handoffService";
import type { HandoffCase } from "@/src/types/case";

export default function DashboardAsesor({ onOpen = () => undefined }: { onOpen?: (item: HandoffCase) => void }) {
  const cases = getCases();
  return <main className="advisor-dashboard"><header><span><small>CALL CENTER</small><h1>Casos derivados por LucIA</h1></span><b>{cases.length} casos</b></header><CaseTable cases={cases} onOpen={onOpen} /></main>;
}
