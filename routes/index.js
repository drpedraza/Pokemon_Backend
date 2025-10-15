module.exports = app => {
    // rutas de acceso
    require("./auth.routes")(app);
    require("./usuario.routes")(app);
    require("./pokemon.routes")(app);
}