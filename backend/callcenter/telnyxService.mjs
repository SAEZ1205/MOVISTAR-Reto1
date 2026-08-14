import Telnyx from "telnyx";
import { buildAdvisorSummary } from "./handoffSummary.mjs";

let instance;

function client() {
  if (!instance) {
    instance = new Telnyx({
      apiKey: process.env.TELNYX_API_KEY,
      publicKey: process.env.TELNYX_PUBLIC_KEY || undefined,
      maxRetries: 1,
      timeout: 20_000,
    });
  }
  return instance;
}

export function telnyxConfigured() {
  return Boolean(process.env.TELNYX_API_KEY && process.env.TELNYX_CONNECTION_ID && process.env.TELNYX_FROM_NUMBER && process.env.ADVISOR_PHONE && process.env.DEMO_CLIENT_PHONE && process.env.PUBLIC_BASE_URL);
}

export function encodeClientState(caseId, leg) {
  return Buffer.from(JSON.stringify({ caseId, leg }), "utf8").toString("base64");
}

export function decodeClientState(value) {
  try { return JSON.parse(Buffer.from(String(value ?? ""), "base64").toString("utf8")); } catch { return {}; }
}

function webhookUrl() {
  return `${process.env.PUBLIC_BASE_URL.replace(/\/$/, "")}/webhooks/telnyx`;
}

export async function dialAdvisor(item) {
  if (!telnyxConfigured()) throw new Error("Telnyx no está configurado completamente.");
  const response = await client().calls.dial({
    connection_id: process.env.TELNYX_CONNECTION_ID,
    from: process.env.TELNYX_FROM_NUMBER,
    to: process.env.ADVISOR_PHONE,
    webhook_url: webhookUrl(),
    client_state: encodeClientState(item.id, "advisor"),
    timeout_secs: 25,
  });
  return response.data;
}

export async function gatherAdvisor(item, callControlId) {
  return client().calls.actions.gatherUsingSpeak(callControlId, {
    payload: buildAdvisorSummary(item),
    voice: process.env.TELNYX_TTS_VOICE || "Telnyx.KokoroTTS.af_heart",
    language: "es-ES",
    valid_digits: "1",
    minimum_digits: 1,
    maximum_digits: 1,
    timeout_millis: 20_000,
    client_state: encodeClientState(item.id, "advisor"),
  });
}

export async function dialCustomer(item) {
  const response = await client().calls.dial({
    connection_id: process.env.TELNYX_CONNECTION_ID,
    from: process.env.TELNYX_FROM_NUMBER,
    to: process.env.DEMO_CLIENT_PHONE,
    webhook_url: webhookUrl(),
    client_state: encodeClientState(item.id, "customer"),
    timeout_secs: 25,
  });
  return response.data;
}

export async function bridgeCalls(customerCallControlId, advisorCallControlId) {
  return client().calls.actions.bridge(customerCallControlId, { call_control_id: advisorCallControlId });
}

export function unwrapWebhook(rawBody, headers) {
  if (!process.env.TELNYX_PUBLIC_KEY) return client().webhooks.unsafeUnwrap(rawBody);
  return client().webhooks.unwrap(rawBody, { headers, key: process.env.TELNYX_PUBLIC_KEY });
}

export function cleanTelnyxError(error) {
  const status = Number(error?.status ?? 0);
  if (status === 401) return "API Key de Telnyx inválida.";
  if (status === 403) return "Telnyx no autorizó el destino o la cuenta requiere verificación.";
  if (status === 422) return "Telnyx rechazó el número o la configuración de la llamada.";
  return String(error?.message ?? "No se pudo iniciar la llamada con Telnyx.").slice(0, 220);
}
