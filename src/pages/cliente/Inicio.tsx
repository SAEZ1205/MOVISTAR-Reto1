import AccountPanel from "@/src/components/cliente/AccountPanel";
import Icon from "@/src/components/shared/Icon";
import { currentReceipt, customer } from "@/src/services/billingService";

export default function Inicio({ onReceipt, onBenefits, onStore }: { onReceipt: () => void; onBenefits: () => void; onStore: () => void }) {
  const remaining = customer.planData - currentReceipt.usage;
  return (
    <div className="home-screen">
      <AccountPanel />
      <div className="home-content">
        <section className="promo-banner"><img src="/hero-movistar-v5.webp" alt="Jóvenes usando su celular" /><div><small>BENEFICIO PARA TI</small><strong>Conecta con los que más quieres</strong><button onClick={onBenefits}>Descubre aquí</button></div></section>
        <div className="carousel-dots"><i className="active" /><i /><i /><i /></div>
        <div className="home-shortcuts"><button><i><Icon name="globe" /></i><strong>Mejorar<br />mi plan</strong></button><button onClick={onStore}><i><Icon name="device" /></i><strong>Renovar<br />mi equipo</strong></button></div>
        <section className="consumption-home"><h2>Mis consumos</h2><p>Se renuevan el 16 Ago. · {customer.daysRemaining} días</p><div className="consumption-cards"><article><strong>Datos del plan</strong><span><i style={{ "--progress": "313deg" } as React.CSSProperties} /><b>{remaining.toFixed(1)} GB</b><small>de {customer.planData} GB</small></span></article><article><strong>Apps ilimitadas</strong><span className="free"><i style={{ "--progress": "360deg" } as React.CSSProperties} /><b>Activo</b><small>en tu plan</small></span></article></div></section>
        <section className="home-bill"><Icon name="receipt" /><span><small>Recibo de agosto</small><strong>S/82.90 pendiente</strong></span><button onClick={onReceipt}>Ver recibo</button></section>
        <h2 className="access-title">Accesos directos</h2>
        <div className="direct-grid"><button><Icon name="wifi" /><strong>Planes hogar</strong><small>Internet y TV</small></button><button onClick={onStore}><Icon name="device" /><strong>Renovar mi equipo</strong><small>Precios especiales</small></button><button><Icon name="receipt" /><strong>Mejorar mi plan</strong><small>Revisa alternativas</small></button><button><Icon name="home" /><strong>Movistar Total</strong><small>Todos tus servicios</small></button></div>
      </div>
    </div>
  );
}
