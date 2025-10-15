const db = require("../models");
const { sendError500 } = require("../utils/request.utils");
 
exports.listUsuario = async (req, res) => {
    try {
        const usuario = await db.usuario.findAll();
        res.send(usuario);
    } catch (error) {
        sendError500(res, error);
    }
}
exports.getUsuario = async (req, res) => {
    const id = req.params.id;
    try {
        const usuario = await db.usuario.findByPk(id);
        if (!usuario) {
            res.status(404).send({ message: "Usuario no encontrado" });
            return;
        }
        res.send(usuario);
    } catch (error) {
        sendError500(res, error);
    }
}
