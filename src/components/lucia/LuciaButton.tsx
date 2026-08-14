import Icon from "@/src/components/shared/Icon";
import LuciaImage from "./LuciaImage";

export default function LuciaButton({ onClick, compact = false }: { onClick: () => void; compact?: boolean }) {
  return (
    <button className={compact ? "lucia-entry compact" : "lucia-entry"} onClick={onClick}>
      <LuciaImage compact />
      <span><small>NUEVO · INTELIGENCIA ARTIFICIAL</small><strong>Entiende tu recibo con LucIA</strong><p>Te explico qué cambió usando datos verificados.</p></span>
      <Icon name="arrow-right" />
    </button>
  );
}
