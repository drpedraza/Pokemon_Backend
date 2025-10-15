const db = require("../models");
const { generarTokenUsuario } = require("../utils/code.utils");
const { stringToSha1 } = require("../utils/crypto.utils");
const { checkRequiredFields } = require("../utils/request.utils");

exports.generateUserToken = async (req, res) => {
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

    res.send({
        message: "Login exitoso",
        token,
        usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email
        }
    });
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
