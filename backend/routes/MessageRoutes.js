const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Channel = require('../models/Channel');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

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

// Middleware para verificar acceso al canal
const checkChannelAccess = async (req, res, next) => {
    try {
        const channel = await Channel.findById(req.params.channelId);
        if (!channel) {
            return res.status(404).json({ message: 'Canal no encontrado' });
        }

        const user = await User.findById(req.user.userId);
        
        // Los administradores tienen acceso a todos los canales
        if (user.role === 'admin') {
            return next();
        }

        // Verificar si el canal es público o si el usuario tiene acceso
        if (channel.isPublic || channel.allowedUsers.includes(user._id)) {
            next();
        } else {
            res.status(403).json({ message: 'No tienes acceso a este canal' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error al verificar acceso al canal' });
    }
};

// Obtener mensajes de un canal
router.get('/api/messages/:channelId', authenticateToken, checkChannelAccess, async (req, res) => {
    try {
        const messages = await Message.find({ channel: req.params.channelId })
            .populate('userId', 'name')
            .sort({ createdAt: 1 });
        
        res.json(messages);
    } catch (error) {
        console.error('Error al obtener mensajes:', error);
        res.status(500).json({ message: 'Error al obtener los mensajes' });
    }
});

// Crear nuevo mensaje
router.post('/api/messages', authenticateToken, async (req, res) => {
    try {
        const { channelId, text } = req.body;

        // Verificar acceso al canal
        const channel = await Channel.findById(channelId);
        if (!channel) {
            return res.status(404).json({ message: 'Canal no encontrado' });
        }

        const user = await User.findById(req.user.userId);
        if (!channel.isPublic && !channel.allowedUsers.includes(user._id) && user.role !== 'admin') {
            return res.status(403).json({ message: 'No tienes acceso a este canal' });
        }

        const message = new Message({
            text,
            userId: req.user.userId,
            channel: channelId
        });

        await message.save();

        const populatedMessage = await Message.findById(message._id)
            .populate('userId', 'name');

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error('Error al crear mensaje:', error);
        res.status(500).json({ message: 'Error al crear el mensaje' });
    }
});

module.exports = router;