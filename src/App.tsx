"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReceiptModal from "@/src/components/cliente/ReceiptModal";
import LuciaImage from "@/src/components/lucia/LuciaImage";
import Inicio from "@/src/pages/cliente/Inicio";
import MisRecibos from "@/src/pages/cliente/MisRecibos";
import EntiendeRecibo from "@/src/pages/cliente/EntiendeRecibo";
import ConoceRecibo from "@/src/pages/cliente/ConoceRecibo";
import {
  benefits,
  currentReceipt,
  customer,
  dailyUsage,
  money,
  offer,
} from "@/src/services/billingService";
import { sendHandoff } from "@/src/services/handoffService";
import { askLucia, getServiceStatus } from "@/src/services/luciaService";
import { offerConfirmation } from "@/src/services/offerService";
import type { Receipt, Tab } from "@/src/types/billing";
import type { WhatsAppState } from "@/src/types/case";
import type { ChatMessage, Resolution, ServiceStatus } from "@/src/types/lucia";
import type { OfferStatus } from "@/src/types/offer";

const quickQuestions = [
  "¿Por qué subió mi recibo?",
  "¿Qué me cobraron en mayo?",
  "¿Cuántos gigas me quedan?",
  "¿Qué beneficios ya tengo?",
];

export default function App() {
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
  const [whatsappState, setWhatsappState] = useState<WhatsAppState>("idle");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "bot", text: "Hola, soy LucIA. Puedo explicarte tus recibos y tu consumo con los seis documentos verificados de esta demo.", source: "Base financiera verificada" },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowProactive(true), 650);
    getServiceStatus().then(setServiceStatus).catch(() => null);
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
      const result = await askLucia(clean);
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
      const result = await sendHandoff(messages);
      setWhatsappMessage(result.message || "No se recibió confirmación.");
      setWhatsappState(result.ok ? "sent" : "error");
    } catch {
      setWhatsappMessage("No se pudo conectar con el envío de WhatsApp.");
      setWhatsappState("error");
    }
  }

  function acceptOffer() {
    setOfferStatus("accepted");
    setMessages((current) => [...current, { role: "bot", text: offerConfirmation(offer), source: "Oferta O-87 · Acción simulada" }]);
  }

  return (
    <main className="app-shell">
      <Inicio />

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
          <EntiendeRecibo
            resolution={resolution}
            usedPercent={usedPercent}
            remaining={remaining}
            currentDelta={currentDelta}
            onSelectReceipt={setSelectedReceipt}
            onExplain={explainNow}
            onShowReceipts={() => setTab("recibos")}
            onShowConsumption={() => setTab("consumo")}
            onOpenChat={() => setShowChat(true)}
          />
        )}

        {tab === "consumo" && <ConoceRecibo usedPercent={usedPercent} remaining={remaining} average={average} />}
        {tab === "recibos" && <MisRecibos onSelectReceipt={setSelectedReceipt} />}
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
