/**
 * Controlador de categorias 
 * maneja las operaciones crud y activar y desactivar categorias
 * Solo accesible por administradores
 */

/**
 * Importar modelos
 */

const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');
const Producto = require('../models/Producto');


/**
 * obtener todas las categorias
 * query params:
 * Activo true/false (filtar por estado)
 * incluirsubcategorias true/false(incluir subcategorias realacionadas)
 * 
 * @param {Object} req request Express
 * @param {Object } res response  Express
 */

const getCategorias = async (req, res) => {
    try {
        const { activo, IncluirSubcategorias } = req.query;

        // Opciones de consulta 
        const opciones = {
            order: [['nombre', 'ASC']] // ordenar de manera alfabetica
        };

        // Filtrar por estado activo si es epecifica 
        if (activo !== undefined) {
            opciones.where = { activo: activo === 'true' };
        }

        // Incluir subcategorias si se solicita 
        if (IncluirSubcategorias === 'true') {
            opciones.include == [{
                model: Subcategoria,
                as: 'subcategorias', // campo del alias para la relacion
                attributes: ['id', 'nombre', 'descripcion', 'activo'] //campos a inclur de la subcategoria
            }]
        }

        // Obtener categorias
        const categorias = await Categoria.findAll(opciones);

        // Respuesta Exitosa
        res.json({
            success: true,
            count: categorias.length,
            data: {
                categorias
            }
        });      

    } catch (error) {
        console.error('Error en getCaregorias: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categorias',
            error: error.message
        })
    }
};

/**
 * obtener  las categorias por id
 * GET /api/categorias/:id
 * 
 * @param {Object} req request Express
 * @param {Object } res response  Express
 */

const getCategoriasById = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar categorias con subcategorias y contar productos 
        const categoria = await Categoria.findByPk( id,{
            include: [
                {
                    model: Subcategoria,
                    as: 'subcategorias',
                    attributes: ['id', 'nombre', 'descripcion', 'activo']
                },
                {
                    model: Producto,
                    as: 'productos',
                    attributes: ['id']
                }
            ] 
        });

        if (!categoria) { 
            return res.status(404).json({
                success: false,
                message: 'Categoria no encontrada'
            });
        }

        // agregar contador de productos
        const categoriaJSON = categoria.toJSON();
        categoriaJSON.totalProductos = categoriaJSON.productos.length;
        delete categoriaJSON.productos;//no enviar la lista completa solo el contador

        // Respuesta exitosa
        res.json({
            success: true,
            data: {
                categoria: categoriaJSON
            }
        });
    

    } catch (error) {
        console.error('Error en getCategoriaById: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categoria',
            error: error.message
        })
    }
};

/**
 * Crear una categoria 
 * POST /api/admin/categorias
 * Body: { nombre, descripcion }
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const crearCategoria = async (req, res) => {
    try {
        const {nombre, descripcion} = req.body;

        //validacion 1 verificar campos requeridos
        if (!nombre) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de la categoria es requerido'
            });
        }

        //Validacion 2 verificar que el nombre no exista
        const categoriaExistente = await Categoria.findOne({ where: { nombre}
        });

        if (categoriaExistente) {
            return res.status(400).json({
                success: false,
                message: `Ya existe una categoria con el nombre "${nombre}"`
            });
        }

        //Crear Categoria
        const nuevaCategoria = await Categoria.create({
            nombre,
            descripcion: descripcion || null, // si no se proporciona la descripcion se establece como null
            activo: true
        });

        // Respuesta exitosa 
        res.status(201).json({
            success: true,
            message: 'Categoria creada exitosamente',
            data: {
                categoria: nuevaCategoria
            }
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Error de validacion',
            errors: error.errors.map(e => e.message)
        });
    }

    res.status(500).json({
        success: false,
        message: 'Error al crear categoria',
        error: error.message
    })
}
};

/**
 * Actualizar Categoria 
 * PUT /api/admin/categorias/:id
 * body: { nombre, descripcion }
 * @param {Object} req rquest Express
 * @param {Object} res response Express
 */

const actualizarCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion } = req.body;

        // Buscar categoria
        const categoria = await Categoria.findByPk(id);

        if (!categoria) {
            return res.status(404).json({
                success: false,
                message: 'Categoria no encontrada'
            });
        }

        // validacion 1 si se cambia el nombre verificar que no exista
        if (nombre && nombre !== categoria.nombre) {
            const categoriaConMismoNombre = await Categoria.findOne({ where: { nombre}
            });

            if (categoriaConMismoNombre) {
                return res.status(400).json({
                    success: false,
                    message: `Ya existe una categoria con el nombre "${nombre}"`
                });
            }
        }

        // Acatualizar campos 
        if (nombre !== undefined) categoria.nombre = nombre;
        if (descripcion !== undefined) categoria.descripcion= descripcion;
        if (activo !== undefined) categoria.activo = activo;

        // guardar cambios
        await categoria.save();

        // Respuesta exitosa
        res.json({
            success: true,
            message: 'Categoria actualizada exitosamente',
            data: {
                categoria
            }
        });

        } catch (error) {
            console.error('Error en actualizarCategoria:', error);

            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    success: false,
                    message: 'Error de validacion',
                    errors: error.errors.map(e => e.message)
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al actualizar categoria',
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





