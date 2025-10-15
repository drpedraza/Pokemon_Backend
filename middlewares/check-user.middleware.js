const db = require("../models");

exports.checkUserMiddleware = async (req, res, next) => {
    const tokenHeader = req.headers["authorization"];

    if (!tokenHeader || !tokenHeader.startsWith("Bearer ")) {
        return res.status(401).send({ message: "User not authenticated" });
    }

    const token = tokenHeader.split(" ")[1];
    const tokenDB = await db.tokens.findOne({ where: { token } });

    if (!tokenDB) {
        return res.status(401).send({ message: "Invalid token" });
    }

    const user = await db.usuario.findByPk(tokenDB.usuario_id);
    if (!user) {
        return res.status(401).send({ message: "User not authenticated" });
    }

    res.locals.user = user;
    next();
};
