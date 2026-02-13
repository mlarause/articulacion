/**
 * MODELO PRODUCTO 
 * Define la tabla producto en la base datos
 * Almacena los productos
 */

//Importar DataTypes de sequelize
const { DataTypes } = require('sequelize');

//importar instancia de sequelize
const { sequelize } = require('../config/database');

/**
 * Definir el modelo de Producto
 */
const Producto = sequelize.define('Producto', {
    // Campos de la tabla 
    // Id Identificador unico (PRIMARY KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    nombre: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El nombre del producto no puede estar vacio'
            },
            len: {
                args: [3, 200],
                msg: 'El nombre debe tener entre 3 y 200 caracteres'
            }
        }        
    },

    /**
     * Descripcion detallada del producto
     */
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    // Precio del prpducto
    precio:{
        type: DataTypes.DECIMAL(10, 2), // hasta 99,999,999.99
        allowNull: false,
        validate: {
            isDecimal: {
                msg: 'El precio debe ser un numero decimal valido'
            },
            min: {
                args: [0],
                msg: ' El precio no puede ser negativo'
            }
        }
    },

    // Stock del producto cantidad disponible en inventario
    stock:{
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            isInt: {
                msg: 'El stock debe ser un numero entero'
            },
            min: {
                args: [0],
                msg: ' El stock no puede ser negativo'
            }
        }
    },

    /**
     * imagen Nombre del archivo de imagen
     * se guarda solo el nombre ejemplo: coca-cola-producto.jpg
     * la ruta seria uploads/coca-cola-producto.jpg
     */
    imagen: {
        type: DataTypes.STRING(255),
        allowNull: true, // la imagen puede ser opcional
        validate: {
            is: {
                args: /\.(jpg|jpeg|png|gif)$/i,
                msg: 'La imagen deber ser un archivo JPG, JPEG,PNG o GIF'
            }
        }
    },
    
/**
     * categoriaId - ID de la a categoria a la que pertenece (FOREIGN KEY)
     * Esta es la relacion con la tabla categoria 
     */
    subcategoriaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'subcategorias', // nombre de la tabla relacionada
            key: 'id' // campo de la tabla relacionada
        },
        onUpdate: 'CASCADE', // si se actualiza el id, actualizar aca tambien
        onDelete: 'CASCADE', // si se elimina la categoria eliminar las subcategorias 
        validate: {
            notNull: {
                msg: 'Debe seleccionar una subcategoria'
            }
        }
    },
    /**
     * categoriaId - ID de la a categoria a la que pertenece (FOREIGN KEY)
     * Esta es la relacion con la tabla categoria 
     */
    categoriaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'categorias', // nombre de la tabla relacionada
            key: 'id' // campo de la tabla relacionada
        },
        onUpdate: 'CASCADE', // si se actualiza el id, actualizar aca tambien
        onDelete: 'CASCADE', // si se elimina la categoria eliminar las subcategorias 
        validate: {
            notNull: {
                msg: 'Debe seleccionar una categoria'
            }
        }
    },

    /**
     * activo estado de la subcategoria
     * si es false los productos de esta subcategoria se ocultan
     */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }

}, {
    // Opciones del modelo

    tableName: 'productos',
    timestamps: true, // agrega campos de createdAt y updatedAt

    /**
     * indices compuestos para optimizar busquedas
     */
    indexes: [
        {
            //Indice para buscar productos por subcategoria
            fields: ['subcategoriaId']
        },
        {
            //Indice para buscar productos por categoria
            fields: ['categoriaId']
        },

        {
            //Indice para buscar productos activos
            fields: ['activo']
        },
        {
            //Indice para buscar productos por nombre
            fields: ['nombre']
        },
  ],

    /**
     * Hooks Acciones automaticas 
     */

    hooks: {
        /**
         * beforeCreate - sejecuta antes de crear un prpducto
         * valida que la subactegoria y que la categoria esten activas
         */
        beforeCreate: async (producto) => {
            const Categoria = require('./Categoria');
            const Subcategoria = require('./Subcategoria');

            //Buscar subcategoria padre
            const subcategoria = await Subcategoria.findByPk(producto.subcategoriaId);

            if (!subcategoria) {
                throw new Error('La subcategoria seleccionada no existe');
            }

            if (!subcategoria.activo) {
                throw new Error('No se puede crear un producto en una subcategoria inactiva');
            }
        
            //Buscar categoria padre
            const categoria = await Categoria.findByPk(producto.categoriaId);

            if (!categoria) {
                throw new Error('La categoria seleccionada no existe');
            }

            if (!categoria.activo) {
                throw new Error('No se puede crear un producto en una categoria inactiva');
            }

            // validar que la subcategoria pertenezca a una caytegoria 
            if (subcategoria.categoriaId !== producto.categoriaId) {
                throw new Error('La subcategoria no pertenece a la categoria seleccionada');
            }
        },

        /**
         * beforeDestroy: se ejecuta antes de eliminar un producto
         * Elimina la imagen del servidor si existe
         */

        beforeDestroy: async (producto) => {
            if (producto.imagen) {
                const { deleteFile} = require('../config/multer');
                // intenta eliminar la imagen del servidor
                const eliminado = await deleteFile(producto.imagen);

                if (eliminado) {
                    console.log(`Imagen eliminada: ${producto.imagen}`);
                }
            }
        }

    }
});

// METODOS DE INSTANCIA
/**
 * Metodo para obtener la url completa de la imagen
 * 
 * @returns {string|null} - url de la imagen
 */
Producto.prototype.obtenerUrlImagen = function() {
    if (this.imagen) {
        return null; 
    }

     const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
     return `${baseUrl}/uploads/${this.imagen}`;
};

/**
 * metodo para verificar si hay stock disponible
 * 
 * @param {number} cantidad - cantidad deseada
 * @returns {boolean} - true si hay stock suficiente false si no 
 */
Producto.prototype.hayStock = function(cantidad = 3) {
    return this.stock >= cantidad;
};

/**
 * Metodo para reducir el stock
 * util para despues de una venta 
 * @param {number} cantidad - cantidad a reducir
 * @returns {Promise<Producto>} producto actulaizado
 */
Producto.prototype.reducirStock = async function(cantidad) {
    if (this.hayStock(cantidad)) {
        throw new Error('Stock insuficiente');
    }
    this.stock -= cantidad;
    return await this.save();
};

/**
 * Metodo para aumetar el stock
 * util al cancelar uan venta o recibir inventario
 * @param {number} cantidad - cantidad a aumentar
 * @returns {Promise<Producto>} producto actualizado
 * 
 */


/**
 * Metodo para obtener la categoria padre
 * 
 * @returns {Promise<Categoria>} - categoria padre
 */
Subcategoria.prototype.obtenerCategoria = async function(){
    const Categoria = require('./Categoria');
    return await Categoria.findByPk(this.categoriaId);
};

// Exportar modelo Subcategoria
module.exports = Subcategoria;

