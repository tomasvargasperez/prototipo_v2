# Manual 03: Chat en Tiempo Real con Socket.IO

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [¿Qué es Socket.IO y Por Qué se Usa?](#qué-es-socketio-y-por-qué-se-usa)
3. [Configuración de Socket.IO](#configuración-de-socketio)
4. [Flujo Completo de un Mensaje](#flujo-completo-de-un-mensaje)
5. [Unirse a un Canal](#unirse-a-un-canal)
6. [Enviar un Mensaje](#enviar-un-mensaje)
7. [Recibir Mensajes en Tiempo Real](#recibir-mensajes-en-tiempo-real)
8. [Sanitización de Mensajes](#sanitización-de-mensajes)
9. [Modelo de Mensajes](#modelo-de-mensajes)

---

## Introducción

El chat en tiempo real es la **funcionalidad central** de tu aplicación. Este manual te explicará cómo funciona Socket.IO, por qué se eligió sobre otras alternativas, y cómo cada línea de código contribuye al sistema de mensajería.

### Objetivos del Sistema de Chat

1. ✅ Comunicación instantánea entre usuarios
2. ✅ Mensajes persistentes en base de datos
3. ✅ Historial de conversaciones
4. ✅ Canales públicos y privados
5. ✅ Seguridad (sanitización, validación)

---

## ¿Qué es Socket.IO y Por Qué se Usa?

### ¿Qué es Socket.IO?

Socket.IO es una librería que permite **comunicación bidireccional en tiempo real** entre cliente y servidor usando WebSockets (con fallback a polling).

### ¿Por Qué Socket.IO y No Otras Opciones?

#### Alternativas Consideradas:

**1. WebSockets Nativos**:
```javascript
// WebSocket nativo
const ws = new WebSocket('ws://localhost:3000');
ws.onmessage = (event) => { /* ... */ };
```
- ❌ No tiene fallback automático
- ❌ No tiene reconexión automática
- ❌ Más código manual
- ❌ No tiene sistema de rooms/channels

**2. Server-Sent Events (SSE)**:
```javascript
// SSE solo permite servidor → cliente
const eventSource = new EventSource('/events');
eventSource.onmessage = (event) => { /* ... */ };
```
- ❌ Solo servidor → cliente (no bidireccional)
- ❌ No permite enviar datos del cliente

**3. Polling (HTTP repetido)**:
```javascript
// Polling: peticiones cada X segundos
setInterval(() => {
  fetch('/api/messages').then(/* ... */);
}, 2000);
```
- ❌ Ineficiente (muchas peticiones innecesarias)
- ❌ No es realmente "tiempo real"
- ❌ Consume muchos recursos

#### Ventajas de Socket.IO:

1. ✅ **Fallback Automático**: Si WebSocket falla, usa polling
2. ✅ **Reconexión Automática**: Si se cae la conexión, se reconecta
3. ✅ **Rooms/Channels**: Fácil agrupar conexiones
4. ✅ **Eventos Personalizados**: Sistema flexible de eventos
5. ✅ **Maduro y Probado**: Usado por millones de aplicaciones

### Comparación Visual

```
┌─────────────────────────────────────────────────────────┐
│                    HTTP REST (Polling)                   │
│                                                          │
│  Cliente: "¿Hay mensajes nuevos?"                        │
│  Servidor: "No"                                          │
│  [Espera 2 segundos]                                     │
│  Cliente: "¿Hay mensajes nuevos?"                        │
│  Servidor: "No"                                          │
│  [Espera 2 segundos]                                     │
│  Cliente: "¿Hay mensajes nuevos?"                        │
│  Servidor: "Sí, aquí está"                               │
│                                                          │
│  ❌ Ineficiente, no es tiempo real                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Socket.IO (WebSocket)                │
│                                                          │
│  Cliente ←─── Conexión persistente ───→ Servidor         │
│                                                          │
│  Cliente: [Conectado, esperando...]                     │
│  Servidor: [Nuevo mensaje] → Cliente                    │
│  Cliente: Recibe instantáneamente                       │
│                                                          │
│  ✅ Eficiente, tiempo real                               │
└─────────────────────────────────────────────────────────┘
```

---

## Configuración de Socket.IO

### Backend: `backend/socket.js`

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

**Línea por línea**:

```javascript
let io;
```
**¿Qué hace?**: Declara variable para almacenar la instancia de Socket.IO.

**¿Por qué `let` y no `const`?**
- `io` se asigna después (en `init`)
- `let` permite reasignación

```javascript
module.exports = {
    init: function(httpServer) {
```
**¿Qué hace?**: Exporta un objeto con función `init`.

**¿Por qué función `init`?**
- Socket.IO necesita el servidor HTTP para inicializarse
- Permite inicializar en el momento correcto (después de crear el servidor)

```javascript
        io = require('socket.io')(httpServer, {
```
**¿Qué hace?**: Crea instancia de Socket.IO con el servidor HTTP.

**¿Por qué necesita `httpServer`?**
- Socket.IO se monta sobre el servidor HTTP
- Comparte el mismo puerto (3000)
- No necesitas puerto separado

```javascript
            cors: {
                origin: ['http://localhost:5173', 'http://localhost:5174'],
                methods: ['GET', 'POST']
            }
```
**¿Qué hace?**: Configura CORS para Socket.IO.

**¿Qué es CORS?**
- Cross-Origin Resource Sharing
- Permite peticiones desde otros orígenes (dominios, puertos)

**¿Por qué especificar orígenes?**
- Seguridad: Solo permite conexiones desde estos orígenes
- Previene conexiones no autorizadas

**Orígenes permitidos**:
- `http://localhost:5173`: Frontend en desarrollo (Vite)
- `http://localhost:5174`: Frontend alternativo (si cambias puerto)

### Inicialización en `backend/app.js`

```javascript
const server = http.createServer(app);
const io = socket.init(server);
```

**Flujo**:
1. Crea servidor HTTP
2. Inicializa Socket.IO con el servidor
3. Socket.IO escucha en el mismo puerto (3000)

---

## Flujo Completo de un Mensaje

### Diagrama de Flujo

```
┌──────────────┐
│   Usuario A  │
│  (Frontend)  │
└──────┬───────┘
       │ 1. Escribe mensaje y presiona Enter
       │
       ▼
┌─────────────────────────────┐
│      Chat.vue                │
│  sendMessage()               │
│  - Valida mensaje             │
│  - socket.emit('send_message')│
└──────┬───────────────────────┘
       │ 2. Evento 'send_message'
       │    { channelId, text, userId }
       │
       ▼
┌─────────────────────────────┐
│   Backend (app.js)           │
│   socket.on('send_message')  │
│  - Valida datos               │
│  - Sanitiza texto             │
│  - Guarda en MongoDB          │
└──────┬───────────────────────┘
       │ 3. io.to(channelId).emit('new_message')
       │
       ▼
┌─────────────────────────────┐
│   Todos los usuarios         │
│   en el canal (Frontend)     │
│  - Reciben 'new_message'      │
│  - Agregan a lista           │
│  - Actualizan vista           │
└─────────────────────────────┘
```

---

## Unirse a un Canal

### Frontend: `frontend/vue-app/src/views/Chat.vue`

#### Paso 1: Inicializar Conexión Socket.IO

```javascript
initializeSocketConnection() {
  this.socket = io('http://localhost:3000')
```
**¿Qué hace?**: Crea conexión Socket.IO con el servidor.

**¿Qué es `io()`?**
- Función de Socket.IO Client
- Crea una conexión WebSocket (o polling si falla)
- Retorna objeto `socket` para enviar/recibir eventos

**¿Por qué `this.socket`?**
- Guarda la conexión en el componente Vue
- Permite usar la conexión en otros métodos

```javascript
  this.socket.on('connect', () => {
    console.log('Conectado al servidor')
    if (this.selectedChannel) {
      this.socket.emit('join_channel', this.selectedChannel)
    }
  })
```
**¿Qué hace?**: Escucha evento `connect`.

**¿Cuándo se dispara `connect`?**
- Cuando la conexión se establece exitosamente
- Si se reconecta después de desconexión

**¿Qué hace `socket.emit()`?**
- Envía un evento al servidor
- `'join_channel'`: Nombre del evento
- `this.selectedChannel`: Datos del evento

#### Paso 2: Seleccionar un Canal

```javascript
async selectChannel(channelId) {
  this.selectedChannel = channelId;
  this.messages = []; // Limpiar mensajes anteriores
```
**¿Qué hace?**: Actualiza el canal seleccionado y limpia mensajes.

**¿Por qué limpiar mensajes?**
- Cada canal tiene sus propios mensajes
- Evita mostrar mensajes del canal anterior

```javascript
  if (this.socket) {
    this.socket.emit('join_channel', channelId);
  }
```
**¿Qué hace?**: Envía evento para unirse al canal.

**¿Por qué verificar `this.socket`?**
- Si la conexión no está lista, `this.socket` puede ser `null`
- Previene errores

### Backend: `backend/app.js` - Evento `join_channel`

```javascript
socket.on('join_channel', async (channelId) => {
```
**¿Qué hace?**: Escucha evento `join_channel` del cliente.

**Parámetros**:
- `'join_channel'`: Nombre del evento
- `(channelId) => { ... }`: Función que se ejecuta cuando llega el evento
- `channelId`: Datos enviados por el cliente

```javascript
  if (!channelId) {
    console.error('❌ No se proporcionó ID del canal');
    return;
  }
```
**¿Qué hace?**: Valida que se proporcionó `channelId`.

**¿Por qué validar?**
- Previene errores si el cliente envía datos inválidos
- Mejor experiencia de usuario (no crashea)

```javascript
  socket.join(channelId);
```
**¿Qué hace?**: Une el socket a una "room" (sala).

**¿Qué es una room?**
- Una room es un grupo de sockets
- Permite enviar mensajes a todos los sockets en esa room
- Similar a unirse a un grupo de chat

**Ejemplo**:
```javascript
// Usuario 1 se une al canal "canal-123"
socket1.join('canal-123');

// Usuario 2 se une al canal "canal-123"
socket2.join('canal-123');

// Ahora hay 2 sockets en la room "canal-123"
// Si envías mensaje a "canal-123", ambos lo reciben
```

```javascript
  try {
    const messages = await Message.find({ channel: channelId })
      .sort({ createdAt: 1 })
      .populate('userId', 'name')
      .lean();
```
**¿Qué hace?**: Busca mensajes del canal en la base de datos.

**Desglose**:

1. `Message.find({ channel: channelId })`:
   - Busca mensajes donde `channel` coincide con `channelId`
   - Retorna array de mensajes

2. `.sort({ createdAt: 1 })`:
   - Ordena por fecha de creación
   - `1` = ascendente (más antiguos primero)
   - `-1` = descendente (más recientes primero)

3. `.populate('userId', 'name')`:
   - Reemplaza `userId` (ObjectId) con datos del usuario
   - Solo trae el campo `name`
   - **Sin populate**: `userId: "6837c276a869072093ba949c"`
   - **Con populate**: `userId: { _id: "6837c276...", name: "Juan Pérez" }`

4. `.lean()`:
   - Retorna objetos JavaScript planos (no documentos Mongoose)
   - Más rápido y ligero
   - Útil cuando no necesitas métodos de Mongoose

**Ejemplo de resultado**:
```javascript
messages = [
  {
    _id: "msg1",
    text: "Hola",
    userId: { _id: "user1", name: "Juan" },  // ← Populado
    channel: "canal-123",
    createdAt: "2025-01-17T10:00:00Z"
  },
  {
    _id: "msg2",
    text: "¿Cómo están?",
    userId: { _id: "user2", name: "María" },  // ← Populado
    channel: "canal-123",
    createdAt: "2025-01-17T10:05:00Z"
  }
]
```

```javascript
    const formattedMessages = messages
      .filter(msg => msg.userId != null)
```
**¿Qué hace?**: Filtra mensajes con usuarios nulos.

**¿Por qué puede haber usuarios nulos?**
- Si un usuario fue eliminado, `userId` puede ser `null`
- Evita errores al intentar acceder a `msg.userId.name`

```javascript
      .map(msg => ({
        _id: msg._id,
        text: desanitizeMessage(msg.text),
        userId: msg.userId._id,
        author: msg.userId.name || 'Usuario Eliminado',
        timestamp: msg.createdAt
      }));
```
**¿Qué hace?**: Transforma cada mensaje al formato esperado por el frontend.

**¿Por qué transformar?**
- El formato de MongoDB puede no ser ideal para el frontend
- Simplifica la estructura
- Agrega campos calculados (`author`)

**Transformación**:
```javascript
// Antes (MongoDB)
{
  _id: "msg1",
  text: "&lt;script&gt;alert('XSS')&lt;/script&gt;Hola",
  userId: { _id: "user1", name: "Juan" },
  createdAt: "2025-01-17T10:00:00Z"
}

// Después (Frontend)
{
  _id: "msg1",
  text: "<script>alert('XSS')</script>Hola",  // ← Desanitizado
  userId: "user1",  // ← Solo ID
  author: "Juan",   // ← Nombre extraído
  timestamp: "2025-01-17T10:00:00Z"
}
```

```javascript
    socket.emit('message_history', formattedMessages);
```
**¿Qué hace?**: Envía el historial al socket que se unió.

**¿Qué es `socket.emit()`?**
- Envía evento a un socket específico
- Solo el socket que se unió recibe el mensaje

**Diferencia con `io.emit()`**:
- `socket.emit()`: Solo a este socket
- `io.emit()`: A todos los sockets conectados
- `io.to(room).emit()`: A todos los sockets en una room

```javascript
  } catch (error) {
    console.error("❌ Error al cargar historial:", error);
    socket.emit('error', { message: 'Error al cargar el historial de mensajes' });
  }
```
**¿Qué hace?**: Maneja errores y notifica al cliente.

---

## Enviar un Mensaje

### Frontend: `frontend/vue-app/src/views/Chat.vue`

```javascript
sendMessage() {
  if (!this.newMessage.trim() || !this.selectedChannel) return;
```
**¿Qué hace?**: Valida que hay mensaje y canal seleccionado.

**¿Por qué `trim()`?**
- Elimina espacios en blanco al inicio y final
- Evita enviar mensajes vacíos o solo espacios

```javascript
  const messagePayload = {
    channelId: this.selectedChannel,
    text: this.newMessage.trim(),
    userId: this.user._id
  };
```
**¿Qué hace?**: Crea objeto con datos del mensaje.

**¿Por qué incluir `userId`?**
- El backend necesita saber quién envió el mensaje
- No se confía en datos del socket (seguridad)

```javascript
  this.socket.emit('send_message', messagePayload);
```
**¿Qué hace?**: Envía evento `send_message` al servidor.

**¿Por qué Socket.IO y no HTTP POST?**
- Socket.IO es más rápido (no overhead de HTTP)
- Tiempo real: otros usuarios reciben el mensaje instantáneamente
- Menos código (no necesitas manejar respuestas)

```javascript
  this.newMessage = '';
```
**¿Qué hace?**: Limpia el input después de enviar.

**¿Por qué limpiar?**
- Mejor UX: el usuario puede escribir el siguiente mensaje inmediatamente
- Evita enviar el mismo mensaje dos veces

### Backend: `backend/app.js` - Evento `send_message`

```javascript
socket.on('send_message', async ({ channelId, text, userId }) => {
```
**¿Qué hace?**: Escucha evento `send_message`.

**¿Qué es la destructuración `{ channelId, text, userId }`?**
- Extrae propiedades del objeto enviado
- Equivale a:
  ```javascript
  const channelId = data.channelId;
  const text = data.text;
  const userId = data.userId;
  ```

```javascript
  try {
    if (!userId) {
      console.error("❌ No se recibió userId");
      return;
    }
```
**¿Qué hace?**: Valida que `userId` existe.

**¿Por qué validar?**
- Previene errores al guardar
- Seguridad: asegura que el mensaje tiene autor

```javascript
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("❌ userId no es un ObjectId válido:", userId);
      return;
    }
```
**¿Qué hace?**: Valida que `userId` es un ObjectId válido.

**¿Qué es ObjectId?**
- Formato de ID de MongoDB
- 24 caracteres hexadecimales
- Ejemplo: `"6837c276a869072093ba949c"`

**¿Por qué validar formato?**
- Previene errores de base de datos
- Seguridad: evita inyección de datos inválidos

```javascript
    const sanitizedText = sanitizeMessage(text);
```
**¿Qué hace?**: Sanitiza el texto antes de guardar.

**¿Por qué sanitizar?**
- Previene ataques XSS
- Protege la base de datos

**Ejemplo**:
```javascript
// Usuario envía
text = "<script>alert('XSS')</script>Hola"

// Después de sanitizar
sanitizedText = "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;Hola"
```

```javascript
    const newMessage = new Message({
      text: sanitizedText,
      userId,
      channel: channelId
    });
```
**¿Qué hace?**: Crea nuevo documento de mensaje.

**¿Qué es `new Message()`?**
- Crea instancia del modelo Mongoose
- Aún NO está guardado en la BD

```javascript
    const savedMessage = await newMessage.save();
```
**¿Qué hace?**: Guarda el mensaje en MongoDB.

**¿Qué retorna `save()`?**
- El documento guardado con `_id` generado
- Puedes usar `savedMessage._id` para referencias

```javascript
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate('userId', 'name');
```
**¿Qué hace?**: Busca el mensaje guardado y popula el usuario.

**¿Por qué buscar de nuevo?**
- `save()` no popula automáticamente
- Necesitas el nombre del usuario para enviarlo al frontend

```javascript
    io.to(channelId).emit('new_message', {
      _id: populatedMessage._id,
      text: desanitizeMessage(populatedMessage.text),
      userId: populatedMessage.userId._id,
      author: populatedMessage.userId.name,
      timestamp: populatedMessage.createdAt
    });
```
**¿Qué hace?**: Envía el mensaje a todos los usuarios en el canal.

**Desglose**:

1. `io.to(channelId)`:
   - Selecciona todos los sockets en la room `channelId`
   - Solo usuarios en ese canal reciben el mensaje

2. `.emit('new_message', data)`:
   - Envía evento `new_message` con los datos
   - Todos los sockets en la room lo reciben

3. `desanitizeMessage(populatedMessage.text)`:
   - Convierte `&lt;script&gt;` de vuelta a `<script>`
   - El texto se muestra legible en el frontend
   - **¿Por qué desanitizar?**: El texto está sanitizado en BD, pero para mostrarlo necesitas desanitizarlo

**Ejemplo**:
```javascript
// En BD (sanitizado)
text: "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;Hola"

// Al enviar (desanitizado)
text: "<script>alert('XSS')</script>Hola"

// En frontend se muestra:
// "<script>alert('XSS')</script>Hola"
// Pero NO se ejecuta porque Vue escapa HTML automáticamente
```

---

## Recibir Mensajes en Tiempo Real

### Frontend: `frontend/vue-app/src/views/Chat.vue`

```javascript
this.socket.on('message_history', (messages) => {
  console.log('Recibiendo historial de mensajes:', messages)
  this.messages = messages
  this.$nextTick(this.scrollToBottom)
})
```
**¿Qué hace?**: Escucha evento `message_history` (historial al unirse al canal).

**¿Qué es `$nextTick`?**
- Espera a que Vue actualice el DOM
- Necesario porque `this.messages = messages` actualiza el DOM asíncronamente
- `scrollToBottom` necesita que el DOM esté actualizado

```javascript
this.socket.on('new_message', (message) => {
  this.messages.push(message)
  this.$nextTick(this.scrollToBottom)
})
```
**¿Qué hace?**: Escucha evento `new_message` (mensaje nuevo en tiempo real).

**¿Qué hace `push()`?**
- Agrega el mensaje al final del array
- Vue detecta el cambio y actualiza la vista automáticamente

**¿Por qué `push` y no reemplazar?**
- `push`: Agrega al final (correcto para mensajes nuevos)
- Reemplazar: Perdería mensajes anteriores

---

## Sanitización de Mensajes

### ¿Por Qué Sanitizar?

**Riesgo XSS**:
```javascript
// Usuario envía
text = "<script>alert('Robar token: ' + localStorage.getItem('token'))</script>"

// Si NO sanitizas, el script se ejecuta
// El atacante puede robar tokens, datos, etc.
```

**Solución**: Sanitizar antes de guardar.

### Archivo: `backend/utils/sanitize.js`

```javascript
function sanitizeString(input) {
    if (typeof input !== 'string') {
        return input;
    }
    
    return input
        .replace(/&/g, '&amp;')   // & → &amp;
        .replace(/</g, '&lt;')     // < → &lt;
        .replace(/>/g, '&gt;')      // > → &gt;
        .replace(/"/g, '&quot;')    // " → &quot;
        .replace(/'/g, '&#x27;')   // ' → &#x27;
        .replace(/\//g, '&#x2F;'); // / → &#x2F;
}
```

**¿Por qué estos caracteres?**
- `<` y `>`: Tags HTML
- `"` y `'`: Atributos HTML
- `/`: Cierre de tags
- `&`: Entidades HTML

**Ejemplo**:
```javascript
// Entrada
"<script>alert('XSS')</script>"

// Salida
"&lt;script&gt;alert(&#x27;XSS&#x27;)&lt;/script&gt;"

// En el navegador se muestra como texto, NO se ejecuta
```

### ¿Por Qué Desanitizar?

**Problema**: Si guardas `&lt;script&gt;`, se mostrará literalmente `&lt;script&gt;` en el chat.

**Solución**: Desanitizar antes de mostrar.

```javascript
function desanitizeMessage(text) {
    return text
        .replace(/&lt;/g, '<')      // &lt; → <
        .replace(/&gt;/g, '>')      // &gt; → >
        .replace(/&quot;/g, '"')    // &quot; → "
        .replace(/&#x27;/g, "'")    // &#x27; → '
        .replace(/&#x2F;/g, '/')    // &#x2F; → /
        .replace(/&amp;/g, '&');    // &amp; → &
}
```

**Flujo Completo**:
```
1. Usuario envía: "<script>alert('XSS')</script>Hola"
2. Backend sanitiza: "&lt;script&gt;alert(&#x27;XSS&#x27;)&lt;/script&gt;Hola"
3. Se guarda en BD: "&lt;script&gt;alert(&#x27;XSS&#x27;)&lt;/script&gt;Hola"
4. Backend desanitiza al enviar: "<script>alert('XSS')</script>Hola"
5. Frontend recibe: "<script>alert('XSS')</script>Hola"
6. Vue muestra: "<script>alert('XSS')</script>Hola" (como texto, NO ejecuta)
```

**¿Por qué es seguro desanitizar?**
- Vue.js escapa HTML automáticamente en templates
- `{{ message.text }}` muestra el texto, no ejecuta código
- Solo se ejecutaría si usas `v-html`, que NO se usa

---

## Modelo de Mensajes

### Archivo: `backend/models/Message.js`

```javascript
const MessageSchema = new mongoose.Schema({
  text: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  autoIndex: false
});
```

**Campos**:

1. **`text`**: Contenido del mensaje (sanitizado)
2. **`userId`**: Referencia al usuario que envió el mensaje
3. **`channel`**: Referencia al canal donde se envió
4. **`createdAt`**: Fecha de creación (automática)

**¿Por qué `ref: 'User'`?**
- Indica que `userId` referencia al modelo `User`
- Permite usar `.populate()` para traer datos del usuario

**Índices**:
```javascript
MessageSchema.index({ channel: 1, createdAt: 1 });
MessageSchema.index({ userId: 1 });
```

**¿Qué son los índices?**
- Estructuras que aceleran búsquedas
- Similar a índice de un libro (te lleva directo a la página)

**¿Por qué estos índices?**
1. `{ channel: 1, createdAt: 1 }`:
   - Búsqueda frecuente: "mensajes de un canal ordenados por fecha"
   - Sin índice: MongoDB escanea todos los documentos (lento)
   - Con índice: MongoDB va directo a los documentos del canal (rápido)

2. `{ userId: 1 }`:
   - Búsqueda: "mensajes de un usuario"
   - Acelera consultas por usuario

---

## Flujo Completo: Ejemplo Práctico

### Escenario: Usuario envía "Hola a todos"

#### Paso 1: Usuario escribe y presiona Enter

**Frontend** (`Chat.vue`):
```javascript
// Usuario escribe "Hola a todos" y presiona Enter
sendMessage() {
  // this.newMessage = "Hola a todos"
  // this.selectedChannel = "canal-123"
  // this.user._id = "user-456"
  
  this.socket.emit('send_message', {
    channelId: "canal-123",
    text: "Hola a todos",
    userId: "user-456"
  });
}
```

#### Paso 2: Backend recibe el evento

**Backend** (`app.js`):
```javascript
socket.on('send_message', async ({ channelId, text, userId }) => {
  // channelId = "canal-123"
  // text = "Hola a todos"
  // userId = "user-456"
  
  // Validaciones...
  
  // Sanitizar
  const sanitizedText = sanitizeMessage("Hola a todos");
  // sanitizedText = "Hola a todos" (no hay caracteres peligrosos)
  
  // Guardar
  const newMessage = new Message({
    text: "Hola a todos",
    userId: "user-456",
    channel: "canal-123"
  });
  await newMessage.save();
  // Guardado en BD con _id: "msg-789"
  
  // Popular
  const populatedMessage = await Message.findById("msg-789")
    .populate('userId', 'name');
  // populatedMessage.userId.name = "Juan Pérez"
  
  // Enviar a todos en el canal
  io.to("canal-123").emit('new_message', {
    _id: "msg-789",
    text: "Hola a todos",
    userId: "user-456",
    author: "Juan Pérez",
    timestamp: "2025-01-17T15:30:00Z"
  });
});
```

#### Paso 3: Todos los usuarios en el canal reciben el mensaje

**Frontend** (todos los usuarios en "canal-123"):
```javascript
this.socket.on('new_message', (message) => {
  // message = {
  //   _id: "msg-789",
  //   text: "Hola a todos",
  //   userId: "user-456",
  //   author: "Juan Pérez",
  //   timestamp: "2025-01-17T15:30:00Z"
  // }
  
  this.messages.push(message);
  // Agrega a la lista de mensajes
  // Vue actualiza la vista automáticamente
});
```

#### Paso 4: Vista se actualiza

**Template Vue**:
```vue
<div v-for="message in messages" :key="message._id">
  <span>{{ message.author }}: {{ message.text }}</span>
</div>
```

**Resultado en pantalla**:
```
Juan Pérez: Hola a todos
```

---

## Conceptos Clave

### 1. Rooms (Salas) en Socket.IO

**¿Qué es una room?**
Un grupo de sockets conectados.

**Ejemplo**:
```javascript
// Usuario 1 se une
socket1.join('canal-123');

// Usuario 2 se une
socket2.join('canal-123');

// Usuario 3 se une
socket3.join('canal-456');

// Enviar mensaje a "canal-123"
io.to('canal-123').emit('new_message', data);
// Solo socket1 y socket2 reciben el mensaje
// socket3 NO lo recibe (está en otro canal)
```

### 2. Emit vs On

**`emit()`**: Envía un evento
```javascript
socket.emit('send_message', data);  // Cliente → Servidor
io.emit('new_message', data);        // Servidor → Todos
```

**`on()`**: Escucha un evento
```javascript
socket.on('new_message', (data) => {  // Escucha evento
  // Maneja el evento
});
```

### 3. Diferentes Tipos de Emit

```javascript
// A un socket específico
socket.emit('event', data);

// A todos los sockets
io.emit('event', data);

// A todos en una room
io.to('room-name').emit('event', data);

// A todos excepto el emisor
socket.broadcast.emit('event', data);

// A todos en una room excepto el emisor
socket.to('room-name').broadcast.emit('event', data);
```

### 4. Sanitización vs Desanitización

**Sanitización** (antes de guardar):
- Protege la base de datos
- Convierte caracteres peligrosos a entidades HTML

**Desanitización** (antes de mostrar):
- Hace el texto legible
- Vue escapa HTML automáticamente (seguro)

---

## Resumen

### Flujo Completo

1. **Usuario escribe mensaje** → Frontend captura
2. **Frontend envía** → `socket.emit('send_message')`
3. **Backend recibe** → `socket.on('send_message')`
4. **Backend valida** → Verifica datos
5. **Backend sanitiza** → Protege contra XSS
6. **Backend guarda** → MongoDB
7. **Backend envía a todos** → `io.to(channel).emit('new_message')`
8. **Frontend recibe** → `socket.on('new_message')`
9. **Frontend actualiza** → Vue muestra el mensaje

### Decisiones Clave

1. **Socket.IO**: Comunicación en tiempo real sin complejidad
2. **Rooms**: Agrupar usuarios por canal
3. **Sanitización**: Proteger base de datos
4. **Desanitización**: Mostrar texto legible
5. **Validación**: Prevenir errores y ataques

---

## Preguntas Frecuentes

### ¿Por qué usar Socket.IO en lugar de HTTP para enviar mensajes?

**HTTP**:
- Cada mensaje = nueva petición
- No es tiempo real (hay delay)
- Más código (manejar respuestas)

**Socket.IO**:
- Conexión persistente
- Tiempo real (instantáneo)
- Menos código

### ¿Es seguro desanitizar antes de enviar?

**Sí**, porque:
- Vue.js escapa HTML automáticamente
- `{{ message.text }}` muestra texto, no ejecuta código
- Solo sería peligroso con `v-html`, que NO se usa

### ¿Por qué guardar mensajes sanitizados si luego los desanitizas?

**Razón**: 
- Si alguien accede directamente a la BD, ve texto sanitizado
- Protección adicional
- El texto se desanitiza solo al enviar al frontend

### ¿Qué pasa si un usuario se desconecta?

**Socket.IO maneja automáticamente**:
- Detecta desconexión
- Cuando se reconecta, puede volver a unirse a canales
- Los mensajes enviados mientras estaba desconectado se pierden (se pueden implementar colas)

---

## Próximos Pasos

Ahora que entiendes el chat en tiempo real, puedes continuar con:
- **Manual 04**: Gestión de Canales (cómo funcionan canales públicos/privados)
- **Manual 05**: Administración (dashboard, gestión de usuarios)

---

**Última actualización**: Enero 2025

**Versión**: 1.0

