/**
 * Controlador de Productos
 * maneja las operaciones crud y activar y desactivar productos
 * Solo accesible por administradores
 */

/**
 * Importar modelos
 */
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');

//importar path y fs para manejo de imagenes
const path = require('path');
const fs = require('fs'); 

/**
 * obtener todas los productos
 * query params:
 * categoriaId: Id de la categoria para filtar por categoria
 * subcategoriaId: Id de la subcategoria para filtar por subcategoria
 * Activo true/false (filtar por estado activo o inactivo) 
 * @param {Object} req request Express
 * @param {Object } res response  Express
 */

const getProductos = async (req, res) => {
    try {
        const { 
            categoriaId, 
            subcategoriaId,
            activo,
            conStock,
            buscar,
            pagina = 1,
            limite = 100
        } = req.query;

        //construir filtros
        const where = {};
        if (categoriaId) where.categoriaId = categoriaId;
        if (subcategoriaId) where.subcategoriaId = subcategoriaId;
        if (activo !== undefined) where.activo = activo === 'true';
        if (conStock === 'true') where.stock = { [require('sequelize').Op.gt]: 0 };

        //paginacion
        const offset = (parseInt(pagina) -1) * parseInt(limite);

        // Opciones de consulta 
        const opciones = {
            where,
            include: [
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id', 'nombre']
                },
                {
                    model: Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre']
                }
            ],
            limit: parseInt(limite),
            offset,
            order: [['nombre', 'ASC']]            
        };

        // obtener productos y total
        const { count, rows: productos }  = await Producto.findAndCountAll(opciones);

        // Respuesta Exitosa
        res.json({
            success: true,            
            data: {
                productos,
                paginacion: {
                    total: count,
                    pagina: parseInt(pagina),
                    limite: parseInt(limite),
                    totalpaginas: Math.ceil(count / parseInt(limite))
                }
            }
        });      

    } catch (error) {
        console.error('Error en getproductos: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos',
            error: error.message
        })
    }
};

/**
 * obtener  los productios por id
 * GET /api/admin/productos/:id
 * 
 * @param {Object} req request Express
 * @param {Object } res response  Express
 */

const getProductoById = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar productos con relacion
        const producto = await Producto.findByPk( id,{
            include: [
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id', 'nombre','activo']
                },
                {
                    model: Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre', 'activo']
                }
            ] 
        });

        if (!producto) { 
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrada'
            });
        }

        // Respuesta exitosa
        res.json({
            success: true,
            data: {
                producto
        }
    });
    

    } catch (error) {
        console.error('Error en getproductoById: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener producto',
            error: error.message
        })
    }
};

/**
 * Crear una Producto 
 * POST /api/admin/productos
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const crearProducto = async (req, res) => {
    try {
        const {nombre, descripcion, precio, stock,  categoriaId, subcategoriaId} = req.body;
        
        //validacion 1 verificar campos requeridos
        if (!nombre || !precio ||!categoriaId || !subcategoriaId) {
            return res.status(400).json({
                success: false,
                message: 'faltan campos requeridos nombre, precio, categoriaId, subcategoriaId'
            });
        }
/**
        // validar 2 si la categoria existe 
         const categoria = await Categoria.findByPk(categoriaId);

        if (!categoria) {
            return res.status(404).json({
                success: false,
                message: `No existe la categoria con id ${categoriaId}`
            });
        }*/

        // valodacion 2 verifica si la categoria esta activa 
        const categoria = await Categoria.findByPk(categoriaId);
        if (!categoria) {
            return res.status(400).json({
                success: false,
                message: `no existe una categoria con id ${categoriaId}`
            });
        }
        if (!categoria.activo) {
            return res.status(400).json({
                success: false,
                message: `la categoria "${categoria.nombre}" esta inactiva`
            });
        }
         

        //Validacion 3 verificar que la subcategoria existe y pertence a una categoria 
        const subcategoria = await Subcategoria.findByPk(subcategoriaId);        

        if (!subcategoria) {
            return res.status(404).json({
                success: false,
                message: `No existe una subcategoria con id ${subcategoriaId}`
            });
        }
        if (!subcategoria.activo) {
            return res.status(400).json({
                success: false,
                message: `La subcategoria "${subcategoria.nombre}" esta inactiva`
            });
        }
        if (subcategoria.categoriaId !== parseInt(categoriaId)) {
            return res.status(400).json({
                success: false,
                message: `La subcategoria "${subcategoria.nombre}" no pertenece a la categoria con id ${categoriaId}`
            });
        }

        // validacion 4 precio y stock
        if (parseFloat(precio) < 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio debe ser mayor a 0'
            });
        }

         if (parseInt(stock) < 0) {
            return res.status(400).json({
                success: false,
                message: 'El stock debe no debe ser negativo'
            });
        }

        // obtener imagen 
        const imagen = req.file ? req.file.filename : null;

        //Crear producto
        const nuevoProducto = await Producto.create({
            nombre,
            descripcion: descripcion || null, 
            precio: parseFloat(precio),
            stock: parseInt(stock),
            categoriaId: parseInt(categoriaId),
            subcategoriaId: parseInt(subcategoriaId),
            imagen,
            activo: true
        });

        // Recargar con relaciones 
        await nuevoProducto.reload({
            include: [
                { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] },
                { model: Subcategoria, as: 'subcategoria', attributes: ['id', 'nombre'] },
            ]
        });

        // respuesta exitosa
        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data: {
                producto: nuevoProducto
            }
        });

    } catch (error) {
        console.error('Error crearProducto: ', error);

        // si hubo un error eliminar la imagen subida 
        if (req.file) {
            const rutaImagen = path.join(__dirname, '../uploads', req.file.filename);
            try {
                await fs.unlink(rutaImagen);
            } catch (err) {
                console.error('Error al eliminar imagen: ', err);
            }
        }

        if (error.name === 'SequelizateValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al crear producto',
            error: error.message
        });
        
    }
};
/**
 * Actualizar subcategoria 
 * PUT /api/admin/subcategorias/:id
 * body: { nombre, descripcion, categoriaId }
 * @param {Object} req rquest Express
 * @param {Object} res response Express
 */

const actualizarSubcategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, categoriaId, activo } = req.body;

        // Buscar subcategoria
        const subcategoria = await Subcategoria.findByPk(id);

        if (!subcategoria) {
            return res.status(404).json({
                success: false,
                message: 'subcategoria no encontrada'
            });
        }

        //  validacion si secambia la categoria verificar q exista y este activa 

        if (categoriaId && categoriaId !== subcategoria.categoriaId) {
            const nuevaCategoria = await Categoria.findByPk(categoriaId);

            if (!nuevaCategoria) {
                return res.status(404).json({
                    success: false,
                    message: `No existe la categoria con id ${categoriaId}`
                });
            }

            if (!nuevaCategoria.activo) {
                return res.status(400).json({
                    success: false,
                    message: `La categoria "${nuevaCategoria.nombre}" esta inactiva`
                });
            }
        }

        // validacion  si se cambia el nombre verificar que no exista la categoria
        if (nombre && nombre !== subcategoria.nombre) {
            const categoriafinal = categoriaId || subcategoria.categoriaId; // si no se cambia la categoria usar la categoria actual

            const subcategoriaConMismoNombre = await Subcategoria.findOne({
                where: {
                    nombre,
                    categoriaId: categoriafinal
                }
            });

            if (subcategoriaConMismoNombre) {
                return res.status(400).json({
                    success: false,
                    message: `Ya existe una subcategoria con el nombre "${nombre}" en esta categoria`
                });
            }
        }

        // Acatualizar campos 
        if (nombre !== undefined) subcategoria.nombre = nombre;
        if (descripcion !== undefined) subcategoria.descripcion= descripcion;
        if (categoriaId !== undefined) subcategoria.categoriaId = categoriaId;
        if (activo !== undefined) subcategoria.activo = activo;

        // guardar cambios
        await subcategoria.save();

        // Respuesta exitosa
        res.json({
            success: true,
            message: 'Subcategoria actualizada exitosamente',
            data: {
                subcategoria
            }
        });

        } catch (error) {
            console.error('Error en actualizarSubcategoria:', error);

            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    success: false,
                    message: 'Error de validacion',
                    errors: error.errors.map(e => e.message)
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al actualizar subcategoria',
                error: error.message
            });
        }
    };

    /**
     * Activar/Desactivar subcategoria
     * PATCH /api/admin/subcategorias/:id/estado
     * 
     * Al desactivar una subcategoria se desactivan todos los productos relacionados
     * @param {Object} req request Express
     * @param {Object} res response Express
     */
    const toggleSubcategoria = async (req, res) => {
        try {
            const { id } = req.params;

            //Buscar subcategoria 
            const subcategoria = await Subcategoria.findByPk(id);

            if (!subcategoria) {
                return res.status(404).json({
                    success: false,
                    message: 'Subcategoria no encontrada'
                });
            }

            // Alternar estado activo
            const nuevoEstado = !subcategoria.activo;
            subcategoria.activo = nuevoEstado;

            // Guardar cambios 
            await subcategoria.save();

            // Contar cuantos registros se afectaron
           const productosAfectados = await Producto.count({ where: { subcategoriaId: id }
            });

            // Respuesta exitosa
            res.json({
                success: true,
                message: `Subcategoria ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`,
                data:{
                    subcategoria,
                    productosAfectados
                    }
                });

        } catch (error) {
            console.error('Error en toggleSubcategoria:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cambiar estado de la subcategoria',
                error: error.message
            });
        }
    };

    /**
     * Eliminar subcategoria 
     * DELETE /api/admin/subcategorias/:id
     * Solo permite eliminar si no tiene subcategorias ni productos relacioandos
     * @param {Object} req request Express
     * @param {Object} res response Express
     */
    const eliminarSubcategoria = async (req, res) => {
        try {
            const { id } = req.paramas;

            //Buscar subcategoria
            const subcategoria = await Subcategoria.findByPk(id);

            if (!subcategoria) {
                return res.status(404).json({
                    success: false,
                    message: 'Subcategoria no en contrada'                    
                });
            }

            // Validacion verificar que no tenga  productos 
            const productos = await Producto.count({
                where: { subcategoriaId: id }
            });

            if (productos > 0) {
                return res.status(400).json({
                    success: false,
                    message:`No se puede eliminar la subcategoria porque tiene ${productos} productos asociadas usa PATCH /api/admin/subcategorias/:id toggle para desactivarla en lugar de eliminarla`
                });
            }

            // Eliminar subcategoria
            await subcategoria.destroy();

            //Respuesta exitosa
            res.json({
                success: true,
                message: 'Subcategoria eliminada Exitosamente'
            });
            
        } catch (error) {
            console.error('Error al eliminar subcategoria', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar subcategoria',
                error: error.message
            });
        }
    };

    /** 
     * Obtener estadisticas de una subcategoria
     * GET /api/admin/subcategorias/:id/estadisticas
     * retorna 
     * Total de subactegorias activas / inactivas
     * total de productos activos / inactivos
     * valor total del inventario
     * stock total
     * @param {Object} req request Express|}
     * @param {Object} res response Express
     */
    const getEstadisticasSubcategoria = async (req, res) => {
        try {
            const { id } = req.params;

            //Veroficar qu la subcategoria exista 
            const subcategoria = await Subcategoria.findByPk(id [{
                include: [{
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id', 'nombre']
                }]
            }]);

            if (!subcategoria) {
                return res.status(404).json({
                    success: false,
                    message: 'subcategoria no encontrada'
                });
            }           

            // contar productos 
            const totalProductos = await Producto.count({
                where: { subcategoriaId: id }
            });
            const productosActivos  = await Producto.count({
                where: { subcategoriaId: id, activo: true }
            });

            // obtener prpductos para calcular estadisticas
            const productos = await Producto.findAll({
                where: { subcategoriaId: id },
                attributes: ['precio', 'stock']
            });

            //calcular estadisticas de inventario
            let valorTotalInventario = 0;
            let stockTotal = 0;
            
            productos.forEach(producto => {
                valorTotalInventario += parseFloat(producto.precio) * producto.stock;
            });

            // Respuesta exitosa

            res.json({
                success: true,
                data: {
                    subcategoria: {
                        id: subcategoria.id,
                        nombre: subcategoria.nombre,
                        activo: subcategoria.activo,
                        categoria: subcategoria.categoria
                    },
                    estadisticas:{
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
            console.error('Error en getEstadisticasSubcategoria: ', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadisticas',
                error: error.message
            })
        }
    };

    // Exportar todos los controladores
    module.exports = {
        getSubcategorias,
        getSubcategoriasById,
        crearSubcategoria,
        actualizarSubcategoria,
        toggleSubcategoria,
        eliminarSubcategoria,
        getEstadisticasSubcategoria
    };





