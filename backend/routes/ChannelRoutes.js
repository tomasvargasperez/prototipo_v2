const express = require('express');
const router = express.Router();
const Channel = require('../models/Channel');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const socket = require('../socket');

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

// Obtener todos los canales (admin)
router.get('/all', authenticateToken, isAdmin, async (req, res) => {
    try {
        const channels = await Channel.find()
            .populate('createdBy', 'name')
            .populate('allowedUsers', 'name email');
        
        res.json(channels);
    } catch (error) {
        console.error('Error al obtener canales:', error);
        res.status(500).json({ message: 'Error al obtener los canales' });
    }
});

// Obtener canales disponibles para un usuario
router.get('/', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        
        // Si es admin, obtiene todos los canales activos
        if (user.role === 'admin') {
            const channels = await Channel.find({ active: true });
            return res.json(channels);
        }

        // Para usuarios normales, obtener canales públicos y aquellos donde tienen permiso
        const channels = await Channel.find({
            $and: [
                { active: true },
                {
                    $or: [
                        { isPublic: true },
                        { allowedUsers: user._id }
                    ]
                }
            ]
        });
        
        res.json(channels);
    } catch (error) {
        console.error('Error al obtener canales:', error);
        res.status(500).json({ message: 'Error al obtener los canales' });
    }
});

// Crear nuevo canal (solo admin)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, description, isPublic, allowedUsers } = req.body;

        const channel = new Channel({
            name,
            description,
            isPublic,
            allowedUsers: allowedUsers || [],
            createdBy: req.user.userId
        });

        const savedChannel = await channel.save();
        const populatedChannel = await Channel.populate(savedChannel, [
            { path: 'createdBy', select: 'name' },
            { path: 'allowedUsers', select: 'name email' }
        ]);

        // Emitir evento de actualización del dashboard
        socket.getIO().emit('dashboard_update');

        res.status(201).json(populatedChannel);
    } catch (error) {
        console.error('Error al crear canal:', error);
        res.status(500).json({ 
            message: 'Error al crear el canal',
            error: error.message 
        });
    }
});

// Actualizar canal (solo admin)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, description, isPublic, allowedUsers, active } = req.body;
        
        const updatedChannel = await Channel.findByIdAndUpdate(
            req.params.id,
            {
                name,
                description,
                isPublic,
                allowedUsers,
                active
            },
            { new: true }
        ).populate('createdBy', 'name')
         .populate('allowedUsers', 'name email');

        if (!updatedChannel) {
            return res.status(404).json({ message: 'Canal no encontrado' });
        }

        res.json(updatedChannel);
    } catch (error) {
        console.error('Error al actualizar canal:', error);
        res.status(500).json({ message: 'Error al actualizar el canal' });
    }
});

// Eliminar canal (solo admin)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const channel = await Channel.findByIdAndDelete(req.params.id);
        
        if (!channel) {
            return res.status(404).json({ message: 'Canal no encontrado' });
        }

        // Emitir evento de actualización del dashboard
        socket.getIO().emit('dashboard_update');

        res.json({ message: 'Canal eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar canal:', error);
        res.status(500).json({ message: 'Error al eliminar el canal' });
    }
});

module.exports = router; 