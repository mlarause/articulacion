/** Rutas del cliente| 
 * rutas publicas  y para los clientes atenticados 
 */

const express = require('express');
const router = express.Router();

// importar los middlewares
const { verificarAuth } = require('../middleware/auth');
const { esCliente } = require ('../middleware/checkRole');


//importar  controladores
const catalogoController = require('../controllers/catalogo.controller');
const carritoController = require('../controllers/carrito.controller');
const pedidoController = require('../controllers/pedido.controller');


//Rutas publicas catalogo
// get /api/catalogo/productos

router.get('/catalogo/productos', catalogoController.getProductos);

// get /api/catalogo/productos/:id
router.get('/catalogo/productos/:id', catalogoController.getProductoById);

// get /api/admin/catalago/categorias
router.get('/catalago/categorias', catalogoController.getCategorias);

// get  /api/catalogo/categoria/:id/subcategorias
router.get('/catalogo/categorias/:id/subcategorias', catalogoController.getSubcategoriasPorCategoria);


// GET /api/catalogo/destacados
router.get('/catalogo/destacados', catalogoController.getProductosDestacados);



//Rutas del carrito 
// get /api/cliente/carrito

router.get('/cliente/carrito', verificarAuth, carritoController.getCarrito);      

// POST /api/cliente/carrito
router.post('/cliente/carrito',verificarAuth, carritoController.agregarAlCarrito);


// PUT /api/cliente/carrito/:id
router.put('/cliente/carrito/:id', verificarAuth, carritoController.actualizarItemCarrito);

// delete /api/cliente/carrito/:id
//Eliminar un item del carrito
router.delete('/cliente/carrito/:id', verificarAuth, carritoController.eliminarItemCarrito);

// delete /api/cliente/carrito/:id
//vaciar carrito
router.delete('/cliente/carrito', verificarAuth, carritoController.vaciarCarrito);


//Rutas de pedidos -cliente  

// POST /api/admin/productos
router.post('/cliente/pedidos', verificarAuth, pedidoController.crearPedido);


// GEt /api/cliente/pedidos
router.get('/cliente/pedidos', verificarAuth, pedidoController.getMisPedidos);

// GEt /api/cliente/pedidos/:id
router.get('/cliente/pedidos/:id', verificarAuth, pedidoController.getPedidoById);


// PUT /api/cliente/pedidos/:id/cancelar
router.put('/cliente/pedidos/:id/cancelar', verificarAuth, pedidoController.cancelarPedido);


module.exports = router;




