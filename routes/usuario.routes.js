const { checkUserMiddleware } = require("../middlewares/check-user.middleware.js");
module.exports = app => {
    const controller = require("../controllers/usuario.controller.js");
    let router = require("express").Router();

    router.get("/",checkUserMiddleware, controller.listUsuario);
    router.get("/:id", checkUserMiddleware, controller.getUsuario);


    app.use('/api/usuario', router);

}