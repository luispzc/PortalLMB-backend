/// <reference path="../pb_data/types.d.ts" />

// Todo usuario nuevo queda como "colaborador" si quien lo crea no le asigna un rol.
onRecordCreate((e) => {
    if (!e.record.getString("rol")) {
        e.record.set("rol", "colaborador")
    }
    e.next()
}, "users")
