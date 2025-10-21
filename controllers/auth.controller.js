const db = require("../models");
const { generarTokenUsuario } = require("../utils/code.utils");
const { stringToSha1 } = require("../utils/crypto.utils");
const { checkRequiredFields } = require("../utils/request.utils");
const axios = require("axios");

exports.generateUserToken = async (req, res) => {
    try {
        const requiredFields = ["email", "password"];
        const fieldsWithErrors = checkRequiredFields(requiredFields, req.body);
        if (fieldsWithErrors.length > 0) {
            return res.status(400).send({
                message: `Faltan los siguientes campos: ${fieldsWithErrors.join(", ")}`
            });
        }

        const { email, password } = req.body;

        const usuario = await db.usuario.findOne({
            where: {
                email,
                password: stringToSha1(password)
            }
        });

        if (!usuario) {
            return res.status(401).send({ message: "Usuario o contraseña incorrectos" });
        }

        const token = generarTokenUsuario();
        await db.tokens.create({
            token,
            usuario_id: usuario.id
        });

        // Si el usuario no tiene ningún Pokémon, asignarle uno aleatorio
        const pokemonesCount = await db.pokemon.count({ where: { usuario_id: usuario.id } });
        if (pokemonesCount === 0) {
            try {
                const randomId = Math.floor(Math.random() * 20) + 1;
                const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
                const data = response.data;

                const nombre = data.name;
                const tipo = data.types.map(t => t.type.name).join(", ");
                const hp = data.stats.find(s => s.stat.name === "hp")?.base_stat || 0;
                const ataque = data.stats.find(s => s.stat.name === "attack")?.base_stat || 0;
                const defensa = data.stats.find(s => s.stat.name === "defense")?.base_stat || 0;
                const velocidad = data.stats.find(s => s.stat.name === "speed")?.base_stat || 0;
                const imagen = data.sprites.front_default || "";

                await db.pokemon.create({
                    nombre,
                    tipo,
                    hp,
                    ataque,
                    defensa,
                    velocidad,
                    imagen,
                    usuario_id: usuario.id
                });
            } catch (err) {
                // No bloqueamos el login si falla la asignación del Pokémon; solo logueamos el error
                console.log("No se pudo asignar Pokémon automático:", err.message || err);
            }
        }

        res.send({
            message: "Login exitoso",
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email
            }
        });
    } catch (error) {
        console.error("Error en generateUserToken:", error);
    }
};

exports.registerUser = async (req, res) => {
    const requiredFields = ["nombre", "email", "password"];
    const fieldsWithErrors = checkRequiredFields(requiredFields, req.body);
    if (fieldsWithErrors.length > 0) {
        return res.status(400).send({
            message: `Faltan los siguientes campos: ${fieldsWithErrors.join(", ")}`
        });
    }

    const { nombre, email, password } = req.body;

    const usuarioExistente = await db.usuario.findOne({ where: { email } });
    if (usuarioExistente) {
        return res.status(400).send({ message: "El email ya está registrado" });
    }

    const nuevoUsuario = await db.usuario.create({
        nombre,
        email,
        password: stringToSha1(password)
    });

    nuevoUsuario.password = undefined;
    res.send({
        message: "Usuario registrado exitosamente",
        usuario: nuevoUsuario
    });
};
