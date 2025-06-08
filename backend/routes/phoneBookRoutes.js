const express = require('express');
const router = express.Router();
const phoneBookController = require('../controllers/phoneBookController');
const verifyToken = require('../middleware/auth');

// Proteger todas las rutas con autenticación
router.use(verifyToken);

// Obtener todo el directorio
router.get('/', phoneBookController.getDirectory);

// Buscar en el directorio
router.get('/search', phoneBookController.searchDirectory);

module.exports = router; 