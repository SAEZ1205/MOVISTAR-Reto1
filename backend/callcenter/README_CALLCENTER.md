# LucIA Call Center · Telnyx + simulación

Este backend convierte el hand-off de LucIA en un caso central. El frontend nunca recibe claves de telefonía ni números reales de prueba.

## Qué funciona sin Telnyx

Con `CALL_PROVIDER=simulation` funcionan el caso compartido, la bandeja del asesor, el resumen hablado con `SpeechSynthesis`, la aceptación, la conexión simulada, el cronómetro, el cierre, las notas y el CSV.

## Inicio rápido en Windows

Terminal 1:

```powershell
npm install
npm approve-scripts esbuild
npm run dev
```

Terminal 2:

```powershell
cd backend\callcenter
copy .env.example .env
npm install
npm run dev
```

En la raíz crea `.env.local`:

```text
VITE_HANDOFF_API_URL=http://localhost:4000/api/handoff
VITE_CALLCENTER_API_URL=http://localhost:4000
```

Prueba `http://localhost:4000/api/health`, luego entra a `http://localhost:3000/?modo=asesor`.

## Primera llamada real: solo resumen al asesor

El modo más simple para tu demo es `CALL_FLOW=summary_only`: cuando LucIA deriva el caso, Telnyx llama a `ADVISOR_PHONE`, lee el resumen por voz, espera que presiones `1` y termina. No necesita un segundo celular.

## Activar Telnyx de forma segura

1. Crea tu cuenta en <https://telnyx.com/sign-up> y entra a Mission Control.
2. Completa la verificación de cuenta y agrega saldo controlado. Telnyx exige verificación para asociar conexiones y perfiles de salida.
3. En tu avatar abre **API Keys**, pulsa **Create API Key**, pon una etiqueta como `LucIA demo` y guarda la clave: Telnyx solo la muestra completa una vez.
4. Ve a **Real-Time Communication → Voice → Programmable Voice → Voice API Applications** y crea una aplicación llamada `LucIA Call Center`.
5. Copia el identificador de la aplicación/conexión en `TELNYX_CONNECTION_ID`.
6. En **Numbers**, busca y compra un número con voz. Ese número va en `TELNYX_FROM_NUMBER`; no suplantes un número de Movistar.
7. Crea o edita un **Outbound Voice Profile**, habilita Perú como destino y asocia la Voice Application. Algunas cuentas o destinos requieren aprobación adicional.
8. Coloca tu celular en `ADVISOR_PHONE` con formato internacional, por ejemplo `+519XXXXXXXX`. Para la primera prueba deja `CALL_FLOW=summary_only`.
9. Publica temporalmente el puerto 4000 por HTTPS y configura `PUBLIC_BASE_URL`.
10. En la Voice Application usa `https://TU-URL/webhooks/telnyx` como webhook de Voice API v2.
11. Copia la public key de firma a `TELNYX_PUBLIC_KEY`, cambia `CALL_PROVIDER=telnyx` y conserva `CALL_FLOW=summary_only`.

Referencias oficiales: [inicio de Voice API](https://developers.telnyx.com/docs/voice/programmable-voice/voice-api-fundamentals), [creación de API Keys](https://developers.telnyx.com/development/api-fundamentals/create-api-keys), [compra de números](https://support.telnyx.com/en/articles/4380325-search-and-buy-numbers) y [verificación de cuenta](https://support.telnyx.com/en/articles/1130595-account-verification).

El SDK usado es `telnyx@7`. Las llamadas se realizan con `client.calls.dial`; las acciones actuales usan `client.calls.actions.gatherUsingSpeak` y `client.calls.actions.bridge`.

## Ngrok para una prueba local

```powershell
ngrok http 4000
```

Si todavía no tienes ngrok: crea una cuenta en <https://ngrok.com>, descarga la versión de Windows, descomprime `ngrok.exe` y agrega el authtoken mostrado por ngrok con `ngrok config add-authtoken TU_TOKEN`.

Coloca la URL HTTPS obtenida en `PUBLIC_BASE_URL` y en el webhook de Telnyx. Si ngrok cambia la URL, actualiza ambos valores y reinicia el backend.

Ejemplo final de `.env` para recibir tú mismo el resumen:

```text
PORT=4000
CALL_PROVIDER=telnyx
CALL_FLOW=summary_only
TELNYX_API_KEY=TU_API_KEY
TELNYX_PUBLIC_KEY=TU_PUBLIC_KEY
TELNYX_CONNECTION_ID=TU_CONNECTION_ID
TELNYX_FROM_NUMBER=+1XXXXXXXXXX
ADVISOR_PHONE=+519XXXXXXXX
PUBLIC_BASE_URL=https://TU-SUBDOMINIO.ngrok-free.app
FRONTEND_ORIGIN=http://localhost:3000
```

Nunca envíes ese `.env` por chat ni lo subas a GitHub.

## Recorrido de la llamada real: resumen

1. `POST /api/handoff` crea el caso y llama al asesor.
2. Al contestar, el asesor escucha un resumen privado de 30–45 segundos.
3. El asesor presiona `1`.
4. El caso queda aceptado y la llamada termina.

Para conectar asesor y cliente, cambia a `CALL_FLOW=bridge`, agrega otro celular controlado en `DEMO_CLIENT_PHONE` y repite la prueba. En ese modo Telnyx llama al cliente después de que el asesor presiona `1` y une ambas llamadas.

## API

- `GET /api/health`
- `POST /api/handoff`
- `GET /api/cases`
- `GET /api/cases/:id`
- `PATCH /api/cases/:id`
- `POST /api/cases/:id/resolve`
- `POST /api/cases/:id/simulation`
- `GET /api/cases/export.csv`
- `POST /webhooks/telnyx`

`cases.json` es suficiente para una demo local o un proceso Node persistente. En Vercel/serverless el filesystem no es durable: para producción reemplázalo por PostgreSQL, Supabase o una base equivalente.

## Errores frecuentes

- `401`: API Key inválida.
- `403`: destino Perú no habilitado o cuenta pendiente de verificación.
- `422`: número, Connection o caller ID inválido.
- El caso aparece solo en un navegador: el frontend no está apuntando al backend central.
- No llegan webhooks: revisa `PUBLIC_BASE_URL`, HTTPS, Voice API v2 y la URL configurada en Telnyx.
- Telnyx no permite la llamada: vuelve a `CALL_PROVIDER=simulation`; la demo seguirá funcionando completa.
