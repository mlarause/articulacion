/**CONFIGURACION DE LA BASE DE DATOS */

//Importar Sequelize
const { Sequelize } = require('sequlize');

//Importar dotenv para varibles de entorno
require('dotenv').config();

//Crear instancias de secualize
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',

        //Configuracion de pool de conexiones
        //Mantiene las conexiones abiertas para mejorar el rendimiento 
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        // Configuracion de logging
        //Permite ver la consutas de mysql por consola
        logging: process.env.NODE_ENV === 'development' ? console.log : false,

        //Zone horaria 
        timezone: '-05:00', //Zona horaria de Colombia

        // Opciones adicionales 
        define: {
            // timestamps: true crea automaticamente los campos createdAt y updatedAt
            timestramps: true,

            // underscored: true usa snake_case para nombres de las columnas 
            underscored: false,

            //frazeTableName: true usa el nombre del modelo tal cual para la tabla
            freezeTableName: true

        }
    }
);

/* Funcion para probar la conexion de la base de datos 
esta funcion se llamara al iniciar el servidor 
*/
const testConnection = async () => {
    try {
        //Imtentar autenticar con la base de datos
        await sequelize.authenticate();
        console.log('Conexion a MySQL establecida correctamente');
        return true;
    } catch (error) {
        console.error('X Error al conectar con MySQL:', error.message);
        console.error(' Verifica que XAMPP este corriendo y las credenciales en .env sean corrrectas');
        return false;
    }
};

/* 