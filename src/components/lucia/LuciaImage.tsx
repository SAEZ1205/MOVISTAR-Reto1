import Image from "next/image";

export default function LuciaImage({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "lucia-avatar compact" : "lucia-avatar"}>
      <Image src="/lucia-mascot-v5.png" alt="LucIA, asistente virtual" width={160} height={160} unoptimized />
      <i aria-hidden="true" />
    </span>
  );
}
