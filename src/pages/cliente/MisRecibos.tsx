import MonthlyBillChart from "@/src/components/cliente/MonthlyBillChart";
import Card from "@/src/components/shared/Card";
import Header from "@/src/components/shared/Header";
import Icon from "@/src/components/shared/Icon";
import { currentReceipt, money } from "@/src/services/billingService";
import type { Receipt } from "@/src/types/billing";

type Props = {
  onBack: () => void;
  onAssistant: () => void;
  onOpenChat: () => void;
  onConsumption: () => void;
  onHistory: () => void;
  onSelectReceipt: (receipt: Receipt) => void;
  showAlert: boolean;
  dismissAlert: () => void;
};

export default function MisRecibos({
  onBack,
  onAssistant,
  onOpenChat,
  onConsumption,
  onHistory,
  onSelectReceipt,
  showAlert,
  dismissAlert,
}: Props) {
  const increase = currentReceipt.amount - currentReceipt.previous;

  return (
    <div className="receipt-screen">
      <Header title="Mi recibo" onBack={onBack} />
      <div className="screen-content receipt-content">
        <nav className="month-tabs" aria-label="Recibos por mes">
          <button className="month-back" aria-label="Mes anterior"><Icon name="arrow-left" /></button>
          <button>Junio</button>
          <button>Julio</button>
          <button className="active" aria-current="page">Agosto</button>
        </nav>

        <Card className="receipt-focus-card">
          <div className="receipt-focus-topline">
            <span><i /> Pendiente de pago</span>
            <small>Agosto 2026</small>
          </div>
          <p className="receipt-total-label">Total a pagar</p>
          <strong className="receipt-total">{money(currentReceipt.amount)}</strong>
          <p className="receipt-due"><Icon name="bell" size={17} /> Vence el {currentReceipt.due}</p>

          <button className="receipt-lucia-primary" onClick={onOpenChat}>
            <span><Icon name="sparkles" size={21} /><b>Entender este recibo con LucIA</b></span>
            <Icon name="arrow-right" size={20} />
          </button>
          <div className="receipt-secondary-actions">
            <button onClick={() => onSelectReceipt(currentReceipt)}><Icon name="download" size={17} /> Ver PDF</button>
            <button onClick={onAssistant}><Icon name="receipt" size={17} /> Ver desglose</button>
          </div>
        </Card>

        {showAlert && (
          <aside className="receipt-change-notice">
            <Icon name="chart" size={22} />
            <span><strong>Este mes pagas {money(increase)} más</strong><small>LucIA encontró los cobros que explican el cambio.</small></span>
            <button className="receipt-change-action" onClick={onAssistant}>Ver por qué</button>
            <button className="receipt-change-close" onClick={dismissAlert} aria-label="Cerrar aviso"><Icon name="close" size={16} /></button>
          </aside>
        )}

        <section className="receipt-guide" aria-label="Cómo revisar tu recibo">
          <span className="receipt-guide-heading"><small>ENCUENTRA RÁPIDO LO QUE BUSCAS</small><strong>¿Qué quieres revisar?</strong></span>
          <div className="receipt-quick-actions">
            <button onClick={onAssistant}><i className="ai"><Icon name="sparkles" /></i><span><strong>¿Por qué cambió?</strong><small>Explicación con evidencia</small></span><Icon name="arrow-right" size={19} /></button>
            <button onClick={onConsumption}><i className="usage"><Icon name="chart" /></i><span><strong>Mi consumo</strong><small>Datos usados día por día</small></span><Icon name="arrow-right" size={19} /></button>
            <button onClick={onHistory}><i className="history"><Icon name="receipt" /></i><span><strong>Recibos anteriores</strong><small>Compara los últimos 6 meses</small></span><Icon name="arrow-right" size={19} /></button>
          </div>
        </section>

        <details className="receipt-disclosure">
          <summary><span><i><Icon name="phone" /></i><b><strong>Mi plan y adicionales</strong><small>Revisa qué incluye el total</small></b></span><Icon name="chevron-down" /></summary>
          <div className="receipt-plan-detail"><span><strong>Plan Móvil 40 GB</strong><small>Plan contratado de agosto</small></span><b>S/59.90</b></div>
          <button className="receipt-plan-bonus"><Icon name="gift" /><span><strong>Bonificaciones y adicionales</strong><small>Beneficios incluidos en tu línea</small></span><Icon name="arrow-right" /></button>
        </details>

        <details className="receipt-disclosure">
          <summary><span><i className="history"><Icon name="chart" /></i><b><strong>Evolución de mis recibos</strong><small>6 meses de comparación</small></b></span><Icon name="chevron-down" /></summary>
          <div className="receipt-chart-detail"><MonthlyBillChart /><button onClick={onHistory}>Ver comparación completa</button></div>
        </details>

        <section className="receipt-safe-note"><Icon name="check" size={20} /><span><strong>Montos verificados</strong><small>LucIA explica la información del recibo; no inventa cargos ni fechas.</small></span></section>

        <button className="digital-receipt-link"><i><Icon name="receipt" /></i><span><strong>Recibir mi recibo por correo</strong><small>Afíliate o actualiza tus datos</small></span><Icon name="arrow-right" /></button>
      </div>
    </div>
  );
}
