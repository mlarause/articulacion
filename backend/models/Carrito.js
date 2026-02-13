/**
 * MODELO CARRITO
 * Define la tabla Carrito en la base datos
 * Almacena los productos que cada usuario ha agregado a su carrito
 */

//Importar DataTypes de sequelize
const { DataTypes } = require('sequelize');

//importar instancia de sequelize
const { sequelize } = require('../config/database');
const { timeStamp } = require('console');

/**
 * Definir el modelo de Carrito
 */
const Carrito = sequelize.define('Carrito', {
    // Campos de la tabla 
    // Id Identificadoe unico (PRIMARY KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    // UsuarioId ID del usuario dueño del carrito
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuarios',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // si se elimina el uausrio se elimina su carrito
        validate: {
            notNull: {
                msg: 'Debe especificar un usuario'
            }
        }
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
         * beforeCreate - sejecuta antes de crear una subactegoria
         * verifica que la categoria padre este activa
         */
        beforeCreate: async (subcategoria) => {
            const Categoria = require('./Categoria');

            //Buscar categoria padre
            const categoria = await Categoria.findByPk(subcategoria.categoriaId);

            if (!categoria) {
                throw new Error('La categoria seleccionada no existe');
            }

            if (!categoria.activo) {
                throw new Error('No se puede crear una subcategoria en una categoria inactiva');
            }
        },
        /**
         * afterUpdate: se ejecuta despues de actualizar una subcategoria
         * si se desactiva una subcategoria se desactivan todos sus productos
         */
        afterUpdate: async (subcategoria, options) => {
            //Verificar si el campo activo cambio
            if (subcategoria.changed('activo') && !subcategoria.activo) {
                console.log(`Desactivando subcategoria: ${subcategoria.nombre}`);

                // Importar modelos (aqui para evitar dependencias circulares)
                const Producto = require('./Producto');

                try {
                    // Paso 1 desactivar los productos de esta subcategoria
                    const productos = await Producto.findAll({
                        where: { subcategoriaId: subcategoria.id}
                    });

                    for (const producto of productos) {
                        await producto.update({ activo: false }, { transaction: options.transaction });
                        console.log(` Producto desactivado: ${producto.nombre}`);
                    }
                    console.log(`Subcategoria y productos relacionados desactivados correctamente`);
                } catch (error) {
                    console.error('Error al desactivar productos relacionados', error.message);
                    throw error;
                }
            }

            // Si se activa un categoria no se activan automaticamente las subcategorias y productos 
        }
    }
});

// METODOS DE INSTANCIA
/**
 * Metodo para contar produsctos de esta subcategoria 
 * 
 * @returns {Promise<number>} - numero de productos
 */
Subcategoria.prototype.contarproductos = async function(){
    const Producto = require('./Producto');
    return await Producto.count({ 
        where: {subcategoriaId: this.id}});
};

}





    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
            msg: 'Ya existe una cetagoria con ese nombre'
        },
        validate: {
            notEmpty: {
                msg: 'El nombre de la categoria no puede estar vacio'
            },
            len: {
                args: [2, 100],
                msg: 'El nombre debe tener entre 2 y 100 caracteres'
            }
        }
    },

    /**
     * Descripcion de la categoria
     */
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    