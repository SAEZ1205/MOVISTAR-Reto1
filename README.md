# Mi Movistar · Entiende tu recibo v5

Prototipo académico de un módulo que viviría dentro de Mi Movistar. LucIA compara seis recibos, explica variaciones con evidencia, muestra consumo entendible, deriva el contexto por WhatsApp y habilita una oferta únicamente después de resolver la consulta.

## Inicio rápido en Windows

Necesitas Node.js 22 y npm 11.16 o posterior. Comprueba las versiones:

```powershell
node --version
npm --version
```

Si npm es anterior a 11.16 y no reconoce `approve-scripts`, actualízalo una vez y vuelve a abrir PowerShell:

```powershell
npm install -g npm@latest
```

Después, dentro de la carpeta del proyecto, ejecuta uno por uno:

```powershell
npm install
npm approve-scripts esbuild
npm run configurar
npm run diagnostico
npm run dev
```

Abre `http://localhost:3000`.

`npm run configurar` te pide la clave de Gemini y, si deseas, los datos de Twilio. Los secretos se guardan en `.env.local`, que está ignorado por Git. Si cambias alguna clave, detén la app con `Ctrl + C`, vuelve a ejecutar `npm run configurar` y después `npm run dev`.

Los avisos `deprecated` y `allow-scripts` de npm no cambian los colores ni la vista móvil. `npm approve-scripts esbuild` se ejecuta una sola vez para autorizar únicamente el instalador de esbuild que aparece en el lockfile. El comando existe desde npm 11.16; en una versión anterior verás `Unknown command`.

## Probar Gemini

1. Crea o copia tu clave desde Google AI Studio.
2. Ejecuta `npm run configurar`.
3. Escribe la clave cuando la terminal la solicite. Se verá oculta con puntos.
4. Conserva `gemini-2.5-flash` o indica otro modelo disponible para tu clave.
5. Comprueba la conexión:

```powershell
npm run probar:gemini
```

6. Inicia la app:

```powershell
npm run dev
```

Gemini solo clasifica la intención y tolera frases incompletas o mal escritas, por ejemplo `xq me vino mas karo`. Los montos y explicaciones salen de `backend/data/demo/billing_data.json`. Si Gemini no responde, se usa el clasificador local sin detener la app.

## Configurar WhatsApp con Twilio Sandbox

El Sandbox sirve para una demo. No representa el proceso de producción de Movistar.

1. Crea una cuenta en Twilio e ingresa a la consola.
2. Ve a **Messaging → Try it out → Send a WhatsApp message**.
3. Activa el Sandbox y confirma sus términos.
4. La consola mostrará un número Sandbox y una frase como `join palabra-palabra`.
5. Desde el WhatsApp que recibirá los resúmenes, escanea el QR. Se abrirá un chat con el mensaje preparado.
6. Envía ese mensaje `join ...` exactamente como aparece. Si lo haces manualmente, también debes copiarlo tal cual.
7. Espera la respuesta de Twilio que confirma que tu número se unió al Sandbox.
8. En PowerShell ejecuta:

```powershell
npm run configurar
```

9. Responde `s` cuando pregunte por Twilio y completa:

```text
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_token
TWILIO_WHATSAPP_FROM=whatsapp:+numero_sandbox
CALLCENTER_WHATSAPP_TO=whatsapp:+51968821435
```

10. Prueba el envío real:

```powershell
npm run probar:whatsapp
```

11. Confirma con `s`. Deberá llegar un mensaje de prueba.
12. Inicia la app, abre LucIA, elige **Todavía tengo dudas** y pulsa **Enviar resumen por WhatsApp**.

Importante: el número indicado en `CALLCENTER_WHATSAPP_TO` debe haberse unido al Sandbox. Al enviar el `join` se abre una ventana de atención de 24 horas para mensajes libres. La unión al Sandbox caduca después de tres días, así que conviene repetirla poco antes de la presentación.

## Verificar la oferta sin venta invasiva

1. Abre **Revisar demo**. La oferta figura como **Bloqueada**.
2. Acepta el aviso inicial de LucIA o pregunta `¿por qué subió mi recibo?`.
3. LucIA explica el aumento usando el recibo y las órdenes simuladas.
4. Pulsa **Sí, quedó claro**.
5. LucIA recuerda los beneficios que ya tienes y recién entonces habilita una oferta puntual.
6. Verás **Bolsa extra de 5 GB por S/5.90**, porque el consumo llegó al 87% y faltan cinco días.
7. Pulsa **Simular contratación**. No se realiza ningún cobro real.

Si eliges **Todavía tengo dudas**, la oferta permanece bloqueada y se prepara la derivación a un humano. Esa es la regla de cross-selling del prototipo.

## Arquitectura

- `app/`: entradas mínimas de Next.js y rutas HTTP; la interfaz se mantiene en `src/`.
- `src/pages/cliente/`: Inicio, resumen explicado, consumo e historial de recibos.
- `src/pages/asesor/`: espacio separado para el dashboard y el detalle de cada caso.
- `src/components/`: componentes reutilizables de cliente, LucIA, asesor y elementos compartidos.
- `src/services/`: acceso a facturación, LucIA, derivación y ofertas.
- `src/types/`: contratos TypeScript compartidos entre los módulos.
- `backend/ai/assistant.ts`: clasificación de Gemini, intención local y respuestas verificadas.
- `backend/handoff/whatsapp.ts`: resumen de derivación y envío a Twilio.
- `backend/data/demo/billing_data.json`: única fuente de datos financieros de la demo.
- `backend/data/raw/` y `backend/data/processed/`: espacios para preparar el dataset sin mezclarlo con la demo.
- `public/recibos/`: seis PDF ficticios.
- `.env.local`: claves locales; nunca debe subirse a GitHub.

Local y publicado usan las mismas rutas `/api/chat`, `/api/status` y `/api/whatsapp`. Ya no existe un segundo backend Python con respuestas diferentes.

## Límites reales

Autenticación, pago, CRM, facturación, órdenes, contratación y transferencia a un asesor son simulados. Para producción se necesitarían APIs internas de Movistar, controles de acceso, auditoría, plantillas oficiales de WhatsApp y métricas de precisión.

Todo el contenido es ficticio y académico. No está afiliado oficialmente a Movistar.
