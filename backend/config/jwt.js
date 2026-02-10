/**
 * CONFIGURACION DE JWT
 * Este archivo contiene funciones para generar y verificar tokens JWT
 * Los JWT se usan para autenticar usuarios sin necesidad de sesiones 
 */

//Importar  jsonwebtoken para manejar los tokens
const jwt = require('jsonwebtoken');

//Importar dotenv para acceder a las variables de entorno
require('dotenv').config();

/**
 * Generar un token JWT para un usuario
 * 
 * @param {Object} payload - Datos que se incluira en el token (id, email, rol)
 * @returns {String} - Token JWT generado
 */

const generateToken = (payload) => {
    try {
        //jwt.sing() crea y firma un token
        //Parametros:
        // 1. payload: datos a incluir en token 
        // 2. secret: clave secreta para firmar (desde .env)
        // 3. options: opciones adicionales como tiempo de expiracion
        const token = jwt.sign(
            payload, // Datos de usuario
            process.env.JWT_SECRET, // Clave secreta desde .env
            { expiresIn: process.env.JWT_EXPIRES_IN } // Tiempo de expiracion
        );

        return token;
    } catch (error) {
        console.error(' Error al generar token JWT:', error.message);
        throw new Error('Error al generar token de autenticacion');
    }
};

/**
 * Verificar si un token es valido 
 * 
 * @param {String} tokenHeader - Header de autorizacion que contiene el token JWT
 * @returns {Object} - datos decodificados del token si es valido
 * @throws {Error} - si el token es invalido o ha expirado
 */

const verifyToken = (token) => {
    try {
        //jwt.verify() verifica la firma del token y lo decodifica
        //Parametros:
        //1. token: el token JWT a verificar
        //2. secret: la misma clave secreta usuada para firmarlo
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        return decoded;
    } catch (error) {
        //Diferentes tipos de errores
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token Expirado');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Token Inavlido');
        } else {
            throw new Error('Error al verificar token');
        }
    }
};

/**
 * Extraer el token del header Authorization
 * El token viene en formato "Bearer <token>"
 * 
 * @param {String} authHeader - >Header Authorization de la peticion
 * @returns {String|null} - Token estraido o null si no existe
 */

const extractToken = (authHeader) => {
    // verifica que el header existe y empieza con "Bearer "
    if (authHeader && authHeader.startsWith('Bearer' )) {
        //Extraer solo el token (quitar "Bearer")
        return authHeader.substring(7);
    }

    return null; // no se encuentra un token valido
};

//Exportar las funciones para usarlas en otros archivos
module.exports = {
    generateToken,
    verifyToken,
    extractToken,
};

