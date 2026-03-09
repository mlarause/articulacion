/**
 * middleware de verificar roles
 * este middleware verifica que el usuario tenga un rol requerido
 * debe usarse despues de middleare de auetnticacion
 */

const esAdministrador = (req, res, next) => {
    try {
        //verificar que existe req.usuario (viene de la autenticacion)
        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                message: 'no autorizado debes iniciar sesioin primero '
            });
        }

        // verificar que el rol es administrador
        if (req.usuario.rol !== 'administrador') {
            return res.status(403).json({
                success: false,
                message: 'acceso denegado se requiere permisos de adminsitrador'
            });
        }

        // el usuario es administrador continuar 
        next();
        
    } catch (error) {
        console.error('Error en middleware esAdministrador', error);
        return res.status(500).json({
            success: false,
            message: 'error al verificar permisos',
            error: error.message
        });
    }
};

/**
 * middleware para verificar si el usuario es cliente 
 */
const esCliente = (req, res, next) => {
    try {
        //verificar que existe req.usuario (viene de la autenticacion)
        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                message: 'no autorizado debes iniciar sesioin primero '
            });
        }

        // verificar que el rol es cliente
        if (req.usuario.rol !== 'cliente') {
            return res.status(403).json({
                success: false,
                message: 'acceso denegado se requiere permisos de cliente'
            });
        }

        // el usuario es cliente continuar 
        next();
        
    } catch (error) {
        console.error('Error en middleware esCliente', error);
        return res.status(500).json({
            success: false,
            message: 'error al verificar permisos',
            error: error.message
        });
    }
};
/**
 * middleware flexible para verificar multiples roles
 * permite verificar varios roles validos
 * util para cuando una ruta tiene varios roles permitidos
 */

const tieneRol = (req, res, next) => {
    return (req, res, next) => {
        try {
            //verificar que existe req.usuario (viene de la autenticacion)
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'no autorizado debes iniciar sesioin primero '
                });
            }

            // verificar usuario esta en la lsita de roles permitidos
            if (req.rolesPermitidos.include (req.usuario.rol)) {
                return res.status(403).json({
                    success: false,
                    message: `Acceso denegado se requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}`
                });
            }

            // el usuario tiene un rol permitido continuar 
            next();
            
        } catch (error) {
            console.error('Error en middleware tieneRol', error);
            return res.status(500).json({
                success: false,
                message: 'error al verificar permisos',
                error: error.message
            });
        }
    };
};

/**
 * middleware para verificar que el usuario accede a sus propios datos 
 * verifica que el usuarioid  en los parametros conciden con el usuario autenticado
 */

const esPropioUsuarioOAdmin = (req, res, next) => {
    try {
        //verificar que existe req.usuario (viene de la autenticacion)
        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                message: 'no autorizado debes iniciar sesioin primero '
            });
        }

        // los adminsitradores pueden acceder a datos de cualquier usuario
        if (req.usuario.rol === 'administrador') {
            return next();
        }

        //Obtener el usuarioId de los parametros de la ruta 
        const usuarioIdParam = req.params.usuarioId || req.params.id;

        //Verificar que el usuarioId concide con el usuario autenticado 
        if (parseInt(usuarioIdParam) !== req.usuario.id) {
            return res.status(403).json({
                success: false,
                message: 'acceso denegado no puedes acceder a datos de otros usuarios'
            });
        }

        // el usuario accede a sus propios datos continuar
        next();
        
    } catch (error) {
        console.error('Error en middleware esPropioUsuarioOAdmin', error);
        return res.status(500).json({
            success: false,
            message: 'error al verificar permisos',
            error: error.message
        });
    }
};

/**
 * middleware para verificar que el usuario es administrador o auxiliar 
 * permite al acceso a usuarios con rol admisntrador  o auxiliar 
 */

const esAdminOAuxiliar = (req, res, next) => {
    try {
        //verificar que existe req.usuario (viene de la autenticacion)
        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                message: 'no autorizado debes iniciar sesioin primero '
            });
        }

        // verificar que el rol es administrador o auxiliar
        if (!['administrador', 'auxiliar'].includes(req.usuario.rol)) {
            return res.status(403).json({
                success: false,
                message: 'acceso denegado se requiere permisos de adminsitrador o auxiliar'
            });
        }

        // el usuario es administrador o auxiliar  continuar 
        next();
        
    } catch (error) {
        console.error('Error en middleware esAdminOAuxiliar', error);
        return res.status(500).json({
            success: false,
            message: 'error al verificar permisos',
            error: error.message
        });
    }
};

/**
 * middleware para verificar que el usuario es solo administrador  no auxiliar
 * bloquea el acceso a aperaciones como eliminar 
 */

const soloAdministrador = (req, res, next) => {
    try {
        //verificar que existe req.usuario (viene de la autenticacion)
        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                message: 'no autorizado debes iniciar sesioin primero '
            });
        }

        // verificar que el rol es administrador 
        if (req.usuario.rol !== 'administrador') {
            return res.status(403).json({
                success: false,
                message: 'acceso denegado solo administradores pueden realizar esta operacion'
            });
        }

        // el usuario es administrador o auxiliar  continuar 
        next();
        
    } catch (error) {
        console.error('Error en middleware soloAdministrador', error);
        return res.status(500).json({
            success: false,
            message: 'error al verificar permisos',
            error: error.message
        });
    }
};

//exportar los middlewares
module.exports = {
    esAdministrador,
    esCliente,
    tieneRol,
    esPropioUsuarioOAdmin,
    esAdminOAuxiliar,
    soloAdministrador
};