import LuciaButton from "@/src/components/lucia/LuciaButton";
import MonthlyBillChart from "@/src/components/cliente/MonthlyBillChart";
import Card from "@/src/components/shared/Card";
import Header from "@/src/components/shared/Header";
import Icon from "@/src/components/shared/Icon";
import { currentReceipt, money } from "@/src/services/billingService";
import type { Receipt } from "@/src/types/billing";

export default function MisRecibos({ onBack, onAssistant, onHistory, onSelectReceipt, showAlert, dismissAlert }: { onBack: () => void; onAssistant: () => void; onHistory: () => void; onSelectReceipt: (receipt: Receipt) => void; showAlert: boolean; dismissAlert: () => void }) {
  return (
    <div className="receipt-screen">
      <Header title="Mi recibo" onBack={onBack} />
      <div className="screen-content">
        <nav className="month-tabs"><button>Junio</button><button>Julio</button><button className="active">Agosto</button></nav>
        <Card className="current-bill-card"><div className="bill-status"><span><small>Estado:</small><strong className="pending">Pendiente</strong></span><span><small>Total:</small><b>{money(currentReceipt.amount)}</b></span></div><dl><div><dt>Vencimiento:</dt><dd>{currentReceipt.due}</dd></div><div><dt>Código de pago:</dt><dd>{currentReceipt.code}</dd></div><div><dt>Renovación:</dt><dd>16 de cada mes</dd></div></dl><div className="bill-main-actions"><button>Pagar</button><button onClick={() => onSelectReceipt(currentReceipt)}>Ver PDF</button></div></Card>

        <LuciaButton onClick={onAssistant} />

        {showAlert && <section className="change-alert"><Icon name="chat" /><span><strong>LucIA detectó por qué subió tu recibo</strong><small>Hay S/23.00 adicionales frente a julio.</small></span><button onClick={dismissAlert} aria-label="Cerrar aviso"><Icon name="close" size={19} /></button></section>}

        <h2 className="receipt-section-title">Plan y adicionales</h2>
        <Card className="plan-card"><div><i><Icon name="phone" /></i><span><strong>Plan Móvil 40 GB</strong><small>Pertenece a tu plan contratado de agosto</small></span><b>S/59.90</b></div><button><i><Icon name="gift" /></i><span>Bonificaciones y adicionales</span><Icon name="chevron-down" /></button></Card>

        <div className="section-heading"><h2>Evolutivo mensual</h2><button onClick={onHistory}>Ver detalle</button></div>
        <Card className="monthly-chart-card"><MonthlyBillChart /></Card>

        <h2 className="receipt-section-title">Otros</h2>
        <Card className="other-actions"><button><i className="green"><Icon name="receipt" /></i><span><strong>Afiliación al Recibo Digital</strong><small>Recibe tu documento mensual en tu correo.</small></span><Icon name="arrow-right" /></button><button onClick={() => onSelectReceipt(currentReceipt)}><i><Icon name="download" /></i><span><strong>Visualiza tu PDF</strong><small>Documento emitido de agosto.</small></span><Icon name="arrow-right" /></button><button onClick={onHistory}><i className="purple"><Icon name="chart" /></i><span><strong>Historial de recibos</strong><small>Compara los últimos seis meses.</small></span><Icon name="arrow-right" /></button></Card>
      </div>
    </div>
  );
}
