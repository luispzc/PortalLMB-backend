/// <reference path="../pb_data/types.d.ts" />

// Colecciones del Portal Lambol: catálogo de áreas y sistemas, registro de accesos,
// tickets de Help Desk y notificaciones. Además agrega cargo y rol a los usuarios.

const SOLO_ADMIN = '@request.auth.rol = "admin"'
const AUTENTICADO = '@request.auth.id != ""'

const fechas = () => [
    { type: "autodate", name: "created", onCreate: true, onUpdate: false },
    { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
]

migrate((app) => {
    // Usuarios: el portal es corporativo, así que solo un admin crea cuentas (sin registro público).
    const users = app.findCollectionByNameOrId("users")
    users.fields.add(new TextField({ name: "cargo", max: 120 }))
    users.fields.add(new SelectField({ name: "rol", values: ["admin", "colaborador"], maxSelect: 1 }))
    users.listRule = `id = @request.auth.id || ${SOLO_ADMIN}`
    users.viewRule = `id = @request.auth.id || ${SOLO_ADMIN}`
    users.createRule = SOLO_ADMIN
    users.updateRule = `(id = @request.auth.id && @request.body.rol:isset = false) || ${SOLO_ADMIN}`
    users.deleteRule = SOLO_ADMIN
    users.manageRule = SOLO_ADMIN
    app.save(users)

    const areas = new Collection({
        type: "base",
        name: "areas",
        listRule: AUTENTICADO,
        viewRule: AUTENTICADO,
        createRule: SOLO_ADMIN,
        updateRule: SOLO_ADMIN,
        deleteRule: SOLO_ADMIN,
        fields: [
            { type: "text", name: "slug", required: true, max: 60, pattern: "^[a-z0-9-]+$" },
            { type: "text", name: "titulo", required: true, max: 80 },
            { type: "text", name: "descripcion", max: 255 },
            // Nombre del ícono de lucide-react (ej. "Building2").
            { type: "text", name: "icono", max: 60 },
            { type: "number", name: "orden", onlyInt: true },
            { type: "bool", name: "activo" },
            ...fechas(),
        ],
        indexes: ["CREATE UNIQUE INDEX idx_areas_slug ON areas (slug)"],
    })
    app.save(areas)

    const sistemas = new Collection({
        type: "base",
        name: "sistemas",
        listRule: AUTENTICADO,
        viewRule: AUTENTICADO,
        createRule: SOLO_ADMIN,
        updateRule: SOLO_ADMIN,
        deleteRule: SOLO_ADMIN,
        fields: [
            { type: "relation", name: "area", collectionId: areas.id, maxSelect: 1, required: true, cascadeDelete: false },
            { type: "text", name: "slug", required: true, max: 60, pattern: "^[a-z0-9-]+$" },
            { type: "text", name: "nombre", required: true, max: 80 },
            { type: "text", name: "descripcion", max: 255 },
            { type: "text", name: "icono", max: 60 },
            // Dirección a la que lleva "Acceder al sistema". Vacía mientras el sistema no esté publicado.
            { type: "url", name: "url" },
            { type: "number", name: "orden", onlyInt: true },
            { type: "bool", name: "activo" },
            ...fechas(),
        ],
        indexes: ["CREATE UNIQUE INDEX idx_sistemas_slug ON sistemas (slug)"],
    })
    app.save(sistemas)

    // Un registro por cada vez que un usuario entra a un sistema desde el portal.
    const accesos = new Collection({
        type: "base",
        name: "accesos",
        listRule: `usuario = @request.auth.id || ${SOLO_ADMIN}`,
        viewRule: `usuario = @request.auth.id || ${SOLO_ADMIN}`,
        createRule: `${AUTENTICADO} && usuario = @request.auth.id`,
        updateRule: null,
        deleteRule: SOLO_ADMIN,
        fields: [
            { type: "relation", name: "usuario", collectionId: users.id, maxSelect: 1, required: true, cascadeDelete: true },
            { type: "relation", name: "sistema", collectionId: sistemas.id, maxSelect: 1, required: true, cascadeDelete: true },
            ...fechas(),
        ],
        indexes: ["CREATE INDEX idx_accesos_usuario ON accesos (usuario, created)"],
    })
    app.save(accesos)

    // Help Desk. El número, el estado inicial y la respuesta los maneja el backend / un admin.
    const tickets = new Collection({
        type: "base",
        name: "tickets",
        listRule: `usuario = @request.auth.id || ${SOLO_ADMIN}`,
        viewRule: `usuario = @request.auth.id || ${SOLO_ADMIN}`,
        createRule: `${AUTENTICADO} && usuario = @request.auth.id && @request.body.numero:isset = false && @request.body.estado:isset = false && @request.body.respuesta:isset = false`,
        updateRule: SOLO_ADMIN,
        deleteRule: SOLO_ADMIN,
        fields: [
            { type: "text", name: "numero", max: 20 },
            { type: "relation", name: "usuario", collectionId: users.id, maxSelect: 1, required: true, cascadeDelete: false },
            { type: "relation", name: "sistema", collectionId: sistemas.id, maxSelect: 1, cascadeDelete: false },
            { type: "text", name: "asunto", required: true, max: 150 },
            { type: "text", name: "descripcion", required: true, max: 5000 },
            { type: "select", name: "prioridad", values: ["baja", "media", "alta", "critica"], maxSelect: 1, required: true },
            { type: "select", name: "estado", values: ["abierto", "en_progreso", "resuelto", "cerrado"], maxSelect: 1 },
            { type: "file", name: "adjuntos", maxSelect: 5, maxSize: 10485760 },
            { type: "text", name: "respuesta", max: 5000 },
            ...fechas(),
        ],
        indexes: ["CREATE UNIQUE INDEX idx_tickets_numero ON tickets (numero) WHERE numero != ''"],
    })
    app.save(tickets)

    // Notificaciones de la campana. El usuario solo puede marcarlas como leídas.
    const notificaciones = new Collection({
        type: "base",
        name: "notificaciones",
        listRule: `usuario = @request.auth.id || ${SOLO_ADMIN}`,
        viewRule: `usuario = @request.auth.id || ${SOLO_ADMIN}`,
        createRule: SOLO_ADMIN,
        updateRule: `(usuario = @request.auth.id && @request.body.usuario:isset = false && @request.body.titulo:isset = false && @request.body.mensaje:isset = false && @request.body.enlace:isset = false) || ${SOLO_ADMIN}`,
        deleteRule: `usuario = @request.auth.id || ${SOLO_ADMIN}`,
        fields: [
            { type: "relation", name: "usuario", collectionId: users.id, maxSelect: 1, required: true, cascadeDelete: true },
            { type: "text", name: "titulo", required: true, max: 150 },
            { type: "text", name: "mensaje", max: 1000 },
            { type: "text", name: "enlace", max: 255 },
            { type: "bool", name: "leida" },
            ...fechas(),
        ],
        indexes: ["CREATE INDEX idx_notificaciones_usuario ON notificaciones (usuario, leida)"],
    })
    app.save(notificaciones)

    // Reporte de uso para admins: cuántas veces se ha entrado a cada sistema.
    const accesosPorSistema = new Collection({
        type: "view",
        name: "accesos_por_sistema",
        listRule: SOLO_ADMIN,
        viewRule: SOLO_ADMIN,
        viewQuery: `
            SELECT s.id, s.nombre AS sistema, a.titulo AS area,
                   COUNT(ac.id) AS total_accesos,
                   COUNT(DISTINCT ac.usuario) AS usuarios_distintos,
                   MAX(ac.created) AS ultimo_acceso
            FROM sistemas s
            JOIN areas a ON a.id = s.area
            LEFT JOIN accesos ac ON ac.sistema = s.id
            GROUP BY s.id
        `,
    })
    app.save(accesosPorSistema)

    const settings = app.settings()
    settings.meta.appName = "Portal Lambol"
    app.save(settings)
}, (app) => {
    for (const nombre of ["accesos_por_sistema", "notificaciones", "tickets", "accesos", "sistemas", "areas"]) {
        app.delete(app.findCollectionByNameOrId(nombre))
    }

    const users = app.findCollectionByNameOrId("users")
    users.fields.removeByName("cargo")
    users.fields.removeByName("rol")
    users.listRule = "id = @request.auth.id"
    users.viewRule = "id = @request.auth.id"
    users.createRule = ""
    users.updateRule = "id = @request.auth.id"
    users.deleteRule = "id = @request.auth.id"
    users.manageRule = null
    app.save(users)
})
