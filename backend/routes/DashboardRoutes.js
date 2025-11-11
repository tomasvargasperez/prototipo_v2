const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Channel = require('../models/Channel');
const Message = require('../models/Message');
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

// Obtener datos del dashboard
router.get('/dashboard', authenticateToken, isAdmin, async (req, res) => {
    try {
        console.log('📊 Iniciando recopilación de datos del dashboard...');

        // Obtener totales
        const totalUsers = await User.countDocuments();
        console.log('👥 Total usuarios:', totalUsers);

        const totalChannels = await Channel.countDocuments({ active: true });
        console.log('💬 Total canales activos:', totalChannels);

        const totalMessages = await Message.countDocuments();
        console.log('✉️ Total mensajes:', totalMessages);

        // Obtener actividad por canal
        console.log('🔍 Consultando actividad por canal...');
        const channelActivity = await Message.aggregate([
            {
                $group: {
                    _id: '$channel',
                    messages: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'channels',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'channelInfo'
                }
            },
            {
                $unwind: '$channelInfo'
            },
            {
                $project: {
                    name: '$channelInfo.name',
                    messages: 1
                }
            },
            {
                $sort: { messages: -1 }
            }
        ]);
        console.log('📊 Actividad por canal: consultada exitosamente');

        // Obtener usuarios más activos
        console.log('🔍 Consultando usuarios más activos...');
        const topUsers = await Message.aggregate([
            {
                $group: {
                    _id: '$userId',
                    messages: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            {
                $unwind: '$userInfo'
            },
            {
                $project: {
                    name: '$userInfo.name',
                    messages: 1
                }
            },
            {
                $sort: { messages: -1 }
            },
            {
                $limit: 5
            }
        ]);

        // Asignar ranking manualmente
        const rankedUsers = topUsers.map((user, index) => ({
            ...user,
            rank: index + 1
        }));

        // console.log('👥 Top usuarios:', rankedUsers);

        // Obtener actividad de usuarios por día (últimos 7 días)
        console.log('🔍 Consultando actividad diaria...');
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const userActivityResults = await Message.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Procesar los resultados de actividad
        const userActivity = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const activityForDate = userActivityResults.find(r => r._id === dateStr);
            userActivity.push({
                date: dateStr,
                count: activityForDate ? activityForDate.count : 0
            });
        }

        // console.log('📅 Actividad diaria:');

        // Simular datos de conexiones por hora
        const connections = Array.from({ length: 24 }, (_, i) => ({
            hour: `${i.toString().padStart(2, '0')}:00`,
            count: Math.floor(Math.random() * 50) + 10
        }));

        const activeConnections = Math.floor(Math.random() * 20) + 5;

        const responseData = {
            totalUsers,
            totalChannels,
            totalMessages,
            activeConnections,
            channelActivity,
            topUsers: rankedUsers,
            userActivity,
            connections
        };

        console.log('✅ Datos del dashboard recopilados exitosamente\n');
        res.json(responseData);
    } catch (error) {
        console.error('❌ Error al obtener datos del dashboard:', error);
        res.status(500).json({ message: 'Error al obtener datos del dashboard' });
    }
});

module.exports = router; 