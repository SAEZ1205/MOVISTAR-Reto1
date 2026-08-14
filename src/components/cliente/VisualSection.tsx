import Header from "@/src/components/shared/Header";
import Icon, { type IconName } from "@/src/components/shared/Icon";

type Kind = "beneficios" | "tienda" | "soporte";
const content: Record<Kind, { title: string; hero: string; description: string; items: { icon: IconName; title: string; detail: string }[] }> = {
  beneficios: { title: "Beneficios", hero: "Tu categoría Movistar Gold", description: "Disfruta descuentos, experiencias y sorpresas por ser parte del programa.", items: [{ icon: "gift", title: "Cine y entretenimiento", detail: "Beneficios exclusivos de tu categoría" }, { icon: "data", title: "Datos para tus apps", detail: "Revisa lo incluido en tu plan" }, { icon: "sparkles", title: "Promociones del mes", detail: "Nuevas opciones para ti" }] },
  tienda: { title: "Tienda", hero: "Mejora tu plan Hogar", description: "Encuentra el plan, paquete o equipo que mejor se adapta a ti.", items: [{ icon: "wifi", title: "Planes hogar", detail: "Internet y TV" }, { icon: "globe", title: "Mejorar mi plan", detail: "Opciones disponibles" }, { icon: "device", title: "Renovación de equipo", detail: "Precios especiales" }, { icon: "shop", title: "Comprar paquetes", detail: "Datos y adicionales" }] },
  soporte: { title: "Soporte", hero: "¿Cómo podemos ayudarte?", description: "Resuelve rápidamente las gestiones frecuentes de tu línea y servicios.", items: [{ icon: "support", title: "Tengo una avería", detail: "Realizar un autodiagnóstico" }, { icon: "data", title: "Medir velocidad de internet", detail: "Comprueba tu conexión" }, { icon: "phone", title: "Administrar mi línea", detail: "Gestiones frecuentes" }, { icon: "headset", title: "Contactar a un asesor", detail: "Atención y seguimiento" }] },
};

export default function VisualSection({ kind, onBack }: { kind: Kind; onBack: () => void }) {
  const page = content[kind];
  return <><Header title={page.title} onBack={onBack} /><div className={`visual-page ${kind}`}><section className="visual-hero"><small>MI MOVISTAR</small><h2>{page.hero}</h2><p>{page.description}</p></section><div className="visual-grid">{page.items.map((item) => <button key={item.title}><i><Icon name={item.icon} /></i><span><strong>{item.title}</strong><small>{item.detail}</small></span><Icon name="arrow-right" /></button>)}</div></div></>;
}
