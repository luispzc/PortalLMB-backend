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

Queda en http://localhost:8090 y usa la misma carpeta `pb_data/` que el modo local. Si el `.env` define `PB_SUPERUSER_EMAIL` y `PB_SUPERUSER_PASSWORD`, el contenedor crea ese superusuario al arrancar.

## Despliegue en Railway

El repositorio ya trae todo lo necesario: `Dockerfile`, `docker-entrypoint.sh` y `railway.json` (healthcheck en `/api/health` y reinicio automático si falla).

1. **Crear el servicio.** En Railway: *New Project → Deploy from GitHub repo →* `PortalLMB-backend`.
2. **Agregar un volumen.** En el servicio: *Settings → Volumes → Add Volume* con *Mount path* `/pb/pb_data`. **Sin volumen, la base de datos se borra en cada deploy.**
3. **Variables** (*Variables*):

   | Variable | Valor |
   | --- | --- |
   | `PB_SUPERUSER_EMAIL` | Correo del superusuario del panel `/_/` |
   | `PB_SUPERUSER_PASSWORD` | Contraseña larga y única (mínimo 10 caracteres) |

   El entrypoint hace `superuser upsert` en cada arranque, así que **la contraseña del superusuario es siempre la de la variable**: si la cambias en el panel, el próximo deploy la vuelve a dejar igual a la variable. Para cambiarla, cambia la variable.

   `PORT` la pone Railway sola; no hace falta definirla.
4. **Dominio público.** *Settings → Networking → Generate Domain*. Anota la URL (por ejemplo `https://portallmb-backend-production.up.railway.app`): el frontend la necesita.
5. **Deploy.** En el primer arranque las migraciones crean las colecciones y el catálogo de áreas y sistemas.
6. **Primer admin del portal.** Entra a `https://TU-DOMINIO/_/` con el superusuario, abre la colección `users` y crea un usuario con `rol` = `admin` y `verified` activado. Desde ahí, ese admin crea al resto en el panel de administración del portal.
7. **(Opcional)** En el panel `/_/`, *Settings → Application*: pon el nombre y la URL pública de la aplicación.

Las cuentas de prueba de tu `pb_data/` local **no** se suben: la base de producción parte vacía, solo con el catálogo.

Para respaldos, descarga la base desde el panel (*Settings → Backups*) o programa respaldos automáticos ahí mismo.

## Colecciones

| Colección | Para qué sirve |
| --- | --- |
| `users` | Usuarios del portal. Además de `name` y `avatar`, tienen `cargo` y `rol` (`admin` o `colaborador`). No hay registro público: solo un admin crea cuentas. |
| `areas` | Las rocas del portal (Administrativos, De Control, Operativos). |
| `sistemas` | Los módulos de cada área. El campo `url` es a dónde lleva "Acceder al sistema". |
| `accesos` | Un registro cada vez que un usuario entra a un sistema. |
| `accesos_por_sistema` | Vista (solo admins) con el total de accesos, usuarios distintos y último acceso por sistema. |

### Permisos

- **Colaborador**: ve el catálogo, registra sus propios accesos y edita su perfil (no su rol).
- **Admin**: además crea y edita usuarios (incluido su correo, rol y contraseña), administra el catálogo y ve el reporte de uso. Esto lo hace desde el panel de administración del portal.
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
- `catalogo.pb.js`: el endpoint `/api/portal/catalogo`.

## Uso desde el frontend

```ts
import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')
await pb.collection('users').authWithPassword(correo, clave)

const { areas } = await pb.send('/api/portal/catalogo', {})

// Al presionar "Acceder al sistema"
await pb.collection('accesos').create({ usuario: pb.authStore.record.id, sistema: sistemaId })

// Panel de administración (solo admins): crear un usuario y reiniciar su contraseña
const usuario = await pb.collection('users').create({
  email: 'nombre@lambol.cl',
  name: 'Nombre Apellido',
  cargo: 'Gestión Operativa',
  rol: 'colaborador',
  password: claveTemporal,
  passwordConfirm: claveTemporal,
  verified: true,
})
await pb.collection('users').update(usuario.id, { password: nuevaClave, passwordConfirm: nuevaClave })
```

Al cambiar la contraseña, PocketBase cierra las sesiones abiertas de ese usuario.
