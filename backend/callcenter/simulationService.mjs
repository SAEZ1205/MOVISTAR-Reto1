import { getCase, updateCase } from "./caseStore.mjs";

export async function runSimulation(id, action) {
  const item = await getCase(id);
  if (!item) return undefined;
  const now = new Date().toISOString();

  if (action === "answer") {
    return updateCase(id, {
      assignedAgent: "Asesor Demo",
      callbackStatus: "WAITING_AGENT_CONFIRMATION",
      callAnsweredAt: now,
    });
  }

  if (action === "accept") {
    const accepted = await updateCase(id, {
      status: "assigned",
      assignedAgent: "Asesor Demo",
      callbackStatus: "CALLING_CUSTOMER",
    });
    setTimeout(async () => {
      const current = await getCase(id);
      if (current?.callbackStatus === "CALLING_CUSTOMER") {
        await updateCase(id, { status: "in-progress", callbackStatus: "IN_CALL", callStartedAt: new Date().toISOString() });
      }
    }, 2200);
    return accepted;
  }

  if (action === "finish") {
    const started = item.callStartedAt ? new Date(item.callStartedAt).getTime() : Date.now();
    return updateCase(id, {
      callbackStatus: "CALL_COMPLETED",
      callEndedAt: now,
      callDurationSeconds: Math.max(1, Math.round((Date.now() - started) / 1000)),
    });
  }

  throw new Error("Acción de simulación no permitida.");
}
