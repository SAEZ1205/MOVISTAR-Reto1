import billing from "./data/billing_data.json";

export type Intent =
  | "increase"
  | "breakdown"
  | "usage"
  | "categories"
  | "plan"
  | "receipts"
  | "receipt_month"
  | "payment"
  | "proration"
  | "discount_demo"
  | "benefits"
  | "offer"
  | "unknown";

export type Classification = { intent: Intent; month?: string };

const allowedIntents: Intent[] = [
  "increase", "breakdown", "usage", "categories", "plan", "receipts",
  "receipt_month", "payment", "proration", "discount_demo", "benefits",
  "offer", "unknown",
];
const monthSlugs = billing.receipts.map((receipt) => receipt.slug);
const current = billing.receipts[billing.receipts.length - 1];

function money(value: number) {
  return `S/${value.toFixed(2)}`;
}

function normalize(message: string) {
  return message
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function localClassification(message: string): Classification {
  const text = normalize(message);
  const month = monthSlugs.find((slug) => text.includes(slug));
  if (month) {
    return {
      intent: month === "mayo" && /prorr|prote|cinco dias|cobro raro/.test(text) ? "proration" : "receipt_month",
      month,
    };
  }
  const rules: [RegExp, Intent][] = [
    [/sub|aument|mas caro|vino mas|llego mas|variac|cambio.*recibo|recibo.*cambio|pago mas|cobran mas|xq.*caro|porque.*caro/, "increase"],
    [/que.*cobr|detalle|concept|total|monto|de donde sale|desglos|suma|cargos/, "breakdown"],
    [/en que.*use|categoria|video|redes|youtube|streaming|aplicaciones/, "categories"],
    [/giga|\bgb\b|dato|consum|queda|alcanz|agot|internet/, "usage"],
    [/benefici|inclui|gratis|tengo en mi plan/, "benefits"],
    [/oferta|promo|recomiend|bolsa extra|comprar gigas/, "offer"],
    [/plan|tarifa|precio mensual/, "plan"],
    [/prorr|parte proporcional/, "proration"],
    [/descuento.*termin|promocion.*termin|beneficio.*termin|fin.*descuento/, "discount_demo"],
    [/pagar|pagado|pendiente|vence|vencimiento|fecha de pago/, "payment"],
    [/recibo|historial|pdf|meses|boleta/, "receipts"],
  ];
  return { intent: rules.find(([pattern]) => pattern.test(text))?.[1] || "unknown" };
}

export async function geminiClassification(message: string): Promise<Classification | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const examples = [
    ["xq me vino mas karo", "increase"],
    ["q me tan cobrando", "breakdown"],
    ["cuantos jigas kedan", "usage"],
    ["el de mayo porque raro", "receipt_month", "mayo"],
    ["tengo algo gratis en mi plan", "benefits"],
    ["hay alguna oferta para mi", "offer"],
  ];
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: [
              "Eres un clasificador de intención para facturación móvil en español peruano.",
              "Tolera faltas ortográficas, frases incompletas, abreviaturas y jerga.",
              "No respondas la consulta y no inventes datos ni montos.",
              `Devuelve solo JSON con intent y, únicamente si corresponde, month. Intents: ${allowedIntents.join(", ")}.`,
              `Meses válidos: ${monthSlugs.join(", ")}.`,
              `Ejemplos: ${JSON.stringify(examples)}.`,
            ].join(" "),
          }],
        },
        contents: [{ role: "user", parts: [{ text: message.slice(0, 500) }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0,
          maxOutputTokens: 80,
        },
      }),
    },
  );
  if (!response.ok) return null;
  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) return null;
  const parsed = JSON.parse(raw) as { intent?: string; month?: string };
  const intent = String(parsed.intent || "") as Intent;
  if (!allowedIntents.includes(intent)) return null;
  const month = monthSlugs.includes(String(parsed.month || "")) ? String(parsed.month) : undefined;
  return { intent, month };
}

export function answerFor({ intent, month }: Classification) {
  const remaining = billing.customer.plan_gb - current.usage_gb;
  const delta = current.amount - current.previous;

  if (intent === "increase") return {
    answer: `Tu recibo subió ${money(delta)} frente a julio. El precio de tu plan sigue en ${money(billing.customer.plan_price)}. El aumento viene de 10 GB adicionales por S/15.00 y Movistar Música por S/8.00.`,
    evidence: current.evidence,
    needsResolutionCheck: true,
  };
  if (intent === "breakdown") return {
    answer: `El total de ${money(current.amount)} se forma así: ${current.charges.map((item) => `${item.label} ${money(item.amount)}`).join(", ")}. La suma coincide exactamente con el recibo.`,
    evidence: ["Detalle del recibo agosto 2026"],
    needsResolutionCheck: true,
  };
  if (intent === "usage") return {
    answer: `Has usado ${current.usage_gb.toFixed(1)} GB de ${billing.customer.plan_gb} GB. Te quedan ${remaining.toFixed(1)} GB para ${billing.customer.days_remaining} días. A tu ritmo reciente, podrías agotarlos el 14 de agosto.`,
    evidence: ["Consumo del ciclo 16 jul - 10 ago 2026"],
    needsResolutionCheck: true,
  };
  if (intent === "categories") return {
    answer: `Tus ${current.usage_gb.toFixed(1)} GB se distribuyen así: ${billing.usage_categories.map((item) => `${item.label} ${item.gb.toFixed(1)} GB`).join(", ")}. Los valores suman exactamente ${current.usage_gb.toFixed(1)} GB.`,
    evidence: ["Consumo por categorías del ciclo"],
    needsResolutionCheck: true,
  };
  if (intent === "plan") return {
    answer: `Tu plan sigue siendo ${billing.customer.plan_name} por ${money(billing.customer.plan_price)}. No existe una orden de cambio de plan en el ciclo actual.`,
    evidence: ["Plan vigente", "Órdenes del ciclo"],
    needsResolutionCheck: true,
  };
  if (intent === "receipts") return {
    answer: `Tienes seis recibos simulados: ${billing.receipts.map((receipt) => `${receipt.short_month} ${money(receipt.amount)}`).join(", ")}. Puedes abrir o descargar cada PDF desde “6 recibos”.`,
    evidence: ["Historial marzo-agosto 2026"],
    needsResolutionCheck: true,
  };
  if (intent === "receipt_month") {
    const receipt = billing.receipts.find((item) => item.slug === month);
    if (receipt) return {
      answer: `En ${receipt.label} el total fue ${money(receipt.amount)} y figura como ${receipt.status.toLowerCase()}. ${receipt.explanation}`,
      evidence: receipt.evidence,
      needsResolutionCheck: true,
    };
  }
  if (intent === "payment") return {
    answer: `El recibo de agosto por ${money(current.amount)} está pendiente y vence el 15 de agosto de 2026. En esta demo el pago es simulado.`,
    evidence: ["Estado y vencimiento del recibo agosto 2026"],
    needsResolutionCheck: true,
  };
  if (intent === "proration") return {
    answer: "En mayo se cobraron S/2.50 por cinco días de Protección Móvil, del 11 al 15 de mayo. Es un prorrateo: pagaste solo la parte del mes en que estuvo activo.",
    evidence: ["Recibo mayo 2026", "Orden PRO-1105", "Regla de prorrateo"],
    needsResolutionCheck: true,
  };
  if (intent === "discount_demo") return {
    answer: "En tus seis recibos no aparece un descuento vencido, así que no voy a atribuirte ese cobro. Como caso alternativo de demo: si una promoción registrada vence, LucIA muestra el descuento, su fecha final y el retorno al precio regular.",
    evidence: ["Caso alternativo de demo · No pertenece a esta cuenta"],
    needsResolutionCheck: true,
  };
  if (intent === "benefits") return {
    answer: `Tu plan ya incluye: ${billing.benefits.join(", ")}. No generan un cargo adicional en este recibo.`,
    evidence: ["Beneficios del plan vigente"],
    needsResolutionCheck: true,
  };
  if (intent === "offer") return {
    answer: `Existe una oferta pertinente para esta demo: ${billing.offer.name} por ${money(billing.offer.price)}, válida por ${billing.offer.duration}. Solo debe mostrarse después de resolver tu consulta porque has usado el 87% de tu plan.`,
    evidence: ["Regla de elegibilidad O-87", "Consumo verificado del ciclo"],
    needsResolutionCheck: true,
  };
  return {
    answer: "No encuentro evidencia suficiente en estos seis recibos para responder sin inventar. Puedo enviar a un asesor el resumen, los datos revisados y esta conversación.",
    evidence: ["Resultado: evidencia insuficiente"],
    needsResolutionCheck: false,
  };
}
