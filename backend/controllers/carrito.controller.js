/**
 * controlador de carrito de compras
 * Gestion de carrito
 * require autenticacion
 */

//importar modelos
const Carrito = require('../models/Carrito');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');

/**
 * obtener carrito de del usuario autenticado
 * GET /api/carrito
 * @param {Object} req request de express con req.usuario del middleware
 * @param {Object} res response de express
 */
const getCarrito = async (req, res) => {
    try {
        // obtener items del carrito con los productos relacionados
        const itemsCarrito = await Carrito.findAll({
            where: { usuarioId: req.usuario.id },
            include: [
                {
                    model: Producto,
                    as: 'producto',
                    attributes: ['id', 'nombre', 'descripcion', 'precio', 'stock', 'imagen', 'activo'],
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
                        },
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        //Calcular el total del carrito
        let totalCarrito = 0;
        itemsCarrito.forEach (item => {
            total += parseFloat(item.precioUnitario) * item.cantidad;
        });

        //respuesta exitosa 
        res.json({
            success: true,
            data: {
                items: itemsCarrito,
                resumen: {
                    totalItems: itemsCarrito.length,
                    cantidadTotal: itemsCarrito.reduce((sum, item) => sum + item.cantidad, 0),
                    totalCarrito: total.toFixed(2)
                }
            }
        });
    } catch (error) {
        console.error('Error en getCarrito', error);
        res.status(500).json({
            success: false,
            message:'Error al obtener el carrito',
            error: error.message
        })
    }
};

/**
 * Agregar producto a carrito
 * POST /api/carrito
 * @param {Object} req request de express
 * @@param {Object} res response express
 */
const agregarAlCarrito = async (req, res) => {
    try {
        const { productoId, cantidad=1 } = req.body;
        //validadcion 1: campos requeridos
        if (!productoId) {
            return res.status(400).json({
                success: false,
                message: 'El productoId es requerido'
            });
        }

        // validacion 2 cantidad valida
        const cantidadNUm = parseInt(cantidad);
        if (cantidadNUm < 1) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad debe ser al menos 1'
            });
        }

        // validacion 3: producto existe y esta activo
        const producto = await Producto.findByPk(productoId);

        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        if (!producto.activo ) {
            return res.status(400).json({
                success: false,
                message: 'el producto no esta disponible'
            });
        }

        //Validaciin 4 verificar si ya existe en el carrito
        const itemExistente = await Carrito.findOne({
            where: {
                usuarioId: req.ususario.id,
                productoId
            }
        });

        if (itemExistente) {
            //Actualizar cantidad
            const nuevaCantidad = itemExistente.cantidad + cantidadNUm;

            //validar stock displonible 
            if (nuevaCantidad > producto.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Stock insuficiente. disponible: ${producto.stock}, En carrito: ${itemExistente.cantidad}`
                });
            }

            itemExistente.cantidad = nuevaCantidad;
            await itemExistente.save();

            //Recargar producto
            await itemExistente.reload({
                include: [{
                    model: Producto,
                    as: 'producto',
                    attributes: ['id', 'nombre', 'precio', 'stock', 'imagen']
                }]
            });

            return res.json({
                success: true,
                message: 'Cnatidad actualizada en el carrito',
                data: {
                    item: itemExistente
                }
            });
        }

        //Validacion 5 stock disponible
        if (cantidadNUm > producto.stock) {
            return res.status(400).json({
                success: false,
                message: `Sockt  insuficiente . Disponible: ${producto.stock}`
            });
        }

        // crear un nuevo item en el carrito
        const nuevoItem = await Carrito.create({
            usuarioId: req.usuario.id,
            productoId,
            cantidad: cantidadNUm,
            precioUnitario: producto.precio
        });

        // Recargar con producto
        await nuevoItem.reload({
            include: [{
                model: Producto,
                as: 'producto',
                attributes: ['id', 'nombre', 'precio', 'stock', 'imagen']
            }]
        });

        // respuesta exitosa 
        res.status(201).json({
            success: true, 
            message: 'Producto agregado al carrito',
            data: {
                item: nuevoItem
            }
        });

    } catch (error) {
        console.error('Error en agregarAlCarrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al agregar producto al carrito',
            error: error.message
        });
    }
};

/**
 * Actualizar cantidad de item del carrito
 * PUT /api/carrito/:id
 * Body { cantidad}
 * @param {Object} req request express
 * @param {Object} res response express
 */
const actualizarItemCarrito = async (req, res )=> {
    try {
        const { id } = req.params;
        const { cantidad } = req.body;

        //validar cantidad
        const cantidadNum = parseInt(cantidad);
        if (cantidadNum < 1 ) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad debe ser al menos 1'
            });
        }

        // Buscar item del carrito
        const item = await Carrito.findOne({
            where: {
                id,
                usuarioId: req.usuario.id //solo puede modificar su propio carrito
            },
            include: [{
                model: Producto,
                as: 'producto',
                attributes: ['id', 'nombre', 'precio', 'stock']
            }]
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item del carrito no encontrado'
            });
        }
        // validar stock disponible
        if (cantidadNum > item.producto.stock) {
            return res.status(400).json({
                success: false,
                message: `Stock insuficiente Disponible: ${item.producto.stock}`
            });
        }

        // actualizar cantidad 
        item.cantidad = cantidadNum;
        await item.save();

        //Respuesta exitosa
        res.json({
            success: true,
            message: 'cantidad actualizada',
            data: {
                item
            }
        });
    } catch (error) {
        console.error('Error en actualizar ItemCarrrito:', error);
        res.status(500).json({
            success: false,
            message: 'error al actualizar item del carrito',
            error: error.message
        });
    }
};

/**
 * Eliminar item del carrito
 * Delete /api/carrito/:id
 */

const eliminarItemCarrito = async (req, res) => {
    try {
        const { id } = req.params;

        //Buscar item 
        const item = await Carrito.findOne({
            where: {
                id,
                usuarioId: req.usuario.id
            }
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado en el carrito'
            });
        }

        //Eliminar 
        await item.destroy();

        //Respuesta exitosa
        res.json({
            success: true,
            message: 'Item eliminado del carrito'
        });

    } catch (error) {
        console.error('Error en eliminarItemCarrito', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar item del carrito',
            error: error.message
        });
    }
};

/**
 * Vaciar todo el carrito
 * DELETE /api/carrito/vaciar 
 * 
 */

const vaciarCarrito = async (req, res) => {
    try {
        //Eliminar todos los items del usuario 
        const itemsEliminados = await Carrito.destroy({
            where: { usuarioId: req.usuario.id }
        });

        res.json({
            success: true,
            message: 'Carrito vaciado',
            data : {
                itemsEliminados
            }
        });
        
    } catch (error) {
        console.error('Error en vaciarCarrito', error); 
        res.status(500).json({
            success: false,
            message: 'Error al vaciar el carrito',
            error: error.message
        });
    }
};

//Exportar controladores
module.exports = {
    getCarrito,
    agregarAlCarrito,
    actualizarItemCarrito,
    eliminarItemCarrito,
    vaciarCarrito
}

