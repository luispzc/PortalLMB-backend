# PortalLMB-backend

Backend del Portal Lambol (Sitio Web de Centralización de Sistemas), hecho con [PocketBase](https://pocketbase.io) 0.30.0.

## Levantar en local (Windows)

```powershell
# 1. Descargar pocketbase.exe (solo la primera vez)
powershell -ExecutionPolicy Bypass -File scripts\instalar-pocketbase.ps1

# 2. Crear la cuenta de superusuario (panel de administración)
.\pocketbase.exe superuser upsert tu-correo@lambol.cl TU_CLAVE

# 3. Iniciar el servidor
.\pocketbase.exe serve
```

- API: http://127.0.0.1:8090/api/
- Panel de administración: http://127.0.0.1:8090/_/

Al iniciar, PocketBase aplica las migraciones de `pb_migrations/`: crea las colecciones y carga el catálogo de áreas y sistemas.

## Con Docker

```bash
docker compose up --build
```

Queda en http://localhost:8090. El `Dockerfile` escucha en el puerto 8080, que es el que espera Railway.

## Colecciones

| Colección | Para qué sirve |
| --- | --- |
| `users` | Usuarios del portal. Además de `name` y `avatar`, tienen `cargo` y `rol` (`admin` o `colaborador`). No hay registro público: solo un admin crea cuentas. |
| `areas` | Las rocas del portal (Administrativos, De Control, Operativos). |
| `sistemas` | Los módulos de cada área. El campo `url` es a dónde lleva "Acceder al sistema". |
| `accesos` | Un registro cada vez que un usuario entra a un sistema. |
| `tickets` | Help Desk. El número (`HD-000001`) y el estado inicial (`abierto`) los pone el backend. |
| `notificaciones` | La campana. El usuario solo puede marcarlas como leídas. |
| `accesos_por_sistema` | Vista (solo admins) con el total de accesos, usuarios distintos y último acceso por sistema. |

### Permisos

- **Colaborador**: ve el catálogo, registra sus propios accesos, crea y ve sus tickets, lee y marca sus notificaciones, edita su perfil (no su rol).
- **Admin**: además administra usuarios, catálogo y tickets, y ve el reporte de uso.
- **Superusuario**: acceso total desde el panel `/_/`.

## Endpoints propios

`GET /api/portal/catalogo` (requiere sesión): áreas activas con sus sistemas activos, ya ordenados.

```json
{
  "areas": [
    {
      "id": "...", "slug": "control", "titulo": "DE CONTROL",
      "descripcion": "Información, análisis y cumplimiento", "icono": "BarChart3",
      "sistemas": [
        { "id": "...", "slug": "indicadores", "nombre": "Indicadores", "descripcion": "", "icono": "BarChart3", "url": "" }
      ]
    }
  ]
}
```

`icono` es el nombre del ícono de `lucide-react` que usa el frontend.

## Automatizaciones (`pb_hooks/`)

- `usuarios.pb.js`: un usuario nuevo sin rol queda como `colaborador`.
- `tickets.pb.js`: numera los tickets y, cuando un admin cambia el estado, crea una notificación para el dueño del ticket.
- `catalogo.pb.js`: el endpoint `/api/portal/catalogo`.

## Uso desde el frontend

```ts
import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')
await pb.collection('users').authWithPassword(correo, clave)

const { areas } = await pb.send('/api/portal/catalogo', {})

// Al presionar "Acceder al sistema"
await pb.collection('accesos').create({ usuario: pb.authStore.record.id, sistema: sistemaId })

// Ticket desde el Help Desk
await pb.collection('tickets').create({
  usuario: pb.authStore.record.id,
  sistema: sistemaId,
  asunto: 'No carga el tablero',
  descripcion: '...',
  prioridad: 'alta',
})
```
