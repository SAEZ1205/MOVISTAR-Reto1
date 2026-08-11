"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  benefits,
  currentReceipt,
  customer,
  dailyUsage,
  money,
  offer,
  receipts,
  type Receipt,
  usageCategories,
} from "@/lib/billing-data";

type Tab = "resumen" | "consumo" | "recibos";
type Resolution = "pending" | "resolved" | "needs-help";
type OfferStatus = "locked" | "available" | "accepted" | "declined";
type ChatMessage = {
  role: "user" | "bot";
  text: string;
  source?: string;
  suggestHuman?: boolean;
};
type ServiceStatus = { gemini: boolean; geminiModel: string; whatsapp: boolean; receipts: number };

const quickQuestions = [
  "¿Por qué subió mi recibo?",
  "¿Qué me cobraron en mayo?",
  "¿Cuántos gigas me quedan?",
  "¿Qué beneficios ya tengo?",
];

function MovistarLogo({ withName = false }: { withName?: boolean }) {
  return (
    <span className="movistar-logo" aria-label="Movistar">
      <svg viewBox="0 0 72 50" role="img" aria-hidden="true">
        <path d="M8 15C12 4 24 2 31 12l5 7 5-7C48 2 60 4 64 15c5 13-1 28-12 31-8 2-11-8-16-8s-8 10-16 8C9 43 3 28 8 15Z" fill="currentColor" />
      </svg>
      {withName && <strong>movistar</strong>}
    </span>
  );
}

function LuciaImage({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "lucia-avatar compact" : "lucia-avatar"}>
      <Image src="/lucia-mascot-v5.png" alt="LucIA, asistente virtual" width={160} height={160} unoptimized />
      <i aria-hidden="true" />
    </span>
  );
}

function ReceiptTrend() {
  const amounts = receipts.map((receipt) => receipt.amount);
  const min = 54;
  const max = 88;
  const points = amounts.map((amount, index) => ({
    x: 36 + index * 96,
    y: 144 - ((amount - min) / (max - min)) * 94,
  }));
  const path = points.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
  const area = `${path} L${points.at(-1)?.x},164 L${points[0].x},164 Z`;

  return (
    <div className="trend-chart" role="img" aria-label="Evolución del recibo de marzo a agosto">
      <svg viewBox="0 0 560 190" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#00a9e0" stopOpacity=".28" />
            <stop offset="1" stopColor="#00a9e0" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[50, 97, 144].map((y) => <line key={y} x1="25" x2="530" y1={y} y2={y} className="grid-line" />)}
        <path d={area} className="trend-area" />
        <path d={path} className="trend-line" />
        {points.map((point, index) => (
          <g key={receipts[index].slug}>
            <circle cx={point.x} cy={point.y} r={index === points.length - 1 ? 7 : 5} className={index === points.length - 1 ? "trend-dot current" : "trend-dot"} />
            <text x={point.x} y="184" textAnchor="middle" className="trend-label">{receipts[index].shortMonth}</text>
          </g>
        ))}
      </svg>
      <div className="trend-callout"><span>Agosto</span><strong>S/82.90</strong><small>+S/23</small></div>
    </div>
  );
}

function BillBreakdown() {
  const colors = ["#00a9e0", "#e9426d", "#7b3ff2"];
  return (
    <div className="bill-breakdown">
      {currentReceipt.charges.map((charge, index) => (
        <div className="breakdown-row" key={charge.label}>
          <span className="breakdown-icon" style={{ background: `${colors[index]}18`, color: colors[index] }}>{index + 1}</span>
          <div><strong>{charge.label}</strong><small>{index === 0 ? "Tu tarifa mensual no cambió" : index === 1 ? "Compra del 10 de agosto" : "Activado el 31 de julio"}</small></div>
          <b>{money(charge.amount)}</b>
        </div>
      ))}
      <div className="breakdown-total"><span>Total de agosto</span><strong>{money(currentReceipt.amount)}</strong></div>
    </div>
  );
}

function LastSevenDays() {
  const values = dailyUsage.slice(-7);
  const labels = ["4 Ago", "5", "6", "7", "8", "9", "Hoy"];
  const max = Math.max(...values);
  return (
    <div className="week-chart" role="img" aria-label="Consumo de datos de los últimos siete días">
      {values.map((value, index) => (
        <div className="week-bar" key={`${labels[index]}-${value}`}>
          <strong>{value.toFixed(1)}</strong>
          <div><i className={index === values.length - 1 ? "today" : ""} style={{ height: `${Math.max(22, value / max * 100)}%` }} /></div>
          <small>{labels[index]}</small>
        </div>
      ))}
    </div>
  );
}

function ReceiptModal({ receipt, close }: { receipt: Receipt; close: () => void }) {
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

export default function Home() {
  const [tab, setTab] = useState<Tab>("resumen");
  const [showProactive, setShowProactive] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const [resolution, setResolution] = useState<Resolution>("pending");
  const [showResolutionPrompt, setShowResolutionPrompt] = useState(false);
  const [offerStatus, setOfferStatus] = useState<OfferStatus>("locked");
  const [whatsappState, setWhatsappState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "bot", text: "Hola, soy LucIA. Puedo explicarte tus recibos y tu consumo con los seis documentos verificados de esta demo.", source: "Base financiera verificada" },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowProactive(true), 650);
    fetch("/api/status").then((response) => response.json()).then(setServiceStatus).catch(() => null);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, asking, handoff, showResolutionPrompt, offerStatus]);

  const usedPercent = Math.round((currentReceipt.usage / customer.planData) * 100);
  const remaining = customer.planData - currentReceipt.usage;
  const average = currentReceipt.usage / dailyUsage.length;
  const currentDelta = currentReceipt.amount - currentReceipt.previous;
  const tabCopy = useMemo(() => ({
    resumen: ["Entiende tu recibo", "Lo importante de tu cobro, sin letras pequeñas."],
    consumo: ["Mi consumo", "Cuánto usaste, en qué y si te alcanzará."],
    recibos: ["Mis 6 recibos", "El actual y los cinco anteriores, en una sola vista."],
  })[tab], [tab]);

  async function ask(raw: string) {
    const clean = raw.trim();
    if (!clean || asking) return;
    setQuestion("");
    setResolution("pending");
    setShowResolutionPrompt(false);
    setOfferStatus("locked");
    setMessages((current) => [...current, { role: "user", text: clean }]);
    setAsking(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: clean }),
      });
      if (!response.ok) throw new Error("Backend no disponible");
      const result = await response.json();
      setMessages((current) => [...current, {
        role: "bot",
        text: result.answer || "No encontré información suficiente para responder.",
        source: result.source || "Base verificada",
        suggestHuman: result.intent === "unknown",
      }]);
      setShowResolutionPrompt(Boolean(result.needsResolutionCheck));
      if (result.intent === "unknown") setHandoff(true);
    } catch {
      setMessages((current) => [...current, { role: "bot", text: "No pude conectarme ahora. Los seis recibos siguen disponibles en esta pantalla.", source: "Modo seguro", suggestHuman: true }]);
      setHandoff(true);
    } finally {
      setAsking(false);
    }
  }

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ask(question);
  }

  function explainNow() {
    setShowProactive(false);
    setShowChat(true);
    setShowResolutionPrompt(true);
    setMessages((current) => [...current, {
      role: "bot",
      text: "Tu recibo subió S/23.00 frente a julio. Tu plan sigue en S/59.90. Se sumaron 10 GB adicionales por S/15.00 y Movistar Música por S/8.00. Por eso el total es S/82.90.",
      source: "Recibo agosto · Orden PAQ-0810 · Alta MUS-0731",
    }]);
  }

  function markResolved() {
    setResolution("resolved");
    setShowResolutionPrompt(false);
    setOfferStatus("available");
    setMessages((current) => [...current, {
      role: "bot",
      text: `Perfecto. Antes de cerrar, recuerda que tu plan ya incluye ${benefits.join(", ").toLowerCase()}. Además, por tu consumo actual hay una opción puntual que podría servirte; no necesitas cambiar de plan.`,
      source: "Beneficios vigentes · Regla de oferta O-87",
    }]);
  }

  function askForHuman() {
    setResolution("needs-help");
    setShowResolutionPrompt(false);
    setHandoff(true);
    setOfferStatus("locked");
    setMessages((current) => [...current, { role: "bot", text: "Entiendo. Preparé un resumen con tu línea, el recibo revisado, las causas y la conversación para que no tengas que repetirlo.", source: "Resumen de derivación" }]);
  }

  async function sendWhatsApp() {
    if (whatsappState === "sending") return;
    setWhatsappState("sending");
    setWhatsappMessage("");
    try {
      const response = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation: messages.map(({ role, text }) => ({ role, text })) }),
      });
      const result = await response.json();
      setWhatsappMessage(result.message || "No se recibió confirmación.");
      setWhatsappState(result.ok ? "sent" : "error");
    } catch {
      setWhatsappMessage("No se pudo conectar con el envío de WhatsApp.");
      setWhatsappState("error");
    }
  }

  function acceptOffer() {
    setOfferStatus("accepted");
    setMessages((current) => [...current, { role: "bot", text: `Simulación completada: elegiste ${offer.name} por ${money(offer.price)}. No se realizó ningún cobro real.`, source: "Oferta O-87 · Acción simulada" }]);
  }

  return (
    <main className="app-shell">
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

      <div className="module-shell">
        <div className="module-heading">
          <div><span className="breadcrumb">Inicio / Entiende tu recibo</span><h2>{tabCopy[0]}</h2><p>{tabCopy[1]}</p></div>
          <button className="demo-trigger" onClick={() => setShowDemo((value) => !value)}><i /> Revisar demo</button>
          {showDemo && (
            <div className="demo-popover">
              <header><strong>Estado de la demo</strong><button onClick={() => setShowDemo(false)}>×</button></header>
              <div className="status-row"><span>Gemini</span><b className={serviceStatus?.gemini ? "ok" : "demo"}>{serviceStatus?.gemini ? "Conectado" : "Modo local"}</b></div>
              <div className="status-row"><span>WhatsApp</span><b className={serviceStatus?.whatsapp ? "ok" : "demo"}>{serviceStatus?.whatsapp ? "Conectado" : "Por configurar"}</b></div>
              <div className="status-row"><span>6 PDF</span><b className="ok">Verificados</b></div>
              <div className="status-row"><span>Oferta</span><b className={offerStatus === "locked" ? "locked" : "ok"}>{offerStatus === "locked" ? "Bloqueada" : "Habilitada"}</b></div>
              <button onClick={() => { setShowDemo(false); setShowChat(true); ask("xq me vino mas karo"); }}>Probar pregunta mal escrita</button>
              <button onClick={() => { setShowDemo(false); setTab("recibos"); }}>Probar prorrateo de mayo</button>
              <button onClick={() => { setShowDemo(false); setShowChat(true); ask("¿Qué pasa cuando termina un descuento?"); }}>Probar fin de descuento</button>
            </div>
          )}
        </div>

        <nav className="module-tabs" aria-label="Secciones de Entiende tu recibo">
          <button className={tab === "resumen" ? "active" : ""} onClick={() => setTab("resumen")}><span>⌂</span>Resumen</button>
          <button className={tab === "consumo" ? "active" : ""} onClick={() => setTab("consumo")}><span>▥</span>Consumo</button>
          <button className={tab === "recibos" ? "active" : ""} onClick={() => setTab("recibos")}><span>▤</span>6 recibos</button>
        </nav>

        {tab === "resumen" && (
          <div className="summary-layout">
            <section className="bill-card card">
              <div className="bill-top"><div><span>Recibo de agosto</span><small>Vence el 15 de agosto</small></div><b>Pendiente</b></div>
              <div className="bill-amount"><strong>{money(currentReceipt.amount)}</strong><span>↑ {money(currentDelta)} vs. julio</span></div>
              <div className="bill-actions"><button className="primary-button">Pagar recibo</button><button className="secondary-button" onClick={() => setSelectedReceipt(currentReceipt)}>Ver PDF</button></div>
            </section>

            <section className="explanation-card card">
              <header className="section-header"><div><small>Explicación directa</small><h3>Tu plan no subió de precio</h3></div><span className="verified-pill">✓ Verificado</span></header>
              <p className="lead-copy">El aumento de <strong>S/23.00</strong> viene de dos servicios agregados durante este ciclo.</p>
              <BillBreakdown />
              <button className="ask-lucia-button" onClick={() => { setShowChat(true); explainNow(); }}><LuciaImage compact /><span><strong>¿Quieres que LucIA te lo explique?</strong><small>Pregunta con tus propias palabras</small></span><b>›</b></button>
            </section>

            <section className="trend-card card">
              <header className="section-header"><div><small>Últimos 6 meses</small><h3>Así cambió tu recibo</h3></div><button className="text-button" onClick={() => setTab("recibos")}>Ver PDF →</button></header>
              <ReceiptTrend />
              <div className="insight"><span>i</span><p><strong>Fue estable hasta julio.</strong> Mayo subió S/2.50 por un prorrateo y agosto S/23.00 por dos cargos.</p></div>
            </section>

            <section className="usage-card card">
              <header className="section-header"><div><small>Datos móviles</small><h3>Te quedan 5.2 GB</h3></div><span className="warning-pill">Vas justo</span></header>
              <div className="usage-main">
                <div className="usage-ring" style={{ "--usage": `${usedPercent * 3.6}deg` } as React.CSSProperties}><span><strong>{usedPercent}%</strong><small>usado</small></span></div>
                <div><p><strong>34.8 GB</strong> de 40 GB</p><span>Quedan {remaining.toFixed(1)} GB para 5 días.</span><small>A este ritmo podrían terminarse el 14 de agosto.</small></div>
              </div>
              <button className="secondary-button full" onClick={() => setTab("consumo")}>Ver consumo diario</button>
            </section>

            <section className={`next-step-card card ${resolution === "resolved" ? "unlocked" : ""}`}>
              <div className="next-icon">{resolution === "resolved" ? "✓" : "⌁"}</div>
              <div><small>Siguiente paso inteligente</small><h3>{resolution === "resolved" ? "Oferta habilitada con una regla clara" : "Primero resolvemos tu consulta"}</h3><p>{resolution === "resolved" ? `${offer.name} por ${money(offer.price)}. ${offer.reason}` : "LucIA no mostrará ninguna venta hasta que confirmes que entendiste el cobro."}</p></div>
              <button onClick={() => setShowChat(true)}>{resolution === "resolved" ? "Ver oferta" : "Resolver con LucIA"}</button>
            </section>
          </div>
        )}

        {tab === "consumo" && (
          <div className="consumption-layout">
            <section className="usage-overview card">
              <div><span>Plan de 40 GB</span><h3>Has usado 34.8 GB</h3><p>Te quedan <strong>5.2 GB</strong> para los próximos 5 días.</p></div>
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
        )}

        {tab === "recibos" && (
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
                  <div className="receipt-actions"><button onClick={() => setSelectedReceipt(receipt)}>Ver</button><a href={receipt.file} download>Descargar</a></div>
                </article>
              ))}
            </section>
          </div>
        )}
      </div>

      <button className="lucia-fab" onClick={() => setShowChat(true)} aria-label="Abrir chat con LucIA"><LuciaImage compact /><span><strong>LucIA</strong><small>Te ayudo con tu recibo</small></span><i /></button>

      {showProactive && (
        <div className="proactive-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowProactive(false)}>
          <section className="proactive-card" role="dialog" aria-modal="true" aria-label="Aviso de LucIA">
            <button className="close-button" onClick={() => setShowProactive(false)} aria-label="Cerrar">×</button>
            <div className="lucia-stage"><LuciaImage /><span>✦</span></div>
            <div className="proactive-copy"><small><i /> LucIA detectó un cambio</small><h2>Tu recibo subió S/23.00</h2><p>Encontré dos causas en tus datos verificados. ¿Quieres que te lo explique fácil?</p></div>
            <div className="proactive-actions"><button className="primary-button" onClick={explainNow}>Sí, explícame</button><button className="secondary-button" onClick={() => setShowProactive(false)}>Ahora no</button></div>
          </section>
        </div>
      )}

      {showChat && (
        <div className="drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowChat(false)}>
          <aside className="chat-drawer" aria-label="Chat con LucIA">
            <header className="chat-header"><div><LuciaImage compact /><span><strong>LucIA</strong><small><i /> En línea · respuestas verificadas</small></span></div><button onClick={() => setShowChat(false)} aria-label="Cerrar">×</button></header>
            <div className="chat-trust">✓ Gemini interpreta la pregunta; los montos salen solo de los seis recibos.</div>
            <div className="chat-content">
              {messages.map((message, index) => (
                <div className={`message ${message.role}`} key={`${message.role}-${index}`}>
                  {message.role === "bot" && <LuciaImage compact />}
                  <div><p>{message.text}</p>{message.source && <small>✓ {message.source}</small>}{message.suggestHuman && <button onClick={askForHuman}>Hablar con un asesor</button>}</div>
                </div>
              ))}
              {asking && <div className="typing"><i /><i /><i /></div>}

              {showResolutionPrompt && !asking && (
                <div className="resolution-card">
                  <strong>¿La explicación resolvió tu duda?</strong>
                  <p>Tu respuesta controla si se habilita una oferta o si te derivamos.</p>
                  <div><button onClick={markResolved}>Sí, quedó claro</button><button onClick={askForHuman}>Todavía tengo dudas</button></div>
                </div>
              )}

              {offerStatus !== "locked" && (
                <div className="offer-card">
                  <span>Oferta pertinente</span><h3>{offer.name}</h3><p>{money(offer.price)} · {offer.duration}</p><small>{offer.reason}</small>
                  {offerStatus === "available" && <div><button onClick={acceptOffer}>Simular contratación</button><button onClick={() => setOfferStatus("declined")}>No gracias</button></div>}
                  {offerStatus === "accepted" && <b>✓ Contratación simulada, sin cobro real</b>}
                  {offerStatus === "declined" && <b>Entendido. No volveré a mostrarla en esta sesión.</b>}
                </div>
              )}

              {handoff && (
                <div className="handoff-card">
                  <span>✓</span><div><strong>Resumen listo para el asesor</strong><p>Línea, recibo, causas, evidencia y últimos mensajes. No tendrás que repetirlo.</p><button onClick={sendWhatsApp} disabled={whatsappState === "sending"}>{whatsappState === "sending" ? "Enviando…" : "Enviar resumen por WhatsApp"}</button>{whatsappMessage && <small className={whatsappState}>{whatsappMessage}</small>}</div>
                </div>
              )}

              {!handoff && !showResolutionPrompt && offerStatus === "locked" && <div className="quick-questions">{quickQuestions.map((item) => <button key={item} onClick={() => ask(item)}>{item}</button>)}</div>}
              <div ref={chatEndRef} />
            </div>
            <form className="chat-form" onSubmit={submitQuestion}><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ej.: xq me vino más caro?" aria-label="Pregunta para LucIA" /><button disabled={asking} aria-label="Enviar">➜</button></form>
          </aside>
        </div>
      )}

      {selectedReceipt && <ReceiptModal receipt={selectedReceipt} close={() => setSelectedReceipt(null)} />}

      <footer className="movistar-nav" aria-label="Navegación principal de Mi Movistar">
        <button className="active"><span>⌂</span><small>Inicio</small></button><button><span>▯</span><small>Mis líneas</small></button><button><span>▢</span><small>Tienda</small></button><button><span>♧</span><small>Alertas</small></button><button><span>☰</span><small>Más</small></button>
      </footer>
    </main>
  );
}
