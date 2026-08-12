import type { CSSProperties } from "react";
import BillBreakdown from "@/src/components/cliente/BillBreakdown";
import ReceiptTrend from "@/src/components/cliente/ReceiptTrend";
import LuciaImage from "@/src/components/lucia/LuciaImage";
import { currentReceipt, customer, money, offer } from "@/src/services/billingService";
import type { Receipt } from "@/src/types/billing";
import type { Resolution } from "@/src/types/lucia";

type EntiendeReciboProps = {
  resolution: Resolution;
  usedPercent: number;
  remaining: number;
  currentDelta: number;
  onSelectReceipt: (receipt: Receipt) => void;
  onExplain: () => void;
  onShowReceipts: () => void;
  onShowConsumption: () => void;
  onOpenChat: () => void;
};

export default function EntiendeRecibo({
  resolution,
  usedPercent,
  remaining,
  currentDelta,
  onSelectReceipt,
  onExplain,
  onShowReceipts,
  onShowConsumption,
  onOpenChat,
}: EntiendeReciboProps) {
  return (
    <div className="summary-layout">
      <section className="bill-card card">
        <div className="bill-top"><div><span>Recibo de agosto</span><small>Vence el 15 de agosto</small></div><b>Pendiente</b></div>
        <div className="bill-amount"><strong>{money(currentReceipt.amount)}</strong><span>↑ {money(currentDelta)} vs. julio</span></div>
        <div className="bill-actions"><button className="primary-button">Pagar recibo</button><button className="secondary-button" onClick={() => onSelectReceipt(currentReceipt)}>Ver PDF</button></div>
      </section>

      <section className="explanation-card card">
        <header className="section-header"><div><small>Explicación directa</small><h3>Tu plan no subió de precio</h3></div><span className="verified-pill">✓ Verificado</span></header>
        <p className="lead-copy">El aumento de <strong>S/23.00</strong> viene de dos servicios agregados durante este ciclo.</p>
        <BillBreakdown />
        <button className="ask-lucia-button" onClick={onExplain}><LuciaImage compact /><span><strong>¿Quieres que LucIA te lo explique?</strong><small>Pregunta con tus propias palabras</small></span><b>›</b></button>
      </section>

      <section className="trend-card card">
        <header className="section-header"><div><small>Últimos 6 meses</small><h3>Así cambió tu recibo</h3></div><button className="text-button" onClick={onShowReceipts}>Ver PDF →</button></header>
        <ReceiptTrend />
        <div className="insight"><span>i</span><p><strong>Fue estable hasta julio.</strong> Mayo subió S/2.50 por un prorrateo y agosto S/23.00 por dos cargos.</p></div>
      </section>

      <section className="usage-card card">
        <header className="section-header"><div><small>Datos móviles</small><h3>Te quedan 5.2 GB</h3></div><span className="warning-pill">Vas justo</span></header>
        <div className="usage-main">
          <div className="usage-ring" style={{ "--usage": `${usedPercent * 3.6}deg` } as CSSProperties}><span><strong>{usedPercent}%</strong><small>usado</small></span></div>
          <div><p><strong>34.8 GB</strong> de {customer.planData} GB</p><span>Quedan {remaining.toFixed(1)} GB para 5 días.</span><small>A este ritmo podrían terminarse el 14 de agosto.</small></div>
        </div>
        <button className="secondary-button full" onClick={onShowConsumption}>Ver consumo diario</button>
      </section>

      <section className={`next-step-card card ${resolution === "resolved" ? "unlocked" : ""}`}>
        <div className="next-icon">{resolution === "resolved" ? "✓" : "⌁"}</div>
        <div><small>Siguiente paso inteligente</small><h3>{resolution === "resolved" ? "Oferta habilitada con una regla clara" : "Primero resolvemos tu consulta"}</h3><p>{resolution === "resolved" ? `${offer.name} por ${money(offer.price)}. ${offer.reason}` : "LucIA no mostrará ninguna venta hasta que confirmes que entendiste el cobro."}</p></div>
        <button onClick={onOpenChat}>{resolution === "resolved" ? "Ver oferta" : "Resolver con LucIA"}</button>
      </section>
    </div>
  );
}
