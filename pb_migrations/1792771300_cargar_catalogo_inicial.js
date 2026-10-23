/// <reference path="../pb_data/types.d.ts" />

// Catálogo inicial: las mismas áreas y sistemas que hoy están fijos en el frontend (src/data/rockAreas.ts).

const CATALOGO = [
    {
        slug: "administrativos",
        titulo: "ADMINISTRATIVOS",
        descripcion: "Finanzas, personas y soporte corporativo",
        icono: "Building2",
        sistemas: [
            ["finanzas", "Finanzas", "Wallet"],
            ["personas", "Personas", "Users"],
            ["compras", "Compras", "ShoppingCart"],
            ["contratos", "Contratos", "FileText"],
            ["soporte", "Soporte", "LifeBuoy"],
            ["archivos", "Archivos", "Folder"],
        ],
    },
    {
        slug: "control",
        titulo: "DE CONTROL",
        descripcion: "Información, análisis y cumplimiento",
        icono: "BarChart3",
        sistemas: [
            ["indicadores", "Indicadores", "BarChart3"],
            ["analisis", "Análisis", "Database"],
            ["auditoria", "Auditoría", "ClipboardCheck"],
            ["calidad", "Calidad", "ShieldCheck"],
            ["riesgos", "Riesgos", "TriangleAlert"],
            ["normativa", "Normativa", "FileText"],
        ],
    },
    {
        slug: "operativos",
        titulo: "OPERATIVOS",
        descripcion: "Gestión de mina, exploración y activos",
        icono: "Mountain",
        sistemas: [
            ["orion", "ORION", "Compass"],
            ["8-spaces", "8-SPACES", "Layers"],
            ["reportes", "Reportes", "Database"],
            ["solicitudes", "Solicitudes", "Send"],
            ["documentos", "Documentos", "Folder"],
            ["paqueteria", "Paquetería", "Package"],
            ["inventario", "Inventario", "Users"],
            ["veta", "VETA", "FileText"],
        ],
    },
]

migrate((app) => {
    const areas = app.findCollectionByNameOrId("areas")
    const sistemas = app.findCollectionByNameOrId("sistemas")

    CATALOGO.forEach((datosArea, indiceArea) => {
        const area = new Record(areas)
        area.set("slug", datosArea.slug)
        area.set("titulo", datosArea.titulo)
        area.set("descripcion", datosArea.descripcion)
        area.set("icono", datosArea.icono)
        area.set("orden", indiceArea + 1)
        area.set("activo", true)
        app.save(area)

        datosArea.sistemas.forEach(([slug, nombre, icono], indiceSistema) => {
            const sistema = new Record(sistemas)
            sistema.set("area", area.id)
            sistema.set("slug", slug)
            sistema.set("nombre", nombre)
            sistema.set("icono", icono)
            sistema.set("orden", indiceSistema + 1)
            sistema.set("activo", true)
            app.save(sistema)
        })
    })
}, (app) => {
    for (const datosArea of CATALOGO) {
        for (const [slug] of datosArea.sistemas) {
            const sistema = app.findFirstRecordByData("sistemas", "slug", slug)
            app.delete(sistema)
        }
        app.delete(app.findFirstRecordByData("areas", "slug", datosArea.slug))
    }
})
