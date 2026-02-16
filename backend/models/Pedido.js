/**
 * MODELO PEDIDO
 * Define la tabla pedido en la base datos
 * Almacena la imformacion de los pedidos realizados por usuarios
 */

//Importar DataTypes de sequelize
const { DataTypes } = require('sequelize');

//importar instancia de sequelize
const { sequelize } = require('../config/database');


/**
 * Definir el modelo de Pedido
 */
const Pedido = sequelize.define('Pedido', {
    // Campos de la tabla 
    // Id Identificadoe unico (PRIMARY KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    // UsuarioId ID del usuario que realizo el pedido
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuarios',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // no se puede eliminar un usuario con pedidos
        validate: {
            notNull: {
                msg: 'Debe especificar un usuario'
            }
        }
    },

    // Total monto total del pedido
    total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: {
                msg: 'El total debe ser un numero decimal valido'
            },
            min: {
                args: [0],
                msg: 'El total no puede ser negativo'
            }
        }
    },

    /**
     * Estado - estado actual del pedido
     * valores posibles:
     * pendiente: pedido creado, esperando pago
     * pagado: pedido pagado, en preparacion
     * enviado: pedido enviado al cliente
     * cancelado: pedido cancelado
     */
    estado: {
        type: DataTypes.ENUM('Pendiente', 'Pagado', 'Enviado', 'Cancelado'),
        allowNull: false,
        defaultValue: 'pendiente',
        validate: {
            isIn: {
                args: [['pendiente', 'pagado', 'enviado', 'cancelado']],
            }
        }
    },

    // Direccion de envio del pedido
    direccionEnvio: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'La direccion de envio es obligatoria'
            }
        }
    },

    // telefono de contacto para el envio
    telefono: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El telefono es obligatorio'
            }
        }
    }, 

    // notas adicionales del pedido (opcional) 
    notas: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    // ProductoId ID del producto en el carrito
    productoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Productos',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // se elimina el producto del carrito
        validate: {
            notNull: {
                msg: 'Debe especificar un producto'
            }
        }
    },

    // Cantidad de este producto en el carrito
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            isInt: {
                msg: 'La cantidad debe ser un numero entero'
            },
            min: {
                args: [1],
                msg: 'La cantidad debe ser al menos 1'
            }
        }
    },

    /**
     * Precio Unitario del producto al momento de agregarlo al carrito
     * se guarda para mentener el precio aunque el producto cambie de precio
     */
    precioUnitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: {
                msg: 'El precio debe ser un numero decimal valido'
            },
            min: {
                args: [0],
                msg: 'El precio no puede ser negativo'
            }
        }
    }
}, {
    // opciones del modelo

    tableName: 'carritos',
    timestamps: true,
    //indices para mejorar las busquedas
    indexes: [
        {
            //indice para buscar carrito por usuario
            fields: ['usuarioId']
        },

        {
        //Indice compuesto: un usuario no puede tener el mismo producto duplicado
        unique: true,
        fields: ['usuarioId', 'productoId'],
        name: 'usuario_producto_unique'
        }
    ],

    /**
     * Hooks Acciones automaticas 
     */

    hooks: {
        /**
         * beforeCreate - se ejecuta antes de crear un item en el carrrito
         * valida que este esta activo y tenga stock suficiente 
         */
        beforeCreate: async (itemCarrito) => {
            const Producto = require('./Producto');

            //Buscar el producto
            const producto = await Producto.findByPk(itemCarrito.productoId);

            if (!producto) {
                throw new Error('el producto no existe');
            }

            if (!producto.activo) {
                throw new Error('No se puede agregar un producto inactivo al carrito');
            }

            if (!producto.hayStock(itemCarrito.cantidad)) {
                throw new Error(`Stock insuficiente. solo hay ${producto.stock} unidades siponible`);
            }

            //Guardar el precio actual del producto
            itemCarrito.precioUnitario = producto.precio
        },
        /**
         * BeforeUpdate: se ejecuta antes de actualizar un carrito
         * valida que haya stock suficiente si se aumenta la cantidad
         */
        BeforeUpdate: async (itemCarrito) => {
            
            if (itemCarrito.changed('cantidad')) {
                const Producto = require('./Producto');
                const producto = await Producto.findByPk(itemCarrito.productoId);

                if (!producto) {
                    throw new Error('El producto no existe');
                }

                if (!producto.hayStock(itemCarrito.cantidad)) {
                    throw new Error(`Stock insuficiente. solo hay ${producto.stock} unidades disponibles`);
                }
            }            
        }
    }
});

// METODOS DE INSTANCIA
/**
 * Metodo para calcular el subtotal de este item 
 * 
 * @returns {number} - Subtotal (precio * cantidad)
 */
Carrito.prototype.calcularSubtotal = function(){
    return parseFloat(this.precioUnitario) * this.cantidad;
};

/**
 * Metodo para actualizar la contidad
 * @param {number} nuevaCantidad -nueva cantidad
 * @returns {Promise} Item actualizado * 
 */
Carrito.prototype.actualizarCantidad = async function (nuevaCantidad) {
    const Producto = require('./Producto');

    const producto = await Producto.findByPk(this.productoId);

    if (!producto.hayStock(nuevaCantidad)) {
        throw new Error(`Stock insuficiente. solo hay ${producto.stock} unidades disponibles`);
    }

    this.cantidad = nuevaCantidad;
    return await this.save();
};

/**
 * Metodo para obtener el carrito completo de un usuario
 * incluye informcion de los productos
 * @param {number} usuarioId - id del usuario
 * @returns {Promise<Array} - Items del carrito con productos
 */
Carrito.obtenerCarritoUsuario = async function(usuarioId) {
    const Producto = require('./Producto');

    return await this.findAll({
        where: { usuarioId},
        include: [
            {
                model: Producto,
                as: 'producto'
            }
        ],
        order: [['createdAt', 'DESC']]
    });
};

/**
 * Metodo para calcular el total del carrito de un usuario
 * @param {number} usuarioId id del usuario
 * @returns {Promise<number>} total del carrito
 */ 
Carrito.calcularTotalCarrito = async function(usuarioId) {
    const items= await this.findAll({
        where: { usuarioId}
    });

    let total = 0;
    for (const item of items) {
        total += item.calcularSubtotal();
    }
    return total;
};

/**
 * Metodo para vaciar el carrito de un usuario
 * util despues de realizar un pedido * 
 * @param {number} usuarioId - id del usuario
 * @returns {Promise<number>} numero de items eliminados
 */
Carrito.vaciarCarrito = async function(usuarioId) {
    return await this.destroy({
        where: { usuarioId }
    });
};

// Exportar modelo
module.exports = Carrito;

   