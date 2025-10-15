const { checkUserMiddleware } = require("../middlewares/check-user.middleware.js");

module.exports = app => {
    const controller = require("../controllers/batalla.controller.js");
    let router = require("express").Router();

    router.post("/batalla", checkUserMiddleware, controller.battlePokemon);

    app.use("/api/pokemon", router);
};
