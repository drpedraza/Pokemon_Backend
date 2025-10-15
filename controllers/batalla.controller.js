const axios = require("axios");
const db = require("../models");
const { sendError500 } = require("../utils/request.utils");

// multiplicadores de daño según tipo (simplificado)
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

exports.battlePokemon = async (req, res) => {
    try {
        const user = res.locals.user;
        const { pokemon_id } = req.body;

        if (!pokemon_id) {
            return res.status(400).send({ message: "Debes enviar el ID del Pokémon del jugador" });
        }

        // Obtener el Pokémon del jugador
        const pokemonJugador = await db.pokemon.findOne({
            where: { id: pokemon_id, usuario_id: user.id },
        });

        if (!pokemonJugador) {
            return res.status(404).send({ message: "Pokémon no encontrado o no pertenece al usuario" });
        }

        // Generar un Pokémon salvaje aleatorio
        const randomId = Math.floor(Math.random() * 100) + 1; // entre 1 y 100
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

        // Preparar datos del jugador
        const jugador = {
            nombre: pokemonJugador.nombre,
            tipo: pokemonJugador.tipo.split(",")[0],
            hp: pokemonJugador.hp * 5,
            ataque: pokemonJugador.ataque,
            defensa: pokemonJugador.defensa,
            velocidad: pokemonJugador.velocidad,
            curas: 2,
        };

        // Simulación de batalla
        let turno = 1;
        const log = [];

        while (jugador.hp > 0 && pokemonSalvaje.hp > 0) {
            log.push(`--- Turno ${turno} ---`);

            // Daño mutuo
            const multJugador = calcularMultiplicador(jugador.tipo, pokemonSalvaje.tipo.split(",")[0]);
            const multSalvaje = calcularMultiplicador(pokemonSalvaje.tipo.split(",")[0], jugador.tipo);

            const dañoJugador = Math.max(5, (jugador.ataque - pokemonSalvaje.defensa / 2) * multJugador);
            const dañoSalvaje = Math.max(5, (pokemonSalvaje.ataque - jugador.defensa / 2) * multSalvaje);

            // Aplicar daño
            pokemonSalvaje.hp -= dañoJugador;
            jugador.hp -= dañoSalvaje;

            log.push(`${jugador.nombre} inflige ${dañoJugador.toFixed(1)} de daño.`);
            log.push(`${pokemonSalvaje.nombre} inflige ${dañoSalvaje.toFixed(1)} de daño.`);

            // Curaciones automáticas (si la vida baja de 30%)
            if (jugador.hp < (pokemonJugador.hp * 5) * 0.3 && jugador.curas > 0) {
                const cura = (pokemonJugador.hp * 5) * 0.5;
                jugador.hp += cura;
                jugador.curas--;
                log.push(`${jugador.nombre} usa una cura (+${cura} HP). Restantes: ${jugador.curas}`);
            }

            turno++;
        }

        let resultado = "";
        if (jugador.hp <= 0 && pokemonSalvaje.hp <= 0) {
            resultado = "Empate: ambos Pokémon quedaron fuera de combate.";
        } else if (jugador.hp > 0) {
            resultado = "¡Ganaste! Has capturado al Pokémon salvaje.";

            // Guardar el Pokémon capturado
            await db.pokemon.create({
                nombre: pokemonSalvaje.nombre,
                tipo: pokemonSalvaje.tipo,
                hp: wildData.stats.find(s => s.stat.name === "hp")?.base_stat || 0,
                ataque: wildData.stats.find(s => s.stat.name === "attack")?.base_stat || 0,
                defensa: wildData.stats.find(s => s.stat.name === "defense")?.base_stat || 0,
                velocidad: wildData.stats.find(s => s.stat.name === "speed")?.base_stat || 0,
                imagen: pokemonSalvaje.imagen,
                usuario_id: user.id,
            });
        } else {
            resultado = "Perdiste. El Pokémon salvaje escapó.";
        }

        res.send({
            resultado,
            pokemonJugador: jugador,
            pokemonSalvaje,
            log,
        });

    } catch (error) {
        sendError500(res, error);
    }
};
