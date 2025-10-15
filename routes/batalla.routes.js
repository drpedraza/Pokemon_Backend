const { checkUserMiddleware } = require("../middlewares/check-user.middleware.js");

module.exports = app => {
    const controller = require("../controllers/batalla.controller.js");
    const router = require("express").Router();

    router.post("/batalla/iniciar", checkUserMiddleware, controller.iniciarBatalla);
    router.post("/batalla/accion", checkUserMiddleware, controller.realizarAccion);

    app.use("/api/pokemon", router);
};
