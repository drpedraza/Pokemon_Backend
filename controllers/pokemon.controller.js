const db = require("../models");
const axios = require("axios");
const { sendError500 } = require("../utils/request.utils");

// Capturar un Pokémon aleatorio
exports.capturarPokemon = async (req, res) => {
    try {
        const randomId = Math.floor(Math.random() * 20) + 1;

        // 2. Llamar a la API de PokeAPI
        const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
        const data = response.data;

        // 3. Extraer datos importantes
        const nombre = data.name;
        const tipo = data.types.map(t => t.type.name).join(", ");
        const hp = data.stats.find(s => s.stat.name === "hp")?.base_stat || 0;
        const ataque = data.stats.find(s => s.stat.name === "attack")?.base_stat || 0;
        const defensa = data.stats.find(s => s.stat.name === "defense")?.base_stat || 0;
        const velocidad = data.stats.find(s => s.stat.name === "speed")?.base_stat || 0;
        const imagen = data.sprites.front_default || "";

        // 4. Guardar el Pokémon en la base de datos del usuario autenticado
        const nuevoPokemon = await db.pokemon.create({
            nombre,
            tipo,
            hp,
            ataque,
            defensa,
            velocidad,
            imagen,
            usuario_id: res.locals.user.id
        });

        res.send({
            message: "¡Has capturado un Pokémon!",
            pokemon: nuevoPokemon
        });
    } catch (error) {
        sendError500(res, error);
    }
};

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
