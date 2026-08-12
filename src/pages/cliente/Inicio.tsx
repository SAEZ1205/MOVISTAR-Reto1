import MovistarLogo from "@/src/components/shared/MovistarLogo";
import { customer } from "@/src/services/billingService";

export default function Inicio() {
  return (
    <>
      <header className="movistar-header">
        <div className="header-inner">
          <button className="back-button" aria-label="Volver">‹</button>
          <MovistarLogo withName />
          <button className="profile-button" aria-label="Perfil de Sebastián">SE</button>
        </div>
      </header>

      <section className="welcome-hero">
        <div className="hero-overlay">
          <span className="hero-kicker">Mi Movistar</span>
          <h1>Hola, Sebastián</h1>
          <p>Tu línea {customer.line} está al día.</p>
          <span className="hero-badge">Nuevo · Recibo explicado con LucIA</span>
        </div>
      </section>
    </>
  );
}
