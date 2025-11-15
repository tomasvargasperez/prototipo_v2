# Manual Backend - Arquitectura y Funcionamiento Completo

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura del Backend](#arquitectura-del-backend)
3. [Punto de Entrada: app.js](#punto-de-entrada-appjs)
4. [Rutas y Endpoints](#rutas-y-endpoints)
5. [Controladores](#controladores)
6. [Servicios](#servicios)
7. [Middleware](#middleware)
8. [Utilidades](#utilidades)
9. [Socket.IO - Comunicación en Tiempo Real](#socketio---comunicación-en-tiempo-real)
10. [Configuración y Variables de Entorno](#configuración-y-variables-de-entorno)

---

## Introducción

El backend de tu aplicación es el **corazón del sistema**. Maneja toda la lógica de negocio, autenticación, comunicación en tiempo real y acceso a la base de datos. Este manual te explicará cómo está estructurado y cómo funciona cada componente.

### Stack Tecnológico del Backend

- **Node.js**: Runtime de JavaScript
- **Express.js**: Framework web
- **MongoDB**: Base de datos NoSQL
- **Mongoose**: ODM (Object Document Mapper) para MongoDB
- **Socket.IO**: Comunicación en tiempo real
- **JWT**: Autenticación basada en tokens
- **bcrypt**: Hash de contraseñas
- **dotenv**: Gestión de variables de entorno

### Estructura de Carpetas

```
backend/
├── app.js                 # Punto de entrada principal
├── socket.js              # Configuración de Socket.IO
├── models/                # Modelos de Mongoose
├── routes/                # Definición de rutas
├── controllers/           # Lógica de controladores
├── services/              # Servicios de negocio
├── middleware/            # Middleware personalizado
└── utils/                 # Utilidades (sanitización, encriptación)
```

---

## Arquitectura del Backend

### Flujo de Petición HTTP

```
Cliente (Frontend)
    ↓ HTTP Request
Express Server (app.js)
    ↓
Middleware (CORS, JSON parser, Auth)
    ↓
Router (routes/*.js)
    ↓
Controller (controllers/*.js)
    ↓
Service (services/*.js) [opcional]
    ↓
Model (models/*.js)
    ↓
MongoDB
    ↓
Response JSON
```

### Flujo de Comunicación en Tiempo Real

```
Cliente (Frontend)
    ↓ WebSocket
Socket.IO Server (app.js)
    ↓
Event Handlers (app.js)
    ↓
Model (models/*.js)
    ↓
MongoDB
    ↓
Emit Event
    ↓
Cliente (Frontend)
```

---

## Punto de Entrada: app.js

### Archivo: `backend/app.js`

Este es el **archivo principal** que inicializa todo el servidor.

#### 1. Importaciones

```javascript
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
```

**Explicación**:
- `express`: Framework web
- `mongoose`: ODM para MongoDB
- `dotenv`: Carga variables de entorno desde `.env`
- `cors`: Permite peticiones cross-origin
- `http`: Crea servidor HTTP (necesario para Socket.IO)
- `socketIo`: Comunicación en tiempo real

#### 2. Carga de Variables de Entorno

```javascript
dotenv.config();
```

**¿Qué hace?**
- Carga variables desde archivo `.env`
- Ejemplo: `process.env.JWT_SECRET`, `process.env.DB_URL`

#### 3. Configuración de Mongoose

```javascript
mongoose.set('strictQuery', true);
```

**¿Qué hace?**
- Suprime advertencia de deprecación de Mongoose
- `strictQuery: true` significa que queries con campos no definidos en el esquema serán rechazados

#### 4. Inicialización de Express y HTTP Server

```javascript
const app = express();
const server = http.createServer(app);
```

**¿Por qué `http.createServer`?**
- Socket.IO necesita un servidor HTTP
- Express es un middleware sobre HTTP

#### 5. Inicialización de Socket.IO

```javascript
const io = socket.init(server);
```

**¿Qué hace?**
- Inicializa Socket.IO con el servidor HTTP
- Configura CORS para permitir conexiones desde el frontend

#### 6. Conexión a MongoDB

```javascript
const DB_URL = process.env.DB_URL || 'mongodb://localhost:27017/chat_bbdd';
mongoose.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: false
})
.then(async () => {
    console.log('✅ Conexión a la base de datos exitosa');
    // Sincronizar índices manualmente
    await Message.syncIndexes();
})
.catch((error) => console.error('❌ Error al conectar:', error));
```

**Opciones de Conexión**:
- `useNewUrlParser: true`: Usa nuevo parser de URLs de MongoDB
- `useUnifiedTopology: true`: Usa nuevo motor de descubrimiento de servidores
- `autoIndex: false`: No crea índices automáticamente (se crean manualmente)

#### 7. Middlewares Globales

```javascript
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
```

**Explicación**:

1. **`cors()`**: Permite peticiones desde cualquier origen
   - En producción, deberías configurar orígenes específicos

2. **`express.urlencoded({ extended: true })`**: Parsea datos de formularios
   - `extended: true`: Permite objetos anidados

3. **`express.json()`**: Parsea JSON en el body de las peticiones

#### 8. Configuración de Socket.IO

```javascript
io.on('connection', (socket) => {
    console.log('🔌 Usuario conectado:', socket.id);
    
    // Eventos de Socket.IO
    socket.on('join_channel', async (channelId) => { ... });
    socket.on('send_message', async ({ channelId, text, userId }) => { ... });
    socket.on('disconnect', () => { ... });
});
```

**Eventos Principales**:

1. **`connection`**: Se ejecuta cuando un cliente se conecta
2. **`join_channel`**: Usuario se une a un canal
3. **`send_message`**: Usuario envía un mensaje
4. **`disconnect`**: Usuario se desconecta

**Ver sección [Socket.IO](#socketio---comunicación-en-tiempo-real)** para más detalles.

#### 9. Registro de Rutas

```javascript
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/admin', dashboardRoutes);
app.use('/api/phonebook', phoneBookRoutes);
app.use('/', userRoutes); // Rutas de autenticación
```

**Estructura de Rutas**:
- `/api/*`: Rutas de API REST
- `/`: Rutas de autenticación (login, logout)

#### 10. Servir Frontend en Producción

```javascript
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/vue-app/dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/vue-app/dist/index.html'));
    });
}
```

**¿Qué hace?**
- En producción, sirve archivos estáticos del frontend compilado
- Cualquier ruta no encontrada retorna `index.html` (SPA routing)

#### 11. Iniciar Servidor

```javascript
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`🚀 Servidor backend escuchando en el puerto ${port}`);
});
```

---

## Rutas y Endpoints

### Estructura de Rutas

Cada archivo en `backend/routes/` define las rutas para un recurso específico.

#### UserRoutes.js

**Archivo**: `backend/routes/UserRoutes.js`

**Rutas**:
- `POST /login`: Autenticación de usuario
- `POST /logout`: Cerrar sesión
- `GET /api/users`: Obtener todos los usuarios (admin)
- `POST /api/users`: Crear usuario (admin)
- `PATCH /api/users/:id`: Actualizar usuario (admin)
- `DELETE /api/users/:id`: Eliminar usuario (admin)
- `GET /api/check-status`: Verificar estado del usuario

**Características**:
- Middleware `authenticateToken`: Verifica JWT
- Middleware `isAdmin`: Verifica rol de administrador
- Hash de contraseñas con bcrypt

#### MessageRoutes.js

**Archivo**: `backend/routes/MessageRoutes.js`

**Rutas**:
- `GET /api/messages/:channelId`: Obtener mensajes de un canal
- `POST /api/messages`: Crear nuevo mensaje

**Características**:
- Middleware `checkChannelAccess`: Verifica acceso al canal
- Sanitización de mensajes antes de guardar
- Desanitización antes de enviar al frontend

#### ChannelRoutes.js

**Archivo**: `backend/routes/ChannelRoutes.js`

**Rutas**:
- `GET /api/channels`: Obtener canales disponibles para el usuario
- `GET /api/channels/all`: Obtener todos los canales (admin)
- `POST /api/channels`: Crear canal (admin)
- `PUT /api/channels/:id`: Actualizar canal (admin)
- `DELETE /api/channels/:id`: Eliminar canal (admin)

**Características**:
- Filtrado por `isPublic` y `allowedUsers`
- Admins ven todos los canales

#### SuggestionRoutes.js

**Archivo**: `backend/routes/SuggestionRoutes.js`

**Rutas**:
- `GET /api/suggestions`: Obtener sugerencias (admin)
- `POST /api/suggestions`: Crear sugerencia
- `PUT /api/suggestions/:id/status`: Actualizar estado (admin)

**Características**:
- Encriptación de contenido (AES-256-CBC)
- Sanitización antes de encriptar
- Desencriptación y desanitización al leer

#### AnnouncementRoutes.js

**Archivo**: `backend/routes/AnnouncementRoutes.js`

**Rutas**:
- `GET /api/announcements`: Obtener anuncios
- `POST /api/announcements`: Crear anuncio (admin)
- `DELETE /api/announcements/:id`: Eliminar anuncio (admin)

#### DashboardRoutes.js

**Archivo**: `backend/routes/DashboardRoutes.js`

**Rutas**:
- `GET /api/admin/dashboard`: Obtener métricas del dashboard (admin)

**Características**:
- Agregaciones de MongoDB
- Métricas: usuarios, canales, mensajes, actividad

#### phoneBookRoutes.js

**Archivo**: `backend/routes/phoneBookRoutes.js`

**Rutas**:
- `GET /api/phonebook`: Obtener directorio telefónico
- `GET /api/phonebook/search`: Buscar en directorio

**Características**:
- Integración con API externa (XML)
- Sistema de caché (5 minutos)

---

## Controladores

Los controladores contienen la **lógica de negocio** para cada recurso.

### Estructura de un Controlador

```javascript
const controller = {
    async getResource(req, res) {
        try {
            // Lógica de negocio
            const data = await Model.find();
            res.json(data);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ message: 'Error al obtener recurso' });
        }
    }
};
```

### Controladores Existentes

1. **UserController.js**: Lógica de usuarios (legacy, no se usa actualmente)
2. **phoneBookController.js**: Lógica del directorio telefónico
3. **MessageController.js**: Lógica de mensajes (legacy, no se usa actualmente)

**Nota**: La mayoría de la lógica está directamente en las rutas. Los controladores se usan principalmente para el directorio telefónico.

---

## Servicios

Los servicios contienen **lógica de negocio compleja** que puede ser reutilizada.

### phoneBookService.js

**Archivo**: `backend/services/phoneBookService.js`

**Clase**: `PhoneBookService`

**Métodos**:
- `fetchPhoneBook()`: Obtiene directorio desde API externa
- `processPhoneBookData(data)`: Procesa XML parseado
- `searchDirectory(query)`: Busca contactos

**Características**:
- Sistema de caché (5 minutos)
- Parsing XML → JSON
- Manejo de errores

**Ver Manual 07 para detalles completos**.

---

## Middleware

### authenticateToken

**Archivo**: `backend/middleware/auth.js`

```javascript
module.exports = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'No se proporcionó token' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user || !user.active) {
            return res.status(403).json({ message: 'Usuario inactivo' });
        }
        
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Token inválido' });
    }
};
```

**Funcionalidad**:
1. Extrae token del header `Authorization`
2. Verifica firma del token
3. Verifica que el usuario existe y está activo
4. Agrega `req.user` con datos del usuario
5. Llama a `next()` para continuar

**Uso**:
```javascript
router.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
    // req.user contiene datos del usuario autenticado
});
```

### isAdmin

**Definido en**: Varios archivos de rutas

```javascript
const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        if (user && user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Acceso denegado: se requieren privilegios de administrador' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error al verificar privilegios' });
    }
};
```

**Funcionalidad**:
- Verifica que el usuario tenga rol `admin`
- Si no es admin, retorna 403

---

## Utilidades

### sanitize.js

**Archivo**: `backend/utils/sanitize.js`

**Funciones**:
- `sanitizeString(input)`: Escapa caracteres HTML peligrosos
- `sanitizeObject(obj)`: Sanitiza objetos recursivamente
- `sanitizeMessage(text)`: Sanitiza mensajes
- `desanitizeMessage(text)`: Revierte el escape

**Uso**:
```javascript
const { sanitizeMessage, desanitizeMessage } = require('./utils/sanitize');

// Al guardar
const sanitized = sanitizeMessage(text);
await Message.create({ text: sanitized });

// Al leer
const message = await Message.findById(id);
const readable = desanitizeMessage(message.text);
```

### encryption.js

**Archivo**: `backend/utils/encryption.js`

**Funciones**:
- `encrypt(text)`: Encripta texto con AES-256-CBC
- `decrypt(text)`: Desencripta texto

**Uso**:
```javascript
const { encrypt, decrypt } = require('./utils/encryption');

// Encriptar
const encrypted = encrypt("Texto secreto");

// Desencriptar
const decrypted = decrypt(encrypted);
```

**Algoritmo**: AES-256-CBC
- Clave derivada de `ENCRYPTION_KEY`
- IV aleatorio por cada encriptación

---

## Socket.IO - Comunicación en Tiempo Real

### Configuración

**Archivo**: `backend/socket.js`

```javascript
let io;

module.exports = {
    init: function(httpServer) {
        io = require('socket.io')(httpServer, {
            cors: {
                origin: ['http://localhost:5173', 'http://localhost:5174'],
                methods: ['GET', 'POST']
            }
        });
        return io;
    },
    getIO: function() {
        if (!io) {
            throw new Error('Socket.io no está inicializado');
        }
        return io;
    }
};
```

**Configuración CORS**:
- Permite conexiones desde `localhost:5173` y `localhost:5174` (Vite dev server)
- En producción, configurar orígenes específicos

### Eventos en app.js

#### 1. Evento `connection`

```javascript
io.on('connection', (socket) => {
    console.log('🔌 Usuario conectado:', socket.id);
    // ... otros eventos ...
});
```

**Se ejecuta cuando**: Un cliente se conecta al servidor

#### 2. Evento `join_channel`

```javascript
socket.on('join_channel', async (channelId) => {
    socket.join(channelId);
    
    const messages = await Message.find({ channel: channelId })
        .sort({ createdAt: 1 })
        .populate('userId', 'name');
    
    const formattedMessages = messages
        .filter(msg => msg.userId != null)
        .map(msg => ({
            _id: msg._id,
            text: desanitizeMessage(msg.text),
            userId: msg.userId._id,
            author: msg.userId.name,
            timestamp: msg.createdAt
        }));
    
    socket.emit('message_history', formattedMessages);
});
```

**Funcionalidad**:
1. Usuario se une a un canal (room de Socket.IO)
2. Carga historial de mensajes del canal
3. Envía historial al cliente

**Nota**: No verifica acceso al canal aquí. La verificación se hace al enviar mensajes.

#### 3. Evento `send_message`

```javascript
socket.on('send_message', async ({ channelId, text, userId }) => {
    // Validar userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return;
    }
    
    // Sanitizar texto
    const sanitizedText = sanitizeMessage(text);
    
    // Guardar mensaje
    const newMessage = new Message({
        text: sanitizedText,
        userId,
        channel: channelId
    });
    await newMessage.save();
    
    // Popular usuario
    const populatedMessage = await Message.findById(newMessage._id)
        .populate('userId', 'name');
    
    // Emitir a todos en el canal
    io.to(channelId).emit('new_message', {
        _id: populatedMessage._id,
        text: desanitizeMessage(populatedMessage.text),
        userId: populatedMessage.userId._id,
        author: populatedMessage.userId.name,
        timestamp: populatedMessage.createdAt
    });
});
```

**Funcionalidad**:
1. Valida `userId`
2. Sanitiza el texto
3. Guarda mensaje en BD
4. Emite mensaje a todos los usuarios en el canal

**Nota**: No verifica acceso al canal aquí. En producción, deberías verificar.

#### 4. Evento `disconnect`

```javascript
socket.on('disconnect', () => {
    console.log('⚠️ Usuario desconectado:', socket.id);
});
```

**Se ejecuta cuando**: Un cliente se desconecta

### Rooms (Salas) de Socket.IO

**Concepto**: Los "rooms" permiten enviar mensajes a un grupo específico de clientes.

**Uso**:
```javascript
socket.join(channelId);  // Unirse a un room
io.to(channelId).emit('new_message', data);  // Enviar a todos en el room
```

**Ventajas**:
- Solo los usuarios en el canal reciben los mensajes
- No necesitas mantener lista de usuarios conectados

---

## Configuración y Variables de Entorno

### Archivo `.env`

**Variables Requeridas**:
```env
# Base de datos
DB_URL=mongodb://localhost:27017/chat_bbdd

# JWT
JWT_SECRET=tu_clave_secreta_muy_segura

# Encriptación
ENCRYPTION_KEY=tu_clave_de_encriptacion

# Puerto
PORT=3000

# Entorno
NODE_ENV=development
```

### Carga de Variables

```javascript
dotenv.config();  // Carga desde .env
const DB_URL = process.env.DB_URL || 'mongodb://localhost:27017/chat_bbdd';
```

**Valores por Defecto**:
- Si `process.env.DB_URL` no existe, usa el valor por defecto
- **⚠️ En producción, siempre usar variables de entorno**

---

## Resumen

### Componentes del Backend

1. **app.js**: Punto de entrada, configuración del servidor
2. **routes/**: Definición de rutas REST
3. **controllers/**: Lógica de controladores (parcialmente usado)
4. **services/**: Servicios de negocio (phoneBookService)
5. **middleware/**: Middleware personalizado (auth)
6. **utils/**: Utilidades (sanitización, encriptación)
7. **models/**: Modelos de Mongoose (ver Manual Base de Datos)
8. **socket.js**: Configuración de Socket.IO

### Flujos Principales

1. **HTTP Request → Response**:
   - Cliente → Express → Middleware → Router → Controller → Model → MongoDB → Response

2. **WebSocket → Event**:
   - Cliente → Socket.IO → Event Handler → Model → MongoDB → Emit Event → Cliente

### Seguridad Implementada

- ✅ Autenticación JWT
- ✅ Verificación de roles (admin/user)
- ✅ Sanitización de datos
- ✅ Encriptación de datos sensibles
- ✅ Hash de contraseñas (bcrypt)
- ✅ Control de acceso a canales

---

## Próximos Pasos

Ahora que entiendes el backend, puedes continuar con:
- **MANUAL_FRONTEND.md**: Todo el frontend
- **MANUAL_BASE_DATOS.md**: Modelos y esquemas

---

**Última actualización**: Enero 2025

**Versión**: 1.0

