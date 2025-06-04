const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const jwt = require('jsonwebtoken');
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

// Middleware para verificar si es administrador
const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        if (user && user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Acceso denegado: se requieren privilegios de administrador' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error al verificar privilegios de administrador' });
    }
};

// Obtener todos los anuncios activos
router.get('/', authenticateToken, async (req, res) => {
    try {
        const announcements = await Announcement.find({ active: true })
            .sort({ timestamp: -1 })
            .populate('author', 'name');
        
        res.json(announcements);
    } catch (error) {
        console.error('Error al obtener los anuncios:', error);
        res.status(500).json({ message: 'Error al obtener los anuncios' });
    }
});

// Crear un nuevo anuncio (solo admin)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { title, content } = req.body;
        
        console.log('Datos recibidos:', req.body);
        console.log('Usuario autenticado:', req.user);

        if (!title || !content) {
            return res.status(400).json({ 
                message: 'El título y el contenido son requeridos',
                received: { title, content }
            });
        }

        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                message: 'Usuario no autenticado correctamente',
                user: req.user
            });
        }

        const announcement = new Announcement({
            title,
            content,
            author: req.user.userId
        });

        const savedAnnouncement = await announcement.save();
        console.log('Anuncio guardado:', savedAnnouncement);

        const populatedAnnouncement = await Announcement.populate(savedAnnouncement, {
            path: 'author',
            select: 'name'
        });

        return res.status(201).json({
            message: 'Anuncio creado exitosamente',
            announcement: populatedAnnouncement
        });
    } catch (error) {
        console.error('Error detallado al crear el anuncio:', error);
        return res.status(500).json({ 
            message: 'Error al crear el anuncio',
            error: error.message 
        });
    }
});

// Eliminar un anuncio (solo admin)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const announcement = await Announcement.findByIdAndDelete(req.params.id);
        if (!announcement) {
            return res.status(404).json({ message: 'Anuncio no encontrado' });
        }
        res.json({ message: 'Anuncio eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar el anuncio:', error);
        res.status(500).json({ message: 'Error al eliminar el anuncio' });
    }
});

module.exports = router; 