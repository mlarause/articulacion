/**
 * Asociaciones entre modelos
 * este archivo define todas las relaciones entre los modelos de sequelize
 * deje ejecutarse despues de importar los modelos 
 */

// Importar todos los modelos

const Usuario = require('./Usuario');
const Categoria = require('./Categoria');
const Subcategoria = require('./Subcategoria');
const Producto = require('./Producto');
const Carrito = require('./Carrito');
const Pedido = require('./Pedido');
const DetallePedido = require('./DetallePedido');

/**
 * Definir asociaciones 
 * Tipos de realaciones sequelize:
 * hasone 1 - 1
 * belongsto 1 - 1
 * hasmany 1 - N
 * belongstomany N - N
 */

/**
 * Categoria  - Subcategoria
 * Una categoria tiene muchas subcategorias
 * una subcategoria pertenece a una categoria
 */

Categoria.hasMany(Subcategoria, {
    foreignKey: 'categoriaId', // Campo q conecta las tablas
    as: 'subcategorias', // Alias para la relacion
    onDelete: 'CASCADE', // si se elimina categoria eliminar subcategorias
    onUpdate: 'CASCADE' // si se actualiza categoria actualizar subcategorias
});

Subcategoria.belongsTo(Categoria, {
    foreignKey: 'categoriaId', // Campo q conecta las tablas
    as: 'categoria', // Alias para la relacion
    onDelete: 'CASCADE', // si se elimina categoria eliminar subcategorias
    onUpdate: 'CASCADE' // si se actualiza categoria actualizar subcategorias
});

/**
 * Categoria  - producto
 * Una categoria tiene muchos productos
 * un producto pertenece a una categoria
 */

Categoria.hasMany(Producto, {
    foreignKey: 'categoriaId', // Campo q conecta las tablas
    as: 'productos', // Alias para la relacion
    onDelete: 'CASCADE', // si se elimina categoria eliminar el producto
    onUpdate: 'CASCADE' // si se actualiza categoria actualizar el producto
});

Producto.belongsTo(Categoria, {
    foreignKey: 'categoriaId', // Campo q conecta las tablas
    as: 'categoria', // Alias para la relacion
    onDelete: 'CASCADE', // si se elimina categoria eliminar el producto
    onUpdate: 'CASCADE' // si se actualiza categoria actualizar el producto
});

/**
 * Subcategoria y producto
 * Una subcategora tiene muchos productos
 * un producto pertenece a una subcategoria
 */

Subcategoria.hasMany(Producto, {
    foreignKey: 'subcategoriaId', // Campo q conecta las tablas
    as: 'productos', // Alias para la relacion
    onDelete: 'CASCADE', // si se elimina subcategoria eliminar el producto
    onUpdate: 'CASCADE' // si se actualiza subcategoria actualizar el producto
});

Producto.belongsTo(Subcategoria, {
    foreignKey: 'subcategoriaId', // Campo q conecta las tablas
    as: 'subcategoria', // Alias para la relacion
    onDelete: 'CASCADE', // si se elimina subcategoria eliminar el producto
    onUpdate: 'CASCADE' // si se actualiza subcategoria actualizar el producto
});

/**
 * Usuario  - carrito
 * Un usuario tiene muchos carritos
 * un carrito pertenece a un usuario
 */

Usuario.hasMany(Carrito, {
    foreignKey: 'usuarioId', // Campo q conecta las tablas
    as: 'carrito', // Alias para la relacion
    onDelete: 'CASCADE', // si se elimina usuario eliminar el carrito
    onUpdate: 'CASCADE' // si se actualiza usuario actualizar el carrito
});

Carrito.belongsTo(Usuario, {
    foreignKey: 'usuarioId', // Campo q conecta las tablas
    as: 'usuario', // Alias para la relacion
    onDelete: 'CASCADE', // si se elimina usuario eliminar el carrito
    onUpdate: 'CASCADE' // si se actualiza usuario actualizar el carrito
});

/**
 * Producto  - Carrito
 * Un producto tiene muchos carritos
 * un carrito pertenece a un producto
 */

Producto.hasMany(Carrito, {
    foreignKey: 'productoId', // Campo q conecta las tablas
    as: 'carrito', // Alias para la relacion
    onDelete: 'CASCADE', // si se elimina producto eliminar carrito
    onUpdate: 'CASCADE' // si se actualiza producto actualizar carrito
});

Carrito.belongsTo(Producto, {
    foreignKey: 'productoId', // Campo q conecta las tablas
    as: 'producto', // Alias para la relacion
    onDelete: 'CASCADE', // si se elimina producto eliminar carrito
    onUpdate: 'CASCADE' // si se actualiza producto actualizar carrito
});

/**
 * Usuario  - Pedido
 * Un usuario tiene muchos pedidos
 * un pedido pertenece a un usuario
 */

Usuario.hasMany(Pedido, {
    foreignKey: 'usuarioId', // Campo q conecta las tablas
    as: 'pedidos', // Alias para la relacion
    onDelete: 'RESTRICT', // si se elimina usuario no eliminar pedidos
    onUpdate: 'CASCADE' // si se actualiza usuario actualizar pedidos
});

Pedido.belongsTo(Usuario, {
    foreignKey: 'usuarioId', // Campo q conecta las tablas
    as: 'usuario', // Alias para la relacion
    onDelete: 'RESTRICT', // si se elimina usuario no eliminar pedidos
    onUpdate: 'CASCADE' // si se actualiza usuario actualizar pedidos
});

/**
 * Pedido  - DetallePedido
 * Un pedido tiene muchos detalles de productos
 * un detalle de pedido pertenece a un pedido
 */

Pedido.hasMany(DetallePedido, {
    foreignKey: 'pedidoId', // Campo q conecta las tablas
    as: 'detalles', // Alias para la relacion
    onDelete: 'CASCADE', // si se elimina pedido eliminar detalles de pedido
    onUpdate: 'CASCADE' // si se actualiza pedido actualizar detalles de pedido
});

DetallePedido.belongsTo(Pedido, {
    foreignKey: 'pedidoId', // Campo q conecta las tablas
    as: 'pedido', // Alias para la relacion
    onDelete: 'CASCADE', // si se elimina pedido eliminar detalles de pedido
    onUpdate: 'CASCADE' // si se actualiza pedido actualizar detalles de pedido
});

/**
 * Producto  - detalle pedido
 * Un producto puede estar en muchos detalles de pedido
 * un detalla tiene un producto 
 */

Producto.hasMany(DetallePedido, {
    foreignKey: 'productoId', // Campo q conecta las tablas
    as: 'detallesPedidos', // Alias para la relacion
    onDelete: 'RESTRICT', // No se puede eliminar un producto si esta en un detalle de pedido
    onUpdate: 'CASCADE' // si se actualiza producto actualizar detalles de pedido
});

DetallePedido.belongsTo(Producto, {
    foreignKey: 'productoId', // Campo q conecta las tablas
    as: 'producto', // Alias para la relacion
    onDelete: 'RESTRICT', // No se puede eliminar un producto si esta en un detalle de pedido
    onUpdate: 'CASCADE' // si se actualiza producto actualizar detalles de pedido
});

/**
 * realacion muchos a muchos
 * pedido y producto tiene una relacion muchos a muchos atravez de detalle de pedido
 */

Pedido.hasMany(Producto, {
    through: DetallePedido, // tabla intermedia
    foreignKey: 'pedidoId', // Campo q conecta las tablas
    otherKey: 'productoId', // Campo q conecta las tablas
    as: 'productos', // Alias para la relacion
    
});

Producto.hasMany(Pedido, {
    through: DetallePedido, // tabla intermedia
    foreignKey: 'productoId', // Campo q conecta las tablas
    otherKey: 'pedidoId', // Campo q conecta las tablas
    as: 'pedidos', // Alias para la relacion
    
});

/**
 * Exportar funcion de inicializacion
 * funcion para inicializar todas las asociaciones
 * se llama desde server.js despues de cargar los modelos
 */
const initAssociations = () => {
    console.log('Asociaciones entre los modelos establecias correctamente');
};

// Exportar los modelos
module.exports = {
    Usuario,
    Categoria,
    Subcategoria,
    Producto,
    Carrito,
    Pedido,
    DetallePedido,
    initAssociations
};

