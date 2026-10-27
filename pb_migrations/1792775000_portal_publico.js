/// <reference path="../pb_data/types.d.ts" />

// El portal pasa a ser público: cualquiera ve el catálogo y entra a los sistemas sin iniciar sesión.
// Solo los administradores inician sesión (ver pb_hooks/usuarios.pb.js).
// Los accesos de visitantes se registran sin usuario, y solo un admin puede leer el registro.

const SOLO_ADMIN = '@request.auth.rol = "admin"'
const AUTENTICADO = '@request.auth.id != ""'

const reporteSql = (usuariosDistintos) => `
    SELECT s.id, s.nombre AS sistema, a.titulo AS area,
           COUNT(ac.id) AS total_accesos,
           ${usuariosDistintos} AS usuarios_distintos,
           MAX(ac.created) AS ultimo_acceso
    FROM sistemas s
    JOIN areas a ON a.id = s.area
    LEFT JOIN accesos ac ON ac.sistema = s.id
    GROUP BY s.id
`

migrate((app) => {
    for (const nombre of ["areas", "sistemas"]) {
        const coleccion = app.findCollectionByNameOrId(nombre)
        coleccion.listRule = ""
        coleccion.viewRule = ""
        app.save(coleccion)
    }

    const accesos = app.findCollectionByNameOrId("accesos")
    accesos.fields.getByName("usuario").required = false
    // Un visitante registra accesos sin usuario; un admin con sesión, a su propio nombre.
    accesos.createRule = '(@request.auth.id = "" && usuario = "") || (@request.auth.id != "" && usuario = @request.auth.id)'
    accesos.listRule = SOLO_ADMIN
    accesos.viewRule = SOLO_ADMIN
    app.save(accesos)

    // Los accesos anónimos no cuentan como un usuario distinto.
    const reporte = app.findCollectionByNameOrId("accesos_por_sistema")
    reporte.viewQuery = reporteSql("COUNT(DISTINCT NULLIF(ac.usuario, ''))")
    app.save(reporte)
}, (app) => {
    for (const nombre of ["areas", "sistemas"]) {
        const coleccion = app.findCollectionByNameOrId(nombre)
        coleccion.listRule = AUTENTICADO
        coleccion.viewRule = AUTENTICADO
        app.save(coleccion)
    }

    // Los accesos anónimos no tienen dueño y no caben en el esquema anterior.
    app.db().newQuery("DELETE FROM accesos WHERE usuario = ''").execute()

    const accesos = app.findCollectionByNameOrId("accesos")
    accesos.fields.getByName("usuario").required = true
    accesos.createRule = `${AUTENTICADO} && usuario = @request.auth.id`
    accesos.listRule = `usuario = @request.auth.id || ${SOLO_ADMIN}`
    accesos.viewRule = `usuario = @request.auth.id || ${SOLO_ADMIN}`
    app.save(accesos)

    const reporte = app.findCollectionByNameOrId("accesos_por_sistema")
    reporte.viewQuery = reporteSql("COUNT(DISTINCT ac.usuario)")
    app.save(reporte)
})
