// Importaciones
const express = require('express'); 
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const userRoutes = require('./routes/UserRoutes');
const messageRoutes = require('./routes/MessageRoutes');
const suggestionRoutes = require('./routes/SuggestionRoutes');
const announcementRoutes = require('./routes/AnnouncementRoutes');
const channelRoutes = require('./routes/ChannelRoutes');
const dashboardRoutes = require('./routes/DashboardRoutes');
const phoneBookRoutes = require('./routes/phoneBookRoutes');
const Message = require('./models/Message');
const User = require('./models/User');
const socket = require('./socket');
const { sanitizeMessage, desanitizeMessage } = require('./utils/sanitize');

// Cargar variables de entorno
dotenv.config();

// Configurar Mongoose para suprimir advertencia de deprecación
mongoose.set('strictQuery', true);

// Inicialización de Express y servidor HTTP
const app = express();
const server = http.createServer(app);

// Inicializar Socket.IO
const io = socket.init(server);

// Conexión a MongoDB
const DB_URL = process.env.DB_URL || 'mongodb://localhost:27017/chat_bbdd'; 
mongoose.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: false // Deshabilitar la creación automática de índices
})
.then(async () => {
    console.log('✅ Conexión a la base de datos exitosa');
    // Crear índices manualmente
    try {
        const Message = mongoose.model('Message');
        await Message.syncIndexes();
        console.log('✅ Índices sincronizados correctamente');
    } catch (error) {
        console.error('❌ Error al sincronizar índices:', error);
    }
})
.catch((error) => console.error('❌ Error al conectar a la base de datos:', error));

// Middlewares
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Socket.IO: Manejo de mensajes y canales
io.on('connection', (socket) => {
    console.log('🔌 Usuario conectado:', socket.id);

    socket.on('join_channel', async (channelId) => {
        if (!channelId) {
            console.error('❌ No se proporcionó ID del canal');
            return;
        }
        
        socket.join(channelId);
        console.log(`📨 Usuario unido al canal: ${channelId}`);
        try {
            const messages = await Message.find({ channel: channelId })
                .sort({ createdAt: 1 })
                .populate('userId', 'name')
                .lean();
            
            // Transformar los mensajes antes de enviarlos, manejando usuarios nulos
            const formattedMessages = messages
                .filter(msg => msg.userId != null) // Filtrar mensajes con usuarios nulos
                .map(msg => ({
                    _id: msg._id,
                    text: desanitizeMessage(msg.text), // Desanitizar para mostrar legible
                    userId: msg.userId._id,
                    author: msg.userId.name || 'Usuario Eliminado',
                    timestamp: msg.createdAt
                }));
            
            socket.emit('message_history', formattedMessages);
        } catch (error) {
            console.error("❌ Error al cargar historial:", error);
            socket.emit('error', { message: 'Error al cargar el historial de mensajes' });
        }
    });

    socket.on('send_message', async ({ channelId, text, userId }) => {
        try {
            // Validar si userId existe
            if (!userId) {
                console.error("❌ No se recibió userId");
                return;
            }

            // Validar que userId sea un ObjectId válido
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                console.error("❌ userId no es un ObjectId válido:", userId);
                return;
            }

            // Sanitizar el texto del mensaje antes de guardar
            const sanitizedText = sanitizeMessage(text);
            
            // Crear y guardar el mensaje
            const newMessage = new Message({
                text: sanitizedText,
                userId,
                channel: channelId
            });
            
            const savedMessage = await newMessage.save();

            // Popular el usuario
            const populatedMessage = await Message.findById(savedMessage._id)
                .populate('userId', 'name');

            // Emitir mensaje al canal (desanitizado para mostrar legible)
            io.to(channelId).emit('new_message', {
                _id: populatedMessage._id,
                text: desanitizeMessage(populatedMessage.text), // Desanitizar para mostrar legible
                userId: populatedMessage.userId._id,
                author: populatedMessage.userId.name,
                timestamp: populatedMessage.createdAt
            });
        } catch (error) {
            console.error("❌ Error al guardar mensaje:", error);
        }
    });

    socket.on('disconnect', () => {
        console.log('⚠️ Usuario desconectado:', socket.id);
    });
});

// Rutas API
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/admin', dashboardRoutes);
app.use('/api/phonebook', phoneBookRoutes);

// Rutas de autenticación (deben ir después de las rutas API)
app.use('/', userRoutes);

// Producción: servir frontend de Vue (si haces build)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/vue-app/dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/vue-app/dist/index.html'));
    });
}

// Puerto y arranque del servidor
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`🚀 Servidor backend escuchando en el puerto ${port}`);
});