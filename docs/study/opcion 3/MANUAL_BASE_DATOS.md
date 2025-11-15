# Manual Base de Datos - Modelos y Esquemas

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [MongoDB y Mongoose](#mongodb-y-mongoose)
3. [Modelo: User](#modelo-user)
4. [Modelo: Channel](#modelo-channel)
5. [Modelo: Message](#modelo-message)
6. [Modelo: Announcement](#modelo-announcement)
7. [Modelo: Suggestion](#modelo-suggestion)
8. [Relaciones entre Modelos](#relaciones-entre-modelos)
9. [Índices](#índices)
10. [Middleware y Hooks](#middleware-y-hooks)
11. [Validaciones](#validaciones)

---

## Introducción

La base de datos de tu aplicación utiliza **MongoDB** como sistema de gestión de bases de datos NoSQL y **Mongoose** como ODM (Object Document Mapper). Este manual te explicará todos los modelos, sus esquemas, relaciones y características.

### Características de MongoDB

- **NoSQL**: Base de datos orientada a documentos
- **Flexible**: Esquemas dinámicos
- **Escalable**: Fácil de escalar horizontalmente
- **JSON-like**: Almacena documentos en formato BSON (Binary JSON)

### Características de Mongoose

- **ODM**: Mapea objetos JavaScript a documentos MongoDB
- **Esquemas**: Define estructura de documentos
- **Validación**: Valida datos antes de guardar
- **Middleware**: Hooks antes/después de operaciones
- **Población**: Referencias entre documentos

### Estructura de Modelos

```
backend/models/
├── User.js          # Usuarios del sistema
├── Channel.js       # Canales de chat
├── Message.js       # Mensajes de chat
├── Announcement.js  # Anuncios
└── Suggestion.js   # Sugerencias anónimas
```

---

## MongoDB y Mongoose

### Conexión a MongoDB

**Archivo**: `backend/app.js`

```javascript
const DB_URL = process.env.DB_URL || 'mongodb://localhost:27017/chat_bbdd';
mongoose.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: false
});
```

**Opciones**:
- `useNewUrlParser: true`: Usa nuevo parser de URLs
- `useUnifiedTopology: true`: Usa nuevo motor de descubrimiento
- `autoIndex: false`: No crea índices automáticamente (se crean manualmente)

### Conceptos Clave

#### Esquema (Schema)

**Definición**: Estructura de un documento

```javascript
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }
});
```

#### Modelo (Model)

**Definición**: Clase que se construye a partir del esquema

```javascript
const User = mongoose.model('User', UserSchema);
```

#### Documento (Document)

**Definición**: Instancia de un modelo

```javascript
const user = new User({ name: 'Juan', email: 'juan@empresa.com' });
await user.save();
```

---

## Modelo: User

### Archivo: `backend/models/User.js`

### Esquema Completo

```javascript
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { 
  strict: true,
  autoIndex: false
});
```

### Campos Explicados

#### `name`

```javascript
name: {
  type: String,
  required: true
}
```

**Tipo**: String
**Requerido**: Sí
**Descripción**: Nombre completo del usuario

**Ejemplo**: `"Juan Pérez"`

#### `email`

```javascript
email: {
  type: String,
  required: true,
  unique: true
}
```

**Tipo**: String
**Requerido**: Sí
**Único**: Sí (índice único)
**Descripción**: Correo electrónico del usuario (usado para login)

**Ejemplo**: `"juan@empresa.com"`

**Validación**: MongoDB garantiza unicidad mediante índice

#### `password`

```javascript
password: {
  type: String,
  required: true
}
```

**Tipo**: String
**Requerido**: Sí
**Descripción**: Contraseña hasheada con bcrypt

**Ejemplo**: `"$2b$10$abcdefghijklmnopqrstuvwxyz1234567890..."`

**Nota**: Se hashea automáticamente antes de guardar (ver middleware)

#### `role`

```javascript
role: {
  type: String,
  enum: ['admin', 'user'],
  default: 'user'
}
```

**Tipo**: String
**Valores Permitidos**: `'admin'` o `'user'`
**Valor por Defecto**: `'user'`
**Descripción**: Rol del usuario en el sistema

**Valores**:
- `'admin'`: Administrador (acceso total)
- `'user'`: Usuario regular (acceso limitado)

#### `active`

```javascript
active: {
  type: Boolean,
  default: true
}
```

**Tipo**: Boolean
**Valor por Defecto**: `true`
**Descripción**: Indica si el usuario está activo

**Uso**:
- `true`: Usuario puede hacer login
- `false`: Usuario NO puede hacer login (desactivado)

#### `createdAt`

```javascript
createdAt: {
  type: Date,
  default: Date.now
}
```

**Tipo**: Date
**Valor por Defecto**: Fecha actual
**Descripción**: Fecha de creación del usuario

### Middleware: Hash de Contraseña

```javascript
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

**¿Qué hace?**
- Se ejecuta **antes** de guardar el documento
- Si el campo `password` fue modificado, lo hashea con bcrypt
- Si no fue modificado, no hace nada (evita re-hashear)

**Ejemplo**:
```javascript
// Crear usuario
const user = new User({ name: 'Juan', email: 'juan@empresa.com', password: 'miPassword123' });
await user.save();
// password se hashea automáticamente: "$2b$10$..."

// Actualizar solo nombre
user.name = 'Juan Pérez';
await user.save();
// password NO se re-hashea (no fue modificado)
```

### Método `toJSON`

```javascript
UserSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});
```

**¿Qué hace?**
- Cuando se serializa el documento a JSON, elimina el campo `password`
- **Nunca** se envía la contraseña al frontend

**Ejemplo**:
```javascript
const user = await User.findById(userId);
const json = user.toJSON();
// json NO contiene el campo password
```

### Índices

```javascript
UserSchema.index({ email: 1 }, { unique: true });
```

**Índice Único en `email`**:
- Garantiza que no haya dos usuarios con el mismo email
- Mejora rendimiento de búsquedas por email

---

## Modelo: Channel

### Archivo: `backend/models/Channel.js`

### Esquema Completo

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

### Campos Explicados

#### `name`

```javascript
name: {
  type: String,
  required: true,
  unique: true
}
```

**Tipo**: String
**Requerido**: Sí
**Único**: Sí
**Descripción**: Nombre del canal

**Ejemplo**: `"Recursos Humanos"`

#### `description`

```javascript
description: {
  type: String,
  default: ''
}
```

**Tipo**: String
**Valor por Defecto**: String vacío
**Descripción**: Descripción opcional del canal

#### `isPublic`

```javascript
isPublic: {
  type: Boolean,
  default: false
}
```

**Tipo**: Boolean
**Valor por Defecto**: `false`
**Descripción**: Indica si el canal es público o privado

**Valores**:
- `true`: Canal público (todos los usuarios pueden verlo)
- `false`: Canal privado (solo usuarios en `allowedUsers`)

#### `allowedUsers`

```javascript
allowedUsers: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
}]
```

**Tipo**: Array de ObjectId
**Referencia**: `User`
**Descripción**: Array de IDs de usuarios que tienen acceso al canal

**Uso**:
- Solo para canales privados (`isPublic: false`)
- Para canales públicos, puede estar vacío

**Ejemplo**:
```javascript
allowedUsers: [
  "6837c276a869072093ba949c",
  "6846378319c2a6a442e90fee"
]
```

**Población**:
```javascript
const channel = await Channel.findById(id).populate('allowedUsers', 'name email');
// channel.allowedUsers ahora contiene objetos User completos
```

#### `createdBy`

```javascript
createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true
}
```

**Tipo**: ObjectId
**Referencia**: `User`
**Requerido**: Sí
**Descripción**: ID del usuario que creó el canal

#### `active`

```javascript
active: {
  type: Boolean,
  default: true
}
```

**Tipo**: Boolean
**Valor por Defecto**: `true`
**Descripción**: Indica si el canal está activo

**Uso**:
- `true`: Canal visible y accesible
- `false`: Canal desactivado (no visible, pero no eliminado)

---

## Modelo: Message

### Archivo: `backend/models/Message.js`

### Esquema Completo

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

### Campos Explicados

#### `text`

```javascript
text: { type: String, required: true }
```

**Tipo**: String
**Requerido**: Sí
**Descripción**: Contenido del mensaje

**Nota**: Se sanitiza antes de guardar (ver backend/utils/sanitize.js)

#### `userId`

```javascript
userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
```

**Tipo**: ObjectId
**Referencia**: `User`
**Requerido**: Sí
**Descripción**: ID del usuario que envió el mensaje

**Población**:
```javascript
const message = await Message.findById(id).populate('userId', 'name');
// message.userId ahora contiene { _id: "...", name: "Juan" }
```

#### `channel`

```javascript
channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true }
```

**Tipo**: ObjectId
**Referencia**: `Channel`
**Requerido**: Sí
**Descripción**: ID del canal donde se envió el mensaje

#### `createdAt`

```javascript
createdAt: { type: Date, default: Date.now }
```

**Tipo**: Date
**Valor por Defecto**: Fecha actual
**Descripción**: Fecha de creación del mensaje

**Nota**: También se agrega `updatedAt` automáticamente por `timestamps: true`

### Índices

```javascript
MessageSchema.index({ channel: 1, createdAt: 1 });
MessageSchema.index({ userId: 1 });
```

**Índices**:
1. **Índice compuesto** `{ channel: 1, createdAt: 1 }`:
   - Optimiza búsquedas de mensajes por canal ordenados por fecha
   - Usado en: `Message.find({ channel: channelId }).sort({ createdAt: 1 })`

2. **Índice simple** `{ userId: 1 }`:
   - Optimiza búsquedas de mensajes por usuario
   - Usado en: `Message.find({ userId: userId })`

---

## Modelo: Announcement

### Archivo: `backend/models/Announcement.js`

### Esquema Completo

```javascript
const AnnouncementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  active: {
    type: Boolean,
    default: true
  }
});
```

### Campos Explicados

#### `title`

```javascript
title: {
  type: String,
  required: true
}
```

**Tipo**: String
**Requerido**: Sí
**Descripción**: Título del anuncio

#### `content`

```javascript
content: {
  type: String,
  required: true
}
```

**Tipo**: String
**Requerido**: Sí
**Descripción**: Contenido del anuncio

#### `author`

```javascript
author: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true
}
```

**Tipo**: ObjectId
**Referencia**: `User`
**Requerido**: Sí
**Descripción**: ID del usuario que creó el anuncio

#### `active`

```javascript
active: {
  type: Boolean,
  default: true
}
```

**Tipo**: Boolean
**Valor por Defecto**: `true`
**Descripción**: Indica si el anuncio está activo

---

## Modelo: Suggestion

### Archivo: `backend/models/Suggestion.js`

### Esquema Completo

```javascript
const SuggestionSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxLength: 10000
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'implemented'],
    default: 'pending'
  }
}, {
  timestamps: true
});
```

### Campos Explicados

#### `content`

```javascript
content: {
  type: String,
  required: true,
  maxLength: 10000
}
```

**Tipo**: String
**Requerido**: Sí
**Longitud Máxima**: 10000 caracteres
**Descripción**: Contenido de la sugerencia (encriptado)

**Nota**: Se encripta antes de guardar (ver backend/utils/encryption.js)

#### `status`

```javascript
status: {
  type: String,
  enum: ['pending', 'reviewed', 'implemented'],
  default: 'pending'
}
```

**Tipo**: String
**Valores Permitidos**: `'pending'`, `'reviewed'`, `'implemented'`
**Valor por Defecto**: `'pending'`
**Descripción**: Estado de la sugerencia

**Estados**:
- `'pending'`: Pendiente de revisión
- `'reviewed'`: Revisada
- `'implemented'`: Implementada

### Middleware: Validación de Longitud

```javascript
SuggestionSchema.pre('save', function(next) {
  if (this.content && this.content.length > 10000) {
    next(new Error('El contenido de la sugerencia es demasiado largo'));
  } else {
    next();
  }
});
```

**¿Qué hace?**
- Valida que el contenido no exceda 10000 caracteres
- Si excede, lanza error y no guarda

---

## Relaciones entre Modelos

### Diagrama de Relaciones

```
User
  ├─► Channel (createdBy)
  ├─► Message (userId)
  ├─► Announcement (author)
  └─► Channel.allowedUsers (array)

Channel
  ├─► Message (channel)
  └─► User (createdBy, allowedUsers)

Message
  ├─► User (userId)
  └─► Channel (channel)

Announcement
  └─► User (author)

Suggestion
  └─► (sin relaciones directas)
```

### Tipos de Relaciones

#### 1. Referencia Simple (One-to-Many)

**Ejemplo**: `Message.userId → User`

```javascript
// Message
userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }

// Población
const message = await Message.findById(id).populate('userId', 'name');
// message.userId = { _id: "...", name: "Juan" }
```

#### 2. Referencia Array (Many-to-Many)

**Ejemplo**: `Channel.allowedUsers → User[]`

```javascript
// Channel
allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]

// Población
const channel = await Channel.findById(id).populate('allowedUsers', 'name email');
// channel.allowedUsers = [{ _id: "...", name: "Juan" }, { _id: "...", name: "María" }]
```

#### 3. Sin Relaciones

**Ejemplo**: `Suggestion`

```javascript
// Suggestion no tiene referencias a otros modelos
// El contenido se encripta, pero no se relaciona con User
```

### Población (Populate)

**Concepto**: Reemplazar ObjectId con el documento completo referenciado

**Sintaxis**:
```javascript
Model.findById(id).populate('campo', 'campos a incluir')
```

**Ejemplos**:

1. **Población Simple**:
   ```javascript
   const message = await Message.findById(id).populate('userId', 'name');
   // message.userId = { _id: "...", name: "Juan" }
   ```

2. **Población Múltiple**:
   ```javascript
   const message = await Message.findById(id)
     .populate('userId', 'name')
     .populate('channel', 'name');
   // message.userId = { _id: "...", name: "Juan" }
   // message.channel = { _id: "...", name: "General" }
   ```

3. **Población de Array**:
   ```javascript
   const channel = await Channel.findById(id).populate('allowedUsers', 'name email');
   // channel.allowedUsers = [{ _id: "...", name: "Juan", email: "juan@..." }, ...]
   ```

---

## Índices

### ¿Qué son los Índices?

**Definición**: Estructuras de datos que mejoran la velocidad de búsquedas

**Ventajas**:
- ✅ Búsquedas más rápidas
- ✅ Ordenamiento más eficiente
- ✅ Validación de unicidad

**Desventajas**:
- ⚠️ Ocupan espacio en disco
- ⚠️ Ralentizan escrituras (mínimo)

### Índices en tu Aplicación

#### 1. Índice Único en `User.email`

```javascript
UserSchema.index({ email: 1 }, { unique: true });
```

**Propósito**: Garantizar unicidad de emails

**Uso**: Búsquedas por email (`User.findOne({ email: '...' })`)

#### 2. Índice Único en `Channel.name`

```javascript
name: { type: String, required: true, unique: true }
```

**Propósito**: Garantizar unicidad de nombres de canales

#### 3. Índice Compuesto en `Message`

```javascript
MessageSchema.index({ channel: 1, createdAt: 1 });
```

**Propósito**: Optimizar búsquedas de mensajes por canal ordenados por fecha

**Uso**: `Message.find({ channel: channelId }).sort({ createdAt: 1 })`

#### 4. Índice Simple en `Message.userId`

```javascript
MessageSchema.index({ userId: 1 });
```

**Propósito**: Optimizar búsquedas de mensajes por usuario

**Uso**: `Message.find({ userId: userId })`

### Creación de Índices

**Automática** (deshabilitada):
```javascript
autoIndex: false  // No crea índices automáticamente
```

**Manual**:
```javascript
UserSchema.index({ email: 1 }, { unique: true });
```

**Sincronización**:
```javascript
await User.syncIndexes();  // Sincroniza índices con la BD
```

---

## Middleware y Hooks

### Tipos de Hooks

#### 1. `pre('save')`

**Se ejecuta**: Antes de guardar el documento

**Ejemplo**: Hash de contraseña

```javascript
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

#### 2. `post('save')`

**Se ejecuta**: Después de guardar el documento

**Ejemplo**: (No usado en tu aplicación)

```javascript
UserSchema.post('save', function(doc) {
  console.log('Usuario guardado:', doc._id);
});
```

### Métodos de Transformación

#### `toJSON`

**Se ejecuta**: Al convertir documento a JSON

**Ejemplo**: Eliminar password

```javascript
UserSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});
```

**Uso**:
```javascript
const user = await User.findById(id);
const json = user.toJSON();  // No incluye password
```

---

## Validaciones

### Validaciones de Mongoose

#### 1. `required`

```javascript
name: { type: String, required: true }
```

**Valida**: Que el campo exista y no sea `null` o `undefined`

#### 2. `unique`

```javascript
email: { type: String, unique: true }
```

**Valida**: Que no haya otro documento con el mismo valor

#### 3. `enum`

```javascript
role: { type: String, enum: ['admin', 'user'] }
```

**Valida**: Que el valor esté en la lista permitida

#### 4. `default`

```javascript
active: { type: Boolean, default: true }
```

**Asigna**: Valor por defecto si no se proporciona

#### 5. `maxLength`

```javascript
content: { type: String, maxLength: 10000 }
```

**Valida**: Que la longitud no exceda el límite

### Validación Personalizada

**Ejemplo**: Validación de longitud en `Suggestion`

```javascript
SuggestionSchema.pre('save', function(next) {
  if (this.content && this.content.length > 10000) {
    next(new Error('El contenido es demasiado largo'));
  } else {
    next();
  }
});
```

---

## Resumen

### Modelos y sus Propósitos

1. **User**: Usuarios del sistema
   - Autenticación
   - Roles (admin/user)
   - Estado activo/inactivo

2. **Channel**: Canales de chat
   - Públicos/privados
   - Permisos de acceso
   - Estado activo/inactivo

3. **Message**: Mensajes de chat
   - Contenido sanitizado
   - Referencias a User y Channel
   - Timestamps automáticos

4. **Announcement**: Anuncios
   - Título y contenido
   - Autor (User)
   - Estado activo/inactivo

5. **Suggestion**: Sugerencias anónimas
   - Contenido encriptado
   - Estados (pending/reviewed/implemented)
   - Validación de longitud

### Características Comunes

- ✅ Referencias entre modelos (populate)
- ✅ Validaciones (required, unique, enum)
- ✅ Valores por defecto
- ✅ Timestamps automáticos (en algunos modelos)
- ✅ Índices para optimización
- ✅ Middleware para transformaciones

---

## Próximos Pasos

Ahora que entiendes la base de datos, has completado todos los manuales de la Opción 3. Puedes:
- Revisar los manuales anteriores para profundizar
- Implementar mejoras en los modelos
- Agregar nuevos modelos según necesidad

---

**Última actualización**: Enero 2025

**Versión**: 1.0

