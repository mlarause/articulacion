/**
 * SERVIDOR PRINCIPAL DEL BACKEND
 * este el archivo principal del servidor del backend
 * configura express. middlewares, rutas y conexion de base de datos
 */

// IMPORTACIONES

// Importar express para crear el servidor
const express = require('express');

//importar cors para permitir solicitudes desde el frontend+
const cors = require('cors');

// importar path para manejar rutas de archivos
const path = require('path');

// Importar dotenv para manejar variables de entorno
require('dotenv').config();

//importar configuarcion de la base de datos
const dbConfig = require('./config/database');

// importar modelos y asociaciones
const { initAssociations } = require('./models');

// importar seeders 
const { runSeeders } = require('./seeders/adminSeeder');


//Crear aplicaciones express

const app = express();

//Obtener el puerto desde la variable de entorno 
const PORT = process.env.PORT || 5000;

// MIDDLEWARES GLOBALES

//cors permiter peticiones desde el frontend
//configura que los dominios pueden hacer peticiones al backend 

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // url del frontend
    credentials: true,//permite envio de cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization']// Headers permitidos
})); 

/**
 * express.json() parsear el body de las peticiones en formato JSON
 */

app.use(express.json());

/**
 * express.urlencoded() pasar el body de los formularios
 * las imagenes  estaran disponibles  
 */

app.use(express.urlencoded({ extended: true }));

/**
 * servir archivos estaticos iamagenes desde la carpera raiz 
 */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// middleware para logging de peticiones
// Muestra en consola cada peticion que llega el servidor 

if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`ok ${req.method} ${req.path}`);
        next();
    });
}

// rutas 

// rutas raiz verificar que el servidor esta corriendo

app.get('/,', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor E-commerce Backend corriendo correctamente',
        version: '1.0.0',
        timeStamp: new Date().toISOString()
    });
});

// ruta de salud verifica que el servidor como esta 
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        database: 'connected',
        timeStamp: new Date().toISOString()
    });
});

//rutas api 

// rutas de autenticacion
// incluye registro login, perfil

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

//Rutas del administrador
//requieren autenticacion y rol de adminsitrador

const adminRoutes = require('./routes/admin.routes');
app.use('/api/admin', adminRoutes);

//Rutas del cliente

const clienteRoutes = require('./routes/cliente.routes');
app.use('/api', clienteRoutes);

// Manejo de rutas no encontradas (404)

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        path: req.path,
    });
});

// Manejo de errores globales

app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    //Error de multer subida de archivos
    if (err.name === 'MulterError') {
        return res.status(400).json({
            success: false,
            message: 'Error al subir el archivo',
            error: err.message,
        });
    }

    // otros errores 
    res.status(500).json({
        success: false,
        message: err.message || 'error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// inicializar servidor y base de datos 

/**
 * funcion principal para iniciar el servidor
 * prueba la conexion a MySQL
 * sincriniza los modelos (crea las tablas)
 * inicia el servidor express
 */

const startServer = async () => {
    try {
        //paso 1 probar conexion a MySQL
        console.log(' Conectado a MySQL...');
        const dbConnected = await testConnection();

        if (!dbConnected) {
            console.error(' No se pudo conectar a Mysql verificar XAMPP y el archivo .env');
            process.exit(1);//salir si no hay conexion
        }

        //paso 2 sincronizar modelos (crear tablas)
        console.log('Sincronizando modelos con la base de datos...');

        //Inicializar asociaciones entre los modelos 
        initAssociations();

        // en desarrollo alter puede ser true para actulizar la estructura
        //en produccion debe ser false para no perder os datos
        const alterTables = process.env.NODE_ENV === 'development';
        const dbSynced = await syncDatabase(false, alterTables);

        if (!dbSynced) {
            console.error('X Error al sincronizar la base den datos ');
            process.exit(1);
        }

        // Paso 3 ejecutar seeders datos iniciales 
        await runSeeders();

        //paso 4 iniciar servidor express
        app.listen(PORT, () => {
            console.log('\n ____________________');
            console.log(`Servidor correindo en el puerto ${PORT}`);
            console.log(`URL: http://localhost:${PORT}`);
            console.log(`base de datos ${process.env.DB_NAME}`);
            console.log(`Modo: ${process.env.NODE_ENV}`);
            console.log('Servidor listo para realizar peticiones');
        });
    } catch (error) {
        console.error('X Error fatal al iniciar el servidor:', error.message);
        process.exit(1);
    }
};

// namejo de cierre 
// captura el ctrl+c para cerrar el servidor correctamente

process.on('SIGINT', () => {
    console.log('\n\n cerrando servidor...');
    process.exit(0);
});

// capturar errores no menjados 

process.on('unhandledRejection', (err) => {
    console.error('X error no manejado', err);
    process.exit(1);
});

// Iniciar servidor 
startServer();

// exportar app para testing 
module.exports = app;