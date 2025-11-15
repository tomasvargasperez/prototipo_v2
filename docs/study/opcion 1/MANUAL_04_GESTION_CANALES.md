# Manual 04: Gestión de Canales

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Modelo de Canal](#modelo-de-canal)
3. [Tipos de Canales](#tipos-de-canales)
4. [Control de Acceso](#control-de-acceso)
5. [Crear un Canal](#crear-un-canal)
6. [Obtener Canales Disponibles](#obtener-canales-disponibles)
7. [Actualizar y Eliminar Canales](#actualizar-y-eliminar-canales)
8. [Flujo Completo de Acceso](#flujo-completo-de-acceso)

---

## Introducción

Los canales son el **corazón organizacional** de tu aplicación. Permiten agrupar conversaciones por temas o grupos de usuarios. Este manual te explicará cómo funcionan los canales públicos y privados, cómo se controla el acceso, y por qué se tomaron cada decisión de diseño.

### Objetivos del Sistema de Canales

1. ✅ Organizar conversaciones por temas
2. ✅ Controlar acceso a información sensible
3. ✅ Permitir canales públicos (todos pueden ver)
4. ✅ Permitir canales privados (solo usuarios autorizados)
5. ✅ Gestión administrativa de canales

---

## Modelo de Canal

### Archivo: `backend/models/Channel.js`

```javascript
const ChannelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        default: ''
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    allowedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    active: {
        type: Boolean,
        default: true
    }
});
```

### Explicación Línea por Línea

#### Campo `name`

```javascript
name: {
    type: String,
    required: true,
    unique: true
}
```

**¿Qué hace?**: Nombre del canal (ej: "Recursos Humanos", "Reunión Ejecutiva").

**¿Por qué `unique: true`?**
- No puede haber dos canales con el mismo nombre
- Evita confusión
- MongoDB crea índice único automáticamente

**Ejemplo**:
```javascript
// ✅ Permitido
canal1 = { name: "Recursos Humanos" }
canal2 = { name: "IT" }

// ❌ No permitido
canal1 = { name: "Recursos Humanos" }
canal2 = { name: "Recursos Humanos" }  // ← Error: duplicado
```

#### Campo `description`

```javascript
description: {
    type: String,
    default: ''
}
```

**¿Qué hace?**: Descripción opcional del canal.

**¿Por qué opcional?**
- No todos los canales necesitan descripción
- `default: ''` significa que si no se proporciona, será string vacío

**Ejemplo**:
```javascript
canal = {
  name: "Ley Karin",
  description: "Canal para discusiones sobre la Ley Karin y normativas relacionadas"
}
```

#### Campo `isPublic`

```javascript
isPublic: {
    type: Boolean,
    default: false
}
```

**¿Qué hace?**: Indica si el canal es público o privado.

**Valores**:
- `true`: Canal público (todos los usuarios pueden verlo)
- `false`: Canal privado (solo usuarios en `allowedUsers`)

**¿Por qué `default: false`?**
- Por defecto, los canales son privados (más seguro)
- El admin debe explícitamente hacer un canal público

**Ejemplo**:
```javascript
// Canal público
canalPublico = {
  name: "General",
  isPublic: true,
  allowedUsers: []  // ← Vacío porque es público
}

// Canal privado
canalPrivado = {
  name: "Reunión Ejecutiva",
  isPublic: false,
  allowedUsers: ["user1_id", "user2_id"]  // ← Solo estos usuarios
}
```

#### Campo `allowedUsers`

```javascript
allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
}]
```

**¿Qué hace?**: Array de IDs de usuarios que tienen acceso al canal.

**¿Por qué array?**
- Un canal privado puede tener múltiples usuarios autorizados
- Permite agregar/quitar usuarios fácilmente

**¿Cuándo se usa?**
- Solo para canales privados (`isPublic: false`)
- Para canales públicos, puede estar vacío

**Ejemplo**:
```javascript
canalPrivado = {
  name: "Proyecto Secreto",
  isPublic: false,
  allowedUsers: [
    "6837c276a869072093ba949c",  // ← Usuario 1
    "6846378319c2a6a442e90fee",   // ← Usuario 2
    "6846fbe919c2a6a442e913eb"    // ← Usuario 3
  ]
}
```

**¿Qué es `ref: 'User'`?**
- Indica que cada elemento del array referencia al modelo `User`
- Permite usar `.populate()` para traer datos de los usuarios

#### Campo `createdBy`

```javascript
createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
}
```

**¿Qué hace?**: ID del usuario que creó el canal.

**¿Por qué es importante?**
- Auditoría: saber quién creó cada canal
- Puede usarse para permisos adicionales (solo el creador puede modificar)

#### Campo `active`

```javascript
active: {
    type: Boolean,
    default: true
}
```

**¿Qué hace?**: Indica si el canal está activo o desactivado.

**¿Por qué no eliminar directamente?**
- Desactivar mantiene el historial
- Puedes reactivar más tarde
- Los mensajes antiguos siguen disponibles

**Ejemplo**:
```javascript
// Desactivar canal (no eliminar)
canal.active = false;
await canal.save();
// Los mensajes siguen en la BD, pero el canal no aparece en la lista
```

---

## Tipos de Canales

### Canal Público

**Características**:
- `isPublic: true`
- `allowedUsers: []` (vacío o no se usa)
- Todos los usuarios pueden verlo y enviar mensajes

**Ejemplo**:
```javascript
{
  name: "General",
  description: "Canal para conversaciones generales",
  isPublic: true,
  allowedUsers: [],
  createdBy: "admin_id",
  active: true
}
```

**Uso típico**:
- Anuncios generales
- Conversaciones abiertas
- Canales de departamentos grandes

### Canal Privado

**Características**:
- `isPublic: false`
- `allowedUsers: [user1_id, user2_id, ...]`
- Solo usuarios en `allowedUsers` pueden verlo

**Ejemplo**:
```javascript
{
  name: "Reunión Ejecutiva",
  description: "Canal privado para directivos",
  isPublic: false,
  allowedUsers: ["ceo_id", "cfo_id", "cto_id"],
  createdBy: "admin_id",
  active: true
}
```

**Uso típico**:
- Información confidencial
- Grupos pequeños
- Proyectos específicos

---

## Control de Acceso

### Middleware: `checkChannelAccess`

**Archivo**: `backend/routes/MessageRoutes.js`

```javascript
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
```

### Explicación Línea por Línea

```javascript
const channel = await Channel.findById(req.params.channelId);
```
**¿Qué hace?**: Busca el canal en la base de datos.

**¿Por qué buscar primero?**
- Necesitas los datos del canal para verificar acceso
- Verifica que el canal existe

```javascript
if (!channel) {
    return res.status(404).json({ message: 'Canal no encontrado' });
}
```
**¿Qué hace?**: Si el canal no existe, retorna error 404.

```javascript
const user = await User.findById(req.user.userId);
```
**¿Qué hace?**: Busca el usuario que hace la petición.

**¿Por qué buscar el usuario?**
- Necesitas verificar su rol
- Necesitas su `_id` para verificar si está en `allowedUsers`

```javascript
if (user.role === 'admin') {
    return next();
}
```
**¿Qué hace?**: Si es admin, permite acceso sin más verificaciones.

**¿Por qué admins tienen acceso total?**
- Los admins necesitan poder moderar todos los canales
- Pueden ver todos los mensajes para auditoría
- Pueden gestionar todos los canales

```javascript
if (channel.isPublic || channel.allowedUsers.includes(user._id)) {
    next();
} else {
    res.status(403).json({ message: 'No tienes acceso a este canal' });
}
```
**¿Qué hace?**: Verifica acceso para usuarios regulares.

**Lógica**:
- **Canal público** (`isPublic: true`) → Acceso permitido
- **Usuario en allowedUsers** → Acceso permitido
- **Ninguna de las anteriores** → Acceso denegado

**Ejemplo**:
```javascript
// Escenario 1: Canal público
channel = { isPublic: true, allowedUsers: [] }
user = { _id: "user1" }
// Resultado: ✅ Acceso permitido (es público)

// Escenario 2: Canal privado, usuario autorizado
channel = { isPublic: false, allowedUsers: ["user1", "user2"] }
user = { _id: "user1" }
// Resultado: ✅ Acceso permitido (está en allowedUsers)

// Escenario 3: Canal privado, usuario NO autorizado
channel = { isPublic: false, allowedUsers: ["user1", "user2"] }
user = { _id: "user3" }
// Resultado: ❌ Acceso denegado (no está en allowedUsers)
```

---

## Crear un Canal

### Backend: `backend/routes/ChannelRoutes.js`

```javascript
router.post('/', authenticateToken, isAdmin, async (req, res) => {
```
**¿Qué hace?**: Define ruta POST para crear canal.

**¿Por qué `isAdmin`?**
- Solo administradores pueden crear canales
- Control centralizado de la estructura organizacional

```javascript
    try {
        const { name, description, isPublic, allowedUsers } = req.body;
```
**¿Qué hace?**: Extrae datos del cuerpo de la petición.

**Ejemplo de petición**:
```javascript
POST /api/channels
{
  "name": "Reunión Ejecutiva",
  "description": "Canal privado para directivos",
  "isPublic": false,
  "allowedUsers": ["user1_id", "user2_id"]
}
```

```javascript
        const channel = new Channel({
            name,
            description,
            isPublic,
            allowedUsers: allowedUsers || [],
            createdBy: req.user.userId
        });
```
**¿Qué hace?**: Crea nuevo documento de canal.

**¿Por qué `allowedUsers || []`?**
- Si no se proporciona `allowedUsers`, usa array vacío
- Previene errores si `allowedUsers` es `undefined`

```javascript
        const savedChannel = await channel.save();
```
**¿Qué hace?**: Guarda el canal en MongoDB.

```javascript
        const populatedChannel = await Channel.populate(savedChannel, [
            { path: 'createdBy', select: 'name' },
            { path: 'allowedUsers', select: 'name email' }
        ]);
```
**¿Qué hace?**: Pobla referencias para enviar datos completos.

**¿Qué es `populate`?**
- Reemplaza ObjectIds con datos de los documentos referenciados

**Antes de populate**:
```javascript
{
  _id: "canal-123",
  name: "Reunión Ejecutiva",
  createdBy: "user-456",  // ← Solo ID
  allowedUsers: ["user1", "user2"]  // ← Solo IDs
}
```

**Después de populate**:
```javascript
{
  _id: "canal-123",
  name: "Reunión Ejecutiva",
  createdBy: { _id: "user-456", name: "Admin" },  // ← Datos completos
  allowedUsers: [
    { _id: "user1", name: "Juan", email: "juan@empresa.com" },
    { _id: "user2", name: "María", email: "maria@empresa.com" }
  ]
}
```

```javascript
        socket.getIO().emit('dashboard_update');
```
**¿Qué hace?**: Emite evento para actualizar dashboard.

**¿Por qué?**
- Si hay un admin viendo el dashboard, se actualiza automáticamente
- No necesita refrescar la página

```javascript
        res.status(201).json(populatedChannel);
```
**¿Qué hace?**: Retorna el canal creado con datos poblados.

---

## Obtener Canales Disponibles

### Lógica para Usuarios Regulares

**Archivo**: `backend/routes/ChannelRoutes.js`

```javascript
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
```

### Explicación de la Consulta MongoDB

```javascript
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
```

**¿Qué hace esta consulta?**

**Operadores MongoDB**:

1. **`$and`**: Todas las condiciones deben cumplirse
2. **`$or`**: Al menos una condición debe cumplirse

**Lógica**:
```
Buscar canales donde:
  (active = true) Y (
    (isPublic = true) O (user._id está en allowedUsers)
  )
```

**Ejemplo Visual**:

```
Canales en BD:
1. { name: "General", isPublic: true, active: true, allowedUsers: [] }
2. { name: "Reunión Ejecutiva", isPublic: false, active: true, allowedUsers: ["user1", "user2"] }
3. { name: "Proyecto Secreto", isPublic: false, active: true, allowedUsers: ["user3"] }
4. { name: "Canal Desactivado", isPublic: true, active: false, allowedUsers: [] }

Usuario: { _id: "user1", role: "user" }

Consulta:
- Canal 1: ✅ active=true, isPublic=true → INCLUIDO
- Canal 2: ✅ active=true, user1 en allowedUsers → INCLUIDO
- Canal 3: ❌ active=true, pero user1 NO está en allowedUsers → EXCLUIDO
- Canal 4: ❌ active=false → EXCLUIDO

Resultado: [Canal 1, Canal 2]
```

### Lógica para Administradores

```javascript
if (user.role === 'admin') {
    const channels = await Channel.find({ active: true });
    return res.json(channels);
}
```

**¿Qué hace?**: Admins ven todos los canales activos.

**¿Por qué no filtrar por `isPublic` o `allowedUsers`?**
- Admins necesitan ver todos los canales para gestión
- Pueden moderar cualquier canal
- Necesitan acceso completo para auditoría

---

## Actualizar y Eliminar Canales

### Actualizar Canal

```javascript
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
```

**¿Qué hace `findByIdAndUpdate`?**
- Busca el canal por ID
- Actualiza los campos proporcionados
- Retorna el documento actualizado

**¿Qué es `{ new: true }`?**
- Por defecto, `findByIdAndUpdate` retorna el documento **antes** de actualizar
- `{ new: true }` retorna el documento **después** de actualizar

**Ejemplo**:
```javascript
// Sin { new: true }
const old = await Channel.findByIdAndUpdate(id, { name: "Nuevo Nombre" });
// old.name = "Nombre Antiguo"  ← Retorna el antiguo

// Con { new: true }
const updated = await Channel.findByIdAndUpdate(id, { name: "Nuevo Nombre" }, { new: true });
// updated.name = "Nuevo Nombre"  ← Retorna el actualizado
```

### Eliminar Canal

```javascript
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const channel = await Channel.findByIdAndDelete(req.params.id);
        
        if (!channel) {
            return res.status(404).json({ message: 'Canal no encontrado' });
        }

        socket.getIO().emit('dashboard_update');
        res.json({ message: 'Canal eliminado correctamente' });
```

**¿Qué hace `findByIdAndDelete`?**
- Busca el canal por ID
- Lo elimina de la base de datos
- Retorna el documento eliminado

**¿Qué pasa con los mensajes del canal?**
- Los mensajes **NO se eliminan automáticamente**
- Quedan en la BD con referencia al canal eliminado
- Puedes implementar eliminación en cascada si lo necesitas

---

## Flujo Completo de Acceso

### Escenario: Usuario intenta acceder a un canal

#### Paso 1: Frontend carga lista de canales

**Frontend** (`Chat.vue`):
```javascript
async fetchChannels() {
  const response = await fetch('http://localhost:3000/api/channels', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  this.channels = await response.json();
}
```

**Backend** (`ChannelRoutes.js`):
```javascript
// Usuario regular
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
// Retorna solo canales a los que tiene acceso
```

**Resultado**: Frontend solo muestra canales accesibles.

#### Paso 2: Usuario hace clic en un canal

**Frontend**:
```javascript
selectChannel(channelId) {
  this.selectedChannel = channelId;
  this.socket.emit('join_channel', channelId);
}
```

#### Paso 3: Backend verifica acceso (Socket.IO)

**Backend** (`app.js`):
```javascript
socket.on('join_channel', async (channelId) => {
  socket.join(channelId);  // ← Se une sin verificar acceso aquí
  // Nota: La verificación real se hace al enviar mensajes
});
```

**¿Por qué no verificar aquí?**
- Simplifica el código
- La verificación real se hace al enviar mensajes (más seguro)
- Si no tiene acceso, simplemente no verá mensajes

#### Paso 4: Usuario intenta enviar mensaje

**Backend** (`app.js`):
```javascript
socket.on('send_message', async ({ channelId, text, userId }) => {
  // Aquí se podría verificar acceso
  // Por simplicidad, se confía en que el frontend solo muestra canales accesibles
  // En producción, deberías verificar aquí también
});
```

**Nota**: En producción, deberías verificar acceso también en Socket.IO.

#### Paso 5: Usuario intenta obtener mensajes vía API

**Backend** (`MessageRoutes.js`):
```javascript
router.get('/api/messages/:channelId', authenticateToken, checkChannelAccess, async (req, res) => {
  // checkChannelAccess verifica:
  // 1. ¿Es admin? → Acceso permitido
  // 2. ¿Canal es público? → Acceso permitido
  // 3. ¿Usuario está en allowedUsers? → Acceso permitido
  // 4. Si ninguna → Acceso denegado (403)
});
```

---

## Ejemplos Prácticos

### Ejemplo 1: Crear Canal Público

**Petición**:
```javascript
POST /api/channels
{
  "name": "General",
  "description": "Canal para conversaciones generales",
  "isPublic": true
}
```

**Resultado en BD**:
```javascript
{
  _id: "canal-123",
  name: "General",
  description: "Canal para conversaciones generales",
  isPublic: true,
  allowedUsers: [],
  createdBy: "admin_id",
  active: true,
  createdAt: "2025-01-17T10:00:00Z"
}
```

**Acceso**:
- ✅ Todos los usuarios pueden verlo
- ✅ Todos los usuarios pueden enviar mensajes

### Ejemplo 2: Crear Canal Privado

**Petición**:
```javascript
POST /api/channels
{
  "name": "Reunión Ejecutiva",
  "description": "Canal privado para directivos",
  "isPublic": false,
  "allowedUsers": ["user1_id", "user2_id", "user3_id"]
}
```

**Resultado en BD**:
```javascript
{
  _id: "canal-456",
  name: "Reunión Ejecutiva",
  description: "Canal privado para directivos",
  isPublic: false,
  allowedUsers: ["user1_id", "user2_id", "user3_id"],
  createdBy: "admin_id",
  active: true,
  createdAt: "2025-01-17T10:00:00Z"
}
```

**Acceso**:
- ✅ Solo user1, user2, user3 pueden verlo
- ✅ Solo user1, user2, user3 pueden enviar mensajes
- ✅ Admins también pueden verlo (acceso total)

### Ejemplo 3: Agregar Usuario a Canal Privado

**Petición**:
```javascript
PUT /api/channels/canal-456
{
  "name": "Reunión Ejecutiva",
  "isPublic": false,
  "allowedUsers": ["user1_id", "user2_id", "user3_id", "user4_id"]  // ← Agregado user4
}
```

**Resultado**:
- user4 ahora puede ver y enviar mensajes al canal

### Ejemplo 4: Convertir Canal Privado a Público

**Petición**:
```javascript
PUT /api/channels/canal-456
{
  "name": "Reunión Ejecutiva",
  "isPublic": true,  // ← Cambiado a público
  "allowedUsers": []  // ← Ya no necesario
}
```

**Resultado**:
- Todos los usuarios pueden ver y enviar mensajes
- `allowedUsers` se ignora (aunque puede quedar con datos)

---

## Consultas MongoDB Avanzadas

### Operador `$and`

```javascript
{ $and: [condición1, condición2] }
```
**Significado**: Ambas condiciones deben cumplirse.

**Ejemplo**:
```javascript
Channel.find({
  $and: [
    { active: true },
    { isPublic: true }
  ]
});
// Busca canales que sean activos Y públicos
```

### Operador `$or`

```javascript
{ $or: [condición1, condición2] }
```
**Significado**: Al menos una condición debe cumplirse.

**Ejemplo**:
```javascript
Channel.find({
  $or: [
    { isPublic: true },
    { allowedUsers: user._id }
  ]
});
// Busca canales que sean públicos O donde el usuario esté autorizado
```

### Operador `$in`

```javascript
{ campo: { $in: [valor1, valor2] } }
```
**Significado**: El campo debe estar en el array.

**Ejemplo**:
```javascript
Channel.find({
  allowedUsers: { $in: [user._id] }
});
// Busca canales donde user._id esté en allowedUsers
```

**Nota**: En tu código usas `allowedUsers: user._id`, que es equivalente pero más simple.

---

## Frontend: Visualización de Canales

### Archivo: `frontend/vue-app/src/views/Chat.vue`

```vue
<div 
  v-for="channel in channels" 
  :key="channel._id"
  class="channel"
  :class="{ active: selectedChannel === channel._id }"
  @click="selectChannel(channel._id)"
>
  <i :class="['fas', channel.isPublic ? 'fa-globe' : 'fa-lock']"></i>
  <span class="channel-name">{{ channel.name }}</span>
</div>
```

**¿Qué hace?**: Renderiza lista de canales.

**Elementos**:
- `v-for="channel in channels"`: Itera sobre canales
- `:key="channel._id"`: Identificador único (requerido por Vue)
- `:class="{ active: ... }"`: Aplica clase `active` si está seleccionado
- `@click="selectChannel(...)"`: Al hacer clic, selecciona el canal
- `fa-globe` o `fa-lock`: Icono según si es público o privado

**Visualización**:
```
🌐 General              ← Icono globo (público)
🔒 Reunión Ejecutiva    ← Icono candado (privado)
🌐 IT                   ← Icono globo (público)
```

---

## Resumen

### Tipos de Canales

1. **Canal Público**:
   - `isPublic: true`
   - Todos los usuarios pueden verlo
   - `allowedUsers` no se usa

2. **Canal Privado**:
   - `isPublic: false`
   - Solo usuarios en `allowedUsers` pueden verlo
   - Admins siempre tienen acceso

### Control de Acceso

**Lógica**:
```
¿Es admin?
  → Sí: Acceso total
  → No: ¿Canal es público O usuario está en allowedUsers?
    → Sí: Acceso permitido
    → No: Acceso denegado
```

### Operaciones

1. **Crear**: Solo admin
2. **Leer**: Según tipo de canal y permisos
3. **Actualizar**: Solo admin
4. **Eliminar**: Solo admin

---

## Preguntas Frecuentes

### ¿Por qué los canales privados por defecto?

**Razón**: Más seguro. Si olvidas especificar `isPublic`, el canal es privado por defecto.

### ¿Qué pasa si elimino un canal?

**Respuesta**: 
- El canal se elimina de la BD
- Los mensajes **NO se eliminan** (quedan huérfanos)
- Puedes implementar eliminación en cascada si lo necesitas

### ¿Puedo hacer un canal semi-público?

**Respuesta**: No directamente. Opciones:
- Canal público (todos pueden ver)
- Canal privado (solo usuarios autorizados)

Para semi-público, necesitarías agregar lógica adicional.

### ¿Los mensajes se eliminan si elimino un canal?

**Respuesta**: No. Los mensajes quedan en la BD. Puedes:
- Implementar eliminación en cascada
- O mantenerlos para auditoría

---

## Próximos Pasos

Ahora que entiendes la gestión de canales, puedes continuar con:
- **Manual 05**: Administración (dashboard, gestión de usuarios)
- **Manual 06**: Seguridad (sanitización, encriptación, ISO 27001)

---

**Última actualización**: Enero 2025

**Versión**: 1.0

