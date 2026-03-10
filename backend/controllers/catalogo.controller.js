/**
 * Controlador de catalogo
 * permite ver los productos sin iniciar sesion 
 */

/**
 * Importar modelos
 */
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');
const { act } = require('react');

/**
 * obtener todas los productos al publico
 * Get /api/catalogo/productos
 * query params:
 * categoriaId: Id de la categoria para filtar por categoria
 * subcategoriaId: Id de la subcategoria para filtar por subcategoria
 * preciomin, preciomax,  rango de precios nombre reciente 
 * @param {Object} req request Express
 * @param {Object } res response  Express
 * solo muestra los productoa activos y con stock
 */

const getProductos = async (req, res) => {
    try {
        const { 
            categoriaId, 
            subcategoriaId,
            buscar,
            precioMin,
            precioMax,
            orden = 'reciente',
            pagina = 1,
            limite = 12
        } = req.query;
        const { Op } = require('sequelize');

        //filtros base solo para productos activos y con stock
        const where = {
            activo: true,
            stock: { [Op.gt]: 0}
        };
        // filtros opcionales
        if (categoriaId) where.categoriaId = categoriaId;
        if (subcategoriaId) where.subcategoriaId = subcategoriaId;

        //Busqueda de texto
        if (buscar) {
            where[Op.or] = [
                { nombre: { [Op.like]: `%${buscar}%` } },
                { descripcion: { [Op.like]: `%${buscar}%` } }, // permite buscar por nombre o descripcion
            ];
        }

        // filtro por rango de precio
        if (precioMin && precioMax) {
            where.precio = {};
            if (precioMin) where.precio[Op.gte] = parseFloat(precioMin);
            if (precioMax) where.precio[Op.lte] = parseFloat(precioMax);
        }

        //Ordenamiento
        let order;
        switch (orden) {
            case 'precio_asc':
                order = [['precio', 'ASC']];
                break;
            case 'precio_desc':
                order = [['precio', 'DESC']];
                break;
            case 'nombre':
                order = [['nombre', 'ASC']];
                break;
            case 'reciente':
                order = [['createdAt', 'DESC']];
                break;
        }
        
        //paginacion
        const offset = (parseInt(pagina) -1) * parseInt(limite);

        // consultar productos

        const opciones = { count, rows: productos } = await Producto.findAndCountAll({
            where,
            include: [
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id', 'nombre'],
                    where: { activo: true}
                },
                {
                    model: Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre'],
                    where: { activo: true}
                },                
            ],
            limit: parseInt(limite),
            offset,
            order: [['nombre', 'ASC']]            
        });

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

        // Buscar productos activo con stock
        const producto = await Producto.findOne({
            where: { 
                id,
                activo: true,
            },
            include: [
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id', 'nombre','activo'],
                    where: { activo: true}
                },
                {
                    model: Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre', 'activo'],
                    where: { activo: true}
                }
            ] 
        });

        if (!producto) { 
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado o no disponible'
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
 * obtener  los productios por id
 * GET /api/admin/productos/:id
 * 
 * @param {Object} req request Express
 * @param {Object } res response  Express
 */

const getCategorias = async (req, res) => {
    try {
        const { Op } = require('sequelize');

        // Buscar pcategorias activas
        const categorias = await Categoria.findAll({
            where: {activo: true},
            attributes: ['id', 'nombre', 'descripcion'],
            order: [['nombre', 'ASC']]            
        });

        //Para cada categoria contar productos activos con stock
        const categoriasConConteo = await Promise.all(
            categorias.map(async (categoria) => {
                const totalProductos = await Producto.count({
                    where: {
                        categoriaId: categoria.id,
                        activo: true,
                        stock: { [Op.gt]: 0}
                    }
                });
                return {
                    ...categoria.toJSON(),
                    totalProductos
                };
            })
        );

        //respuesta exitosa
        res.json({
            success: true,
            data: {
                categorias: categoriasConConteo
            }
        });   

    } catch (error) {
        console.error('Error en getCategorias: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categorías',
            error: error.message
        })
    }
};

/**
 * obtener  subcategorias por categoria
 * GET /api/catalogo/categorias/:id/subcategorias
 * 
 * @param {Object} req request Express
 * @param {Object } res response  Express
 */

const getSubcategoriasPorCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { Op } = require('sequelize');

        //Vericar que la categoria exista y este activa
        const categoria = await Categoria.findOne({
            where: { id, activo: true },
        });

        if (!categoria) {
            return res.status(404).json({
                success: false,
                message: 'Categoria no encontrada'
            });
        }

        // Buscar subcategorias activas
        const subcategorias = await Subcategoria.findAll({
            where: { 
                categoriaId: id,
                activo: true
            },
            attributes: ['id', 'nombre', 'descripcion'],
            order: [['nombre', 'ASC']]            
        });

        //contar productos activos con stock para cada subcategoria
        const subcategoriasConConteo = await Promise.all(
            subcategorias.map(async (subcategoria) => {
                const totalProductos = await Producto.count({
                    where: {
                        subcategoriaId: subcategoria.id,
                        activo: true,
                        stock: { [Op.gt]: 0}
                    }
                });
                return {
                    ...subcategoria.toJSON(),
                    totalProductos
                };
            })
        );

        //respuesta exitosa
        res.json({
            success: true,
            data: {
                categoria: {
                    id: categoria.id,
                    nombre: categoria.nombre
                },
                subcategorias: subcategoriasConConteo
            }
        });   

    } catch (error) {
        console.error('Error en getSubcategoriasPorCategorias: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categorías',
            error: error.message
        })
    }
};

/**
 * obtener  productos destacados
 * GET /api/catalogo/descatados
 * 
 * @param {Object} req request Express
 * @param {Object } res response  Express
 */

const getProductosDestacados = async (req, res) => {
    try {
        const { limite = 8 } = req.query;
        const { Op } = require('sequelize');

        //Obtener productos mas recientes
        const productos = await Producto.findAll({
            where: { 
                activo: true,
                stock: { [Op.gt]: 0 } 
            },
            include: [
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id', 'nombre'],
                    where: { activo: true}
                },
                {
                    model: Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre'],
                    where: { activo: true}
                }
                
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limite)
        });

        //respuesta exitosa
        res.json({
            success: true,
            data: {
                productos
            }
        });   

    } catch (error) {
        console.error('Error en getProductosDestacados: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos destacados',
            error: error.message
        })
    }
};


    // Exportar todos los controladores
    module.exports = {
        getProductos,
        getProductoById,
        getCategorias,
        getSubcategoriasPorCategoria,
        getProductosDestacados
    }





