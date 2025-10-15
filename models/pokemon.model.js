module.exports = (sequelize, Sequelize) => {
    const Pokemon = sequelize.define("pokemon", {
        nombre: {
            type: Sequelize.STRING,
            allowNull: false
        },
        tipo: {
            type: Sequelize.STRING,
            allowNull: false
        },
        hp: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        ataque: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        defensa: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        velocidad: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        imagen: {
            type: Sequelize.STRING,
            allowNull: false
        }
    });
    return Pokemon;
};
