import Icon from "./Icon";

export default function Header({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <header className="screen-header">
      <button onClick={onBack} aria-label="Volver"><Icon name="arrow-left" size={34} /></button>
      <h1>{title}</h1>
      <span aria-hidden="true" />
    </header>
  );
}
