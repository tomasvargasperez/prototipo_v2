# Manual 01: Arquitectura y Tecnologías de la Aplicación

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura General](#arquitectura-general)
3. [Stack Tecnológico Completo](#stack-tecnológico-completo)
4. [Por Qué Cada Tecnología](#por-qué-cada-tecnología)
5. [Estructura del Proyecto](#estructura-del-proyecto)
6. [Flujo de Inicialización](#flujo-de-inicialización)

---

## Introducción

Este manual te ayudará a entender **por qué** se eligió cada tecnología y **cómo** se estructura la aplicación. Es fundamental comprender esto antes de profundizar en funcionalidades específicas.

### Objetivo de la Aplicación

La plataforma está diseñada para ICAFAL con estos requisitos:
- ✅ Comunicación en tiempo real entre empleados
- ✅ Seguridad avanzada (ISO 27001)
- ✅ Control total sobre los datos
- ✅ Escalabilidad y mantenibilidad
- ✅ Costos reducidos (tecnologías open source)

---

## Arquitectura General

### Patrón Arquitectónico: Cliente-Servidor con Separación de Capas

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                      │
│                   (Frontend - Vue.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Login.vue  │  │   Chat.vue   │  │ Admin_app.vue│       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                  │
│                    Vue Router                                │
│                            │                                  │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    HTTP/REST │ Socket.IO
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                    CAPA DE APLICACIÓN                        │
│                   (Backend - Node.js)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Routes     │  │  Controllers │  │  Middleware  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                  │
│                    Express + Socket.IO                        │
│                            │                                  │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    Mongoose ODM
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                    CAPA DE DATOS                             │
│                   (MongoDB)                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Users      │  │  Messages    │  │  Channels    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└───────────────────────────────────────────────────────────────┘
```

### ¿Por Qué Esta Arquitectura?

**Separación de Responsabilidades**:
- **Frontend**: Solo se encarga de la interfaz de usuario
- **Backend**: Lógica de negocio y seguridad
- **Base de Datos**: Almacenamiento persistente

**Ventajas**:
1. ✅ **Mantenibilidad**: Cambios en una capa no afectan las otras
2. ✅ **Escalabilidad**: Puedes escalar frontend y backend independientemente
3. ✅ **Seguridad**: La lógica crítica está en el backend, no expuesta al cliente
4. ✅ **Reutilización**: El backend puede servir múltiples clientes (web, móvil, etc.)

---

## Stack Tecnológico Completo

### Backend (Servidor)

| Tecnología | Versión | Archivo Principal | Propósito |
|------------|---------|-------------------|-----------|
| **Node.js** | 18+ | Runtime | Ejecutar JavaScript en el servidor |
| **Express** | ^5.1.0 | `backend/app.js` | Framework web para API REST |
| **MongoDB** | 5+ | Base de datos | Almacenamiento de datos |
| **Mongoose** | ^6.13.2 | `backend/models/` | ODM para MongoDB |
| **Socket.IO** | ^4.8.1 | `backend/app.js` | Comunicación en tiempo real |
| **JWT** | ^9.0.2 | `backend/middleware/auth.js` | Autenticación |
| **bcrypt** | ^5.1.1 | `backend/models/User.js` | Hash de contraseñas |
| **dotenv** | ^16.5.0 | `backend/app.js` | Variables de entorno |
| **cors** | - | `backend/app.js` | Permisos CORS |
| **crypto** | nativo | `backend/utils/encryption.js` | Encriptación AES-256 |

### Frontend (Cliente)

| Tecnología | Versión | Archivo Principal | Propósito |
|------------|---------|-------------------|-----------|
| **Vue.js** | ^3.5.13 | `frontend/vue-app/src/main.js` | Framework reactivo |
| **Vue Router** | ^4.5.1 | `frontend/vue-app/src/router/` | Navegación SPA |
| **Vite** | ^6.3.5 | `frontend/vue-app/vite.config.js` | Build tool |
| **Socket.IO Client** | ^4.8.1 | `frontend/vue-app/src/views/Chat.vue` | Cliente WebSocket |
| **Font Awesome** | ^6.7.2 | `frontend/vue-app/src/main.js` | Iconos |
| **Chart.js** | ^4.4.1 | `frontend/vue-app/src/views/Admin_app.vue` | Gráficos |

### Servicios Externos

| Tecnología | Versión | Archivo | Propósito |
|------------|---------|--------|-----------|
| **axios** | ^1.9.0 | `backend/services/phoneBookService.js` | Cliente HTTP |
| **fast-xml-parser** | ^5.2.4 | `backend/services/phoneBookService.js` | Parseo XML |

---

## Por Qué Cada Tecnología

### 1. Node.js (Backend Runtime)

**¿Qué es?**
Node.js es un entorno de ejecución de JavaScript fuera del navegador, basado en el motor V8 de Chrome.

**¿Por qué Node.js y no otras opciones?**

#### Alternativas Consideradas:
- ❌ **PHP**: Lenguaje diferente, curva de aprendizaje
- ❌ **Python (Django/Flask)**: Más lento para I/O, sintaxis diferente
- ❌ **Java (Spring)**: Más verboso, requiere más configuración
- ❌ **C# (.NET)**: Requiere Windows Server o configuración compleja

#### Ventajas de Node.js:
1. ✅ **JavaScript en todo el stack**: Mismo lenguaje en frontend y backend
   ```javascript
   // Frontend y Backend usan la misma sintaxis
   const user = { name: "Juan" };
   const users = users.map(u => u.name);
   ```

2. ✅ **Event-driven y asíncrono**: Perfecto para aplicaciones en tiempo real
   ```javascript
   // Node.js maneja múltiples conexiones simultáneas eficientemente
   io.on('connection', (socket) => {
     // Cada conexión es manejada de forma asíncrona
   });
   ```

3. ✅ **Ecosistema npm**: Miles de librerías disponibles
4. ✅ **Rendimiento**: Excelente para I/O intensivo (chat, APIs)
5. ✅ **Open source**: Sin costos de licencia

**Código de ejemplo** (`backend/app.js`):
```javascript
// Node.js permite crear un servidor HTTP fácilmente
const http = require('http');
const server = http.createServer(app);
server.listen(3000); // Escucha en puerto 3000
```

---

### 2. Express.js (Framework Web)

**¿Qué es?**
Express es un framework minimalista y flexible para Node.js que facilita la creación de APIs REST y servidores web.

**¿Por qué Express y no otras opciones?**

#### Alternativas Consideradas:
- ❌ **Koa.js**: Más moderno pero menos documentación
- ❌ **Nest.js**: Demasiado complejo para este proyecto
- ❌ **Fastify**: Más rápido pero menos maduro
- ❌ **Hapi.js**: Más configuración, menos flexible

#### Ventajas de Express:
1. ✅ **Simplicidad**: Fácil de aprender y usar
   ```javascript
   // Express hace que crear rutas sea muy simple
   app.get('/api/users', (req, res) => {
     res.json({ users: [] });
   });
   ```

2. ✅ **Middleware**: Sistema potente de middleware
   ```javascript
   // Middleware para parsear JSON automáticamente
   app.use(express.json());
   ```

3. ✅ **Madurez**: Más de 10 años en el mercado, muy estable
4. ✅ **Comunidad**: Gran cantidad de recursos y ejemplos
5. ✅ **Flexibilidad**: No impone estructura, tú decides

**Código de ejemplo** (`backend/app.js`):
```javascript
const express = require('express');
const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Ruta simple
app.get('/api/users', (req, res) => {
  res.json({ message: 'Lista de usuarios' });
});
```

---

### 3. MongoDB (Base de Datos)

**¿Qué es?**
MongoDB es una base de datos NoSQL orientada a documentos. Almacena datos en formato JSON (BSON).

**¿Por qué MongoDB y no SQL tradicional?**

#### Alternativas Consideradas:
- ❌ **MySQL/PostgreSQL**: Requieren esquemas rígidos, migraciones complejas
- ❌ **SQLite**: No soporta múltiples conexiones simultáneas
- ❌ **Firebase**: Servicio en la nube, menos control

#### Ventajas de MongoDB:
1. ✅ **Esquema flexible**: Puedes agregar campos sin migraciones
   ```javascript
   // En SQL necesitarías ALTER TABLE
   // En MongoDB simplemente guardas el documento
   const user = {
     name: "Juan",
     email: "juan@empresa.com",
     nuevoCampo: "valor" // ← Se agrega automáticamente
   };
   ```

2. ✅ **JSON nativo**: Mismo formato que JavaScript
   ```javascript
   // Los documentos son objetos JavaScript
   const message = {
     text: "Hola",
     userId: "123",
     channel: "456",
     createdAt: new Date()
   };
   await Message.create(message); // ← Muy natural
   ```

3. ✅ **Escalabilidad horizontal**: Fácil de escalar
4. ✅ **Consultas potentes**: Agregaciones complejas
5. ✅ **Open source**: Sin costos de licencia

**Código de ejemplo** (`backend/models/Message.js`):
```javascript
// Esquema flexible de MongoDB
const MessageSchema = new mongoose.Schema({
  text: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' },
  createdAt: { type: Date, default: Date.now }
});
```

---

### 4. Mongoose (ODM - Object Document Mapper)

**¿Qué es?**
Mongoose es una librería que proporciona una solución basada en esquemas para modelar datos de MongoDB.

**¿Por qué Mongoose y no el driver nativo de MongoDB?**

#### Alternativas:
- ❌ **Driver nativo de MongoDB**: Más código, menos validación
- ❌ **TypeORM**: Diseñado para SQL, no ideal para MongoDB

#### Ventajas de Mongoose:
1. ✅ **Validación automática**: Valida datos antes de guardar
   ```javascript
   // Mongoose valida automáticamente
   const UserSchema = new mongoose.Schema({
     email: {
       type: String,
       required: true,  // ← Valida que existe
       unique: true     // ← Valida que es único
     }
   });
   ```

2. ✅ **Hooks (pre/post)**: Ejecuta código antes/después de operaciones
   ```javascript
   // Hash automático de contraseña antes de guardar
   UserSchema.pre('save', async function(next) {
     if (this.isModified('password')) {
       this.password = await bcrypt.hash(this.password, 10);
     }
     next();
   });
   ```

3. ✅ **Relaciones**: Populate para referencias
   ```javascript
   // Populate automáticamente trae datos relacionados
   const message = await Message.findById(id)
     .populate('userId', 'name'); // ← Trae el nombre del usuario
   ```

4. ✅ **Tipado**: Esquemas definen estructura de datos

**Código de ejemplo** (`backend/models/User.js`):
```javascript
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

// Hook que se ejecuta ANTES de guardar
UserSchema.pre('save', async function(next) {
  // Hashea la contraseña automáticamente
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});
```

---

### 5. Socket.IO (Comunicación en Tiempo Real)

**¿Qué es?**
Socket.IO es una librería que permite comunicación bidireccional en tiempo real entre cliente y servidor usando WebSockets.

**¿Por qué Socket.IO y no WebSockets nativos o otras opciones?**

#### Alternativas Consideradas:
- ❌ **WebSockets nativos**: Más código, sin fallback automático
- ❌ **Server-Sent Events (SSE)**: Solo servidor → cliente
- ❌ **Polling**: Ineficiente, consume muchos recursos

#### Ventajas de Socket.IO:
1. ✅ **Fallback automático**: Si WebSocket falla, usa polling
   ```javascript
   // Socket.IO automáticamente elige el mejor método
   const socket = io('http://localhost:3000');
   // Intenta WebSocket, si falla usa polling
   ```

2. ✅ **Reconexión automática**: Si se cae la conexión, se reconecta
   ```javascript
   // Socket.IO maneja reconexión automáticamente
   socket.on('disconnect', () => {
     // Automáticamente intenta reconectar
   });
   ```

3. ✅ **Rooms/Channels**: Fácil agrupar conexiones
   ```javascript
   // Unirse a un canal es muy simple
   socket.join('canal-123');
   io.to('canal-123').emit('mensaje', data);
   ```

4. ✅ **Eventos personalizados**: Sistema de eventos flexible
   ```javascript
   // Puedes crear tus propios eventos
   socket.on('send_message', (data) => {
     // Maneja el evento personalizado
   });
   ```

**Código de ejemplo** (`backend/app.js`):
```javascript
// Servidor
io.on('connection', (socket) => {
  socket.on('join_channel', (channelId) => {
    socket.join(channelId); // ← Usuario se une al canal
  });

  socket.on('send_message', (data) => {
    io.to(data.channelId).emit('new_message', data);
    // ← Envía a todos en el canal
  });
});
```

```javascript
// Cliente
const socket = io('http://localhost:3000');
socket.emit('join_channel', 'canal-123');
socket.on('new_message', (message) => {
  // ← Recibe mensaje en tiempo real
});
```

---

### 6. JWT (JSON Web Tokens)

**¿Qué es?**
JWT es un estándar abierto para transmitir información de forma segura entre partes como un objeto JSON.

**¿Por qué JWT y no sesiones tradicionales o otras opciones?**

#### Alternativas Consideradas:
- ❌ **Sesiones en servidor**: Requieren almacenamiento, no escalan bien
- ❌ **Cookies de sesión**: Más complejo, requiere configuración adicional
- ❌ **OAuth2**: Demasiado complejo para este caso

#### Ventajas de JWT:
1. ✅ **Stateless**: No requiere almacenamiento en servidor
   ```javascript
   // El token contiene toda la información necesaria
   const token = jwt.sign({ userId: user._id }, SECRET);
   // No necesitas guardar nada en el servidor
   ```

2. ✅ **Escalabilidad**: Funciona con múltiples servidores
   ```javascript
   // Cualquier servidor puede verificar el token
   const decoded = jwt.verify(token, SECRET);
   // No necesita consultar base de datos compartida
   ```

3. ✅ **Portable**: Funciona en web, móvil, etc.
4. ✅ **Seguro**: Firmado digitalmente, no se puede modificar
5. ✅ **Estándar**: Ampliamente adoptado

**Código de ejemplo** (`backend/routes/UserRoutes.js`):
```javascript
// Generar token
const token = jwt.sign(
  { userId: user._id },           // Payload (datos)
  process.env.JWT_SECRET,          // Clave secreta
  { expiresIn: '24h' }            // Expiración
);

// Verificar token
const decoded = jwt.verify(token, process.env.JWT_SECRET);
// Si el token fue modificado, lanza error
```

---

### 7. bcrypt (Hash de Contraseñas)

**¿Qué es?**
bcrypt es un algoritmo de hash diseñado específicamente para contraseñas. Es lento intencionalmente para prevenir ataques de fuerza bruta.

**¿Por qué bcrypt y no otros algoritmos?**

#### Alternativas Consideradas:
- ❌ **MD5/SHA-256**: Demasiado rápidos, vulnerables a fuerza bruta
- ❌ **Argon2**: Más nuevo, menos soporte
- ❌ **PBKDF2**: Más complejo de configurar

#### Ventajas de bcrypt:
1. ✅ **Lento intencionalmente**: Dificulta ataques de fuerza bruta
   ```javascript
   // bcrypt es lento (tarda ~100ms)
   // Esto hace que probar millones de contraseñas sea inviable
   const hash = await bcrypt.hash(password, 10);
   // 10 = número de rondas (más rondas = más lento = más seguro)
   ```

2. ✅ **Salt automático**: Genera salt único por contraseña
   ```javascript
   // Cada hash tiene un salt diferente
   const hash1 = await bcrypt.hash('password123', 10);
   const hash2 = await bcrypt.hash('password123', 10);
   // hash1 !== hash2 (diferentes salts)
   ```

3. ✅ **Maduro y probado**: Usado por millones de aplicaciones
4. ✅ **Fácil de usar**: API simple

**Código de ejemplo** (`backend/models/User.js`):
```javascript
// Hash automático antes de guardar
UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10); // Genera salt
    this.password = await bcrypt.hash(this.password, salt); // Hashea
  }
  next();
});

// Verificar contraseña
const isValid = await bcrypt.compare('password123', user.password);
// Compara la contraseña con el hash almacenado
```

---

### 8. Vue.js (Frontend Framework)

**¿Qué es?**
Vue.js es un framework progresivo de JavaScript para construir interfaces de usuario.

**¿Por qué Vue.js y no React o Angular?**

#### Alternativas Consideradas:
- ❌ **React**: Más complejo, requiere más configuración
- ❌ **Angular**: Demasiado pesado, curva de aprendizaje alta
- ❌ **Svelte**: Menos maduro, menos recursos

#### Ventajas de Vue.js:
1. ✅ **Progresivo**: Puedes adoptarlo gradualmente
   ```javascript
   // Puedes usar Vue solo en partes de tu aplicación
   const { createApp } = Vue;
   createApp({ data() { return { count: 0 } } }).mount('#app');
   ```

2. ✅ **Sintaxis simple**: Fácil de aprender
   ```vue
   <!-- Template muy legible -->
   <template>
     <div>
       <p>{{ message }}</p>
       <button @click="increment">Click</button>
     </div>
   </template>
   ```

3. ✅ **Reactividad automática**: Los cambios se reflejan automáticamente
   ```javascript
   // Cambias el dato, la vista se actualiza automáticamente
   this.message = 'Nuevo mensaje'; // ← La vista se actualiza sola
   ```

4. ✅ **Documentación excelente**: Muy bien documentado
5. ✅ **Rendimiento**: Muy rápido

**Código de ejemplo** (`frontend/vue-app/src/views/Chat.vue`):
```vue
<template>
  <div>
    <p>{{ userName }}</p>
    <button @click="logout">Cerrar Sesión</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      userName: 'Juan'
    }
  },
  methods: {
    logout() {
      this.userName = ''; // ← La vista se actualiza automáticamente
    }
  }
}
</script>
```

---

### 9. Vite (Build Tool)

**¿Qué es?**
Vite es un build tool moderno que proporciona un servidor de desarrollo extremadamente rápido.

**¿Por qué Vite y no Webpack o Create React App?**

#### Alternativas Consideradas:
- ❌ **Webpack**: Más lento, configuración compleja
- ❌ **Parcel**: Menos popular, menos recursos
- ❌ **Create React App**: Solo para React

#### Ventajas de Vite:
1. ✅ **Desarrollo rápido**: Hot Module Replacement instantáneo
   ```bash
   # Vite inicia en milisegundos
   npm run dev
   # Webpack puede tardar varios segundos
   ```

2. ✅ **Build optimizado**: Usa Rollup para producción
   ```bash
   # Build de producción muy optimizado
   npm run build
   # Genera archivos minificados y optimizados
   ```

3. ✅ **Configuración mínima**: Funciona out-of-the-box
4. ✅ **Soporte nativo para Vue**: Diseñado para Vue.js

**Código de ejemplo** (`frontend/vue-app/vite.config.js`):
```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()], // ← Plugin de Vue
  server: {
    port: 5173 // ← Puerto de desarrollo
  }
})
```

---

### 10. Vue Router (Navegación)

**¿Qué es?**
Vue Router es el router oficial de Vue.js para crear Single Page Applications (SPA).

**¿Por qué Vue Router y no navegación tradicional?**

#### Alternativas:
- ❌ **Navegación tradicional**: Recarga toda la página (lento)
- ❌ **Router manual**: Mucho código, propenso a errores

#### Ventajas de Vue Router:
1. ✅ **SPA**: No recarga la página, navegación instantánea
   ```javascript
   // Cambiar de ruta es instantáneo
   this.$router.push('/chat'); // ← No recarga la página
   ```

2. ✅ **Rutas protegidas**: Fácil proteger rutas
   ```javascript
   // Puedes proteger rutas con guards
   router.beforeEach((to, from, next) => {
     if (to.path === '/admin' && !isAdmin) {
       next('/login'); // ← Redirige si no es admin
     }
   });
   ```

3. ✅ **Historial del navegador**: Botones atrás/adelante funcionan
4. ✅ **URLs limpias**: Sin `#` en la URL

**Código de ejemplo** (`frontend/vue-app/src/router/index.js`):
```javascript
const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/chat', component: Chat },
  { path: '/admin', component: AdminApp }
];

// Navegación
this.$router.push('/chat'); // ← Cambia a vista de chat
```

---

## Estructura del Proyecto

### Organización de Carpetas

```
app_chat_corp/
├── backend/                    # Servidor Node.js
│   ├── app.js                 # Punto de entrada del servidor
│   ├── socket.js              # Configuración Socket.IO
│   ├── models/                # Modelos de base de datos (Mongoose)
│   │   ├── User.js
│   │   ├── Message.js
│   │   ├── Channel.js
│   │   ├── Announcement.js
│   │   └── Suggestion.js
│   ├── routes/                # Rutas HTTP (Express)
│   │   ├── UserRoutes.js
│   │   ├── MessageRoutes.js
│   │   ├── ChannelRoutes.js
│   │   ├── AnnouncementRoutes.js
│   │   ├── SuggestionRoutes.js
│   │   ├── DashboardRoutes.js
│   │   └── phoneBookRoutes.js
│   ├── controllers/           # Lógica de negocio (alternativa)
│   ├── middleware/            # Middlewares (auth, validación)
│   │   └── auth.js
│   ├── services/              # Servicios externos
│   │   └── phoneBookService.js
│   └── utils/                 # Utilidades
│       ├── encryption.js
│       └── sanitize.js
│
└── frontend/
    └── vue-app/               # Aplicación Vue.js
        ├── src/
        │   ├── main.js        # Punto de entrada Vue
        │   ├── App.vue        # Componente raíz
        │   ├── router/        # Configuración de rutas
        │   │   └── index.js
        │   ├── views/         # Vistas principales
        │   │   ├── Login.vue
        │   │   ├── Chat.vue
        │   │   └── Admin_app.vue
        │   ├── utils/         # Utilidades frontend
        │   │   └── security.js
        │   └── services/      # Servicios (axios)
        │       └── axiosConfig.js
        └── public/            # Archivos estáticos
```

### ¿Por Qué Esta Estructura?

**Separación por Responsabilidad**:
- `models/`: Define estructura de datos
- `routes/`: Define endpoints HTTP
- `middleware/`: Lógica transversal (auth, validación)
- `services/`: Integraciones externas
- `utils/`: Funciones reutilizables

**Ventajas**:
1. ✅ Fácil de navegar
2. ✅ Fácil de mantener
3. ✅ Fácil de escalar
4. ✅ Convenciones claras

---

## Flujo de Inicialización

### Backend: `backend/app.js`

Vamos línea por línea:

```javascript
// 1. IMPORTACIONES
const express = require('express');
```
**¿Qué hace?**: Importa Express para crear el servidor web.

```javascript
const mongoose = require('mongoose');
```
**¿Qué hace?**: Importa Mongoose para conectar con MongoDB.

```javascript
const dotenv = require('dotenv');
```
**¿Qué hace?**: Carga variables de entorno desde archivo `.env`.

```javascript
// 2. CONFIGURACIÓN
dotenv.config();
```
**¿Qué hace?**: Lee el archivo `.env` y carga las variables.

```javascript
mongoose.set('strictQuery', true);
```
**¿Qué hace?**: Configura Mongoose para evitar advertencias de deprecación.

```javascript
// 3. INICIALIZACIÓN
const app = express();
```
**¿Qué hace?**: Crea la aplicación Express.

```javascript
const server = http.createServer(app);
```
**¿Qué hace?**: Crea servidor HTTP (necesario para Socket.IO).

```javascript
const io = socket.init(server);
```
**¿Qué hace?**: Inicializa Socket.IO con el servidor HTTP.

```javascript
// 4. CONEXIÓN A BASE DE DATOS
mongoose.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: false
})
```
**¿Qué hace?**: Conecta a MongoDB con opciones de configuración.

```javascript
// 5. MIDDLEWARES
app.use(cors());
```
**¿Qué hace?**: Permite peticiones desde otros orígenes (frontend).

```javascript
app.use(express.json());
```
**¿Qué hace?**: Parsea automáticamente JSON en las peticiones.

```javascript
// 6. RUTAS
app.use('/api/users', userRoutes);
```
**¿Qué hace?**: Registra rutas de usuarios en `/api/users`.

```javascript
// 7. INICIAR SERVIDOR
server.listen(port, () => {
    console.log(`🚀 Servidor backend escuchando en el puerto ${port}`);
});
```
**¿Qué hace?**: Inicia el servidor en el puerto especificado.

---

### Frontend: `frontend/vue-app/src/main.js`

```javascript
// 1. ACTIVAR SANITIZACIÓN
import { setupLocalStorageInterceptor } from './utils/security'
setupLocalStorageInterceptor()
```
**¿Qué hace?**: Activa protección XSS antes de que la app inicie.

```javascript
// 2. IMPORTAR VUE
import { createApp } from 'vue'
```
**¿Qué hace?**: Importa función para crear aplicación Vue.

```javascript
// 3. IMPORTAR COMPONENTE RAÍZ
import App from './App.vue'
```
**¿Qué hace?**: Importa el componente principal.

```javascript
// 4. IMPORTAR ROUTER
import router from './router'
```
**¿Qué hace?**: Importa configuración de rutas.

```javascript
// 5. CREAR Y CONFIGURAR APP
const app = createApp(App)
app.use(router)
```
**¿Qué hace?**: Crea la app y configura el router.

```javascript
// 6. MONTAR EN EL DOM
app.mount('#app')
```
**¿Qué hace?**: Monta la aplicación en el elemento `#app` del HTML.

---

## Resumen

### Decisiones Clave

1. **Node.js + Express**: JavaScript en todo el stack, fácil de aprender
2. **MongoDB + Mongoose**: Esquema flexible, perfecto para prototipos
3. **Socket.IO**: Comunicación en tiempo real sin complejidad
4. **Vue.js**: Framework progresivo, fácil de adoptar
5. **JWT**: Autenticación stateless, escalable
6. **bcrypt**: Seguridad probada para contraseñas

### Próximos Pasos

Ahora que entiendes la arquitectura y tecnologías, puedes continuar con:
- **Manual 02**: Autenticación (cómo funciona login, JWT, seguridad)
- **Manual 03**: Chat en Tiempo Real (Socket.IO, mensajería)

---

**Última actualización**: Enero 2025

**Versión**: 1.0

