function clean(value, limit) {
  return String(value ?? "").replace(/[<>\n\r]/g, " ").replace(/\s+/g, " ").trim().slice(0, limit);
}

export function buildAdvisorSummary(item) {
  const evidence = (Array.isArray(item.evidence) ? item.evidence : []).slice(0, 3).map((value) => clean(value, 130)).filter(Boolean).join(". ");
  return [
    "LucIA Call Center.",
    `Nuevo caso ${clean(item.id, 30)}.`,
    `Cliente ${clean(item.customerName, 60)}.`,
    `La consulta es: ${clean(item.question, 220)}.`,
    `Motivo de derivación: ${clean(item.reason, 180)}.`,
    evidence ? `Evidencia disponible: ${evidence}.` : "No existe evidencia suficiente para confirmar la causa.",
    "El cliente solicita atención humana. Presione uno para aceptar el caso.",
  ].join(" ").slice(0, 1200);
}
