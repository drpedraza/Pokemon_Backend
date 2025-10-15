const db = require("../models");
const { sendError500 } = require("../utils/request.utils");

// Listar los Pokémon capturados del usuario autenticado
exports.listarPokemones = async (req, res) => {
    try {
        const pokemones = await db.pokemon.findAll({
            where: { usuario_id: res.locals.user.id }
        });
        res.send(pokemones);
    } catch (error) {
        sendError500(res, error);
    }
};
