/// <reference path="../pb_data/types.d.ts" />

// Catálogo del portal en una sola llamada: áreas activas con sus sistemas activos, ya ordenados.
// Es lo que el frontend necesita para dibujar las rocas y el menú de cada área. Es público.
routerAdd("GET", "/api/portal/catalogo", (e) => {
    const areas = e.app.findRecordsByFilter("areas", "activo = true", "orden", 0, 0)
    const sistemas = e.app.findRecordsByFilter("sistemas", "activo = true", "orden", 0, 0)

    const resultado = areas.map((area) => ({
        id: area.id,
        slug: area.getString("slug"),
        titulo: area.getString("titulo"),
        descripcion: area.getString("descripcion"),
        icono: area.getString("icono"),
        sistemas: sistemas
            .filter((sistema) => sistema.getString("area") === area.id)
            .map((sistema) => ({
                id: sistema.id,
                slug: sistema.getString("slug"),
                nombre: sistema.getString("nombre"),
                descripcion: sistema.getString("descripcion"),
                icono: sistema.getString("icono"),
                url: sistema.getString("url"),
            })),
    }))

    return e.json(200, { areas: resultado })
})
