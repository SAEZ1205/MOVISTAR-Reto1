import ReceiptTrend from "@/src/components/cliente/ReceiptTrend";
import { money, receipts } from "@/src/services/billingService";
import type { Receipt } from "@/src/types/billing";

export default function MisRecibos({ onSelectReceipt }: { onSelectReceipt: (receipt: Receipt) => void }) {
  return (
    <div className="receipts-layout">
      <section className="receipts-overview card">
        <header className="section-header"><div><small>Marzo - agosto 2026</small><h3>Tu historial en una sola vista</h3></div><span className="verified-pill">✓ 6 PDF</span></header>
        <ReceiptTrend />
      </section>
      <section className="receipt-list card">
        {receipts.slice().reverse().map((receipt, index) => (
          <article className={index === 0 ? "receipt-item current" : "receipt-item"} key={receipt.slug}>
            <div className="receipt-file"><span className="pdf-badge">PDF</span><div><strong>{receipt.month}</strong><small>{receipt.period}</small></div></div>
            <div className="receipt-why"><small>Qué pasó</small><strong>{receipt.note}</strong></div>
            <div className="receipt-total"><small>{receipt.status}</small><strong>{money(receipt.amount)}</strong></div>
            <div className="receipt-actions"><button onClick={() => onSelectReceipt(receipt)}>Ver</button><a href={receipt.file} download>Descargar</a></div>
          </article>
        ))}
      </section>
    </div>
  );
}
