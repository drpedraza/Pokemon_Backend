const { v4: uuidv4 } = require('uuid');
exports.generarCodigo = () => {
    const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let codigo = "";
    for (let i = 0; i < 3; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return codigo;
}
exports.generarTokenUsuario = () => {
    const caracteres = "abcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";
    for (let i = 0; i < 20; i++) {
        token += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return token;
}
exports.validarTarjeta = (numero) => {
    let sum = 0;
    let shouldDouble = false;
    for (let i = numero.length - 1; i >= 0; i--) {
        let digit = parseInt(numero[i]);
        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
};
exports.generarCodigoBilletera = () => {
    return uuidv4();

    
};























