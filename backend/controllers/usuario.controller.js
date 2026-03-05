/**
 * Controlador de usuarios ADMIN
 * maneja las gestion de usuarios por administradoes
 * Lista de usuarios activa / desactivar cuentas 
 */

/**
 * Importar modelos
 */

const Usuario = require('../models/Usuario');



/**
 * obtener todas los usuarios
 * GET /api/usuarios
 * query params:
 * Activo true/false (filtar por estado)
 * 
 * @param {Object} req request Express
 * @param {Object } res response  Express
 */

const getUsuarios = async (req, res) => {
    try {
        const { rol, activo, buscar, pagina = 1, limite = 10 } = req.query;

        //Contruir los filtros
        const where = {};
        if (rol) where.rol = rol;
        if (activo !== undefined) where.activo = activo === 'true';

        //Busqueda por texto
        if (buscar) {
            const { Op } = require('sequelize');
            where[Op.or] = [
                { nombre: { [Op.like]: `%${buscar}%` }  },
                { apellido: { [Op.like]: `%${buscar}%` }  },
                { email: { [Op.like]: `%${buscar}%` }  },
            ];
        }

        //Paginacion
        const offset = (parseInt(pagina) -1) * parseInt(limite);

        //Obtener usuarios sin password 
        const { count, rows: usuarios } = await Usuario.findAndCountAll({
            where,
            attributes: {  exclude: ['password'] },
            limit: parseInt(limite),
            offset,
            order: [['createdAt', 'DESC']]
        });

        //respuesta exitosa
        res.json({
            success: true,
            data: {
                usuarios,
                paginacion: {
                    total: count,
                    pagina: parseInt(pagina),
                    limite: parseInt(limite),
                    totalPaginas: Math.ceil(count / parseInt(limite))
                }
            }
        });
        } catch (error) {
            console.error('Error en getUsuarios:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener usuarios',
                error: error.message
            });
        }
    };

    
/**
 * obtener  un usuario por id
 * GET /api/admin/usuarios/:id
 * 
 * @param {Object} req request Express
 * @param {Object } res response  Express
 */

const getUsuarioById = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar usuarios 
        const usuario = await Usuario.findByPk( id, {
            attributes: { exclude: ['password'] },
        });            

        if (!usuario) { 
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Respuesta exitosa
        res.json({
            success: true,
            data: {
                usuario
            }
        });
    

    } catch (error) {
        console.error('Error en getUsuarioById: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuario',
            error: error.message
        })
    }
};

/**
 * Crear nuevo usuario
 * POST /api/admin/usuarios
 * Body: { nombre, apellido, email, password, rol, telefono, direccion}
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const crearUsuario = async (req, res) => {
    try {
        const {nombre, apellido, email, password, rol, telefono, direccion} = req.body;

        //validaciones
        if (!nombre || !apellido || !email || !password || !rol) {
            return res.status(400).json({
                success: false,
                message: 'Faltan  campos requeridos: nombre, apellido, email, password, rol'
            });
        }

        //validar rol
        if (!['cliente', 'auxiliar', 'administrador'].includes(rol)) {
            return res.status(400).json({
                success: false,
                message: 'Rol invalido. Debe ser: cliente, auxiliar o administrador'
            });
        }
        
        //Validar email unico
        const usuarioExistente = await Usuario.findOne({ where: { email }});
        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: 'El email ya esta registrado'
            });
        }

        //Crear usuario
        const nuevaUsuario = await Usuario.create({
            nombre,
            apellido,
            email,
            password,
            rol,
            telefono: telefono || null,
            direccion: direccion || null, // si no se proporciona  se establece como null
            activo: true
        });

        // Respuesta exitosa 
        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            data: {
                usuario: nuevaUsuario.toJson() // convertir a JSON para excluir campos sensibles
            }
        });
    } catch (error) {
        console.error('Error al crearUsuario', error);
        if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Error de validacion',
            errors: error.errors.map(e => e.message)
        });
    }

    res.status(500).json({
        success: false,
        message: 'Error al crear usuario',
        error: error.message
    })
}
};

/**
 * Actualizar Usuario
 * PUT /api/admin/usuarios/:id
 * body: { nombre, apellido, email, password, rol, telefono, direccion }
 * @param {Object} req rquest Express
 * @param {Object} res response Express
 */

const actualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, telefono, direccion, rol } = req.body;

        // Buscar usuario
        const usuario = await Usuario.findByPk(id);

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // validar rol si se proporciona
        if (rol && ['cliente', 'administrador'].includes(rol)) { 
                return res.status(400).json({
                    success: false,
                    message: 'rol invalido'
                });
            }

        // Acatualizar campos 
        if (nombre !== undefined) usuario.nombre = nombre;
        if (apellido !== undefined) usuario.apellido = apellido;
        if (telefono !== undefined) usuario.telefono = telefono;
        if (direccion !== undefined) usuario.direccion = direccion;
        if (rol !== undefined) usuario.rol = rol;

        // guardar cambios
        await usuario.save();

        // Respuesta exitosa
        res.json({
            success: true,
            message: 'usuario actualizada exitosamente',
            data: {
                usuario: usuario.toJson()
            }
        });

        } catch (error) {
            console.error('Error en actualizarUsuario:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error al actualizar usuario',
                    error: error.message
                });
            }
        };

    /**
     * Activar/Desactivar categoria
     * PATCH /api/admin/categorias/:id/estado
     * 
     * Al desactivar una categoria se desactivan todas las subcategorias realacionadas
     * al desactivar una subcategoria de desactivan todos los productos relacionados
     * @param {Object} req request Express
     * @param {Object} res response Express
     */
    const toggleCategoria = async (req, res) => {
        try {
            const { id } = req.params;

            //Buscar categoria 
            const categoria = await Categoria.findByPk(id);

            if (!categoria) {
                return res.status(404).json({
                    success: false,
                    message: 'Categoria no encontrada'
                });
            }

            // Alternar estado activo
            const nuevoEstado = !categoria.activo;
            categoria.activo = nuevoEstado;

            // Guardar cambios 
            await categoria.save();

            // Contar cuantos registros se afectaron
            const subcategoriasAfectadas = await Subcategoria.count({ where: { categoriaId: id }
            });

            const productosAfectados = await Producto.count({ where: { categoriaId: id }
            });

            // Respuesta exitosa
            res.json({
                success: true,
                message: `Categoria ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`,
                data:{
                    categoria,
                    afectados: {
                        subcategorias: subcategoriasAfectadas,
                        productos: productosAfectados
                    }
                }
            });

        } catch (error) {
            console.error('Error en toggleCategoria:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cambiar estado de la categoria',
                error: error.message
            });
        }
    };

    /**
     * Eliminar categoria 
     * DELETE /api/admin/categorias/:id
     * Solo permite eliminar si no tiene subcategorias ni productos relacioandos
     * @param {Object} req request Express
     * @param {Object} res response Express
     */
    const eliminarCategoria = async (req, res) => {
        try {
            const { id } = req.paramas;

            //Buscar categoria
            const categoria = await Categoria.findByPk(id);

            if (!categoria) {
                return res.status(404).json({
                    success: false,
                    message: 'Categoria no en contrada'                    
                });
            }

            // Validacion verificar que no tenga  subcategorias 
            const subcategorias = await Subcategoria.count({
                where: { categoriaId: id }
            });

            if (subcategorias > 0) {
                return res.status(400).json({
                    success: false,
                    message:`No se puede eliminar la categoria porque tiene ${subcategorias} subcategorias asociadas usa PATCH /api/admin/categorias/:id toggle para desactivarla en lugar de eliminarla`
                });
            }

            // Validacion verificar que no tenga productos
            const productos = await Producto.count({
                where: { categoriaId: id }
            });

            if (productos > 0) {
                return res.status(400).json({
                    success: false,
                    message:`No se puede eliminar la categoria porque tiene ${productos} productos asociados usa PATCH /api/admin/categorias/:id toggle para desactivarla en lugar de eliminarla`
                });
            }

            // Eliminar categoria
            await categoria.destroy();

            //Respuesta exitosa
            res.json({
                success: true,
                message: 'Categoria eliminada Exitosamente'
            });
            
        } catch (error) {
            console.error('Error al eliminar categoria', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar categoria',
                error: error.message
            });
        }
    };

    /** 
     * Obtener estadisticas de una categoria
     * GET /api/admin/categorias/:id/estadisticas
     * retorna 
     * Total de subactegorias activas / inactivas
     * total de productos activos / inactivos
     * valor total del inventario
     * stock total
     * @param {Object} req request Express|}
     * @param {Object} res response Express
     */
    const getEstadisticasCategoria = async (req, res) => {
        try {
            const { id } = req.params;

            //Veroficar qu la categoria exista 
            const categoria = await Categoria.findByPk(id);

            if (!categoria) {
                return res.status(404).json({
                    success: false,
                    message: 'categoria no encontrada'
                });
            }

            // contar subcategorias 
            const totalSubcategorias = await Subcategoria.count({
                where: { categoriaId: id }
            });
            const subcategoriasActivas  = await Subcategoria.count({
                where: { categoriaId: id, activo: true }
            });

            // contar productos 
            const totalProductos = await Producto.count({
                where: { categoriaId: id }
            });
            const productosActivos  = await Producto.count({
                where: { categoriaId: id, activo: true }
            });

            // obtener prpductos para calcular estadisticas
            const productos = await Producto.findAll({
                where: { categoriaId: id },
                attributes: ['precio', 'stock']
            });

            //calcular estadisticas de inventario
            let valorTotalInventario = 0;
            let stockTotal = 0;
            
            productos.forEach(producto => {
                valorTotalInventario += parseFloat(producto.precio) * producto.stock;
                stockTotal += producto.stock;
            });

            // Respuesta exitosa

            res.json({
                success: true,
                data: {
                    categoria: {
                        id: categoria.id,
                        nombre: categoria.nombre,
                        activo: categoria.activo
                    },
                    estadisticas:{
                        subcategorias: {
                            total: totalSubcategorias,
                            activas: subcategoriasActivas,
                            inactivas: totalSubcategorias - subcategoriasActivas
                        },

                        productos: {
                            total: totalProductos,
                            activas: productosActivos,
                            inactivas: totalProductos - productosActivos
                        },

                        inventario: {
                            stockTotal,
                            valorTotal: valorTotalInventario.toFixed(2)// quitar decimales 
                        }
                    }
                }
            });

        }  catch (error) {
            console.error('Error en getEstadisticasCategoria: ', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadisticas',
                error: error.message
            })
        }
    };

    // Exportar todos los controladores
    module.exports = {
        getCategorias,
        getCategoriasById,
        crearCategoria,
        actualizarCategoria,
        toggleCategoria,
        eliminarCategoria,
        getEstadisticasCategoria
    };





