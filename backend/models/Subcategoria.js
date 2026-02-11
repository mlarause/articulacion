/**
 * MODELO SUBCAREGORIA 
 * Define la tabla subcategoria en la base datos
 * Almacena las subcategorias de los productos
 */

//Importar DataTypes de sequelize
const { DataTypes } = require('sequelize');

//importar instancia de sequelize
const { sequelize } = require('../config/database');

/**
 * Definir el modelo de Subcategoria
 */
const Subcategoria = sequelize.define('Subcategoria', {
    // Campos de la tabla 
    // Id Identificador unico (PRIMARY KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
            msg: 'Ya existe una subcategoria con ese nombre'
        },
        validate: {
            notEmpty: {
                msg: 'El nombre de la subcategoria no puede estar vacio'
            },
            len: {
                args: [2, 100],
                msg: 'El nombre debe tener entre 2 y 100 caracteres'
            }
        }
    },

    /**
     * Descripcion de la subcategoria
     */
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
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

    tableName: 'subcategorias',
    timestamps: true, // agrega campos de createdAt y updatedAt

    /**
     * indices compuestos para optimizar busquedas
     */
    indexes: [
        {
            //Indice para buscar subcategorias por categoria
            fields: ['categoriaId']
        },
        {
            //Indice compuesto: nombre unico por categoria
            //Permite que dos categorias diferentes tengan subcategorias con el mismo nombre
            unique: true,
            fields: ['nombre', 'categoriaId'],
            name: 'nombre_categoria_unique'
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

