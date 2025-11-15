# Manual 06: Seguridad - Sanitización, Encriptación e ISO 27001

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Sanitización de Datos](#sanitización-de-datos)
3. [Encriptación de Datos Sensibles](#encriptación-de-datos-sensibles)
4. [Protección de Contraseñas](#protección-de-contraseñas)
5. [Autenticación y Tokens JWT](#autenticación-y-tokens-jwt)
6. [ISO 27001: Confidencialidad, Integridad y Disponibilidad](#iso-27001-confidencialidad-integridad-y-disponibilidad)
7. [Resumen de Medidas de Seguridad](#resumen-de-medidas-de-seguridad)

---

## Introducción

La seguridad es **fundamental** en una aplicación empresarial que maneja información sensible. Este manual te explicará todas las medidas de seguridad implementadas en tu aplicación, desde la sanitización de datos hasta el cumplimiento de estándares ISO 27001.

### Objetivos de Seguridad

1. ✅ Proteger contra ataques XSS (Cross-Site Scripting)
2. ✅ Encriptar datos sensibles (sugerencias anónimas)
3. ✅ Proteger contraseñas con hash (bcrypt)
4. ✅ Autenticación segura con JWT
5. ✅ Cumplir con estándares ISO 27001

---

## Sanitización de Datos

### ¿Qué es la Sanitización?

**Sanitización** es el proceso de **escapar caracteres peligrosos** en los datos para prevenir ataques de inyección de código, especialmente XSS (Cross-Site Scripting).

**Ejemplo de Ataque XSS**:
```javascript
// Usuario envía mensaje malicioso:
"<script>alert('XSS')</script>Hola mundo"

// Sin sanitización:
// El navegador ejecuta el script ← PELIGROSO

// Con sanitización:
"&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;Hola mundo"
// El navegador muestra el texto, NO ejecuta el script ← SEGURO
```

### Sanitización en el Backend

**Archivo**: `backend/utils/sanitize.js`

#### Función `sanitizeString`

```javascript
function sanitizeString(input) {
    if (typeof input !== 'string') {
        return input;
    }
    
    return input
        .replace(/&/g, '&amp;')   // & → &amp;
        .replace(/</g, '&lt;')    // < → &lt;
        .replace(/>/g, '&gt;')    // > → &gt;
        .replace(/"/g, '&quot;')  // " → &quot;
        .replace(/'/g, '&#x27;')  // ' → &#x27;
        .replace(/\//g, '&#x2F;'); // / → &#x2F;
}
```

**¿Qué hace cada reemplazo?**

| Carácter Original | Entidad HTML | Razón |
|-------------------|--------------|-------|
| `&` | `&amp;` | Debe ir primero (evita doble escape) |
| `<` | `&lt;` | Previene etiquetas HTML |
| `>` | `&gt;` | Previene cierre de etiquetas |
| `"` | `&quot;` | Previene atributos HTML |
| `'` | `&#x27;` | Previene atributos HTML |
| `/` | `&#x2F;` | Previene cierre de etiquetas |

**¿Por qué `&` primero?**
- Si sanitizas `<` antes de `&`, podrías tener:
  ```
  "&lt;script&gt;" → "&amp;lt;script&amp;gt;" (incorrecto)
  ```
- Si sanitizas `&` primero:
  ```
  "&lt;script&gt;" → "&amp;lt;script&amp;gt;" (correcto)
  ```

#### Función `sanitizeObject`

```javascript
function sanitizeObject(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    
    if (typeof obj === 'string') {
        return sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    
    if (typeof obj === 'object') {
        const sanitized = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                sanitized[key] = sanitizeObject(obj[key]);
            }
        }
        return sanitized;
    }
    
    return obj;
}
```

**¿Qué hace?**: Sanitiza recursivamente objetos y arrays.

**Ejemplo**:
```javascript
const data = {
  name: "<script>alert('XSS')</script>",
  items: ["<b>Item 1</b>", "<i>Item 2</i>"]
};

const sanitized = sanitizeObject(data);
// Resultado:
{
  name: "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;",
  items: ["&lt;b&gt;Item 1&lt;/b&gt;", "&lt;i&gt;Item 2&lt;/i&gt;"]
}
```

#### Función `desanitizeMessage`

```javascript
function desanitizeMessage(text) {
    if (!text || typeof text !== 'string') {
        return text;
    }
    
    return text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/')
        .replace(/&amp;/g, '&');
}
```

**¿Qué hace?**: Revierte el escape para mostrar texto legible.

**¿Por qué desanitizar?**
- Los datos se guardan sanitizados en la BD (seguro)
- Al mostrar, se desanitizan para que sean legibles
- **Importante**: El navegador NO ejecuta el código porque ya está escapado en el DOM

**Uso en Mensajes**:

**Archivo**: `backend/app.js` (Socket.IO)

```javascript
const { sanitizeMessage, desanitizeMessage } = require('./utils/sanitize');

// Al guardar mensaje
socket.on('send_message', async ({ channelId, text, userId }) => {
  const sanitizedText = sanitizeMessage(text);  // ← Sanitizar antes de guardar
  const newMessage = new Message({
    text: sanitizedText,
    userId,
    channel: channelId
  });
  await newMessage.save();
});

// Al enviar mensajes al frontend
const messages = await Message.find({ channel: channelId });
const desanitizedMessages = messages.map(msg => ({
  ...msg.toObject(),
  text: desanitizeMessage(msg.text)  // ← Desanitizar para mostrar
}));
```

### Sanitización en el Frontend

**Archivo**: `frontend/vue-app/src/utils/security.js`

#### Interceptor de localStorage

```javascript
export function setupLocalStorageInterceptor() {
    const originalGetItem = Storage.prototype.getItem;
    const originalSetItem = Storage.prototype.setItem;
    
    // Sobrescribir setItem
    Storage.prototype.setItem = function(key, value) {
        let sanitizedValue = value;
        
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                sanitizedValue = JSON.stringify(sanitizeForStorage(parsed));
            } catch (e) {
                sanitizedValue = sanitizeForStorage(value);
            }
        }
        
        return originalSetItem.call(this, key, sanitizedValue);
    };
    
    // Sobrescribir getItem
    Storage.prototype.getItem = function(key) {
        const value = originalGetItem.call(this, key);
        if (value === null) return null;
        
        try {
            const parsed = JSON.parse(value);
            return JSON.stringify(desanitizeForStorage(parsed));
        } catch (e) {
            return desanitizeForStorage(value);
        }
    };
}
```

**¿Qué hace?**
- Intercepta **todas** las llamadas a `localStorage.setItem()` y `localStorage.getItem()`
- Sanitiza automáticamente antes de guardar
- Desanitiza automáticamente al leer

**¿Por qué es importante?**
- Protege contra XSS en `localStorage`
- Si un atacante inyecta código malicioso, se sanitiza automáticamente
- No necesitas recordar sanitizar manualmente

**Activación**:

**Archivo**: `frontend/vue-app/src/main.js`

```javascript
import { setupLocalStorageInterceptor } from './utils/security'
setupLocalStorageInterceptor()  // ← Se activa al iniciar la app
```

---

## Encriptación de Datos Sensibles

### ¿Qué es la Encriptación?

**Encriptación** es el proceso de convertir datos legibles en datos ilegibles usando una clave secreta. Solo quien tiene la clave puede desencriptar.

**Ejemplo**:
```
Texto original: "Sugerencia: Mejorar el sistema"
Texto encriptado: "a1b2c3d4e5f6...:9f8e7d6c5b4a..."
```

### Encriptación de Sugerencias Anónimas

**Archivo**: `backend/utils/encryption.js`

#### Algoritmo: AES-256-CBC

**AES-256-CBC**:
- **AES**: Advanced Encryption Standard
- **256**: Clave de 256 bits (muy segura)
- **CBC**: Cipher Block Chaining (modo de operación)

#### Función `encrypt`

```javascript
const crypto = require('crypto');

const ENCRYPTION_KEY = crypto.scryptSync(
    process.env.ENCRYPTION_KEY || 'tu_clave_secreta_predeterminada',
    'salt',
    32  // 32 bytes = 256 bits
);
const IV_LENGTH = 16; // Para AES-256-CBC

const encrypt = (text) => {
    const iv = crypto.randomBytes(IV_LENGTH);  // ← Vector de inicialización aleatorio
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
};
```

**Explicación Paso a Paso**:

1. **Generar IV (Initialization Vector)**:
   ```javascript
   const iv = crypto.randomBytes(16);
   ```
   - IV es aleatorio por cada encriptación
   - Previene que el mismo texto produzca el mismo resultado

2. **Crear Cipher**:
   ```javascript
   const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
   ```
   - `createCipheriv`: Crea el objeto de encriptación
   - `aes-256-cbc`: Algoritmo y modo
   - `ENCRYPTION_KEY`: Clave secreta
   - `iv`: Vector de inicialización

3. **Encriptar**:
   ```javascript
   let encrypted = cipher.update(text);
   encrypted = Buffer.concat([encrypted, cipher.final()]);
   ```
   - `update`: Encripta el texto
   - `final`: Finaliza la encriptación

4. **Formato de Salida**:
   ```javascript
   return iv.toString('hex') + ':' + encrypted.toString('hex');
   ```
   - Formato: `IV:encryptedText`
   - Ejemplo: `"a1b2c3d4e5f6...:9f8e7d6c5b4a..."`

#### Función `decrypt`

```javascript
const decrypt = (text) => {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');  // ← Extraer IV
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};
```

**Explicación Paso a Paso**:

1. **Extraer IV**:
   ```javascript
   const textParts = text.split(':');
   const iv = Buffer.from(textParts.shift(), 'hex');
   ```
   - Separa el IV del texto encriptado

2. **Extraer Texto Encriptado**:
   ```javascript
   const encryptedText = Buffer.from(textParts.join(':'), 'hex');
   ```
   - Une las partes restantes (por si hay `:` en el texto encriptado)

3. **Desencriptar**:
   ```javascript
   const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
   let decrypted = decipher.update(encryptedText);
   decrypted = Buffer.concat([decrypted, decipher.final()]);
   ```

### Uso en Sugerencias

**Archivo**: `backend/routes/SuggestionRoutes.js`

```javascript
const { encrypt, decrypt } = require('../utils/encryption');
const { sanitizeMessage, desanitizeMessage } = require('../utils/sanitize');

// Al crear sugerencia
router.post('/', authenticateToken, async (req, res) => {
  const { content } = req.body;
  
  // 1. Sanitizar (protección XSS)
  const sanitizedContent = sanitizeMessage(content);
  
  // 2. Encriptar (protección confidencialidad)
  const encryptedContent = encrypt(sanitizedContent);
  
  const suggestion = new Suggestion({
    content: encryptedContent,  // ← Guardar encriptado
    userId: req.user.userId,
    status: 'pending'
  });
  
  await suggestion.save();
});

// Al leer sugerencias (solo admin)
router.get('/', authenticateToken, async (req, res) => {
  const suggestions = await Suggestion.find();
  
  const decrypted = suggestions.map(s => {
    // 1. Desencriptar
    const decryptedContent = decrypt(s.content);
    
    // 2. Desanitizar (para mostrar legible)
    const desanitizedContent = desanitizeMessage(decryptedContent);
    
    return {
      ...s.toObject(),
      content: desanitizedContent
    };
  });
  
  res.json(decrypted);
});
```

**Flujo Completo**:

```
Usuario envía sugerencia:
"Sugerencia: Mejorar el sistema"

Backend:
1. Sanitiza: "Sugerencia: Mejorar el sistema" (sin cambios, no hay HTML)
2. Encripta: "a1b2c3d4e5f6...:9f8e7d6c5b4a..."
3. Guarda en BD: "a1b2c3d4e5f6...:9f8e7d6c5b4a..."

Admin lee sugerencia:
1. Lee de BD: "a1b2c3d4e5f6...:9f8e7d6c5b4a..."
2. Desencripta: "Sugerencia: Mejorar el sistema"
3. Desanitiza: "Sugerencia: Mejorar el sistema"
4. Envía al frontend: "Sugerencia: Mejorar el sistema"
```

**¿Por qué doble protección?**
- **Sanitización**: Protege contra XSS
- **Encriptación**: Protege confidencialidad (si alguien accede a la BD, no puede leer)

---

## Protección de Contraseñas

### Hash con bcrypt

**Archivo**: `backend/models/User.js`

#### Middleware `pre('save')`

```javascript
const bcrypt = require('bcrypt');

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();  // ← Si no se modificó, no hashear
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

**Explicación**:

1. **Verificar si se modificó**:
   ```javascript
   if (!this.isModified('password')) {
     return next();
   }
   ```
   - Si solo actualizas `name` o `email`, no re-hashea la contraseña

2. **Generar Salt**:
   ```javascript
   const salt = await bcrypt.genSalt(10);
   ```
   - **Salt**: Valor aleatorio único por contraseña
   - **10**: Rondas de hasheo (más rondas = más seguro pero más lento)

3. **Hashear Contraseña**:
   ```javascript
   this.password = await bcrypt.hash(this.password, salt);
   ```
   - Combina contraseña + salt
   - Genera hash irreversible

**Ejemplo**:
```
Contraseña original: "miPassword123"
Salt generado: "$2b$10$abcdefghijklmnopqrstuv"
Hash resultante: "$2b$10$abcdefghijklmnopqrstuv...xyz123"
```

**Características de bcrypt**:
- ✅ **Irreversible**: No se puede obtener la contraseña original del hash
- ✅ **Único**: Mismo password produce hash diferente (por el salt)
- ✅ **Lento**: Protege contra ataques de fuerza bruta

### Verificación de Contraseña

**Archivo**: `backend/routes/UserRoutes.js`

```javascript
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = await UserSchema.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: 'Credenciales incorrectas' });
  }
  
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ message: 'Credenciales incorrectas' });
  }
  
  // Contraseña correcta, generar token JWT
  const token = jwt.sign({ userId: user._id }, JWT_SECRET);
  res.json({ token, user });
});
```

**¿Cómo funciona `bcrypt.compare`?**
- Toma la contraseña en texto plano
- Toma el hash almacenado (que incluye el salt)
- Hashea la contraseña con el mismo salt
- Compara los hashes

**Ejemplo**:
```
Usuario envía: "miPassword123"
Hash en BD: "$2b$10$abcdefghijklmnopqrstuv...xyz123"

bcrypt.compare:
1. Extrae salt del hash: "$2b$10$abcdefghijklmnopqrstuv"
2. Hashea "miPassword123" con ese salt
3. Compara: ¿Coincide? → true/false
```

### Ocultación de Contraseñas en Respuestas

**Archivo**: `backend/models/User.js`

```javascript
UserSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password;  // ← Elimina password al serializar
    return ret;
  }
});
```

**¿Qué hace?**
- Cuando Mongoose convierte el documento a JSON, elimina el campo `password`
- **Nunca** se envía la contraseña (ni siquiera el hash) al frontend

---

## Autenticación y Tokens JWT

### ¿Qué es JWT?

**JWT (JSON Web Token)** es un estándar para transmitir información de forma segura entre partes.

**Estructura**:
```
header.payload.signature
```

**Ejemplo**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODM3YzI3NmE4NjkwNzIwOTNiYTk0OWMifQ.signature
```

### Generación de Token

**Archivo**: `backend/routes/UserRoutes.js`

```javascript
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  const user = await UserSchema.findOne({ email });
  const validPassword = await bcrypt.compare(password, user.password);
  
  if (!validPassword) {
    return res.status(401).json({ message: 'Credenciales incorrectas' });
  }
  
  const token = jwt.sign(
    { userId: user._id },  // ← Payload (datos del usuario)
    process.env.JWT_SECRET || 'tu_clave_secreta',  // ← Clave secreta
    { expiresIn: '24h' }  // ← Expiración
  );
  
  res.json({ token, user });
});
```

**Componentes del Token**:

1. **Payload**:
   ```javascript
   { userId: user._id }
   ```
   - Datos que se incluyen en el token
   - **No incluir información sensible** (no contraseñas, emails, etc.)

2. **Clave Secreta**:
   ```javascript
   process.env.JWT_SECRET
   ```
   - Se usa para firmar el token
   - **Nunca** exponer en el código

3. **Expiración**:
   ```javascript
   { expiresIn: '24h' }
   ```
   - El token expira después de 24 horas
   - El usuario debe hacer login nuevamente

### Verificación de Token

**Archivo**: `backend/middleware/auth.js`

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No se proporcionó token de acceso' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar si el usuario está activo
    const user = await User.findById(decoded.userId);
    if (!user || !user.active) {
      return res.status(403).json({ message: 'Usuario inactivo o no encontrado' });
    }
    
    req.user = decoded;  // ← Agregar datos del usuario a la petición
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token inválido' });
  }
};
```

**Explicación**:

1. **Extraer Token**:
   ```javascript
   const authHeader = req.headers['authorization'];
   const token = authHeader && authHeader.split(' ')[1];
   ```
   - Formato: `Bearer eyJhbGciOiJIUzI1NiIs...`
   - Extrae solo el token (después de "Bearer ")

2. **Verificar Firma**:
   ```javascript
   const decoded = jwt.verify(token, process.env.JWT_SECRET);
   ```
   - Verifica que el token no fue modificado
   - Verifica que no haya expirado
   - Si es válido, retorna el payload decodificado

3. **Verificar Usuario Activo**:
   ```javascript
   const user = await User.findById(decoded.userId);
   if (!user || !user.active) {
     return res.status(403).json({ message: 'Usuario inactivo' });
   }
   ```
   - Verifica que el usuario existe y está activo
   - Si fue desactivado después de generar el token, se rechaza

### Uso del Token en el Frontend

**Archivo**: `frontend/vue-app/src/services/axiosConfig.js`

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000'
});

// Interceptor para agregar token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

**¿Qué hace?**
- Agrega automáticamente el token a todas las peticiones
- Si el token expira o es inválido, redirige al login

---

## ISO 27001: Confidencialidad, Integridad y Disponibilidad

### Confidencialidad

**Definición**: Asegurar que la información solo sea accesible para aquellos autorizados.

**Implementaciones en tu Aplicación**:

1. ✅ **Autenticación con JWT**: Solo usuarios autenticados pueden acceder
2. ✅ **Control de Acceso por Roles**: Admin vs Usuario regular
3. ✅ **Canales Privados**: Solo usuarios autorizados pueden ver mensajes
4. ✅ **Encriptación de Sugerencias**: AES-256-CBC
5. ✅ **Hash de Contraseñas**: bcrypt (nunca en texto plano)
6. ✅ **Sanitización de localStorage**: Protección contra XSS

**Documentación detallada**: Ver `docs/iso27001/confidencialidad.md`

### Integridad

**Definición**: Asegurar que la información no sea modificada de manera no autorizada.

**Implementaciones en tu Aplicación**:

1. ✅ **Validación de Esquemas (Mongoose)**: Campos requeridos, tipos, enums
2. ✅ **Sanitización de Datos**: Protección contra inyección de código
3. ✅ **Verificación de Tokens JWT**: Detección de alteraciones
4. ✅ **Timestamps Automáticos**: Registro de creación y modificación
5. ✅ **Índices Únicos**: Prevención de duplicados
6. ✅ **Control de Acceso**: Previene modificaciones no autorizadas

**Documentación detallada**: Ver `docs/iso27001/integridad.md`

### Disponibilidad

**Definición**: Asegurar que la información esté accesible cuando se necesite.

**Implementaciones en tu Aplicación**:

1. ✅ **Manejo de Errores**: Try-catch en rutas críticas
2. ✅ **Caché**: Directorio telefónico con TTL de 5 minutos
3. ✅ **Manejo de Desconexiones**: Socket.IO con reconexión automática
4. ✅ **Validación de Datos**: Previene errores
5. ✅ **Filtrado de Datos Nulos**: Evita errores en frontend

**Documentación detallada**: Ver `docs/iso27001/disponibilidad.md`

### Nivel de Cumplimiento

**Confidencialidad**: ⭐⭐⭐ (3/5)
- ✅ Cumple con requisitos básicos
- ⚠️ Requiere mejoras (HTTPS, HttpOnly cookies, refresh tokens)

**Integridad**: ⭐⭐⭐ (3/5)
- ✅ Cumple con requisitos básicos
- ⚠️ Requiere mejoras (logs de auditoría, checksums, transacciones)

**Disponibilidad**: ⭐⭐ (2/5)
- ⚠️ Cumple con requisitos básicos
- ⚠️ Requiere mejoras significativas (health checks, backups, redundancia)

---

## Resumen de Medidas de Seguridad

### ✅ Implementado

1. **Sanitización**:
   - ✅ Backend: Mensajes y sugerencias
   - ✅ Frontend: localStorage interceptor

2. **Encriptación**:
   - ✅ Sugerencias anónimas (AES-256-CBC)

3. **Protección de Contraseñas**:
   - ✅ Hash con bcrypt (salt rounds: 10)
   - ✅ Contraseñas nunca se envían al frontend

4. **Autenticación**:
   - ✅ JWT con expiración de 24h
   - ✅ Verificación de usuario activo
   - ✅ Middleware centralizado

5. **Control de Acceso**:
   - ✅ Roles (admin/user)
   - ✅ Canales privados
   - ✅ Verificación de permisos

6. **ISO 27001**:
   - ✅ Medidas básicas de confidencialidad
   - ✅ Medidas básicas de integridad
   - ✅ Medidas básicas de disponibilidad

### ⚠️ Áreas de Mejora

1. **HTTPS/TLS**: Cifrado de comunicaciones en producción
2. **HttpOnly Cookies**: Mayor protección contra XSS para tokens
3. **Refresh Tokens**: Tokens de corta duración con renovación
4. **Rate Limiting**: Prevenir ataques DoS
5. **Health Checks**: Monitoreo del estado del servicio
6. **Backups Automáticos**: Recuperación ante desastres
7. **Logs de Auditoría**: Registro de cambios críticos
8. **Validación Exhaustiva**: Formatos, longitudes, caracteres permitidos

---

## Preguntas Frecuentes

### ¿Por qué sanitizar si luego desanitizo?

**Respuesta**: 
- Los datos se guardan **sanitizados** en la BD (seguro)
- Al mostrar, se desanitizan para legibilidad
- El navegador NO ejecuta código porque ya está escapado en el DOM

### ¿Por qué encriptar sugerencias si ya están sanitizadas?

**Respuesta**:
- **Sanitización**: Protege contra XSS (inyección de código)
- **Encriptación**: Protege confidencialidad (si alguien accede a la BD, no puede leer)

### ¿Qué pasa si olvido la clave de encriptación?

**Respuesta**:
- Las sugerencias encriptadas **NO se pueden desencriptar**
- Es importante tener un backup seguro de la clave
- Considera usar un gestor de secretos (AWS Secrets Manager, HashiCorp Vault)

### ¿Por qué bcrypt y no SHA-256?

**Respuesta**:
- **SHA-256**: Hash rápido (vulnerable a fuerza bruta)
- **bcrypt**: Hash lento (protege contra fuerza bruta)
- bcrypt está diseñado específicamente para contraseñas

---

## Próximos Pasos

Ahora que entiendes la seguridad, puedes continuar con:
- **Manual 07**: Directorio Telefónico (integración externa)

---

**Última actualización**: Enero 2025

**Versión**: 1.0

