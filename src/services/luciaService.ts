import type { LuciaReply, ServiceStatus } from "@/src/types/lucia";

export async function getServiceStatus(): Promise<ServiceStatus> {
  const response = await fetch("/api/status");
  return response.json();
}

export async function askLucia(message: string): Promise<LuciaReply> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) throw new Error("Backend no disponible");
  return response.json();
}
