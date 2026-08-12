import { currentReceipt, money } from "@/src/services/billingService";

export default function BillBreakdown() {
  const colors = ["#00a9e0", "#e9426d", "#7b3ff2"];
  return (
    <div className="bill-breakdown">
      {currentReceipt.charges.map((charge, index) => (
        <div className="breakdown-row" key={charge.label}>
          <span className="breakdown-icon" style={{ background: `${colors[index]}18`, color: colors[index] }}>{index + 1}</span>
          <div><strong>{charge.label}</strong><small>{index === 0 ? "Tu tarifa mensual no cambió" : index === 1 ? "Compra del 10 de agosto" : "Activado el 31 de julio"}</small></div>
          <b>{money(charge.amount)}</b>
        </div>
      ))}
      <div className="breakdown-total"><span>Total de agosto</span><strong>{money(currentReceipt.amount)}</strong></div>
    </div>
  );
}
