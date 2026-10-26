/// <reference path="../pb_data/types.d.ts" />

// Contenido demostrativo temporal para la vitrina pública del portal. Se mantiene
// fuera de la base de datos hasta que se definan los campos y el flujo editorial.
const DESARROLLOS_DEMO = [
    { id: "sistema-comercial", titulo: "Sistema Comercial", categoria: "Gestión comercial", descripcion: "Seguimiento de facturas, gastos, reportes y operaciones comerciales.", imagen: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80", url: "https://example.com/desarrollos/sistema-comercial" },
    { id: "mapa-operativo", titulo: "Mapa Operativo", categoria: "Operaciones", descripcion: "Planificación territorial, rutas y consulta de puntos de operación.", imagen: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80", url: "https://example.com/desarrollos/mapa-operativo" },
    { id: "inventario-lmbl", titulo: "Inventario LMBL", categoria: "Activos", descripcion: "Control de asignación, devoluciones y disponibilidad de equipos.", imagen: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80", url: "https://example.com/desarrollos/inventario-lmbl" },
    { id: "veta-ambiental", titulo: "VETA Ambiental", categoria: "Medio ambiente", descripcion: "Gestión de proyectos ambientales y control de compromisos.", imagen: "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=1200&q=80", url: "https://example.com/desarrollos/veta-ambiental" },
    { id: "centro-documental", titulo: "Centro Documental", categoria: "Documentación", descripcion: "Acceso organizado a documentación corporativa y operacional.", imagen: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=1200&q=80", url: "https://example.com/desarrollos/centro-documental" },
    { id: "tablero-gerencial", titulo: "Tablero Gerencial", categoria: "Analítica", descripcion: "Indicadores consolidados para apoyar decisiones de gestión.", imagen: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80", url: "https://example.com/desarrollos/tablero-gerencial" },
]

// Catálogo del portal en una sola llamada: áreas activas con sus sistemas activos, ya ordenados.
// Es lo que el frontend necesita para dibujar las rocas y el menú de cada área.
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

routerAdd("GET", "/api/portal/desarrollos", (e) => {
    return e.json(200, { desarrollos: DESARROLLOS_DEMO })
})
