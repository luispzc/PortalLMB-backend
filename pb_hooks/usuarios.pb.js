/// <reference path="../pb_data/types.d.ts" />

// Todo usuario nuevo queda como "colaborador" (sin acceso) si quien lo crea no le asigna un rol.
onRecordCreate((e) => {
    if (!e.record.getString("rol")) {
        e.record.set("rol", "colaborador")
    }
    e.next()
}, "users")

// El portal es público: iniciar sesión solo sirve para administrar, así que solo entran los admins.
// Cubre el login con contraseña y la renovación de sesión, de modo que quitarle el rol a alguien
// también le cierra el acceso en su próxima renovación.
onRecordAuthRequest((e) => {
    if (e.record.getString("rol") !== "admin") {
        throw new ForbiddenError("Esta cuenta no tiene acceso de administrador.")
    }
    e.next()
}, "users")
