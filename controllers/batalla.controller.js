const axios = require("axios");
const db = require("../models");
const { sendError500 } = require("../utils/request.utils");

// Estado temporal de batallas activas (clave: user.id)
const activeBattles = {};

const typeAdvantages = {
    fire: ["grass", "bug", "ice"],
    water: ["fire", "rock", "ground"],
    grass: ["water", "rock", "ground"],
    electric: ["water", "flying"],
    ground: ["electric", "fire", "rock"],
    rock: ["fire", "ice", "flying"],
    fighting: ["rock", "ice", "dark"],
    psychic: ["fighting", "poison"],
    ice: ["grass", "ground", "flying"],
    bug: ["grass", "psychic"],
    dark: ["psychic", "ghost"],
    ghost: ["psychic", "ghost"],
    normal: [],
};

function calcularMultiplicador(atacante, defensor) {
    if (typeAdvantages[atacante]?.includes(defensor)) return 1.5;
    return 1;
}

exports.iniciarBatalla = async (req, res) => {
    try {
        const user = res.locals.user;
        const { pokemon_id } = req.body;

        if (!pokemon_id) {
            return res.status(400).send({ message: "Debes enviar el ID del Pokémon del jugador" });
        }

        const pokemonJugador = await db.pokemon.findOne({
            where: { id: pokemon_id, usuario_id: user.id },
        });

        if (!pokemonJugador) {
            return res.status(404).send({ message: "Pokémon no encontrado o no pertenece al usuario" });
        }

        const randomId = Math.floor(Math.random() * 100) + 1;
        const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
        const wildData = response.data;

        const pokemonSalvaje = {
            nombre: wildData.name,
            tipo: wildData.types.map(t => t.type.name).join(", "),
            hp: wildData.stats.find(s => s.stat.name === "hp")?.base_stat * 5,
            ataque: wildData.stats.find(s => s.stat.name === "attack")?.base_stat || 0,
            defensa: wildData.stats.find(s => s.stat.name === "defense")?.base_stat || 0,
            velocidad: wildData.stats.find(s => s.stat.name === "speed")?.base_stat || 0,
            imagen: wildData.sprites.front_default || "",
        };

        const jugador = {
            nombre: pokemonJugador.nombre,
            tipo: pokemonJugador.tipo.split(",")[0],
            hp: pokemonJugador.hp * 5,
            ataque: pokemonJugador.ataque,
            defensa: pokemonJugador.defensa,
            velocidad: pokemonJugador.velocidad,
            curas: 2,
        };

        activeBattles[user.id] = {
            turno: 1,
            jugador,
            pokemonSalvaje,
            log: [`¡Comienza la batalla contra un ${pokemonSalvaje.nombre}!`],
        };

        res.send({
            message: "Batalla iniciada",
            estado: activeBattles[user.id],
        });
    } catch (error) {
        sendError500(res, error);
    }
};

exports.realizarAccion = async (req, res) => {
    try {
        const user = res.locals.user;
        const { accion } = req.body; // atacar, defender, curar, huir

        const batalla = activeBattles[user.id];
        if (!batalla) {
            return res.status(400).send({ message: "No hay una batalla activa" });
        }

        const { jugador, pokemonSalvaje, log } = batalla;
        log.push(`--- Turno ${batalla.turno} ---`);

        // Huir
        if (accion === "huir") {
            delete activeBattles[user.id];
            return res.send({ message: "Has huido de la batalla.", log });
        }

        // Curar
        if (accion === "curar") {
            if (jugador.curas > 0) {
                const cura = jugador.hp * 0.3;
                jugador.hp += cura;
                jugador.curas--;
                log.push(`${jugador.nombre} se cura (+${cura.toFixed(1)} HP). Restantes: ${jugador.curas}`);
            } else {
                log.push(`${jugador.nombre} no tiene curas disponibles.`);
            }
        }

        // Atacar
        if (accion === "atacar") {
            const multJugador = calcularMultiplicador(jugador.tipo, pokemonSalvaje.tipo.split(",")[0]);
            const dañoJugador = Math.max(5, (jugador.ataque - pokemonSalvaje.defensa / 2) * multJugador);
            pokemonSalvaje.hp -= dañoJugador;
            if (pokemonSalvaje.hp < 0) pokemonSalvaje.hp = 0;
            log.push(`${jugador.nombre} ataca e inflige ${dañoJugador.toFixed(1)} de daño.`);
        }

        // Defender
        let defensaExtra = 1;
        if (accion === "defender") {
            defensaExtra = 0.5;
            log.push(`${jugador.nombre} se prepara para defenderse.`);
        }

        // Ataque del salvaje
        if (pokemonSalvaje.hp > 0) {
            const multSalvaje = calcularMultiplicador(pokemonSalvaje.tipo.split(",")[0], jugador.tipo);
            const dañoSalvaje = Math.max(5, (pokemonSalvaje.ataque - jugador.defensa / 2) * multSalvaje * defensaExtra);
            jugador.hp -= dañoSalvaje;
            if (jugador.hp < 0) jugador.hp = 0;
            log.push(`${pokemonSalvaje.nombre} contraataca e inflige ${dañoSalvaje.toFixed(1)} de daño.`);
        }

        // Resultado
        let resultado = null;

        if (jugador.hp <= 0 && pokemonSalvaje.hp <= 0) {
            resultado = "Empate: ambos Pokémon quedaron fuera de combate.";
            delete activeBattles[user.id];
        } else if (pokemonSalvaje.hp <= 0) {
            // Contar cuántos Pokémon tiene el usuario
            const cantidadPokemon = await db.pokemon.count({
                where: { usuario_id: user.id }
            });

            if (cantidadPokemon >= 10) {
                resultado = `¡Ganaste! Pero ya tienes ${cantidadPokemon} o más Pokémon, no puedes capturar más.`;
            } else {
                resultado = "¡Ganaste! Has capturado al Pokémon salvaje.";
                // Guardar el Pokémon capturado
                await db.pokemon.create({
                    nombre: pokemonSalvaje.nombre,
                    tipo: pokemonSalvaje.tipo,
                    hp: pokemonSalvaje.hp || 1, // mínimo 1
                    ataque: pokemonSalvaje.ataque,
                    defensa: pokemonSalvaje.defensa,
                    velocidad: pokemonSalvaje.velocidad,
                    imagen: pokemonSalvaje.imagen,
                    usuario_id: user.id,
                });
            }
            delete activeBattles[user.id];
        } else if (jugador.hp <= 0) {
            resultado = "Perdiste. El Pokémon salvaje escapó.";
            delete activeBattles[user.id];
        }

        batalla.turno++;

        res.send({
            resultado,
            estado: batalla,
        });

    } catch (error) {
        sendError500(res, error);
    }
};
