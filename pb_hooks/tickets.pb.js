/// <reference path="../pb_data/types.d.ts" />

// Ticket nuevo: se numera correlativamente (HD-000001, HD-000002, ...) y parte "abierto".
onRecordCreate((e) => {
    let siguiente = 1
    const ultimos = e.app.findRecordsByFilter("tickets", "numero != ''", "-numero", 1, 0)
    if (ultimos.length > 0) {
        siguiente = parseInt(ultimos[0].getString("numero").replace("HD-", ""), 10) + 1
    }
    e.record.set("numero", "HD-" + String(siguiente).padStart(6, "0"))
    e.record.set("estado", "abierto")
    e.next()
}, "tickets")

// Cuando un admin cambia el estado de un ticket, el dueño recibe una notificación en la campana.
onRecordUpdate((e) => {
    const estadoAnterior = e.record.original().getString("estado")
    const estadoNuevo = e.record.getString("estado")

    e.next()

    if (estadoAnterior === estadoNuevo) return

    const etiquetas = {
        abierto: "abierto",
        en_progreso: "en progreso",
        resuelto: "resuelto",
        cerrado: "cerrado",
    }
    const notificacion = new Record(e.app.findCollectionByNameOrId("notificaciones"))
    notificacion.set("usuario", e.record.getString("usuario"))
    notificacion.set("titulo", `Ticket ${e.record.getString("numero")} ${etiquetas[estadoNuevo] || estadoNuevo}`)
    notificacion.set("mensaje", e.record.getString("asunto"))
    notificacion.set("enlace", `/helpdesk/${e.record.id}`)
    notificacion.set("leida", false)
    e.app.save(notificacion)
}, "tickets")
