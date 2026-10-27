/// <reference path="../pb_data/types.d.ts" />

// Cada sistema puede tener una foto, que el portal muestra en su vista previa.
// Es opcional: los sistemas sin foto siguen mostrando la imagen por defecto del portal.
// La miniatura 800x450 es la que pide el catálogo (ver pb_hooks/catalogo.pb.js).

migrate((app) => {
    const sistemas = app.findCollectionByNameOrId("sistemas")
    sistemas.fields.add(new FileField({
        name: "imagen",
        maxSelect: 1,
        maxSize: 5242880,
        mimeTypes: ["image/jpeg", "image/png", "image/webp"],
        thumbs: ["800x450"],
    }))
    app.save(sistemas)
}, (app) => {
    // Al revertir se pierden el campo y las fotos que se hayan subido.
    const sistemas = app.findCollectionByNameOrId("sistemas")
    sistemas.fields.removeByName("imagen")
    app.save(sistemas)
})
