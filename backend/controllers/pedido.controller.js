/**
 * Controlador de pedidos 
 * gestion de pedidos 
 * requiere autenmticacion 
 */
//importar modelos 

const Pedido = require('../models/Pedido');
const DetallePedido = require('../models/DetallePedido');
const Carrito = require('../models/Carrito');
const Producto = require('../models/Producto');
const Usuario = require('../models/Usuario');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');

/**
 * Crear pedido desde el carrito (checkout)
 * POST /api/cliente/pedidos
 */

const crearPedido = async (req, res) => {
    const { sequelize } = require('../config/database');
    const t = await sequelize.transaction();

    try {
        const { direccionEnvio, telefono, metodoPago = 'efectivo', notasAdicionales } = req.body;

        //Validacion 1 Direccion requerida
        if (!direccionEnvio || direccionEnvio.trim() === '') {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message : 'La direccion de envio es requerida'
            });
        }

         //Validacion 2 telefono requerida
        if (!telefono || telefono.trim() === '') {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message : 'El telefono es requerido'
            });
        }

         //Validacion 3 metodos de pago
        const metodosValidos = ['efectivo', 'tarjeta', 'transferencia'];
        if (!metodosValidos.includes(metodoPago)) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message : `metodo de pago invalido, opciones: ${metodosValidos.join(', ')}`
            });
        }

        // obtener items del carrito 

        const carritoItems = await Carrito.findAll({
            where: { usuarioId: req.user.usuarioId },
            include: [{
                model: Producto,
                as: 'producto',
                attributes: ['id', 'nombre', 'precio', 'stock', 'activo']
            }],
            transaction: t
        });

        if (itemsCarrito.length === 0) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'El carrito esta vacio '
            });
        }

        //Verificar stock y productos activos 
        const erroresValidacion = [];
        let totalPedido = 0;

        for (const item of itemsCarrito) {
            const producto = item.producto;

            // verificar que el producto este activo
            if (!producto.activo) {
                erroresValidacion.push(`${producto.nombre} ya no esta disponible`);
                continue;
            }

            //Verificar stock suficiente 
            if (item.cantidad > producto.stock) {
                erroresValidacion.push(
                    `${producto.nombre}: stock insufiiente (disponible: ${producto.stock}, solicitado: ${item.cantidad})`
                );
                continue;
            }

            //Calcular total 
            totalPedido += parseFloat(item.precioUnitario) * item.cantidad;
        }

        // ai hay errores de validacion retornar
        if (erroresValidacion.length > 0) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Error en validacion de carrito',
                errores: erroresValidacion
            });
        }

        //crear pedido 
        const pedido = await Pedido.create({
            usuarioId: req.user.usuarioId,
            total: totalPedido,
            estado: 'pendiente',
            direccionEnvio,
            telefono,
            metodoPago,
            notasAdicionales
        }, { transaction: t });

        // crear detalles del pedido y actualizar stock

        const detallesPedido = [];

        for (const item of itemsCarrito) {
            const producto = item.producto;

            //Crear detalle 
            const detalle = await DetallePedido.create({
                pedidoId: pedido.id,
                productoId: producto.id,
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario,
                subtotal: parseFloat(item.precioUnitario) * item.cantidad
            }, { transaction: t });

            detallesPedido.push(detalle);

            // reduicir stock del producto
            producto.stock -= item.cantidad;
            await producto.save({ transaction: t });
        }

        // vaciar carrito
        await Carrito.destroy({
            where: { usuarioId: req.usuario.id },
            transaction: t
        });

        // confirmar transaccion
        await t.commit();

        //cargar pedido con relaciones
        await pedido.reload({
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'nombre', 'email']
                },
                {
                    model: DetallePedido,
                    as: 'detalles',
                    include: [{
                        model: Producto,
                        as: 'producto',
                        attributes: ['id', 'nombre', 'precio', 'imagen']
                    }]
                }
            ]   
        });

        //Respuesta exitosa
        res.status(201).json({
            success: true,
            message: 'Pedido creado exitosamente',
            data: {
                pedido
            }
        });

    } catch (error) {
        //revertir transaccion en caso de error
        await t.rollback();
        console.error('Error al crear pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear el pedido',
            error: error.message
        });
    }
};

/**
 * Obtener pedidos del cliente autenticado 
 * Get /api/cliente/pedidos
 * query: ?estado=pendiente&pagina=1&limite=10
 */

const getMisPedidos = async (req, res) => {
    try {
        const { estado, pagina = 1, limite = 10 } = req.query;

        // filtros
        const where = { usuarioId: req.usuario.id };
        if (estado) where.estado = estado;

        // paginacion
        const offset = (parseInt(pagina) - 1) * parseInt(limite);

        //Cosultar pedidos
        const { count, rows: pedidos } = await Pedido.findAndCountAll({
            where,
            include: [
                {
                    model: DetallePedido,
                    as: 'detalles',
                    include: [{
                        model: Producto,
                        as: 'producto',
                        attributes: ['id', 'nombre', 'imagen']
                    }]
                }
            ],
            limit: parseInt(limite),
            offset,
            order: [['createdAt', 'DESC']]
        });

        // Respuesta exitosa 
        res.json({
            success: true,
            data: {
                pedidos,
                paginacion: {
                    total: count,
                    pagina: parseInt(pagina),
                    limite: parseInt(limite),
                    totalPaginas: Math.ceil(count / parseInt(limite))
            }
        }
    });
    } catch (error) {
        console.error('Error en getMisPedidos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los pedidos',
            error: error.message
        });
    }
};

/**
 * Obtener un pedido especifico por ID
 * Get /api/cliente/pedidos/:id
 * solo puede ver sus pedidos admin todos 
 */

const getPedidoById = async (req, res) => {
    try {
        const { id } = req.params;
        // construir filtros (cliente solo ve sus pedidos admin ve todos) 
        const where = { id };
        if (req.usuario.rol !== 'administrador') {
            where.usuarioId = req.usuario.id;
        }

        //Buscar pedido 
        const pedido = await Pedido.findOne({
            where,
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'nombre', 'email']
                }, 
                {
                    model: DetallePedido,
                    as: 'detalles',
                    include: [{
                        model: Producto,
                        as: 'producto',
                        attributes: ['id', 'nombre', 'descripcion', 'imagen'],
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
                        ]
                    }]
                }
            ]
        });

        if (!pedido) {
            return res.status(404).json({
                success: false,
                message: 'pedido no encontrado'
            });
        }

        //respueste exitosa
        res.json({
            success: true,
            data: {
                pedido
            }
        });
    } catch (error) {
        console.error('Error en getPedidoById:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el pedido',
            error: error.message
        });
    }
}; 

/**
 * Cancelar pedido
 * Put /api/cliente/pedidos/:id/cancelar
 * solo se puede cancelar si el estado es pendiente
 * devuleve el stock a los productos
 */

const cancelarPedido = async (req, res) => {
    const { sequelize } = require('../config/database');
    const t = await sequelize.transaction();

    try {
        const { id } = req.params;

        //buscar pedido solo los propios pedidos
        const pedido = await Pedido.findOne({
            where: {
                id,
                usuarioId: req.usuario.id
            },
            include: [{
                model: DetallePedido,
                as: 'detalles',
                include: [{
                    model: Producto,
                    as: 'producto',
                }]
            }],
            transaction: t
        });

        if (!pedido) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }
        // solo se puede cancelar si esta en pendiente
        if (pedido.estado !== 'pendiente') {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: `no se puede cancelar un pedido en estado '${pedido.estado}'`
            });
        }

        //Devolve stock de los productos
        for (const detalle of pedido.detalles) {
            const producto = detalle.producto;
            producto.stock += detalle.cantidad;
            await producto.save({ transaction: t });
        }

        //actualizar estado del pedido
        pedido.estado = 'cancelado';
        await pedido.save({ transaction: t  });

        await t.commit();

        //respuesta exitosa
        res.json({
            success: true,
            message: 'Pedido cancelado exitosamente',
            data: {
                pedido
            }
        });
    } catch (error) {
        await t.rollback();
        console.error('Error en cancelarPedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cancelar el pedido',
            error: error.message
        });
    }
};

/**
 * admin obtener todos los pedidos
 * get /api/admin/pedidos
 * query ?estado=pendiente&usuarioId=1&pagina=1&limite=10
 */
const getAllPedidos = async (req, res) => {
    try {
        const { estado, usuarioId, pagina = 1, limite =20 } = req.query;

        //filtros 
        const where = {};
        if (estado) where.estado = estado;
        if (usuarioId) where.usuarioId = usuarioId;

        //paginacion
        const offset = (parseInt(pagina) - 1) * parseInt(limite);

        //Consultar pedidos
        const { count, rows: pedidos } = await Pedido.findAndCountAll({
            where,
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'nombre', 'email']
                },
                {
                    model: DetallePedido,
                    as: 'detalles',
                    include: [{
                        model: Producto,
                        as: 'producto',
                        attributes: ['id', 'nombre', 'imagen']
                    }]
                }
            ],
            limit: parseInt(limite),
            offset,
            order: [['createdAt', 'DESC']]
        });

        //Respuesta exitosa 
        res.json({
            success: true,
            data: {
                pedidos,
                paginacion: {
                    total: count,
                    pagina: parseInt(pagina),
                    limite: parseInt(limite),
                    totalPaginas: Math.ceil(count / parseInt(limite))
                }
            }
        });
    } catch (error) {
        console.error('Error en getAllPedidos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los pedidos',
            error: error.message
        });
    }
};

/**
 * adminactualizar estado del pedido
 * PUT /api/admin/pedidos/:id/estado
 * body: { estado }
 */

const actualizarEstadoPedido = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        
        //validar estado
        const estadosValidos = ['pendiente', 'enviado', 'entregado', 'cancelado'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                success: false,
                message: `Estado invalido, opciones: ${estadosValidos.json(',')}`
            });
        }

        //buscar pedido
        const pedido = await Pedido.findByPk(id);

        if (!pedido) {
            return res.status(404).json({
                success: false,
                message: 'pedido no encontrado'
            })
        }

        //actualizar estados
        pedido.estado = estado;
        await pedido.save();

        //recargar con relaciones
        await pedido.reload({
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'nombre', 'email']
                }
            ]
        });

        //respuesta exitosa
        res.json({
            success: true,
            message: 'Estado del pedido actualizado',
            data: {
                pedido
            }
        });  

    } catch (error) {
        console.error('Error en actualizarEstadoPedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el estado del pedido',
            error: error.message
        });
    }
};

/**
 * Obtener estaddisticas de pedidos
 * Get /api/admin/pedidos/estadisticas
 */

const getEstadisticasPedidos = async (req, res) => {
    try {
        const { Op, fn, col } = require('sequelize');

        //Total de pedidos
        const totalPedidos = await Pedido.count();

        //pedidos estado
        const pedidosPorEstado = await Pedido.findAll({
            attributes: [
                'estado',
                [fn('COUNT', col('id')), 'cantidad'],
                [fn('SUM', col('total')), 'totalVentas']
            ],
            group: ['estado']
        });

        //total de ventas
        const totalVentas = await Pedido.sum('total');

        //pedidos hoy 
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const pedidosHoy = await Pedido.count({
            where: {
                createdAt: { [Op.gte]: hoy } //pedidos ultimos 7 dias 
            }
        });

        //Respuesta exitosa
        res.json({
            success: true,
            data: {
                totalPedidos,
                pedidosHoy,
                ventasTotales: parseFloat(totalVentas || 0).toFixed(2),
                pedidosPorEstado: pedidosPorEstado.map(p => ({
                    estado: p.estado,
                    cantidad: parseInt(p.getDataValue('cantidad')),
                    totalVentas: parseFloat(p.getDataValue('totalVentas') || 0).toFixed(2)
                }))
            }
        });  
    } catch (error) {
        console.error('Error en getEstadisticasPedidos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las estadísticas',
            error: error.message
        });
    }
};

//Exportar controladores
module.exports = {
    //cliente
    crearPedido,
    getMisPedidos,
    getPedidoById,
    cancelarPedido,
    //admin
    getAllPedidos,
    actualizarEstadoPedido,
    getEstadisticasPedidos

};