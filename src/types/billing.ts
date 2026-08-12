export type Tab = "resumen" | "consumo" | "recibos";

export type Receipt = {
  slug: string;
  month: string;
  shortMonth: string;
  period: string;
  issued: string;
  due: string;
  code: string;
  amount: number;
  previous: number;
  status: "Pagado" | "Pendiente";
  usage: number;
  note: string;
  charges: {
    label: string;
    amount: number;
    kind: "plan" | "extra" | "adjustment";
  }[];
  explanation: string;
  evidence: string[];
  file: string;
};
