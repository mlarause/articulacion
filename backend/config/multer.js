/**
 * Configuracion de subida de archivos
 * 
 * Multer es un middleware para menejar la subida de archivos
 * Este archivo configura como y donde se guardan las imagenes
 */

// importar multer para manejar archivos 
const multer = require('multer');

//Importar path para trabajar con rutas de archivos 
const path = require('path');

// Importar fs para verificar /crear directorios
const fs = require('fs');

// importar dotenv para variables de entorno
require('dotenv').config();

// Obtener la ruta donde se guardan los archivos
const uploadPath = process.env.UPLOAD_PATH || './uploads';

//Verificar si la carpeta uploads existe, si no crearla
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log(`Carpeta ${uploadPath} creada`);
}

/**
 * Configuracion de almacenamiento de multer
 * Define donde y como se guardaran los archivos
 */

const storage = multer.diskStorage({
    /**
     * Destination: define la carpeta destino donde se guardara el arechivo
     * 
     * @param {Object} req - Objeto de peticion HTTP
     * @param {Object} file - Archivo que esta subiendo
     * @param {Function} cb - Callback que se llama con (error, destination)
     */
    destination: function (req, file, cb) {
        // cb(null, ruta) -> sin error, ruta = carpeta destino
        cb(null, uploadPath);
    },

    /**
     * filename: Define el nombre con el que se guardara el archivo
     * formato: timestamp-nombreoriginal.ext
     * 
     * @param {Object} req - Objeto de peticion HTTP
     * @param {Object} file - Archivo que se esta subiendo
     * @param {Function} cb - Callback que se llama con (error, filename)
     */
    filename: function (req, file, cb) {
        //Generar nombte unico usando timestamp + nombre original
        //Date.now() genera un timestamp unico
        //path.extname()  extrae la extension del archivo (.jpg, .png, etc)
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

/**
 * Filtro para validar el tipo de archivo
 * solo permite imagenes (jpg, jpeg, png, gif)
 * 
 * @param {Object} req - Objeto de peticion HTTP
 * @param {Object} file - Archivo que se esta subiendo
 * @param {Function} cb - Callback que se llama con (error, acceptFile)
 */