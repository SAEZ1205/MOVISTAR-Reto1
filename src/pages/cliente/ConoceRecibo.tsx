import LastSevenDays from "@/src/components/cliente/LastSevenDays";
import { currentReceipt, customer, usageCategories } from "@/src/services/billingService";

type ConoceReciboProps = {
  usedPercent: number;
  remaining: number;
  average: number;
};

export default function ConoceRecibo({ usedPercent, remaining, average }: ConoceReciboProps) {
  return (
    <div className="consumption-layout">
      <section className="usage-overview card">
        <div><span>Plan de {customer.planData} GB</span><h3>Has usado 34.8 GB</h3><p>Te quedan <strong>{remaining.toFixed(1)} GB</strong> para los próximos 5 días.</p></div>
        <div className="progress-track"><i style={{ width: `${usedPercent}%` }} /><b>{usedPercent}%</b></div>
        <div className="metric-grid"><span>Promedio diario<strong>{average.toFixed(2)} GB</strong></span><span>Máximo del ciclo<strong>1.80 GB</strong></span><span>Para llegar al cierre<strong>1.04 GB/día</strong></span></div>
      </section>

      <section className="week-card card">
        <header className="section-header"><div><small>Últimos 7 días</small><h3>Tu consumo día por día</h3></div><span className="blue-pill">GB</span></header>
        <p className="helper-copy">El dato aparece encima de cada barra. “Hoy” está marcado en verde.</p>
        <LastSevenDays />
        <div className="insight blue"><span>i</span><p><strong>Hoy usaste 1.8 GB.</strong> Video fue la categoría que más consumió.</p></div>
      </section>

      <section className="category-card card">
        <header className="section-header"><div><small>Total: 34.8 GB</small><h3>¿En qué usaste tus datos?</h3></div></header>
        <div className="category-list">
          {usageCategories.map((category) => (
            <div className="category-item" key={category.label}>
              <span className="category-dot" style={{ background: category.color }} />
              <div><strong>{category.label}</strong><small>{category.detail}</small><i><b style={{ width: `${category.value / currentReceipt.usage * 100}%`, background: category.color }} /></i></div>
              <em>{category.value.toFixed(1)} GB</em>
            </div>
          ))}
        </div>
      </section>

      <section className="recommendation-card card">
        <span>✓</span><div><small>Recomendación antes de vender</small><h3>No necesitas cambiar de plan todavía</h3><p>Un solo mes alto no justifica pagar más todos los meses. Reduce la calidad de video durante estos cinco días.</p></div>
      </section>
    </div>
  );
}
