# MOVISTAR Reto 1 · Mi recibo inteligente

Prototipo académico móvil inspirado en la experiencia de **Mi Movistar**. La solución se integra como un botón de IA dentro de **Mi recibo**: LucIA explica variaciones con evidencia, compara seis recibos, muestra consumo, recuerda beneficios, deriva el contexto al Call Center y solo habilita una oferta cuando la consulta ya fue resuelta.

> Proyecto académico no afiliado oficialmente a Movistar. Todos los datos personales, recibos, órdenes, montos y acciones son ficticios o simulados.

## Stack oficial

- React 19
- TypeScript
- Vite
- Tailwind CSS 4

La aplicación principal **no usa Next.js**. El código antiguo quedó conservado dentro de `legacy/` únicamente como referencia y no participa en la compilación.

## Ejecutar el proyecto

Requisitos: Node.js 22.13 o superior.

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

Si quieres abrirlo desde otro dispositivo conectado a tu misma red local, usa `npm run dev -- --host 0.0.0.0`.

Para comprobar la versión de producción:

```bash
npm run build
npm run preview
```

Si npm muestra específicamente un aviso para aprobar `esbuild`, ejecuta una vez:

```bash
npm approve-scripts esbuild
```

En Windows también puedes ejecutar `INICIAR_EN_WINDOWS.bat`.

## Flujo principal de la demo

1. Entra a **Recibo** desde la barra inferior.
2. Pulsa **Entiende tu recibo con LucIA**.
3. Revisa la diferencia entre julio y agosto, el desglose y la evidencia.
4. Abre LucIA y pregunta, por ejemplo: `xq me vino mas karo`.
5. Si confirmas que la explicación resolvió la duda, se habilita una oferta controlada.
6. Si todavía tienes dudas, se crea un caso con el contexto completo para el Call Center.

La IA interpreta la intención; los importes, fechas, cargos, beneficios y ofertas se obtienen de datos estructurados. Si no hay evidencia, responde que no puede afirmarlo y ofrece derivación.

## Estructura

```text
MOVISTAR-Reto1/
├── src/
│   ├── pages/
│   │   ├── cliente/
│   │   └── asesor/
│   ├── components/
│   │   ├── cliente/
│   │   ├── lucia/
│   │   ├── asesor/
│   │   └── shared/
│   ├── services/
│   ├── types/
│   ├── data/mocks/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── backend/
│   ├── data/{raw,processed,demo}/
│   ├── billing/
│   ├── ai/
│   ├── handoff/
│   └── offers/
├── scripts/preparar-dataset.py
├── public/
├── legacy/
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Servicios del frontend

- `billingService.ts`: recibos, comparación y análisis.
- `luciaService.ts`: preguntas y respuestas con modo local verificado o API externa opcional.
- `handoffService.ts`: creación, lectura y actualización de casos de demo.
- `offerService.ts`: elegibilidad y catálogo controlado.

Los secretos nunca deben usar el prefijo `VITE_`. Las variables `GEMINI_API_KEY` y `TWILIO_*` están reservadas para un backend seguro.

## Reparto para cuatro personas

| Persona | Responsabilidad | Carpetas principales |
|---|---|---|
| 1 | Dataset y lógica financiera | `backend/data/`, `backend/billing/`, `scripts/`, `src/types/billing.ts` |
| 2 | LucIA y motor IA | `backend/ai/`, `src/components/lucia/`, `src/services/luciaService.ts`, `src/types/lucia.ts` |
| 3 | Frontend del cliente | `src/pages/cliente/`, `src/components/cliente/`, `src/components/shared/`, `billingService.ts`, `offerService.ts` |
| 4 | Call Center y hand-off | `src/pages/asesor/`, `src/components/asesor/`, `backend/handoff/`, `handoffService.ts`, `src/types/case.ts` |

Para evitar conflictos, cada integrante debe crear su propia rama y no modificar carpetas asignadas a otra persona sin coordinar.

## Archivos antiguos conservados

`legacy/next-prototype/`, `legacy/sites-runtime/`, `legacy/integrations/` y `legacy/generated/` contienen la implementación anterior y archivos de apoyo. No se cargan desde Vite y pueden eliminarse en una limpieza posterior cuando el equipo confirme que ya no necesita compararlos.
