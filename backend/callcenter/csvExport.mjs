function cell(value) {
  return `"${String(value ?? "").replace(/"/g, '""').replace(/[\r\n]+/g, " ")}"`;
}

export function casesToCsv(cases) {
  const headers = ["case_id", "created_at", "customer_name", "line_masked", "receipt", "question", "handoff_reason", "evidence", "status", "callback_status", "assigned_agent", "call_duration_seconds", "resolution", "advisor_notes"];
  const rows = cases.map((item) => [
    item.id, item.createdAt, item.customerName, item.customerPhoneMasked ?? item.line,
    item.receiptSlug, item.question, item.reason, (item.evidence ?? []).join(" | "),
    item.status, item.callbackStatus, item.assignedAgent, item.callDurationSeconds,
    item.resolution, item.advisorNotes,
  ].map(cell).join(","));
  return `\uFEFF${[headers.join(","), ...rows].join("\r\n")}`;
}
