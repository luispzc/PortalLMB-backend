/// <reference path="../pb_data/types.d.ts" />

// Se retira el Help Desk del portal: se eliminan los tickets y las notificaciones,
// que solo se generaban a partir de los tickets.

const SOLO_ADMIN = '@request.auth.rol = "admin"'
const AUTENTICADO = '@request.auth.id != ""'

const fechas = () => [
    { type: "autodate", name: "created", onCreate: true, onUpdate: false },
    { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
]

migrate((app) => {
    app.delete(app.findCollectionByNameOrId("notificaciones"))
    app.delete(app.findCollectionByNameOrId("tickets"))
}, (app) => {
    // Vuelve a crear ambas colecciones (vacías) con la misma definición que tenían.
    const users = app.findCollectionByNameOrId("users")
    const sistemas = app.findCollectionByNameOrId("sistemas")

    app.save(new Collection({
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
    }))

    app.save(new Collection({
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
    }))
})
