const { checkUserMiddleware } = require("../middlewares/check-user.middleware.js");

module.exports = app => {
    const controller = require("../controllers/pokemon.controller.js");
    let router = require("express").Router();

    router.post("/capturar", checkUserMiddleware, controller.capturarPokemon);

    router.get("/", checkUserMiddleware, controller.listarPokemones);

    app.use("/api/pokemon", router);
};
