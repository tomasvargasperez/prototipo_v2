# Documentación Completa de la Aplicación - Plataforma Comunicacional Empresarial

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura General](#arquitectura-general)
3. [Tecnologías Aplicadas](#tecnologías-aplicadas)
4. [Flujo Completo de la Aplicación](#flujo-completo-de-la-aplicación)
5. [Estructura de Carpetas y Archivos](#estructura-de-carpetas-y-archivos)
6. [Base de Datos](#base-de-datos)
7. [Seguridad Implementada](#seguridad-implementada)
8. [Futuras Mejoras](#futuras-mejoras)

---

## Introducción

Esta aplicación es una **Plataforma Comunicacional Empresarial** que permite la comunicación en tiempo real entre empleados de una organización. Incluye funcionalidades de chat corporativo, gestión de canales, anuncios, sugerencias anónimas, dashboard administrativo y directorio telefónico integrado.

### Características Principales

- ✅ **Chat en tiempo real** con Socket.IO
- ✅ **Autenticación JWT** con roles (admin/user)
- ✅ **Canales públicos y privados** con control de acceso
- ✅ **Foro de anuncios** corporativos
- ✅ **Buzón de sugerencias** anónimas con encriptación
- ✅ **Dashboard administrativo** con métricas
- ✅ **Directorio telefónico** integrado desde fuente externa
- ✅ **Protección XSS** mediante sanitización

---

## Arquitectura General

### Patrón de Arquitectura

La aplicación sigue una **arquitectura cliente-servidor** con separación clara entre frontend y backend:

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Frontend      │         │    Backend      │         │   Base de       │
│   (Vue.js)      │◄────────►│   (Node.js)    │◄────────►│   Datos         │
│   Puerto 5173   │  HTTP    │   Puerto 3000   │  MongoDB │   (MongoDB)     │
└─────────────────┘  Socket  └─────────────────┘          └─────────────────┘
```

### Componentes Principales

1. **Frontend (Vue.js 3)**: Interfaz de usuario reactiva
2. **Backend (Node.js/Express)**: API REST y WebSocket
3. **Base de Datos (MongoDB)**: Almacenamiento persistente
4. **Socket.IO**: Comunicación bidireccional en tiempo real

---

## Tecnologías Aplicadas

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Node.js** | 18+ | Runtime de JavaScript del servidor |
| **Express** | ^5.1.0 | Framework web para API REST |
| **MongoDB** | 5+ | Base de datos NoSQL |
| **Mongoose** | ^6.13.2 | ODM (Object Document Mapper) para MongoDB |
| **Socket.IO** | ^4.8.1 | Biblioteca para comunicación en tiempo real |
| **JWT (jsonwebtoken)** | ^9.0.2 | Autenticación basada en tokens |
| **bcrypt** | ^5.1.1 | Hash de contraseñas |
| **dotenv** | ^16.5.0 | Gestión de variables de entorno |
| **fast-xml-parser** | ^5.2.4 | Parseo de XML (directorio telefónico) |
| **axios** | ^1.9.0 | Cliente HTTP para peticiones externas |
| **crypto** | nativo | Encriptación AES-256-CBC (sugerencias) |

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Vue.js** | ^3.5.13 | Framework JavaScript reactivo |
| **Vue Router** | ^4.5.1 | Enrutamiento de la SPA |
| **Vite** | ^6.3.5 | Build tool y dev server |
| **Socket.IO Client** | ^4.8.1 | Cliente para comunicación en tiempo real |
| **Font Awesome** | ^6.7.2 | Iconos |
| **Chart.js** | ^4.4.1 | Gráficos (dashboard) |

### Base de Datos

- **MongoDB**: Base de datos NoSQL orientada a documentos
- **Colecciones principales**: `users`, `messages`, `channels`, `announcements`, `suggestions`

---

## Flujo Completo de la Aplicación

### 1. Inicio de Sesión (Login)

#### Paso 1.1: Usuario accede a la aplicación

**Archivo**: `frontend/vue-app/src/views/Login.vue`

1. El usuario abre la aplicación en el navegador (`http://localhost:5173`)
2. Vue Router redirige automáticamente a `/login` (configurado en `router/index.js`)
3. Se muestra el formulario de login con campos:
   - Email
   - Contraseña

#### Paso 1.2: Usuario envía credenciales

**Archivo**: `frontend/vue-app/src/views/Login.vue` (método `login()`)

```javascript
// El usuario hace clic en "INICIAR SESIÓN"
// Se envía petición POST a http://localhost:3000/login
const response = await fetch('http://localhost:3000/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
```

#### Paso 1.3: Backend valida credenciales

**Archivo**: `backend/routes/UserRoutes.js` (ruta `POST /login`)

1. **Búsqueda del usuario**:
   ```javascript
   const user = await UserSchema.findOne({ email });
   ```
   - Consulta en la colección `users` de MongoDB
   - Busca por campo `email` (único)

2. **Verificación de estado activo**:
   ```javascript
   if (!user.active) {
     return res.status(403).json({ message: 'Usuario inactivo...' });
   }
   ```

3. **Validación de contraseña**:
   ```javascript
   const validPassword = await bcrypt.compare(password, user.password);
   ```
   - Compara la contraseña en texto plano con el hash almacenado
   - Usa bcrypt con salt rounds = 10

4. **Generación del token JWT**:
   ```javascript
   const token = jwt.sign(
     { userId: user._id },
     process.env.JWT_SECRET || 'tu_clave_secreta',
     { expiresIn: '24h' }
   );
   ```
   - Token contiene el `userId` del usuario
   - Expira en 24 horas
   - Firmado con `JWT_SECRET`

5. **Respuesta al frontend**:
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIs...",
     "user": {
       "userId": "...",
       "name": "Juan Pérez",
       "email": "juan@empresa.com",
       "role": "user",
       "active": true
     }
   }
   ```

#### Paso 1.4: Frontend almacena credenciales

**Archivo**: `frontend/vue-app/src/views/Login.vue`

1. **Almacenamiento en localStorage**:
   ```javascript
   localStorage.setItem('token', data.token);
   localStorage.setItem('user', JSON.stringify({
     _id: data.user.userId,
     name: data.user.name,
     role: data.user.role,
     email: data.user.email,
     active: data.user.active
   }));
   ```
   - **Nota**: El interceptor de seguridad (`utils/security.js`) sanitiza automáticamente estos datos antes de guardarlos

2. **Redirección según rol**:
   ```javascript
   if (data.user.role === 'admin') {
     this.$router.push('/admin');
   } else {
     this.$router.push('/chat');
   }
   ```

#### Paso 1.5: Log en consola del servidor

**Archivo**: `backend/routes/UserRoutes.js`

```
✅ Login exitoso - Juan Pérez
```

---

### 2. Vista de Chat (Usuario Regular)

#### Paso 2.1: Carga inicial de la vista Chat

**Archivo**: `frontend/vue-app/src/views/Chat.vue`

1. **Verificación de autenticación**:
   ```javascript
   mounted() {
     const storedUser = JSON.parse(localStorage.getItem('user'));
     if (!storedUser || !storedUser._id) {
       this.$router.push('/login');
       return;
     }
   }
   ```

2. **Inicialización de Socket.IO**:
   ```javascript
   initializeSocketConnection() {
     this.socket = io('http://localhost:3000');
     // Se conecta al servidor Socket.IO
   }
   ```

3. **Carga de canales**:
   ```javascript
   async fetchChannels() {
     const response = await fetch('http://localhost:3000/api/channels', {
       headers: { 'Authorization': `Bearer ${token}` }
     });
     this.channels = await response.json();
   }
   ```
   - **Archivo backend**: `backend/routes/ChannelRoutes.js`
   - Filtra canales según permisos del usuario

4. **Selección automática del primer canal**:
   ```javascript
   if (!this.selectedChannel && this.channels.length > 0) {
     this.selectChannel(this.channels[0]._id);
   }
   ```

#### Paso 2.2: Selección de un canal

**Archivo**: `frontend/vue-app/src/views/Chat.vue` (método `selectChannel()`)

1. **Actualización del estado**:
   ```javascript
   this.selectedChannel = channelId;
   this.messages = []; // Limpia mensajes anteriores
   ```

2. **Unión al canal en Socket.IO**:
   ```javascript
   this.socket.emit('join_channel', channelId);
   ```

3. **Cierre de otros módulos**:
   ```javascript
   this.showSuggestionBox = false;
   this.showAnnouncementsBox = false;
   this.showPhonebookBox = false;
   ```

#### Paso 2.3: Backend procesa unión al canal

**Archivo**: `backend/app.js` (evento `join_channel`)

1. **Unión a la sala Socket.IO**:
   ```javascript
   socket.join(channelId);
   ```

2. **Carga del historial de mensajes**:
   ```javascript
   const messages = await Message.find({ channel: channelId })
     .sort({ createdAt: 1 })
     .populate('userId', 'name')
     .lean();
   ```
   - Consulta mensajes del canal ordenados por fecha
   - Popula el campo `userId` para obtener el nombre del usuario

3. **Desanitización de mensajes**:
   ```javascript
   const formattedMessages = messages.map(msg => ({
     text: desanitizeMessage(msg.text), // Convierte &lt; a <
     // ...
   }));
   ```

4. **Envío del historial**:
   ```javascript
   socket.emit('message_history', formattedMessages);
   ```

#### Paso 2.4: Frontend recibe y muestra mensajes

**Archivo**: `frontend/vue-app/src/views/Chat.vue`

1. **Recepción del historial**:
   ```javascript
   this.socket.on('message_history', (messages) => {
     this.messages = messages;
     this.$nextTick(this.scrollToBottom);
   });
   ```

2. **Renderizado en el template**:
   ```vue
   <div v-for="(message, index) in messages" :key="index">
     <div class="message-avatar">{{ getMessageInitials(message) }}</div>
     <div class="message-content">
       <span class="message-author">{{ message.author }}</span>
       <span class="message-text">{{ message.text }}</span>
     </div>
   </div>
   ```

#### Paso 2.5: Envío de un mensaje nuevo

**Archivo**: `frontend/vue-app/src/views/Chat.vue` (método `sendMessage()`)

1. **Validación**:
   ```javascript
   if (!this.newMessage.trim() || !this.selectedChannel) return;
   ```

2. **Envío vía Socket.IO**:
   ```javascript
   this.socket.emit('send_message', {
     channelId: this.selectedChannel,
     text: this.newMessage.trim(),
     userId: this.user._id
   });
   ```

3. **Limpieza del input**:
   ```javascript
   this.newMessage = '';
   ```

#### Paso 2.6: Backend procesa y guarda el mensaje

**Archivo**: `backend/app.js` (evento `send_message`)

1. **Validación del userId**:
   ```javascript
   if (!mongoose.Types.ObjectId.isValid(userId)) {
     return;
   }
   ```

2. **Sanitización del texto**:
   ```javascript
   const sanitizedText = sanitizeMessage(text);
   // Convierte <script> a &lt;script&gt;
   ```

3. **Creación y guardado**:
   ```javascript
   const newMessage = new Message({
     text: sanitizedText, // Texto sanitizado
     userId,
     channel: channelId
   });
   await newMessage.save();
   ```

4. **Población del usuario**:
   ```javascript
   const populatedMessage = await Message.findById(savedMessage._id)
     .populate('userId', 'name');
   ```

5. **Emisión a todos los usuarios del canal**:
   ```javascript
   io.to(channelId).emit('new_message', {
     text: desanitizeMessage(populatedMessage.text), // Desanitizado para mostrar
     userId: populatedMessage.userId._id,
     author: populatedMessage.userId.name,
     timestamp: populatedMessage.createdAt
   });
   ```

#### Paso 2.7: Frontend recibe y muestra el mensaje nuevo

**Archivo**: `frontend/vue-app/src/views/Chat.vue`

```javascript
this.socket.on('new_message', (message) => {
  this.messages.push(message);
  this.$nextTick(this.scrollToBottom);
});
```

---

### 3. Buzón de Sugerencias

#### Paso 3.1: Usuario accede al buzón

**Archivo**: `frontend/vue-app/src/views/Chat.vue`

1. **Click en "Buzón de Sugerencias"**:
   ```javascript
   toggleSuggestionBox() {
     this.showSuggestionBox = !this.showSuggestionBox;
     this.showAnnouncementsBox = false;
     this.showPhonebookBox = false;
   }
   ```

2. **Se muestra el formulario**:
   ```vue
   <div v-else class="suggestion-container">
     <textarea v-model="suggestionText" placeholder="Escribe tu sugerencia aquí..."></textarea>
     <button @click="submitSuggestion">Enviar Sugerencia</button>
   </div>
   ```

#### Paso 3.2: Usuario envía una sugerencia

**Archivo**: `frontend/vue-app/src/views/Chat.vue` (método `submitSuggestion()`)

```javascript
const response = await fetch('http://localhost:3000/api/suggestions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    content: this.suggestionText.trim()
  })
});
```

#### Paso 3.3: Backend procesa la sugerencia

**Archivo**: `backend/routes/SuggestionRoutes.js` (ruta `POST /api/suggestions`)

1. **Validación del token**:
   ```javascript
   router.post('/', authenticateToken, async (req, res) => {
     // authenticateToken verifica JWT y estado activo del usuario
   });
   ```

2. **Sanitización del contenido**:
   ```javascript
   const sanitizedContent = sanitizeMessage(req.body.content);
   // Protección XSS antes de encriptar
   ```

3. **Encriptación**:
   ```javascript
   const encryptedContent = encrypt(sanitizedContent);
   // Usa AES-256-CBC
   // Archivo: backend/utils/encryption.js
   ```

4. **Guardado en base de datos**:
   ```javascript
   const suggestion = new Suggestion({
     content: encryptedContent, // Contenido encriptado
     userId: req.user.userId,
     status: 'pending'
   });
   await suggestion.save();
   ```

#### Paso 3.4: Confirmación al usuario

```javascript
alert('¡Gracias! Tu sugerencia ha sido enviada correctamente.');
this.suggestionText = '';
this.showSuggestionBox = false;
```

---

### 4. Foro de Anuncios

#### Paso 4.1: Usuario accede al foro

**Archivo**: `frontend/vue-app/src/views/Chat.vue`

```javascript
toggleAnnouncementsBox() {
  this.showAnnouncementsBox = !this.showAnnouncementsBox;
  this.showSuggestionBox = false;
  this.showPhonebookBox = false;
  if (this.showAnnouncementsBox) {
    this.fetchAnnouncements();
  }
}
```

#### Paso 4.2: Carga de anuncios

**Archivo**: `frontend/vue-app/src/views/Chat.vue` (método `fetchAnnouncements()`)

```javascript
const response = await fetch('http://localhost:3000/api/announcements', {
  headers: { 'Authorization': `Bearer ${token}` }
});
this.announcements = await response.json();
```

#### Paso 4.3: Backend retorna anuncios

**Archivo**: `backend/routes/AnnouncementRoutes.js`

```javascript
router.get('/', authenticateToken, async (req, res) => {
  const announcements = await Announcement.find({ active: true })
    .populate('author', 'name')
    .sort({ timestamp: -1 });
  res.json(announcements);
});
```

#### Paso 4.4: Renderizado de anuncios

**Archivo**: `frontend/vue-app/src/views/Chat.vue`

```vue
<div v-for="announcement in announcements" :key="announcement._id">
  <h3>{{ announcement.title }}</h3>
  <p>{{ announcement.content }}</p>
  <span>Por: {{ announcement.author.name }}</span>
  <span>{{ formatDate(announcement.timestamp) }}</span>
</div>
```

---

### 5. Directorio Telefónico

#### Paso 5.1: Usuario accede al directorio

**Archivo**: `frontend/vue-app/src/views/Chat.vue`

```javascript
togglePhonebookBox() {
  this.showPhonebookBox = !this.showPhonebookBox;
  this.showSuggestionBox = false;
  this.showAnnouncementsBox = false;
  if (this.showPhonebookBox) {
    this.fetchPhonebook();
  }
}
```

#### Paso 5.2: Carga del directorio

**Archivo**: `frontend/vue-app/src/views/Chat.vue` (método `fetchPhonebook()`)

```javascript
const response = await fetch('http://localhost:3000/api/phonebook', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
this.directory = data.entries;
this.filteredDirectory = [...this.directory];
```

#### Paso 5.3: Backend obtiene directorio

**Archivo**: `backend/routes/phoneBookRoutes.js`

1. **Verificación de caché**:
   ```javascript
   // Archivo: backend/services/phoneBookService.js
   if (this.cachedData && this.lastFetch && (Date.now() - this.lastFetch) < this.cacheTimeout) {
     return this.cachedData; // Retorna caché si es válido (5 minutos)
   }
   ```

2. **Petición a fuente externa**:
   ```javascript
   const response = await this.axiosInstance.get(this.phoneBookUrl);
   // URL: https://icafal.alodesk.io:20080/panel/share/phonebook/9267361683
   ```

3. **Parseo de XML a JSON**:
   ```javascript
   const result = this.parser.parse(response.data);
   // Usa fast-xml-parser
   ```

4. **Procesamiento de datos**:
   ```javascript
   this.cachedData = this.processPhoneBookData(result);
   // Extrae nombre y anexo de cada entrada
   ```

5. **Actualización de caché**:
   ```javascript
   this.lastFetch = Date.now();
   return this.cachedData;
   ```

#### Paso 5.4: Búsqueda en el directorio

**Archivo**: `frontend/vue-app/src/views/Chat.vue` (método `searchDirectory()`)

1. **Búsqueda local**:
   ```javascript
   this.filteredDirectory = this.directory.filter(entry => 
     entry.name.toLowerCase().includes(searchTerm) ||
     entry.extension.toString().includes(searchTerm)
   );
   ```

2. **Búsqueda en servidor (si no hay resultados locales)**:
   ```javascript
   if (this.filteredDirectory.length === 0) {
     const response = await fetch(
       `http://localhost:3000/api/phonebook/search?query=${searchTerm}`,
       { headers: { 'Authorization': `Bearer ${token}` } }
     );
   }
   ```

#### Paso 5.5: Renderizado del directorio

**Archivo**: `frontend/vue-app/src/views/Chat.vue`

```vue
<table class="phonebook-table">
  <thead>
    <tr>
      <th>Nombre</th>
      <th>Anexo</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="entry in filteredDirectory" :key="entry.id">
      <td>{{ entry.name }}</td>
      <td>{{ entry.extension }}</td>
    </tr>
  </tbody>
</table>
```

---

### 6. Vista Administrativa (Admin)

#### Paso 6.1: Acceso al panel admin

**Archivo**: `frontend/vue-app/src/views/Admin_app.vue`

1. **Verificación de rol**:
   - El usuario debe tener `role: 'admin'` en localStorage
   - Redirección automática desde Login si es admin

2. **Carga de datos del dashboard**:
   ```javascript
   async fetchDashboardData() {
     const response = await fetch('http://localhost:3000/api/admin/dashboard', {
       headers: { 'Authorization': `Bearer ${token}` }
     });
     this.dashboardData = await response.json();
   }
   ```

#### Paso 6.2: Backend genera métricas

**Archivo**: `backend/routes/DashboardRoutes.js`

1. **Totales**:
   ```javascript
   const totalUsers = await User.countDocuments();
   const totalChannels = await Channel.countDocuments({ active: true });
   const totalMessages = await Message.countDocuments();
   ```

2. **Actividad por canal**:
   ```javascript
   const channelActivity = await Message.aggregate([
     { $group: { _id: '$channel', messages: { $sum: 1 } } },
     { $lookup: { from: 'channels', localField: '_id', foreignField: '_id', as: 'channelInfo' } },
     { $unwind: '$channelInfo' },
     { $project: { name: '$channelInfo.name', messages: 1 } },
     { $sort: { messages: -1 } }
   ]);
   ```

3. **Top usuarios**:
   ```javascript
   const topUsers = await Message.aggregate([
     { $group: { _id: '$userId', messages: { $sum: 1 } } },
     { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
     { $unwind: '$userInfo' },
     { $project: { name: '$userInfo.name', messages: 1 } },
     { $sort: { messages: -1 } },
     { $limit: 5 }
   ]);
   ```

4. **Actividad diaria**:
   ```javascript
   const dailyActivity = await Message.aggregate([
     { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
     { $sort: { _id: 1 } }
   ]);
   ```

#### Paso 6.3: Gestión de usuarios (Admin)

**Archivo**: `frontend/vue-app/src/views/Admin_app.vue`

1. **Listado de usuarios**:
   ```javascript
   const response = await fetch('http://localhost:3000/api/users', {
     headers: { 'Authorization': `Bearer ${token}` }
   });
   ```

2. **Actualización de usuario**:
   ```javascript
   await fetch(`http://localhost:3000/api/users/${userId}`, {
     method: 'PATCH',
     headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({ name, email, role, active })
   });
   ```

3. **Eliminación de usuario**:
   ```javascript
   await fetch(`http://localhost:3000/api/users/${userId}`, {
     method: 'DELETE',
     headers: { 'Authorization': `Bearer ${token}` }
   });
   ```

#### Paso 6.4: Gestión de canales (Admin)

**Archivo**: `frontend/vue-app/src/views/Admin_app.vue`

1. **Creación de canal**:
   ```javascript
   await fetch('http://localhost:3000/api/channels', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       name: channelName,
       description: description,
       isPublic: isPublic,
       allowedUsers: allowedUsers
     })
   });
   ```

2. **Actualización de canal**:
   ```javascript
   await fetch(`http://localhost:3000/api/channels/${channelId}`, {
     method: 'PUT',
     // ...
   });
   ```

3. **Eliminación de canal**:
   ```javascript
   await fetch(`http://localhost:3000/api/channels/${channelId}`, {
     method: 'DELETE',
     // ...
   });
   ```

---

### 7. Cierre de Sesión (Logout)

#### Paso 7.1: Usuario hace clic en "Cerrar Sesión"

**Archivo**: `frontend/vue-app/src/views/Chat.vue` o `Admin_app.vue`

```javascript
async logout() {
  const token = localStorage.getItem('token');
  
  // Notificar al backend
  await fetch('http://localhost:3000/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  // Limpiar datos locales
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Desconectar Socket.IO
  if (this.socket) {
    this.socket.disconnect();
  }
  
  // Redirigir a login
  this.$router.push('/login');
}
```

#### Paso 7.2: Backend registra el logout

**Archivo**: `backend/routes/UserRoutes.js` (ruta `POST /logout`)

```javascript
router.post('/logout', authenticateToken, async (req, res) => {
  const user = await UserSchema.findById(req.user.userId);
  if (user) {
    console.log('🚪 Logout exitoso -', user.name);
  }
  res.json({ message: 'Logout exitoso' });
});
```

---

## Estructura de Carpetas y Archivos

### 📁 Raíz del Proyecto

```
app_chat_corp/
├── backend/              # Servidor Node.js/Express
├── frontend/             # Cliente Vue.js
├── docs/                 # Documentación
├── readme/               # Archivos de referencia
├── package.json          # Dependencias raíz (residual)
└── README.md             # Documentación principal
```

---

### 📁 backend/

#### 📄 `app.js` - Punto de entrada del servidor

**Función**: Orquesta Express, Socket.IO, MongoDB y todas las rutas.

**Responsabilidades**:
- ✅ Inicialización de Express y servidor HTTP
- ✅ Configuración de Socket.IO
- ✅ Conexión a MongoDB
- ✅ Configuración de middlewares (CORS, JSON parser)
- ✅ Manejo de eventos Socket.IO (`join_channel`, `send_message`)
- ✅ Sanitización/desanitización de mensajes en tiempo real
- ✅ Registro de rutas API
- ✅ Servir frontend en producción

**Código clave**:
```javascript
const app = express();
const server = http.createServer(app);
const io = socket.init(server);

// Conexión MongoDB
mongoose.connect(DB_URL);

// Eventos Socket.IO
io.on('connection', (socket) => {
  socket.on('join_channel', async (channelId) => { /* ... */ });
  socket.on('send_message', async ({ channelId, text, userId }) => { /* ... */ });
});

// Rutas
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
// ...
```

---

#### 📁 `routes/` - Rutas HTTP REST

##### 📄 `UserRoutes.js` - Gestión de usuarios y autenticación

**Endpoints**:
- `POST /login` - Iniciar sesión (genera JWT)
- `POST /logout` - Cerrar sesión (registra en consola)
- `GET /api/users` - Listar usuarios (admin)
- `PATCH /api/users/:id` - Actualizar usuario (admin)
- `DELETE /api/users/:id` - Eliminar usuario (admin)

**Características**:
- Validación de credenciales con bcrypt
- Generación de tokens JWT (24h de expiración)
- Verificación de estado activo del usuario
- Logs simplificados (solo nombre del usuario)

---

##### 📄 `MessageRoutes.js` - Gestión de mensajes vía API REST

**Endpoints**:
- `GET /api/messages/:channelId` - Obtener mensajes de un canal
- `POST /api/messages` - Crear mensaje (alternativa a Socket.IO)

**Características**:
- Validación de acceso al canal
- Sanitización antes de guardar
- Desanitización antes de enviar al cliente
- Populación de datos del usuario

---

##### 📄 `ChannelRoutes.js` - Gestión de canales

**Endpoints**:
- `GET /api/channels` - Listar canales (filtrados por permisos)
- `GET /api/channels/all` - Listar todos (admin)
- `POST /api/channels` - Crear canal (admin)
- `PUT /api/channels/:id` - Actualizar canal (admin)
- `DELETE /api/channels/:id` - Eliminar canal (admin)

**Características**:
- Control de acceso (público/privado)
- Lista de usuarios permitidos (`allowedUsers`)
- Validación de permisos admin

---

##### 📄 `AnnouncementRoutes.js` - Gestión de anuncios

**Endpoints**:
- `GET /api/announcements` - Listar anuncios activos
- `POST /api/announcements` - Crear anuncio (admin)
- `DELETE /api/announcements/:id` - Eliminar anuncio (admin)

**Características**:
- Solo muestra anuncios activos
- Populación del autor (nombre del usuario)

---

##### 📄 `SuggestionRoutes.js` - Gestión de sugerencias

**Endpoints**:
- `POST /api/suggestions` - Crear sugerencia (encriptada)
- `GET /api/suggestions` - Listar sugerencias (admin, desencriptadas)
- `PUT /api/suggestions/:id/status` - Actualizar estado (admin)

**Características**:
- Encriptación AES-256-CBC antes de guardar
- Sanitización antes de encriptar
- Desencriptación y desanitización al listar
- Estados: `pending`, `reviewed`, `implemented`

---

##### 📄 `DashboardRoutes.js` - Métricas administrativas

**Endpoints**:
- `GET /api/admin/dashboard` - Obtener métricas agregadas

**Métricas incluidas**:
- Total de usuarios
- Total de canales activos
- Total de mensajes
- Actividad por canal (agregación MongoDB)
- Top 5 usuarios más activos
- Actividad diaria (últimos 7 días)

**Características**:
- Usa agregaciones de MongoDB para eficiencia
- Logs simplificados en consola

---

##### 📄 `phoneBookRoutes.js` - API del directorio telefónico

**Endpoints**:
- `GET /api/phonebook` - Obtener directorio completo
- `GET /api/phonebook/search?query=...` - Buscar en el directorio

**Características**:
- Integración con servicio externo (XML)
- Caché en memoria (5 minutos)
- Búsqueda case-insensitive

---

#### 📁 `models/` - Modelos de Mongoose (Esquemas de BD)

##### 📄 `User.js` - Modelo de Usuario

**Campos**:
- `name` (String, requerido)
- `email` (String, requerido, único)
- `password` (String, requerido, hasheado con bcrypt)
- `role` (String, enum: ['admin', 'user'], default: 'user')
- `active` (Boolean, default: true)
- `createdAt` (Date, default: Date.now)

**Hooks**:
- `pre('save')`: Hashea la contraseña antes de guardar (solo si fue modificada)

**Índices**:
- `email`: único

**Métodos**:
- `toJSON`: Elimina el campo `password` al serializar

---

##### 📄 `Message.js` - Modelo de Mensaje

**Campos**:
- `text` (String, requerido, sanitizado)
- `userId` (ObjectId, ref: 'User', requerido)
- `channel` (ObjectId, ref: 'Channel', requerido)
- `createdAt` (Date, default: Date.now)

**Índices**:
- `{ channel: 1, createdAt: 1 }`: Para consultas eficientes por canal
- `{ userId: 1 }`: Para consultas por usuario

**Relaciones**:
- `userId` → `User`
- `channel` → `Channel`

---

##### 📄 `Channel.js` - Modelo de Canal

**Campos**:
- `name` (String, requerido, único)
- `description` (String, default: '')
- `isPublic` (Boolean, default: false)
- `allowedUsers` (Array de ObjectId, ref: 'User')
- `createdBy` (ObjectId, ref: 'User', requerido)
- `createdAt` (Date, default: Date.now)
- `active` (Boolean, default: true)

**Relaciones**:
- `allowedUsers` → `User[]`
- `createdBy` → `User`

---

##### 📄 `Announcement.js` - Modelo de Anuncio

**Campos**:
- `title` (String, requerido)
- `content` (String, requerido)
- `author` (ObjectId, ref: 'User', requerido)
- `timestamp` (Date, default: Date.now)
- `active` (Boolean, default: true)

**Relaciones**:
- `author` → `User`

---

##### 📄 `Suggestion.js` - Modelo de Sugerencia

**Campos**:
- `content` (String, requerido, encriptado)
- `userId` (ObjectId, ref: 'User', requerido)
- `status` (String, enum: ['pending', 'reviewed', 'implemented'], default: 'pending')
- `createdAt` (Date, default: Date.now)

**Relaciones**:
- `userId` → `User`

**Nota**: El contenido está encriptado con AES-256-CBC

---

#### 📁 `middleware/` - Middlewares de Express

##### 📄 `auth.js` - Middleware de autenticación JWT

**Función**: Verifica tokens JWT y estado activo del usuario.

**Proceso**:
1. Extrae el token del header `Authorization: Bearer <token>`
2. Verifica el token con `jwt.verify()`
3. Busca el usuario en la BD
4. Verifica que el usuario esté activo
5. Agrega `req.user` con los datos del token decodificado

**Uso**:
```javascript
router.get('/ruta-protegida', authenticateToken, async (req, res) => {
  // req.user.userId está disponible
});
```

---

#### 📁 `controllers/` - Controladores (lógica de negocio alternativa)

##### 📄 `UserController.js` - Controlador de usuarios

**Nota**: Este controlador tiene una implementación alternativa de login con tokens de 1h (vs 24h en `UserRoutes.js`). Actualmente no se usa en las rutas principales.

---

##### 📄 `phoneBookController.js` - Controlador del directorio telefónico

**Función**: Adaptador entre las rutas y el servicio de phonebook.

---

#### 📁 `services/` - Servicios externos

##### 📄 `phoneBookService.js` - Servicio del directorio telefónico

**Función**: Consume y procesa el directorio telefónico desde una fuente XML externa.

**Características**:
- Caché en memoria (5 minutos)
- Parseo de XML a JSON
- Configuración de axios para ignorar certificados SSL (solo desarrollo)
- Procesamiento de datos (extracción de nombre y anexo)

**Clase**:
```javascript
class PhoneBookService {
  constructor() {
    this.parser = new XMLParser();
    this.phoneBookUrl = 'https://icafal.alodesk.io:20080/...';
    this.cachedData = null;
    this.lastFetch = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }
  
  async fetchPhoneBook() { /* ... */ }
  processPhoneBookData(data) { /* ... */ }
}
```

---

#### 📁 `utils/` - Utilidades

##### 📄 `encryption.js` - Encriptación AES-256-CBC

**Función**: Encripta y desencripta sugerencias.

**Algoritmo**: AES-256-CBC

**Proceso**:
1. Genera un IV (Initialization Vector) aleatorio
2. Crea un cipher con la clave derivada de `ENCRYPTION_KEY`
3. Encripta el texto
4. Retorna `IV:encryptedText` en formato hexadecimal

**Funciones**:
- `encrypt(text)`: Encripta un texto
- `decrypt(encryptedText)`: Desencripta un texto

---

##### 📄 `sanitize.js` - Sanitización backend

**Función**: Sanitiza y desanitiza strings para prevenir XSS.

**Proceso de sanitización**:
- `&` → `&amp;`
- `<` → `&lt;`
- `>` → `&gt;`
- `"` → `&quot;`
- `'` → `&#x27;`
- `/` → `&#x2F;`

**Funciones**:
- `sanitizeString(input)`: Sanitiza un string
- `sanitizeObject(obj)`: Sanitiza un objeto recursivamente
- `sanitizeMessage(text)`: Alias de `sanitizeString`
- `desanitizeMessage(text)`: Revierte la sanitización

**Uso**:
- Mensajes: sanitizar antes de guardar, desanitizar antes de enviar
- Sugerencias: sanitizar antes de encriptar, desanitizar después de desencriptar

---

#### 📄 `socket.js` - Configuración de Socket.IO

**Función**: Inicializa y configura Socket.IO.

**Características**:
- CORS configurado para `http://localhost:5173` y `5174`
- Inicialización del servidor Socket.IO

---

### 📁 frontend/vue-app/

#### 📄 `index.html` - HTML principal

**Función**: Punto de entrada HTML de la SPA.

**Contenido**:
- Div `#app` donde se monta Vue
- Scripts de Vite

---

#### 📁 `src/` - Código fuente del frontend

##### 📄 `main.js` - Punto de entrada de Vue

**Función**: Inicializa la aplicación Vue y configura el router.

**Proceso**:
1. Activa el interceptor de seguridad de `localStorage`
2. Crea la instancia de Vue
3. Configura el router
4. Monta la app en `#app`

**Código clave**:
```javascript
import { setupLocalStorageInterceptor } from './utils/security'
setupLocalStorageInterceptor() // Protección XSS

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.mount('#app')
```

---

##### 📄 `App.vue` - Componente raíz

**Función**: Shell principal de la SPA.

**Contenido**:
- `<router-view />`: Renderiza las vistas según la ruta

---

##### 📁 `router/` - Configuración de rutas

##### 📄 `index.js` - Router de Vue

**Rutas**:
- `/` → Redirige a `/login`
- `/login` → `Login.vue`
- `/chat` → `Chat.vue`
- `/admin` → `Admin_app.vue`

**Configuración**:
- Modo: `createWebHistory` (URLs limpias sin `#`)

---

##### 📁 `views/` - Vistas principales

##### 📄 `Login.vue` - Vista de inicio de sesión

**Función**: Autenticación de usuarios.

**Componentes**:
- Formulario con email y contraseña
- Validación de campos requeridos
- Redirección según rol (admin → `/admin`, user → `/chat`)

**Métodos**:
- `login()`: Envía credenciales al backend, almacena token y usuario, redirige

---

##### 📄 `Chat.vue` - Vista principal de chat

**Función**: Interfaz de chat en tiempo real.

**Componentes**:
- Sidebar con canales y opciones
- Área de mensajes
- Input para enviar mensajes
- Módulos: Buzón de Sugerencias, Foro de Anuncios, Directorio Telefónico

**Funcionalidades**:
- Conexión Socket.IO
- Selección de canales
- Envío/recepción de mensajes en tiempo real
- Buzón de sugerencias
- Foro de anuncios
- Directorio telefónico con búsqueda
- Logout

**Métodos principales**:
- `initializeSocketConnection()`: Conecta a Socket.IO
- `selectChannel(channelId)`: Cambia de canal
- `sendMessage()`: Envía mensaje vía Socket.IO
- `fetchChannels()`: Carga lista de canales
- `toggleSuggestionBox()`: Muestra/oculta buzón de sugerencias
- `toggleAnnouncementsBox()`: Muestra/oculta foro de anuncios
- `togglePhonebookBox()`: Muestra/oculta directorio telefónico
- `logout()`: Cierra sesión

---

##### 📄 `Admin_app.vue` - Vista administrativa

**Función**: Panel de administración.

**Componentes**:
- Dashboard con métricas
- Gestión de usuarios (CRUD)
- Gestión de canales (CRUD)
- Gestión de anuncios (CRUD)
- Visualización de sugerencias

**Funcionalidades**:
- Visualización de métricas agregadas
- Crear/editar/eliminar usuarios
- Crear/editar/eliminar canales
- Crear/eliminar anuncios
- Ver sugerencias desencriptadas
- Cambiar estado de sugerencias

---

##### 📁 `utils/` - Utilidades del frontend

##### 📄 `security.js` - Protección XSS en localStorage

**Función**: Interceptor automático de `localStorage` para sanitizar datos.

**Proceso**:
1. Intercepta `localStorage.setItem()`: sanitiza antes de guardar
2. Intercepta `localStorage.getItem()`: desanitiza al leer
3. Expone `window._getRawItem()`: para ver valores crudos (debug)

**Funciones**:
- `sanitizeForStorage(data)`: Sanitiza datos recursivamente
- `desanitizeForStorage(data)`: Desanitiza datos recursivamente
- `setupLocalStorageInterceptor()`: Configura los interceptores

**Uso automático**: Se activa en `main.js` al iniciar la app.

---

##### 📁 `services/` - Servicios del frontend

##### 📄 `axiosConfig.js` - Configuración de Axios

**Función**: Configura Axios para incluir automáticamente el token JWT.

**Características**:
- Interceptor de requests: agrega `Authorization: Bearer <token>`
- Interceptor de responses: maneja errores 401 (redirige a login)

**Nota**: Actualmente no se usa en todas las vistas (algunas usan `fetch` directamente).

---

##### 📁 `assets/` - Recursos estáticos

##### 📄 `main.css` - Estilos globales

**Función**: Estilos base de la aplicación.

---

##### 📄 `style.css` - Estilos adicionales

**Función**: Estilos complementarios.

---

##### 📁 `components/` - Componentes reutilizables

**Nota**: Actualmente contiene solo `HelloWorld.vue.bak` (archivo de respaldo).

---

#### 📁 `public/` - Archivos públicos

- `background-network.jpg`: Imagen de fondo del chat
- `background-network_2.jpg`: Imagen de fondo alternativa
- `vite.svg`: Logo de Vite

---

#### 📄 `vite.config.js` - Configuración de Vite

**Función**: Configuración del build tool Vite.

**Características**:
- Plugin de Vue
- Configuración de puerto (5173 por defecto)

---

#### 📄 `package.json` - Dependencias del frontend

**Scripts**:
- `dev`: Inicia servidor de desarrollo
- `build`: Construye para producción
- `preview`: Previsualiza build de producción

---

### 📁 docs/ - Documentación

#### 📁 `usecases/` - Casos de uso y diagramas

- `ANUNCIOS.md`: Caso de uso de anuncios
- `AUTENTICACION_Y_ROLES.md`: Autenticación y roles
- `CANALES.md`: Gestión de canales
- `CHAT_TIEMPO_REAL.md`: Chat en tiempo real
- `DASHBOARD.md`: Dashboard administrativo
- `MENSAJES.md`: Gestión de mensajes
- `PHONEBOOK.md`: Directorio telefónico
- `SUGERENCIAS.md`: Buzón de sugerencias
- `USUARIOS.md`: Gestión de usuarios
- `DIAGRAMA_*.md`: Diagramas UML (clases, componentes, despliegue, estados, actividades, secuencia)

#### 📁 `security/` - Documentación de seguridad

- `SEGURIDAD_XSS_TOKENS.md`: Análisis de vulnerabilidades XSS
- `IMPLEMENTACION_SANITIZACION.md`: Guía de implementación
- `SANITIZACION.md`: Explicación de sanitización
- `PRUEBA_SANITIZACION.md`: Pruebas de sanitización
- `ANALISIS_FALTANTE_MITIGACION_XSS.md`: Análisis de mejoras pendientes

#### 📁 `phonebook/` - Documentación del directorio telefónico

- `PHONEBOOK_INTEGRATION_PHASE1.md`: Fase 1 de integración
- `PHONEBOOK_INTEGRATION_PHASE2.md`: Fase 2 de integración
- `PHONEBOOK_INTEGRATION_TECHNICAL_DOCUMENTATION.md`: Documentación técnica

---

## Base de Datos

### MongoDB - Características

**Tipo**: Base de datos NoSQL orientada a documentos

**Ventajas**:
- ✅ Esquema flexible
- ✅ Escalabilidad horizontal
- ✅ Consultas eficientes con índices
- ✅ Agregaciones potentes

**Conexión**:
```javascript
mongoose.connect(DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  autoIndex: false
});
```

**URL de conexión**: `mongodb://localhost:27017/chat_bbdd`

---

### Colecciones (Esquemas)

#### 1. `users` - Usuarios

**Esquema**: `User.js`

**Campos**:
```javascript
{
  _id: ObjectId,           // ID único generado por MongoDB
  name: String,            // Nombre completo
  email: String,           // Email único (índice único)
  password: String,        // Hash bcrypt (60 caracteres)
  role: String,            // 'admin' | 'user'
  active: Boolean,         // true | false
  createdAt: Date          // Fecha de creación
}
```

**Índices**:
- `email`: único

**Relaciones**:
- Referenciado por: `messages.userId`, `channels.createdBy`, `channels.allowedUsers[]`, `announcements.author`, `suggestions.userId`

**Ejemplo de documento**:
```json
{
  "_id": "683f3ca0410438efc32d4b42",
  "name": "Juan Pérez",
  "email": "juan@empresa.com",
  "password": "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890",
  "role": "user",
  "active": true,
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

---

#### 2. `messages` - Mensajes

**Esquema**: `Message.js`

**Campos**:
```javascript
{
  _id: ObjectId,           // ID único
  text: String,            // Contenido sanitizado
  userId: ObjectId,        // Referencia a User
  channel: ObjectId,       // Referencia a Channel
  createdAt: Date          // Fecha de creación
}
```

**Índices**:
- `{ channel: 1, createdAt: 1 }`: Para consultas por canal ordenadas
- `{ userId: 1 }`: Para consultas por usuario

**Relaciones**:
- `userId` → `users._id`
- `channel` → `channels._id`

**Ejemplo de documento**:
```json
{
  "_id": "6846378319c2a6a442e90fee",
  "text": "&lt;script&gt;alert('XSS')&lt;/script&gt;",  // Sanitizado
  "userId": "683f3ca0410438efc32d4b42",
  "channel": "683df716b0e4d393ef3e91af",
  "createdAt": "2025-01-17T15:30:00.000Z"
}
```

---

#### 3. `channels` - Canales

**Esquema**: `Channel.js`

**Campos**:
```javascript
{
  _id: ObjectId,           // ID único
  name: String,            // Nombre único
  description: String,     // Descripción opcional
  isPublic: Boolean,       // true = público, false = privado
  allowedUsers: [ObjectId], // Array de referencias a User (si es privado)
  createdBy: ObjectId,     // Referencia a User
  createdAt: Date,         // Fecha de creación
  active: Boolean          // true | false
}
```

**Índices**:
- `name`: único

**Relaciones**:
- `createdBy` → `users._id`
- `allowedUsers[]` → `users._id[]`

**Ejemplo de documento**:
```json
{
  "_id": "683df716b0e4d393ef3e91af",
  "name": "Ley Karin",
  "description": "Canal sobre normativas legales",
  "isPublic": true,
  "allowedUsers": [],
  "createdBy": "683f3ca0410438efc32d4b42",
  "createdAt": "2025-01-10T08:00:00.000Z",
  "active": true
}
```

---

#### 4. `announcements` - Anuncios

**Esquema**: `Announcement.js`

**Campos**:
```javascript
{
  _id: ObjectId,           // ID único
  title: String,           // Título del anuncio
  content: String,          // Contenido del anuncio
  author: ObjectId,         // Referencia a User
  timestamp: Date,          // Fecha de creación
  active: Boolean          // true | false
}
```

**Relaciones**:
- `author` → `users._id`

**Ejemplo de documento**:
```json
{
  "_id": "6844d7528ad40cf1d4caca37",
  "title": "Reunión de equipo",
  "content": "La reunión será el próximo viernes a las 10:00 AM",
  "author": "683f3ca0410438efc32d4b42",
  "timestamp": "2025-01-16T09:00:00.000Z",
  "active": true
}
```

---

#### 5. `suggestions` - Sugerencias

**Esquema**: `Suggestion.js`

**Campos**:
```javascript
{
  _id: ObjectId,           // ID único
  content: String,         // Contenido encriptado (AES-256-CBC)
  userId: ObjectId,        // Referencia a User
  status: String,          // 'pending' | 'reviewed' | 'implemented'
  createdAt: Date          // Fecha de creación
}
```

**Relaciones**:
- `userId` → `users._id`

**Nota**: El contenido está encriptado. Formato: `IV:encryptedText` (hexadecimal)

**Ejemplo de documento**:
```json
{
  "_id": "6846fbe919c2a6a442e913eb",
  "content": "a1b2c3d4e5f6...:9f8e7d6c5b4a...",  // Encriptado
  "userId": "683f3ca0410438efc32d4b42",
  "status": "pending",
  "createdAt": "2025-01-17T14:20:00.000Z"
}
```

---

### Agregaciones MongoDB

#### Actividad por Canal

```javascript
Message.aggregate([
  { $group: { _id: '$channel', messages: { $sum: 1 } } },
  { $lookup: { from: 'channels', localField: '_id', foreignField: '_id', as: 'channelInfo' } },
  { $unwind: '$channelInfo' },
  { $project: { name: '$channelInfo.name', messages: 1 } },
  { $sort: { messages: -1 } }
]);
```

#### Top Usuarios

```javascript
Message.aggregate([
  { $group: { _id: '$userId', messages: { $sum: 1 } } },
  { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
  { $unwind: '$userInfo' },
  { $project: { name: '$userInfo.name', messages: 1 } },
  { $sort: { messages: -1 } },
  { $limit: 5 }
]);
```

#### Actividad Diaria

```javascript
Message.aggregate([
  {
    $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      count: { $sum: 1 }
    }
  },
  { $sort: { _id: 1 } }
]);
```

---

## Seguridad Implementada

### 1. Autenticación JWT

**Implementación**:
- Tokens firmados con `JWT_SECRET`
- Expiración: 24 horas
- Verificación en middleware `authenticateToken`

**Proceso**:
1. Usuario inicia sesión → Backend genera JWT
2. Frontend almacena token en `localStorage`
3. Cada petición incluye `Authorization: Bearer <token>`
4. Backend verifica token y estado activo del usuario

---

### 2. Hash de Contraseñas (bcrypt)

**Implementación**:
- Algoritmo: bcrypt con salt rounds = 10
- Hook `pre('save')` en modelo `User`

**Proceso**:
1. Usuario crea/actualiza contraseña
2. Mongoose ejecuta hook antes de guardar
3. Contraseña se hashea con bcrypt
4. Se guarda el hash (60 caracteres)

---

### 3. Sanitización XSS

#### Frontend (`utils/security.js`)

**Función**: Interceptor automático de `localStorage`

**Proceso**:
- Al guardar: sanitiza datos antes de almacenar
- Al leer: desanitiza datos al recuperar

**Caracteres escapados**:
- `<` → `&lt;`
- `>` → `&gt;`
- `"` → `&quot;`
- `'` → `&#x27;`
- `/` → `&#x2F;`
- `&` → `&amp;`

#### Backend (`utils/sanitize.js`)

**Función**: Sanitización de mensajes y sugerencias

**Aplicación**:
- Mensajes: sanitizar antes de guardar, desanitizar antes de enviar
- Sugerencias: sanitizar antes de encriptar, desanitizar después de desencriptar

---

### 4. Encriptación de Sugerencias

**Algoritmo**: AES-256-CBC

**Implementación**:
- Clave derivada de `ENCRYPTION_KEY` con scrypt
- IV aleatorio por cada encriptación
- Formato: `IV:encryptedText` (hexadecimal)

**Proceso**:
1. Usuario envía sugerencia
2. Backend sanitiza el contenido
3. Backend encripta con AES-256-CBC
4. Se guarda encriptado en BD
5. Al listar (admin): se desencripta y desanitiza

---

### 5. Control de Acceso

**Roles**:
- `admin`: Acceso completo
- `user`: Acceso limitado

**Middleware**:
- `authenticateToken`: Verifica JWT y estado activo
- `isAdmin`: Verifica rol admin (en rutas específicas)

**Validaciones**:
- Canales privados: verificación de `allowedUsers`
- Rutas admin: verificación de rol

---

### 6. Logs Simplificados

**Implementación**:
- Login: Solo muestra nombre del usuario
- Logout: Solo muestra nombre del usuario
- Sin exposición de emails, IDs, timestamps en logs

---

## Futuras Mejoras

### 🔒 Seguridad

#### 1. Reducción de Duración de Tokens

**Estado actual**: Tokens JWT expiran en 24 horas

**Mejora propuesta**:
- Reducir a 15-30 minutos
- Implementar refresh tokens
- Almacenar refresh tokens en HttpOnly cookies

**Beneficio**: Reduce el riesgo de robo de tokens por XSS

---

#### 2. Implementación de Refresh Tokens

**Estado actual**: Solo access tokens

**Mejora propuesta**:
- Generar refresh token al login (expira en 7 días)
- Almacenar en HttpOnly cookie
- Endpoint `/refresh` para renovar access token
- Invalidar refresh token en logout

**Beneficio**: Mayor seguridad sin comprometer UX

---

#### 3. Headers de Seguridad HTTP

**Estado actual**: Sin headers de seguridad

**Mejora propuesta**:
- Content-Security-Policy (CSP)
- Strict-Transport-Security (HSTS)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block

**Implementación**: Middleware de Express

---

#### 4. Rate Limiting

**Estado actual**: Sin límites de peticiones

**Mejora propuesta**:
- Implementar `express-rate-limit`
- Límites por endpoint:
  - Login: 5 intentos por IP cada 15 minutos
  - API general: 100 peticiones por minuto por usuario
  - Socket.IO: límite de mensajes por segundo

**Beneficio**: Previene ataques de fuerza bruta y DoS

---

#### 5. Validación Exhaustiva de Inputs

**Estado actual**: Validación básica

**Mejora propuesta**:
- Usar `joi` o `express-validator`
- Validar tipos, longitudes, formatos
- Sanitizar todos los campos de usuario (no solo mensajes)

**Campos a validar**:
- Email: formato válido
- Contraseña: mínimo 8 caracteres, mayúsculas, números
- Nombre: solo letras y espacios
- Mensajes: longitud máxima, caracteres permitidos

---

#### 6. Sanitización de Anuncios y Campos de Usuario

**Estado actual**: Solo mensajes y sugerencias

**Mejora propuesta**:
- Aplicar sanitización a anuncios (título y contenido)
- Aplicar sanitización a campos de usuario (nombre, email)

---

### 🚀 Funcionalidades

#### 7. Notificaciones en Tiempo Real

**Mejora propuesta**:
- Notificaciones de nuevos mensajes (si no estás en el canal)
- Notificaciones de nuevos anuncios
- Notificaciones de cambios de estado en sugerencias (admin)

**Implementación**: Eventos Socket.IO adicionales

---

#### 8. Búsqueda de Mensajes

**Mejora propuesta**:
- Búsqueda full-text en mensajes
- Filtros por fecha, usuario, canal
- Índice de texto en MongoDB para búsquedas eficientes

---

#### 9. Archivos Adjuntos

**Mejora propuesta**:
- Subida de archivos (imágenes, documentos)
- Almacenamiento en sistema de archivos o S3
- Validación de tipos y tamaños
- Preview de imágenes

**Implementación**: `multer` para uploads, validación de MIME types

---

#### 10. Mensajes Privados (DM)

**Mejora propuesta**:
- Canales privados entre dos usuarios
- Notificaciones de mensajes privados
- Lista de conversaciones privadas

---

#### 11. Reacciones a Mensajes

**Mejora propuesta**:
- Emojis de reacción (👍, ❤️, 😂, etc.)
- Contador de reacciones por mensaje
- Lista de usuarios que reaccionaron

**Implementación**: Nuevo modelo `Reaction` con referencia a `Message` y `User`

---

#### 12. Edición y Eliminación de Mensajes

**Mejora propuesta**:
- Editar mensajes propios (con indicador "editado")
- Eliminar mensajes propios
- Eliminar mensajes de otros usuarios (admin)

---

#### 13. Historial de Actividad del Usuario

**Mejora propuesta**:
- Registro de acciones del usuario (login, logout, creación de canales, etc.)
- Vista de historial en perfil
- Exportación de historial (admin)

---

### 🎨 Interfaz de Usuario

#### 14. Modo Oscuro

**Mejora propuesta**:
- Toggle para cambiar entre modo claro y oscuro
- Persistencia de preferencia en localStorage
- Transiciones suaves

---

#### 15. Responsive Design

**Estado actual**: Diseño principalmente desktop

**Mejora propuesta**:
- Adaptación para tablets
- Adaptación para móviles
- Menú hamburguesa en móviles
- Optimización de touch events

---

#### 16. Mejoras de UX

**Mejora propuesta**:
- Indicadores de escritura ("Usuario está escribiendo...")
- Indicadores de lectura de mensajes
- Scroll automático mejorado
- Loading states más claros
- Mensajes de error más amigables

---

### 📊 Dashboard

#### 17. Gráficos Interactivos

**Mejora propuesta**:
- Gráficos de líneas para actividad diaria
- Gráficos de barras para top usuarios
- Gráficos de pastel para distribución de mensajes por canal
- Filtros de fecha personalizables

**Implementación**: Mejorar uso de Chart.js

---

#### 18. Exportación de Reportes

**Mejora propuesta**:
- Exportar métricas a PDF
- Exportar métricas a Excel
- Programar reportes automáticos por email

---

### 🔧 Infraestructura

#### 19. Caché Distribuido (Redis)

**Estado actual**: Caché en memoria (solo una instancia)

**Mejora propuesta**:
- Implementar Redis para caché compartido
- Caché de directorio telefónico en Redis
- Caché de sesiones en Redis

**Beneficio**: Escalabilidad horizontal

---

#### 20. Logging Estructurado

**Estado actual**: `console.log` básico

**Mejora propuesta**:
- Usar `winston` o `pino` para logging
- Niveles de log (info, warn, error)
- Rotación de archivos de log
- Integración con servicios de monitoreo (Sentry, LogRocket)

---

#### 21. Testing

**Estado actual**: Sin tests

**Mejora propuesta**:
- Tests unitarios (Jest)
- Tests de integración (Supertest)
- Tests E2E (Cypress o Playwright)
- Coverage mínimo del 80%

---

#### 22. CI/CD

**Mejora propuesta**:
- Pipeline de CI (GitHub Actions, GitLab CI)
- Tests automáticos en cada commit
- Deploy automático a staging/producción
- Rollback automático en caso de errores

---

### 📱 Integraciones

#### 23. Integración con Email

**Mejora propuesta**:
- Notificaciones por email de nuevos mensajes
- Resumen diario/semanal de actividad
- Recuperación de contraseña por email

**Implementación**: Nodemailer o servicio de email (SendGrid, Mailgun)

---

#### 24. Integración con Calendario

**Mejora propuesta**:
- Sincronización con Google Calendar
- Recordatorios de eventos en canales
- Notificaciones de reuniones próximas

---

#### 25. API Pública Documentada

**Mejora propuesta**:
- Documentación con Swagger/OpenAPI
- Endpoints públicos para integraciones
- Rate limiting por API key

---

### 🗄️ Base de Datos

#### 26. Optimización de Consultas

**Mejora propuesta**:
- Análisis de consultas lentas
- Índices adicionales según uso
- Paginación en todas las listas
- Caché de consultas frecuentes

---

#### 27. Backup Automático

**Mejora propuesta**:
- Backups diarios automáticos
- Retención de backups (7 días, 30 días, 1 año)
- Restauración automatizada en caso de fallo

---

#### 28. Migraciones de Esquema

**Mejora propuesta**:
- Sistema de migraciones (migrate-mongo)
- Versionado de esquemas
- Rollback de migraciones

---

### 🔐 Auditoría

#### 29. Registro de Auditoría

**Mejora propuesta**:
- Registro de todas las acciones críticas
- Modelo `AuditLog` con: usuario, acción, timestamp, IP
- Vista de auditoría en dashboard (admin)

---

#### 30. Análisis de Seguridad

**Mejora propuesta**:
- Escaneo de vulnerabilidades (npm audit, Snyk)
- Análisis estático de código (ESLint security)
- Penetration testing periódico

---

## Conclusión

Esta aplicación es una **Plataforma Comunicacional Empresarial** robusta con funcionalidades de chat en tiempo real, gestión de usuarios, canales, anuncios, sugerencias anónimas y directorio telefónico. Implementa medidas de seguridad básicas (JWT, bcrypt, sanitización XSS, encriptación) y tiene un gran potencial de mejora en seguridad, funcionalidades, UX e infraestructura.

### Puntos Fuertes

- ✅ Arquitectura clara y separación de responsabilidades
- ✅ Comunicación en tiempo real con Socket.IO
- ✅ Protección básica contra XSS
- ✅ Encriptación de datos sensibles (sugerencias)
- ✅ Control de acceso basado en roles
- ✅ Dashboard administrativo funcional

### Áreas de Mejora Prioritarias

1. **Seguridad**: Refresh tokens, headers de seguridad, rate limiting
2. **Validación**: Validación exhaustiva de inputs
3. **Testing**: Implementar suite de tests
4. **UX**: Mejoras de interfaz y responsive design
5. **Infraestructura**: Logging estructurado, caché distribuido

---

**Última actualización**: Enero 2025

**Versión del documento**: 1.0

