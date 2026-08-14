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

## Activar Telnyx de forma segura

1. Crea una cuenta Telnyx y genera una API Key.
2. En **Voice → Programmable Voice**, crea una Voice API Application / Call Control Connection.
3. Copia el `TELNYX_CONNECTION_ID`.
4. Compra o configura un número legítimo como `TELNYX_FROM_NUMBER`. No suplantes un número de Movistar.
5. En el Outbound Voice Profile habilita Perú si la cuenta y el destino lo permiten. Algunas cuentas requieren verificación adicional.
6. Define límites de gasto bajos para la demo.
7. Usa solo dos celulares controlados por el equipo en `ADVISOR_PHONE` y `DEMO_CLIENT_PHONE`.
8. Publica el backend por HTTPS y configura `PUBLIC_BASE_URL`.
9. En Telnyx configura el webhook `https://TU-BACKEND/webhooks/telnyx` con Voice API v2.
10. Agrega `TELNYX_PUBLIC_KEY` para validar la firma y cambia `CALL_PROVIDER=telnyx`.

El SDK usado es `telnyx@7`. Las llamadas se realizan con `client.calls.dial`; las acciones actuales usan `client.calls.actions.gatherUsingSpeak` y `client.calls.actions.bridge`.

## Ngrok para una prueba local

```powershell
ngrok http 4000
```

Coloca la URL obtenida en `PUBLIC_BASE_URL` y en el webhook de Telnyx. Si ngrok cambia la URL, actualiza ambos valores y reinicia el backend.

## Recorrido de la llamada real

1. `POST /api/handoff` crea el caso y llama al asesor.
2. Al contestar, el asesor escucha un resumen privado de 30–45 segundos.
3. El asesor presiona `1`.
4. El backend llama al celular del cliente de prueba.
5. Cuando contesta, Telnyx une ambos legs.
6. Al colgar, el caso queda `CALL_COMPLETED`; el asesor decide cuándo marcarlo `resolved`.

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
