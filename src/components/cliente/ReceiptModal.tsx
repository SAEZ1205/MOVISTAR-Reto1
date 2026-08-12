import { money } from "@/src/services/billingService";
import type { Receipt } from "@/src/types/billing";

export default function ReceiptModal({ receipt, close }: { receipt: Receipt; close: () => void }) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <section className="pdf-modal" aria-modal="true" role="dialog" aria-label={`Recibo de ${receipt.month}`}>
        <header>
          <div className="pdf-title"><span className="pdf-badge">PDF</span><div><strong>{receipt.month}</strong><small>{money(receipt.amount)} · {receipt.status}</small></div></div>
          <div className="pdf-actions"><a href={receipt.file} target="_blank" rel="noreferrer">Abrir</a><a href={receipt.file} download>Descargar</a><button onClick={close} aria-label="Cerrar">×</button></div>
        </header>
        <iframe src={receipt.file} title={`Recibo de ${receipt.month}`} />
      </section>
    </div>
  );
}
