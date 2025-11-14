# Integridad según ISO 27001 - Análisis de la Aplicación

## 📋 Tabla de Contenidos

1. [¿Qué es la Integridad?](#qué-es-la-integridad)
2. [Cómo tu Aplicación Maneja la Integridad](#cómo-tu-aplicación-maneja-la-integridad)
3. [Aspectos que Podrían Mejorarse](#aspectos-que-podrían-mejorarse)
4. [Resumen](#resumen)
5. [Conclusión](#conclusión)

---

## ¿Qué es la Integridad?

### Definición según ISO 27001

**Integridad** es uno de los tres pilares de la seguridad de la información (junto con **Confidencialidad** e **Disponibilidad**). Se define como:

> **"Asegurar que la información no sea modificada de manera no autorizada o accidental"**

### Ejemplo Práctico

Imagina que envías un mensaje importante:
- ✅ **Con integridad**: El mensaje llega exactamente como lo enviaste
- ❌ **Sin integridad**: Alguien puede modificar el mensaje antes de que llegue al destinatario

En tu aplicación:
- ✅ Un mensaje no puede ser alterado por un tercero
- ❌ Sin integridad: Un atacante podría cambiar "Reunión a las 10:00" por "Reunión a las 15:00"

---

## Cómo tu Aplicación Maneja la Integridad

### 1. Validación de Esquemas (Mongoose)

#### Implementación Actual

**Archivos**: `backend/models/User.js`, `Message.js`, `Channel.js`, etc.

**Proceso**:
- Mongoose valida los datos antes de guardar según el esquema definido
- Campos requeridos, tipos, valores permitidos, etc.

**Ejemplo Práctico**:

**Archivo**: `backend/models/User.js`

```javascript
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true  // ← NO se puede guardar sin nombre
  },
  email: {
    type: String,
    required: true,
    unique: true  // ← NO puede haber dos usuarios con el mismo email
  },
  role: {
    type: String,
    enum: ['admin', 'user'],  // ← Solo estos valores permitidos
    default: 'user'
  }
});
```

**Escenario**:
```
Intento guardar:
{
  name: "",  // ← Vacío
  email: "juan@empresa.com",
  role: "superadmin"  // ← Valor no permitido
}

Mongoose rechaza:
❌ Error: "name is required"
❌ Error: "role must be one of: admin, user"
```

**¿Por qué es importante?**
- Evita que se guarden datos inválidos o corruptos
- Mantiene la consistencia de la base de datos
- Protege la integridad de los datos almacenados

**Estado**: ✅ **Bien implementado**

---

### 2. Validación de Tipos de Datos

#### Implementación Actual

**Archivo**: `backend/routes/SuggestionRoutes.js`

```javascript
router.post('/', authenticateToken, async (req, res) => {
  // Validación de tipo
  if (!req.body.content || typeof req.body.content !== 'string') {
    return res.status(400).json({ 
      message: 'El contenido de la sugerencia es requerido' 
    });
  }
});
```

**Ejemplo Práctico**:
```
Usuario envía:
{
  content: 12345  // ← Número en lugar de string
}

Backend valida:
❌ typeof req.body.content !== 'string'
❌ Respuesta: 400 "El contenido de la sugerencia es requerido"
```

**Archivo**: `backend/app.js` (Socket.IO)

```javascript
socket.on('send_message', async ({ channelId, text, userId }) => {
  // Validar que userId existe
  if (!userId) {
    console.error("❌ No se recibió userId");
    return;
  }

  // Validar que userId sea un ObjectId válido
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    console.error("❌ userId no es un ObjectId válido:", userId);
    return;
  }
});
```

**Ejemplo Práctico**:
```
Usuario envía:
{
  userId: "no-es-un-id-valido"  // ← String inválido
}

Backend valida:
❌ mongoose.Types.ObjectId.isValid(userId) === false
❌ Rechaza el mensaje
```

**Estado**: ✅ **Bien implementado** (parcialmente)

---

### 3. Sanitización de Datos (Protección contra Modificación Maliciosa)

#### Implementación Actual

**Archivo**: `backend/utils/sanitize.js`

**Proceso**:
- Sanitiza datos antes de guardar para prevenir inyección de código
- Protege la integridad del contenido almacenado

**Ejemplo Práctico**:

**Archivo**: `backend/app.js` (Socket.IO)

```javascript
socket.on('send_message', async ({ channelId, text, userId }) => {
  // Sanitizar el texto del mensaje antes de guardar
  const sanitizedText = sanitizeMessage(text);
  
  const newMessage = new Message({
    text: sanitizedText,  // ← Texto sanitizado
    userId,
    channel: channelId
  });
  
  await newMessage.save();
});
```

**Transformación**:
```
Usuario envía:
"<script>alert('XSS')</script>Hola mundo"

Backend sanitiza:
"&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;Hola mundo"

Se guarda en BD:
"&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;Hola mundo"

Al mostrar (desanitizado):
"<script>alert('XSS')</script>Hola mundo"  // ← Pero NO se ejecuta
```

**¿Por qué es importante?**
- Evita que código malicioso se ejecute
- Mantiene la integridad del contenido almacenado
- El texto se muestra legible pero seguro

**Estado**: ✅ **Bien implementado**

---

### 4. Verificación de Integridad de Tokens (JWT)

#### Implementación Actual

**Archivo**: `backend/middleware/auth.js`

**Proceso**:
- JWT incluye una firma digital
- El backend verifica la firma para detectar alteraciones

```javascript
module.exports = async (req, res, next) => {
  const token = authHeader && authHeader.split(' ')[1];
  
  try {
    // Verifica la firma del token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Si el token fue modificado, jwt.verify() lanza error
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token inválido' });
  }
};
```

**Ejemplo Práctico**:
```
Token original:
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODM...signature"

Atacante modifica:
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODQ...signature"
                    ↑ Cambió el userId

Backend verifica:
jwt.verify(token, JWT_SECRET)
❌ Error: "invalid signature"
❌ Respuesta: 403 "Token inválido"
```

**¿Por qué es importante?**
- Detecta si un token fue alterado
- Protege contra suplantación de identidad
- Mantiene la integridad de la autenticación

**Estado**: ✅ **Bien implementado**

---

### 5. Validación de Integridad Referencial

#### Implementación Actual

**Archivo**: `backend/models/Message.js`

```javascript
const MessageSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',  // ← Referencia a User
    required: true 
  },
  channel: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Channel',  // ← Referencia a Channel
    required: true 
  }
});
```

**Proceso**:
- Los ObjectId deben existir en las colecciones referenciadas
- Si se elimina un usuario, los mensajes mantienen la referencia (no se eliminan automáticamente)

**Ejemplo Práctico**:
```
Mensaje guardado:
{
  _id: "msg123",
  userId: "user456",  // ← Debe existir en colección users
  channel: "channel789",  // ← Debe existir en colección channels
  text: "Hola"
}

Si se intenta guardar con userId inexistente:
❌ MongoDB no valida automáticamente (depende de la aplicación)
```

**Estado**: ⚠️ **Parcialmente implementado**

---

### 6. Timestamps Automáticos

#### Implementación Actual

**Archivo**: `backend/models/Message.js`

```javascript
const MessageSchema = new mongoose.Schema({
  text: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true  // ← Agrega createdAt y updatedAt automáticamente
});
```

**Beneficio**:
- Registra cuándo se creó y modificó cada documento
- Permite auditoría y detección de cambios

**Ejemplo Práctico**:
```
Mensaje guardado:
{
  _id: "msg123",
  text: "Hola",
  createdAt: "2025-01-17T10:30:00.000Z",  // ← Automático
  updatedAt: "2025-01-17T10:30:00.000Z"   // ← Automático
}

Si se modifica:
{
  _id: "msg123",
  text: "Hola mundo",  // ← Modificado
  createdAt: "2025-01-17T10:30:00.000Z",  // ← No cambia
  updatedAt: "2025-01-17T11:45:00.000Z"   // ← Se actualiza automáticamente
}
```

**Estado**: ✅ **Bien implementado**

---

### 7. Validación de Longitud

#### Implementación Actual

**Archivo**: `backend/models/Suggestion.js`

```javascript
const SuggestionSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxLength: 10000  // ← Límite de longitud
  }
});

// Validación adicional en hook
SuggestionSchema.pre('save', function(next) {
  if (this.content && this.content.length > 10000) {
    next(new Error('El contenido de la sugerencia es demasiado largo'));
  } else {
    next();
  }
});
```

**Ejemplo Práctico**:
```
Usuario envía sugerencia de 15,000 caracteres

Backend valida:
❌ this.content.length > 10000
❌ Error: "El contenido de la sugerencia es demasiado largo"
❌ NO se guarda
```

**¿Por qué es importante?**
- Previene datos excesivamente grandes
- Protege contra ataques de denegación de servicio
- Mantiene la integridad del tamaño de los datos

**Estado**: ✅ **Bien implementado** (parcialmente)

---

### 8. Valores Permitidos (Enums)

#### Implementación Actual

**Archivo**: `backend/models/User.js`

```javascript
role: {
  type: String,
  enum: ['admin', 'user'],  // ← Solo estos valores
  default: 'user'
}
```

**Archivo**: `backend/models/Suggestion.js`

```javascript
status: {
  type: String,
  enum: ['pending', 'reviewed', 'implemented'],  // ← Solo estos valores
  default: 'pending'
}
```

**Ejemplo Práctico**:
```
Intento guardar:
{
  role: "superadmin"  // ← Valor no permitido
}

Mongoose rechaza:
❌ Error: "role must be one of: admin, user"
```

**¿Por qué es importante?**
- Mantiene consistencia de datos
- Previene valores inválidos
- Protege la integridad de los estados

**Estado**: ✅ **Bien implementado**

---

### 9. Índices Únicos

#### Implementación Actual

**Archivo**: `backend/models/User.js`

```javascript
email: {
  type: String,
  required: true,
  unique: true  // ← Índice único
}

// Índice explícito
UserSchema.index({ email: 1 }, { unique: true });
```

**Archivo**: `backend/models/Channel.js`

```javascript
name: {
  type: String,
  required: true,
  unique: true  // ← No puede haber dos canales con el mismo nombre
}
```

**Ejemplo Práctico**:
```
Intento crear usuario:
{
  email: "juan@empresa.com"
}

Ya existe otro usuario con ese email:
❌ Error: "E11000 duplicate key error collection: users index: email_1"
❌ NO se guarda
```

**¿Por qué es importante?**
- Garantiza unicidad
- Previene duplicados
- Mantiene la integridad de los datos únicos

**Estado**: ✅ **Bien implementado**

---

### 10. Control de Acceso (Previene Modificaciones No Autorizadas)

#### Implementación Actual

**Archivo**: `backend/routes/MessageRoutes.js`

```javascript
// Middleware para verificar acceso al canal
const checkChannelAccess = async (req, res, next) => {
  const channel = await Channel.findById(req.params.channelId);
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
};
```

**Ejemplo Práctico**:
```
Usuario "user3" intenta acceder a mensajes del canal "Reunión Ejecutiva":
- Canal es privado (isPublic: false)
- user3 NO está en allowedUsers

Backend verifica:
❌ channel.isPublic === false
❌ !channel.allowedUsers.includes(user3._id)
❌ Respuesta: 403 "No tienes acceso a este canal"
```

**¿Por qué es importante?**
- Previene modificaciones no autorizadas
- Protege la integridad de los datos
- Solo usuarios autorizados pueden modificar

**Estado**: ✅ **Bien implementado**

---

## Aspectos que Podrían Mejorarse

### 1. Validación Exhaustiva de Inputs

**Estado Actual**: 
- Validación básica de tipos
- Algunos campos no tienen validación de formato

**Riesgo**:
- Emails sin formato válido
- Nombres con caracteres especiales
- Textos sin límites de longitud en algunos campos

**Recomendación ISO 27001**:
- Validar formato de email (regex)
- Validar longitud mínima/máxima
- Validar caracteres permitidos
- Usar librerías como `joi` o `express-validator`

**Impacto**: ⚠️ **Medio**

**Implementación Sugerida**:
```javascript
// Validación de email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(req.body.email)) {
  return res.status(400).json({ message: 'Email inválido' });
}

// Validación de longitud
if (req.body.name.length < 2 || req.body.name.length > 50) {
  return res.status(400).json({ message: 'Nombre debe tener entre 2 y 50 caracteres' });
}

// Validación de caracteres permitidos
const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
if (!nameRegex.test(req.body.name)) {
  return res.status(400).json({ message: 'Nombre solo puede contener letras y espacios' });
}
```

---

### 2. Checksums/Hashes para Verificar Integridad

**Estado Actual**:
- No hay verificación de integridad mediante hashes

**Riesgo**:
- No se puede detectar si los datos fueron modificados directamente en la BD
- No hay forma de verificar que los datos no se corrompieron

**Recomendación ISO 27001**:
- Calcular hash (SHA-256) de datos críticos
- Almacenar hash junto con los datos
- Verificar hash periódicamente

**Impacto**: ⚠️ **Medio**

**Implementación Sugerida**:
```javascript
const crypto = require('crypto');

// Al guardar mensaje
const messageHash = crypto.createHash('sha256')
  .update(JSON.stringify({ text, userId, channel }))
  .digest('hex');

const message = new Message({
  text: sanitizedText,
  userId,
  channel: channelId,
  integrityHash: messageHash  // ← Hash de integridad
});

// Al leer mensaje
const calculatedHash = crypto.createHash('sha256')
  .update(JSON.stringify({ 
    text: message.text, 
    userId: message.userId, 
    channel: message.channel 
  }))
  .digest('hex');

if (calculatedHash !== message.integrityHash) {
  console.error('⚠️ Integridad comprometida en mensaje:', message._id);
  // Notificar administrador o marcar como corrupto
}
```

---

### 3. Logs de Auditoría de Cambios

**Estado Actual**:
- No hay registro de quién modificó qué y cuándo

**Riesgo**:
- No se puede rastrear modificaciones no autorizadas
- No hay forma de detectar cambios sospechosos

**Recomendación ISO 27001**:
- Registrar todas las modificaciones críticas
- Incluir: usuario, acción, timestamp, datos anteriores/nuevos

**Impacto**: ⚠️ **Alto**

**Implementación Sugerida**:
```javascript
// Modelo de auditoría
const AuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // 'create', 'update', 'delete'
  resource: { type: String, required: true }, // 'message', 'user', 'channel'
  resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  oldData: { type: Object },
  newData: { type: Object },
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String },
  userAgent: { type: String }
});

// Middleware para registrar cambios
async function logAudit(req, action, resource, resourceId, oldData, newData) {
  await AuditLog.create({
    userId: req.user.userId,
    action,
    resource,
    resourceId,
    oldData,
    newData,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });
}

// Al modificar usuario
router.patch('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
  const oldUser = await User.findById(req.params.id);
  // ... modificación ...
  const newUser = await User.findById(req.params.id);
  
  await logAudit(req, 'update', 'user', req.params.id, oldUser.toObject(), newUser.toObject());
});
```

---

### 4. Transacciones para Operaciones Críticas

**Estado Actual**:
- No se usan transacciones de MongoDB

**Riesgo**:
- Si una operación falla a mitad de camino, puede dejar datos inconsistentes

**Recomendación ISO 27001**:
- Usar transacciones para operaciones que modifican múltiples documentos
- Garantizar atomicidad (todo o nada)

**Impacto**: ⚠️ **Medio**

**Implementación Sugerida**:
```javascript
// Crear canal y agregar usuarios en una transacción
const session = await mongoose.startSession();
session.startTransaction();

try {
  const channel = await Channel.create([{
    name: channelName,
    createdBy: userId
  }], { session });

  await User.updateMany(
    { _id: { $in: allowedUsers } },
    { $push: { channels: channel[0]._id } },
    { session }
  );

  await session.commitTransaction();
  console.log('✅ Transacción completada exitosamente');
} catch (error) {
  await session.abortTransaction();
  console.error('❌ Transacción abortada:', error);
  throw error;
} finally {
  session.endSession();
}
```

---

### 5. Validación de Integridad Referencial Mejorada

**Estado Actual**:
- Referencias no se validan automáticamente
- Si se elimina un usuario, los mensajes mantienen referencia inválida

**Riesgo**:
- Datos huérfanos (mensajes sin usuario válido)
- Inconsistencias en la base de datos

**Recomendación ISO 27001**:
- Validar referencias antes de guardar
- Implementar cascada o restricción al eliminar

**Impacto**: ⚠️ **Medio**

**Implementación Sugerida**:
```javascript
// Antes de guardar mensaje
router.post('/api/messages', authenticateToken, async (req, res) => {
  const { channelId, text } = req.body;
  
  // Validar que el usuario existe
  const userExists = await User.findById(req.user.userId);
  if (!userExists) {
    return res.status(400).json({ message: 'Usuario no existe' });
  }

  // Validar que el canal existe
  const channelExists = await Channel.findById(channelId);
  if (!channelExists) {
    return res.status(400).json({ message: 'Canal no existe' });
  }

  // Validar acceso al canal
  if (!channelExists.isPublic && 
      !channelExists.allowedUsers.includes(req.user.userId) && 
      userExists.role !== 'admin') {
    return res.status(403).json({ message: 'No tienes acceso a este canal' });
  }

  // Ahora sí guardar
  const message = new Message({ text, userId: req.user.userId, channel: channelId });
  await message.save();
});
```

---

### 6. Firmas Digitales para Mensajes Críticos

**Estado Actual**:
- No hay firmas digitales

**Riesgo**:
- No se puede verificar la autenticidad de mensajes críticos
- No se puede detectar si un mensaje fue modificado por un administrador

**Recomendación ISO 27001**:
- Firmar mensajes importantes con clave privada
- Verificar firma al leer

**Impacto**: ⚠️ **Bajo** (depende del caso de uso)

**Implementación Sugerida**:
```javascript
const crypto = require('crypto');

// Generar par de claves (una vez)
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

// Al guardar mensaje crítico
const messageData = JSON.stringify({ text, userId, channel, timestamp });
const signature = crypto.sign('sha256', Buffer.from(messageData), {
  key: privateKey,
  padding: crypto.constants.RSA_PKCS1_PSS_PADDING
});

const message = new Message({
  text: sanitizedText,
  userId,
  channel: channelId,
  signature: signature.toString('base64')  // ← Firma digital
});

// Al leer mensaje crítico
const messageData = JSON.stringify({ 
  text: message.text, 
  userId: message.userId, 
  channel: message.channel,
  timestamp: message.createdAt 
});
const isValid = crypto.verify('sha256', Buffer.from(messageData), {
  key: publicKey,
  padding: crypto.constants.RSA_PKCS1_PSS_PADDING
}, Buffer.from(message.signature, 'base64'));

if (!isValid) {
  console.error('⚠️ Firma inválida en mensaje:', message._id);
}
```

---

## Resumen: Integridad en tu Aplicación

### ✅ Bien Implementado

1. ✅ **Validación de Esquemas (Mongoose)**: Campos requeridos, tipos, enums
2. ✅ **Validación de Tipos**: Verificación de strings, ObjectId
3. ✅ **Sanitización de Datos**: Protección contra inyección de código
4. ✅ **Verificación de Tokens JWT**: Detección de alteraciones
5. ✅ **Timestamps Automáticos**: Registro de creación y modificación
6. ✅ **Validación de Longitud**: Límites en sugerencias
7. ✅ **Valores Permitidos (Enums)**: Roles, estados
8. ✅ **Índices Únicos**: Prevención de duplicados
9. ✅ **Control de Acceso**: Previene modificaciones no autorizadas

### ⚠️ Áreas de Mejora

1. ⚠️ **Validación Exhaustiva de Inputs**: Formatos, longitudes, caracteres
2. ⚠️ **Checksums/Hashes**: Verificación de integridad de datos
3. ⚠️ **Logs de Auditoría**: Registro de cambios
4. ⚠️ **Transacciones**: Atomicidad en operaciones críticas
5. ⚠️ **Validación de Integridad Referencial**: Validación de referencias
6. ⚠️ **Firmas Digitales**: Autenticidad de mensajes críticos

---

## Conclusión

### Estado Actual

Tu aplicación implementa **medidas básicas de integridad** que son fundamentales:

- ✅ **Validación de Esquemas y Tipos**: Sistema robusto de validación
- ✅ **Sanitización de Datos**: Protección contra inyección de código
- ✅ **Verificación de Tokens**: Detección de alteraciones
- ✅ **Control de Acceso**: Previene modificaciones no autorizadas

### Cumplimiento ISO 27001

**Nivel Actual**: ⭐⭐⭐ (3/5)

- ✅ Cumple con requisitos básicos de integridad
- ⚠️ Requiere mejoras para cumplimiento completo

### Prioridades para Mejora

Para alcanzar un **cumplimiento completo de ISO 27001** en integridad, se recomienda priorizar:

1. **🔴 Alta Prioridad**:
   - Logs de auditoría de cambios
   - Validación exhaustiva de inputs
   - Validación de integridad referencial

2. **🟡 Media Prioridad**:
   - Checksums/Hashes para verificación
   - Transacciones para operaciones críticas

3. **🟢 Baja Prioridad**:
   - Firmas digitales (según necesidad del caso de uso)

---

## Referencias

- **ISO/IEC 27001:2022**: Sistema de gestión de seguridad de la información
- **Anexo A.8**: Seguridad de la información en las operaciones
- **Anexo A.9**: Control de acceso
- **Anexo A.10**: Criptografía
- **Anexo A.12**: Seguridad de las operaciones

---

**Última actualización**: Enero 2025

**Versión del documento**: 1.0

