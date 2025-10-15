const dbConfig = require("../config/db.config");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(
    dbConfig.DB,
    dbConfig.USER,
    dbConfig.PASSWORD,
    {
        host: dbConfig.HOST,
        dialect: dbConfig.dialect,
    }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.usuario = require("./usuario.model")(sequelize, Sequelize);
db.tokens = require("./usuarioauth.model")(sequelize, Sequelize);
db.pokemon = require("./pokemon.model")(sequelize, Sequelize);

// Relación: un usuario tiene muchos Pokémon capturados
db.usuario.hasMany(db.pokemon, { as: "pokemones", foreignKey: "usuario_id", onDelete: "CASCADE" });
db.pokemon.belongsTo(db.usuario, {
    foreignKey: "usuario_id",
    as: "usuario",
});
db.usuario.hasMany(db.tokens, { as: "tokens", foreignKey: "usuario_id", onDelete: "CASCADE" });
db.tokens.belongsTo(db.usuario, {
    foreignKey: "usuario_id",
    as: "usuario",
});

module.exports = db;