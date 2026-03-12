/**
 * middleware de autenticacion JWT
 * este arvchivo verrifica quer el usuario tenga un token valido 
 * se usa para las rutas protegidas que requiran autenticacion
 * 
 */

// importar fuciones de JWT
const jwt = { verifyToken, extractToken } = require('../config/jwt');

const { extractToken } = require('../config/jwt');
// importar modelo de usuario
const Usuario = require('../models/Usuario');

// middleware de autenticacion

const verificarAuth = async (req, res, next) => {
    try {
        //paso 1 obtener el token del header Authorization
        const authHeader = req.header = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ 
                success: false,
                message: ' no se proporciono token de autenticacion'
            });
        }

        //Extrael el token quitar Bearer
        const token = extractToken(authHeader);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'token de autentiacion invalido'
            });
        }

        //paso 2 verificar que el token es valido
        let decoded;// funcion para decodificar el token 
        try {
            decoded = verifyToken(token);
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: error.message // token expirado o invalido
            });
        }

        // buscar el usuario en la bade de datos
        const usuario = await Usuario.findById(decoded.id, {
            attributes: { exclude: ['password'] }// no incluir la contrseña en la respuesta 
        });

        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // paso 4  verificar que el usuario esta activo
         if (!usuario.activo) {
            return res.status(401).json({
                success: false,
                message: 'Usuario inactivo contacte al administrador|'
            });
        }

        // paso 5 Agregar el usuario al objeto req para uso posterior 
        //ahora en los controladores podemos acceder a req.usuario

        // continuar con el siguiente 
        next();

    } catch (error) {
        console.error ('Error en middleware de autentiaccion', error);
        return res.status(500).json({
            success: false,
            message: 'error en la verificacion de autenticacion',
            error: error.message
        });
    }
} ;

/**
 * middleware opcional de autenmgtiacion 
 * similar a verificarAuth pero no retorna error si no hay token
 * es para rutas q no requieren atenticacion
 */

const verificarAuthOpcional = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // si no hay token continuar sin usuario
        if (!authHeader) {
            req.usuario = null;
            return next();
        }

        const token = extractToken(authHeader);

        if (!token) {
            req.usuario = null;
            return next();
        }

        try {
            const decoded = verifyToken(token);
            const usuario = await Usuario.findById(decoded.id, {
                attributes: { exclude: ['password'] }
            });

            if (usuario && usuario.activo) {
                req.usuario = usuario; 
            } else {
                req.usuario = null;
            }
        } catch (error) {
            //Token invalido o expirado constinuar sin usuario
            req.usuario = null;
        }

        next();
    } catch (error) {
        console.error('error en middleware de autenticacion opcional', error);
        req.usuario = null;
        next();
    }
}; 

//Exportar middleware
module.exports = {
    verificarAuth,
    verificarAuthOpcional
}