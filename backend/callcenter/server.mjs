import "dotenv/config";
import cors from "cors";
import express from "express";
import { createCase, getCase, getCases, updateCase } from "./caseStore.mjs";
import { casesToCsv } from "./csvExport.mjs";
import { runSimulation } from "./simulationService.mjs";
import {
  bridgeCalls,
  cleanTelnyxError,
  decodeClientState,
  dialAdvisor,
  dialCustomer,
  gatherAdvisor,
  telnyxConfigured,
  unwrapWebhook,
} from "./telnyxService.mjs";

const app = express();
const port = Number(process.env.PORT || 4000);
const provider = process.env.CALL_PROVIDER === "telnyx" ? "telnyx" : "simulation";
const allowedOrigins = new Set((process.env.FRONTEND_ORIGIN || "http://127.0.0.1:3000,http://localhost:3000").split(",").map((value) => value.trim()).filter(Boolean));
const processedEvents = new Set();

app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.has(origin));
  },
}));
app.use(express.json({
  limit: "120kb",
  verify(request, _response, buffer) { request.rawBody = buffer.toString("utf8"); },
}));

function clean(value, limit = 500) {
  return String(value ?? "").replace(/[<>\r\n]/g, " ").replace(/\s+/g, " ").trim().slice(0, limit);
}

function maskPhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length > 3 ? `${"•".repeat(Math.max(4, digits.length - 3))}${digits.slice(-3)}` : "Número protegido";
}

function normalizeCase(body) {
  const now = new Date().toISOString();
  const id = clean(body?.id, 30) || `CASO-${Date.now().toString().slice(-6)}`;
  const conversation = Array.isArray(body?.conversation) ? body.conversation.slice(-8).map((message) => ({
    role: message?.role === "user" ? "user" : "bot",
    text: clean(message?.text, 600),
    source: clean(message?.source, 160),
  })) : [];
  const evidence = Array.isArray(body?.evidence) ? body.evidence.slice(0, 8).map((value) => clean(value, 220)) : [];
  return {
    ...body,
    id,
    customerName: clean(body?.customerName, 80) || "Cliente demo",
    line: maskPhone(body?.customerPhoneMasked || body?.line),
    customerPhoneMasked: maskPhone(body?.customerPhoneMasked || body?.line),
    advisorPhoneMasked: maskPhone(process.env.ADVISOR_PHONE),
    question: clean(body?.question, 600) || "Consulta de facturación",
    receiptSlug: clean(body?.receiptSlug, 80) || "recibo-demo",
    reason: clean(body?.reason, 400) || "El cliente solicita atención humana.",
    evidence,
    conversation,
    status: "new",
    callbackRequested: true,
    callbackStatus: "CALLBACK_REQUESTED",
    contactPreference: "callback",
    assignedAgent: null,
    callStartedAt: null,
    callAnsweredAt: null,
    callEndedAt: null,
    callDurationSeconds: null,
    resolution: null,
    advisorNotes: null,
    callError: null,
    createdAt: body?.createdAt || now,
    updatedAt: now,
  };
}

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, service: "LucIA Call Center", provider, configured: provider === "simulation" || telnyxConfigured() });
});

app.post("/api/handoff", async (request, response) => {
  try {
    let item = await createCase(normalizeCase(request.body));
    item = await updateCase(item.id, { callbackStatus: "CALLING_AGENT" });

    if (provider === "telnyx") {
      try {
        const call = await dialAdvisor(item);
        item = await updateCase(item.id, { advisorCallControlId: call?.call_control_id ?? null });
      } catch (error) {
        item = await updateCase(item.id, { callbackStatus: "CALL_FAILED", callError: cleanTelnyxError(error) });
      }
    }

    response.status(201).json({
      ok: true,
      configured: provider === "simulation" || telnyxConfigured(),
      provider,
      message: provider === "simulation"
        ? `${item.id}: LucIA envió el contexto. Abre la consola del asesor para atender la llamada simulada.`
        : item.callbackStatus === "CALL_FAILED"
          ? `${item.id}: el caso se guardó, pero Telnyx no pudo iniciar la llamada.`
          : `${item.id}: estamos contactando a un asesor.`,
      case: item,
    });
  } catch (error) {
    response.status(400).json({ ok: false, message: clean(error?.message || "No se pudo crear el caso.") });
  }
});

app.get("/api/cases", async (_request, response) => {
  response.json({ ok: true, provider, cases: await getCases() });
});

app.get("/api/cases/export.csv", async (_request, response) => {
  response.setHeader("Content-Type", "text/csv; charset=utf-8");
  response.setHeader("Content-Disposition", "attachment; filename=lucia-callcenter-casos.csv");
  response.send(casesToCsv(await getCases()));
});

app.get("/api/cases/:id", async (request, response) => {
  const item = await getCase(request.params.id);
  if (!item) return response.status(404).json({ ok: false, message: "Caso no encontrado." });
  response.json({ ok: true, case: item });
});

app.patch("/api/cases/:id", async (request, response) => {
  const allowed = {};
  if (["new", "assigned", "in-progress", "resolved"].includes(request.body?.status)) allowed.status = request.body.status;
  if (typeof request.body?.resolution === "string") allowed.resolution = clean(request.body.resolution, 1200);
  if (typeof request.body?.advisorNotes === "string") allowed.advisorNotes = clean(request.body.advisorNotes, 1200);
  const item = await updateCase(request.params.id, allowed);
  if (!item) return response.status(404).json({ ok: false, message: "Caso no encontrado." });
  response.json({ ok: true, case: item });
});

app.post("/api/cases/:id/resolve", async (request, response) => {
  const item = await updateCase(request.params.id, { status: "resolved", resolution: clean(request.body?.resolution, 1200) });
  if (!item) return response.status(404).json({ ok: false, message: "Caso no encontrado." });
  response.json({ ok: true, case: item });
});

app.post("/api/cases/:id/simulation", async (request, response) => {
  if (provider !== "simulation") return response.status(409).json({ ok: false, message: "Los controles de simulación solo están disponibles en CALL_PROVIDER=simulation." });
  try {
    const item = await runSimulation(request.params.id, request.body?.action);
    if (!item) return response.status(404).json({ ok: false, message: "Caso no encontrado." });
    response.json({ ok: true, provider, case: item });
  } catch (error) {
    response.status(400).json({ ok: false, message: clean(error?.message) });
  }
});

app.post("/webhooks/telnyx", async (request, response) => {
  if (provider !== "telnyx") return response.sendStatus(204);
  let event;
  try {
    const headers = Object.fromEntries(Object.entries(request.headers).map(([key, value]) => [key, Array.isArray(value) ? value.join(",") : String(value ?? "")]));
    event = unwrapWebhook(request.rawBody || JSON.stringify(request.body), headers);
  } catch {
    return response.status(401).json({ ok: false, message: "Firma de webhook inválida." });
  }
  response.sendStatus(200);
  void handleTelnyxEvent(event).catch((error) => console.error("Webhook Telnyx:", cleanTelnyxError(error)));
});

async function handleTelnyxEvent(envelope) {
  const data = envelope?.data ?? envelope;
  const eventId = data?.id;
  if (eventId && processedEvents.has(eventId)) return;
  if (eventId) {
    processedEvents.add(eventId);
    if (processedEvents.size > 5000) processedEvents.delete(processedEvents.values().next().value);
  }

  const eventType = data?.event_type;
  const payload = data?.payload ?? {};
  const state = decodeClientState(payload.client_state);
  if (!state.caseId) return;
  let item = await getCase(state.caseId);
  if (!item) return;

  if (eventType === "call.initiated") {
    const field = state.leg === "customer" ? "customerCallControlId" : "advisorCallControlId";
    await updateCase(item.id, { [field]: payload.call_control_id });
    return;
  }

  if (eventType === "call.answered" && state.leg === "advisor") {
    item = await updateCase(item.id, { callbackStatus: "AGENT_ANSWERED", advisorCallControlId: payload.call_control_id, callAnsweredAt: new Date().toISOString() });
    await gatherAdvisor(item, payload.call_control_id);
    await updateCase(item.id, { callbackStatus: "WAITING_AGENT_CONFIRMATION" });
    return;
  }

  if (eventType === "call.gather.ended" && state.leg === "advisor") {
    if (payload.digits !== "1") return updateCase(item.id, { callbackStatus: "AGENT_NO_ANSWER", callError: "El asesor no aceptó el caso." });
    item = await updateCase(item.id, { status: "assigned", callbackStatus: "AGENT_ACCEPTED", assignedAgent: "Asesor Demo", advisorCallControlId: payload.call_control_id });
    const customerCall = await dialCustomer(item);
    await updateCase(item.id, { callbackStatus: "CALLING_CUSTOMER", customerCallControlId: customerCall?.call_control_id ?? null });
    return;
  }

  if (eventType === "call.answered" && state.leg === "customer") {
    item = await updateCase(item.id, { status: "in-progress", callbackStatus: "CUSTOMER_ANSWERED", customerCallControlId: payload.call_control_id });
    await bridgeCalls(payload.call_control_id, item.advisorCallControlId);
    await updateCase(item.id, { callbackStatus: "IN_CALL", callStartedAt: new Date().toISOString() });
    return;
  }

  if (eventType === "call.bridged") {
    await updateCase(item.id, { status: "in-progress", callbackStatus: "IN_CALL", callStartedAt: item.callStartedAt || new Date().toISOString() });
    return;
  }

  if (eventType === "call.hangup") {
    const now = new Date().toISOString();
    if (item.callStartedAt) {
      const duration = Math.max(1, Math.round((Date.now() - new Date(item.callStartedAt).getTime()) / 1000));
      await updateCase(item.id, { callbackStatus: "CALL_COMPLETED", callEndedAt: now, callDurationSeconds: duration });
    } else {
      await updateCase(item.id, { callbackStatus: state.leg === "advisor" ? "AGENT_NO_ANSWER" : "CUSTOMER_NO_ANSWER", callEndedAt: now });
    }
  }
}

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ ok: false, message: "Ocurrió un error seguro en el Call Center." });
});

app.listen(port, () => {
  console.log(`LucIA Call Center activo en http://localhost:${port} · proveedor ${provider}`);
});
