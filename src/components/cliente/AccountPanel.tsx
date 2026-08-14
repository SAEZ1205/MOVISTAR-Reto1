import Icon from "@/src/components/shared/Icon";
import { customer } from "@/src/services/billingService";

export default function AccountPanel() {
  return (
    <section className="account-panel">
      <header><button aria-label="Menú"><Icon name="menu" size={30} /></button><h1>¡Hola, {customer.name}!</h1><button aria-label="Actualizar"><Icon name="refresh" size={30} /></button></header>
      <div className="gold-row"><span><Icon name="gift" /> Movistar Gold</span><button>Ver beneficios <Icon name="arrow-right" /></button></div>
      <div className="line-row"><Icon name="phone" /><span><strong>{customer.line}</strong><small>Postpago</small></span><Icon name="chevron-down" /></div>
    </section>
  );
}
