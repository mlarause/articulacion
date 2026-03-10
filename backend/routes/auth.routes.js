/**
 * Rutas de autenticacion 
 * dedine los endpoints para registro login y gestion de perfil
 */

//importar Router de express
const express = require('express');
const router = express.Router();

//importar controladores de autenticacion 
const {
    register,
    login,
    getMe,
    updateMe,
    changePassword
} = require('../controllers/auth.controller');

//importar  middleware
const { verificarAuth } = require('../middleware/auth');

//Rutas publicas

router.post('/register', register);

router.post('/login', login);

//rutas protegidas 

router.get('/me', verificarAuth, getMe);

router.put('/me', verificarAuth, updateMe);

router.put('/change-password', verificarAuth, changePassword);

//exportar router
module.exports = router;