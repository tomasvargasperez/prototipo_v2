const express = require('express');
const router = express.Router();
const SuggestionSchema = require('../models/Suggestion');
const jwt = require('jsonwebtoken');
const { encrypt, decrypt } = require('../utils/encryption');
const User = require('../models/User');

// Middleware de autenticación
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No se proporcionó token de acceso' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Token inválido' });
    }
};

// Middleware para verificar si es admin
const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        if (user && user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Acceso denegado: se requieren permisos de administrador' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error al verificar permisos de administrador' });
    }
};

// Crear una nueva sugerencia
router.post('/', authenticateToken, async (req, res) => {
    try {
        if (!req.body.content || typeof req.body.content !== 'string') {
            return res.status(400).json({ 
                success: false,
                message: 'El contenido de la sugerencia es requerido' 
            });
        }

        // Encriptar el contenido
        let encryptedContent;
        try {
            encryptedContent = encrypt(req.body.content);
        } catch (encryptError) {
            console.error('Error al encriptar:', encryptError);
            return res.status(500).json({ 
                success: false,
                message: 'Error al procesar la sugerencia' 
            });
        }
        
        const suggestion = new SuggestionSchema({
            content: encryptedContent,
            status: 'pending'
        });

        const savedSuggestion = await suggestion.save();
        
        res.status(201).json({
            success: true,
            message: 'Sugerencia guardada exitosamente',
            data: {
                id: savedSuggestion._id,
                timestamp: savedSuggestion.timestamp,
                status: savedSuggestion.status
            }
        });
    } catch (error) {
        console.error('Error al guardar la sugerencia:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al crear la sugerencia',
            error: error.message 
        });
    }
});

// Obtener todas las sugerencias (solo admin)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const suggestions = await SuggestionSchema.find().sort({ timestamp: -1 });
        
        // Desencriptar el contenido de cada sugerencia
        const decryptedSuggestions = suggestions.map(suggestion => {
            try {
                return {
                    _id: suggestion._id,
                    content: decrypt(suggestion.content),
                    timestamp: suggestion.timestamp,
                    status: suggestion.status
                };
            } catch (decryptError) {
                console.error('Error al desencriptar sugerencia:', decryptError);
                return {
                    _id: suggestion._id,
                    content: '[Error al desencriptar contenido]',
                    timestamp: suggestion.timestamp,
                    status: suggestion.status
                };
            }
        });
        
        res.json(decryptedSuggestions);
    } catch (error) {
        console.error('Error al obtener las sugerencias:', error);
        res.status(500).json({ message: 'Error al obtener las sugerencias' });
    }
});

// Actualizar el estado de una sugerencia (solo admin)
router.put('/:id/status', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!['pending', 'reviewed', 'implemented'].includes(status)) {
            return res.status(400).json({ message: 'Estado no válido' });
        }

        const suggestion = await SuggestionSchema.findById(req.params.id);
        
        if (!suggestion) {
            return res.status(404).json({ message: 'Sugerencia no encontrada' });
        }

        suggestion.status = status;
        await suggestion.save();

        res.json({ message: 'Estado actualizado correctamente', suggestion });
    } catch (error) {
        console.error('Error al actualizar el estado:', error);
        res.status(500).json({ message: 'Error al actualizar el estado de la sugerencia' });
    }
});

module.exports = router; 