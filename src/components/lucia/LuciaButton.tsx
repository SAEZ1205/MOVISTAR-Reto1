import Icon from "@/src/components/shared/Icon";
import LuciaImage from "./LuciaImage";

export default function LuciaButton({ onClick, compact = false }: { onClick: () => void; compact?: boolean }) {
  return (
    <button className={compact ? "lucia-entry compact" : "lucia-entry"} onClick={onClick}>
      <LuciaImage compact />
      <span className="lucia-entry-copy"><small><b>IA</b> NUEVO EN MI RECIBO</small><strong>Entiende tu recibo con LucIA</strong><p>Descubre qué cambió y de dónde sale cada monto.</p></span>
      <span className="lucia-entry-arrow"><Icon name="arrow-right" /></span>
    </button>
  );
}
