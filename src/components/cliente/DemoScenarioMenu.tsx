import Icon, { type IconName } from "@/src/components/shared/Icon";

type DemoScenario = {
  label: string;
  description: string;
  icon: IconName;
  question?: string;
};

const scenarios: DemoScenario[] = [
  {
    label: "Cobro por reconexión",
    description: "Explica el cargo después de recuperar el servicio.",
    icon: "support",
    question: "Muéstrame el caso demo de cobro por reconexión",
  },
  {
    label: "Fin de descuento",
    description: "Muestra por qué el total sube cuando termina una promoción.",
    icon: "gift",
    question: "Muéstrame el caso demo de fin de descuento",
  },
  {
    label: "Prorrateo",
    description: "Movimiento ocurrido dentro del periodo facturado.",
    icon: "chart",
    question: "Muéstrame el caso demo de prorrateo",
  },
  {
    label: "Dashboard del asesor",
    description: "Revisa cómo LucIA entrega el caso al Call Center.",
    icon: "headset",
  },
];

export default function DemoScenarioMenu({
  onScenario,
  onAdvisor,
}: {
  onScenario: (question: string) => void;
  onAdvisor: () => void;
}) {
  return (
    <details className="demo-scenario-menu">
      <summary>
        <span><i><Icon name="sparkles" size={20} /></i><b><small>SOLO PARA LA PRESENTACIÓN</small><strong>Modo demo: elegir un caso</strong></b></span>
        <Icon name="chevron-down" size={20} />
      </summary>
      <div className="demo-scenario-options">
        {scenarios.map((scenario, index) => (
          <button key={scenario.label} onClick={() => scenario.question ? onScenario(scenario.question) : onAdvisor()}>
            <b>{index + 1}</b>
            <i><Icon name={scenario.icon} size={19} /></i>
            <span><strong>{scenario.label}</strong><small>{scenario.description}</small></span>
            <Icon name="arrow-right" size={18} />
          </button>
        ))}
      </div>
    </details>
  );
}
