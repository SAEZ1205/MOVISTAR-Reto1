import type { CSSProperties } from "react";
import BillBreakdown from "@/src/components/cliente/BillBreakdown";
import ReceiptTrend from "@/src/components/cliente/ReceiptTrend";
import LuciaButton from "@/src/components/lucia/LuciaButton";
import Badge from "@/src/components/shared/Badge";
import Button from "@/src/components/shared/Button";
import Card from "@/src/components/shared/Card";
import Header from "@/src/components/shared/Header";
import Icon from "@/src/components/shared/Icon";
import { benefits, currentReceipt, customer, money, offer } from "@/src/services/billingService";
import type { Resolution } from "@/src/types/lucia";

export default function EntiendeRecibo({ resolution, usedPercent, remaining, currentDelta, onBack, onHistory, onConsumption, onOpenChat, onResolved, onHuman }: { resolution: Resolution; usedPercent: number; remaining: number; currentDelta: number; onBack: () => void; onHistory: () => void; onConsumption: () => void; onOpenChat: () => void; onResolved: () => void; onHuman: () => void }) {
  return (
    <div className="assistant-screen">
      <Header title="Entiende tu recibo" onBack={onBack} />
      <div className="screen-content">
        <section className="assistant-hero"><span><Icon name="sparkles" /></span><div><small>ANÁLISIS CON EVIDENCIA</small><h2>Tu plan no subió de precio</h2><p>LucIA encontró dos servicios adicionales que explican exactamente el cambio.</p></div><Badge tone="green">Verificado</Badge></section>
        <Card className="difference-card"><span><small>Recibo anterior</small><strong>{money(currentReceipt.previous)}</strong></span><Icon name="arrow-right" /><span><small>Recibo actual</small><strong>{money(currentReceipt.amount)}</strong></span><b>+{money(currentDelta)}</b></Card>
        <Card className="explanation-card"><div className="section-title"><span><small>DESGLOSE DEL TOTAL</small><h2>¿Qué cambió este mes?</h2></span><Badge tone="blue">0% inventado</Badge></div><p className="plain-explanation">Tu plan conserva el mismo precio. El aumento viene de un paquete de datos y un servicio activados durante el ciclo.</p><BillBreakdown /><div className="evidence-box"><Icon name="check" /><span><strong>Evidencia utilizada</strong><small>{currentReceipt.evidence.join(" · ")}</small></span></div></Card>
        <LuciaButton onClick={onOpenChat} compact />
        <Card className="trend-card"><div className="section-title"><span><small>ÚLTIMOS 6 MESES</small><h2>Así cambió tu recibo</h2></span><button onClick={onHistory}>Ver recibos</button></div><ReceiptTrend /><p className="chart-note"><strong>Fue estable hasta julio.</strong> Mayo tuvo un prorrateo de S/2.50 y agosto dos cargos adicionales.</p></Card>
        <Card className="usage-summary"><div><small>DATOS MÓVILES</small><h2>Te quedan {remaining.toFixed(1)} GB</h2><p>de {customer.planData} GB para {customer.daysRemaining} días.</p><Button variant="secondary" onClick={onConsumption}>Ver mi consumo</Button></div><div className="usage-ring" style={{ "--usage": `${usedPercent * 3.6}deg` } as CSSProperties}><span><strong>{usedPercent}%</strong><small>usado</small></span></div></Card>
        <Card className="benefit-reminder"><Icon name="gift" /><div><small>YA ESTÁ INCLUIDO EN TU PLAN</small><h2>No pagues dos veces por lo que ya tienes</h2><p>{benefits.join(" · ")}</p></div></Card>
        <Card className={`decision-card ${resolution}`}><div><small>SIGUIENTE PASO</small><h2>{resolution === "resolved" ? "Consulta resuelta: oferta habilitada" : resolution === "needs-help" ? "Derivación lista para un asesor" : "¿La explicación resolvió tu duda?"}</h2><p>{resolution === "resolved" ? `${offer.name} por ${money(offer.price)}. La regla comercial sí se cumple.` : resolution === "needs-help" ? "Prepararemos todo el contexto para que no repitas la historia." : "La oferta permanece bloqueada hasta que confirmes que entendiste el cobro."}</p></div>{resolution === "pending" && <footer><Button onClick={onResolved}>Sí, quedó claro</Button><Button variant="secondary" onClick={onHuman}>Todavía tengo dudas</Button></footer>}{resolution !== "pending" && <Button onClick={onOpenChat}>{resolution === "resolved" ? "Ver oferta en LucIA" : "Preparar derivación"}</Button>}</Card>
      </div>
    </div>
  );
}
