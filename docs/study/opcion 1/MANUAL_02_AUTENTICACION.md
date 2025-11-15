# Manual 02: Sistema de Autenticación

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Flujo Completo de Autenticación](#flujo-completo-de-autenticación)
3. [Modelo de Usuario y Hash de Contraseñas](#modelo-de-usuario-y-hash-de-contraseñas)
4. [Proceso de Login](#proceso-de-login)
5. [Tokens JWT](#tokens-jwt)
6. [Middleware de Autenticación](#middleware-de-autenticación)
7. [Almacenamiento en el Frontend](#almacenamiento-en-el-frontend)
8. [Logout](#logout)

---

## Introducción

El sistema de autenticación es el **corazón de la seguridad** de tu aplicación. Este manual te explicará paso a paso cómo funciona, por qué se tomaron cada decisión técnica, y cómo cada pieza se conecta.

### Objetivos del Sistema de Autenticación

1. ✅ Verificar la identidad del usuario
2. ✅ Proteger contraseñas (nunca en texto plano)
3. ✅ Mantener sesiones seguras
4. ✅ Controlar acceso a recursos
5. ✅ Cumplir con estándares de seguridad (ISO 27001)

---

## Flujo Completo de Autenticación

### Diagrama de Flujo

```
┌─────────────┐
│   Usuario   │
│  (Frontend) │
└──────┬──────┘
       │ 1. Ingresa email y contraseña
       │
       ▼
┌─────────────────────────────────────┐
│      Login.vue (Frontend)          │
│  - Captura credenciales             │
│  - Envía POST /login                │
└──────┬──────────────────────────────┘
       │ 2. POST /login
       │    { email, password }
       │
       ▼
┌─────────────────────────────────────┐
│   UserRoutes.js (Backend)           │
│   POST /login                        │
│  - Busca usuario por email           │
│  - Verifica contraseña (bcrypt)      │
│  - Genera token JWT                  │
└──────┬──────────────────────────────┘
       │ 3. Respuesta
       │    { token, user }
       │
       ▼
┌─────────────────────────────────────┐
│   Login.vue (Frontend)               │
│  - Guarda token en localStorage      │
│  - Guarda datos de usuario           │
│  - Redirige según rol                │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Peticiones Futuras                 │
│  - Header: Authorization: Bearer token│
│  - Middleware auth.js verifica token │
└─────────────────────────────────────┘
```

---

## Modelo de Usuario y Hash de Contraseñas

### Archivo: `backend/models/User.js`

Este archivo define la estructura de los usuarios y **protege automáticamente las contraseñas**.

#### Paso 1: Definir el Esquema

```javascript
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true  // ← Campo obligatorio
  },
  email: {
    type: String,
    required: true,
    unique: true  // ← No puede haber dos usuarios con el mismo email
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],  // ← Solo estos valores permitidos
    default: 'user'  // ← Si no se especifica, es 'user'
  },
  active: {
    type: Boolean,
    default: true  // ← Usuarios activos por defecto
  },
  createdAt: {
    type: Date,
    default: Date.now  // ← Fecha automática
  }
});
```

**¿Por qué estos campos?**
- `name`: Identificación del usuario
- `email`: Único, usado para login
- `password`: Hash, nunca texto plano
- `role`: Control de acceso (admin/user)
- `active`: Permite desactivar usuarios sin eliminarlos
- `createdAt`: Auditoría

#### Paso 2: Hook Pre-Save (Hash Automático)

```javascript
UserSchema.pre('save', async function(next) {
  // Este código se ejecuta ANTES de guardar el usuario
```

**¿Qué es un hook?**
Un hook es una función que se ejecuta automáticamente en un momento específico del ciclo de vida del documento.

**¿Por qué `pre('save')`?**
- Se ejecuta **antes** de guardar
- Garantiza que la contraseña siempre se hashea
- No puedes olvidarte de hashearla manualmente

```javascript
  if (!this.isModified('password')) {
    console.log('📝 Password no modificado, saltando hasheo');
    return next();
  }
```

**¿Qué hace esta línea?**
- `this.isModified('password')`: Verifica si el campo `password` fue modificado
- Si NO fue modificado (por ejemplo, solo cambiaste el nombre), NO hashea de nuevo
- **¿Por qué es importante?**: Si hasheas un hash, obtienes un hash diferente, y no podrías verificar la contraseña

**Ejemplo**:
```javascript
// Escenario 1: Crear nuevo usuario
const user = new User({ email: 'juan@empresa.com', password: '123456' });
await user.save(); // ← Se ejecuta pre('save'), hashea '123456'

// Escenario 2: Actualizar solo el nombre
user.name = 'Juan Pérez';
await user.save(); // ← NO se ejecuta hash (password no fue modificado)
```

```javascript
  try {
    console.log('🔐 Iniciando hasheo de password...');
    
    const salt = await bcrypt.genSalt(10);
```

**¿Qué es un salt?**
Un salt es un valor aleatorio que se agrega a la contraseña antes de hashearla.

**¿Por qué es necesario?**
Sin salt, dos usuarios con la misma contraseña tendrían el mismo hash:
```
Usuario 1: password = "123456" → hash = "abc123"
Usuario 2: password = "123456" → hash = "abc123"  ← ¡Mismo hash!
```

Con salt, cada hash es único:
```
Usuario 1: password = "123456" + salt1 → hash = "abc123"
Usuario 2: password = "123456" + salt2 → hash = "def456"  ← ¡Diferentes!
```

**¿Qué significa el número 10?**
- Es el número de "rounds" (rondas) de hasheo
- Más rounds = más lento = más seguro
- 10 es un buen balance entre seguridad y rendimiento
- Cada round duplica el tiempo: 10 rounds ≈ 100ms

```javascript
    this.password = await bcrypt.hash(this.password, salt);
```

**¿Qué hace `bcrypt.hash()`?**
1. Toma la contraseña en texto plano
2. Agrega el salt
3. Aplica el algoritmo bcrypt
4. Retorna el hash (60 caracteres)

**Ejemplo**:
```javascript
// Entrada
password = "miPassword123"
salt = "abc123..."

// Proceso interno (simplificado)
hash = bcrypt(password + salt, rounds=10)
// Resultado: "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890..."

// Guardado en BD
user.password = "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890..."
```

```javascript
    next();  // ← Continúa con el guardado
  } catch (error) {
    console.error('❌ Error al hashear password:', error);
    next(error);  // ← Si hay error, detiene el guardado
  }
});
```

#### Paso 3: Ocultar Contraseña en Respuestas

```javascript
UserSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password;  // ← Elimina password al convertir a JSON
    return ret;
  }
});
```

**¿Por qué es importante?**
Cuando conviertes un documento de MongoDB a JSON (para enviarlo al frontend), esta función se ejecuta automáticamente y elimina el campo `password`.

**Ejemplo**:
```javascript
// Sin toJSON transform
const user = await User.findById(id);
res.json(user);
// Respuesta: { _id: "...", name: "Juan", email: "...", password: "$2b$10$..." }
// ← ¡Password expuesto!

// Con toJSON transform
const user = await User.findById(id);
res.json(user);
// Respuesta: { _id: "...", name: "Juan", email: "..." }
// ← Password NO incluido
```

---

## Proceso de Login

### Archivo: `backend/routes/UserRoutes.js` - Ruta POST /login

Vamos línea por línea:

```javascript
router.post('/login', async (req, res) => {
```
**¿Qué hace?**: Define una ruta POST en `/login` que no requiere autenticación (es pública).

```javascript
  try {
    const { email, password } = req.body;
```
**¿Qué hace?**: Extrae `email` y `password` del cuerpo de la petición.

**Ejemplo de petición**:
```javascript
// Frontend envía:
fetch('http://localhost:3000/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'juan@empresa.com',
    password: 'miPassword123'
  })
});
```

```javascript
    const user = await UserSchema.findOne({ email });
```
**¿Qué hace?**: Busca un usuario en la base de datos con ese email.

**¿Por qué `findOne` y no `find`?**
- `findOne`: Retorna un documento o `null`
- `find`: Retorna un array (aunque sea uno solo)
- Como el email es único, solo puede haber uno

**Ejemplo**:
```javascript
// Si existe:
user = { _id: "...", email: "juan@empresa.com", password: "$2b$10$...", ... }

// Si NO existe:
user = null
```

```javascript
    if (!user) {
      console.log('❌ Login fallido - Usuario no encontrado');
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }
```
**¿Qué hace?**: Si no encuentra el usuario, retorna error 401 (No autorizado).

**¿Por qué mensaje genérico "Credenciales incorrectas"?**
- No revelas si el email existe o no
- Previene enumeración de usuarios
- Más seguro

```javascript
    if (!user.active) {
      console.log('❌ Login fallido - Usuario inactivo');
      return res.status(403).json({ message: 'Usuario inactivo. Contacte al administrador.' });
    }
```
**¿Qué hace?**: Verifica si el usuario está activo.

**¿Por qué verificar `active`?**
- Permite desactivar usuarios sin eliminarlos
- Útil para suspender cuentas temporalmente
- Mantiene historial de datos

```javascript
    const validPassword = await bcrypt.compare(password, user.password);
```
**¿Qué hace?**: Compara la contraseña en texto plano con el hash almacenado.

**¿Cómo funciona `bcrypt.compare()`?**
1. Toma la contraseña en texto plano: `"miPassword123"`
2. Toma el hash almacenado: `"$2b$10$abcdefghijklmnopqrstuvwxyz..."`
3. Extrae el salt del hash (bcrypt lo incluye en el hash)
4. Hashea la contraseña con ese salt
5. Compara el resultado con el hash almacenado

**Ejemplo**:
```javascript
// Usuario ingresa
password = "miPassword123"

// Hash almacenado en BD
user.password = "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890..."

// bcrypt.compare hace internamente:
salt = extraerSalt(user.password)  // "abc123..."
hashIngresado = bcrypt.hash("miPassword123", salt)
hashAlmacenado = user.password

// Compara
if (hashIngresado === hashAlmacenado) {
  return true  // ← Contraseña correcta
} else {
  return false  // ← Contraseña incorrecta
}
```

**¿Por qué es seguro?**
- No puedes revertir el hash a la contraseña original
- Incluso si alguien roba la BD, no puede obtener las contraseñas
- Solo puedes verificar si una contraseña es correcta

```javascript
    if (!validPassword) {
      console.log('❌ Login fallido - Contraseña incorrecta');
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }
```
**¿Qué hace?**: Si la contraseña no coincide, retorna error.

```javascript
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'tu_clave_secreta',
      { expiresIn: '24h' }
    );
```
**¿Qué hace?**: Genera un token JWT.

**Desglose de `jwt.sign()`**:

1. **Payload (primer parámetro)**: `{ userId: user._id }`
   - Datos que quieres incluir en el token
   - Solo incluye `userId` (mínimo necesario)
   - **NO incluyas datos sensibles** (email, password, etc.)

2. **Secret (segundo parámetro)**: `process.env.JWT_SECRET`
   - Clave secreta para firmar el token
   - Si alguien modifica el token, la firma no coincidirá
   - **Nunca compartas esta clave**

3. **Opciones (tercer parámetro)**: `{ expiresIn: '24h' }`
   - El token expira en 24 horas
   - Después de 24h, el usuario debe hacer login de nuevo

**Estructura de un JWT**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODM3YzI3NmE4NjkwNzIwOTNiYTk0OWMifQ.signature
│─────────────── Header ───────────────││─────── Payload ───────││── Signature ──│
```

**Header** (Base64):
```json
{
  "alg": "HS256",  // Algoritmo de hash
  "typ": "JWT"     // Tipo de token
}
```

**Payload** (Base64):
```json
{
  "userId": "6837c276a869072093ba949c",
  "iat": 1705507200,  // Issued at (fecha de emisión)
  "exp": 1705593600   // Expiration (fecha de expiración)
}
```

**Signature**:
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  JWT_SECRET
)
```

**¿Por qué JWT es seguro?**
- Si modificas el payload, la firma no coincidirá
- El servidor puede verificar que el token no fue alterado
- No necesitas almacenar tokens en el servidor (stateless)

```javascript
    console.log('✅ Login exitoso -', user.name);
```
**¿Qué hace?**: Registra el login exitoso en la consola del servidor.

```javascript
    res.json({
      token,
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        active: user.active
      }
    });
```
**¿Qué hace?**: Envía el token y datos del usuario al frontend.

**¿Por qué enviar datos del usuario?**
- El frontend necesita mostrar el nombre del usuario
- Evita hacer otra petición para obtener datos del usuario
- El token solo contiene `userId`, no todos los datos

```javascript
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});
```
**¿Qué hace?**: Captura cualquier error inesperado y retorna error 500.

---

## Tokens JWT

### ¿Qué es JWT?

JWT (JSON Web Token) es un estándar abierto (RFC 7519) para transmitir información de forma segura entre partes.

### ¿Por Qué JWT y No Sesiones Tradicionales?

#### Sesiones Tradicionales:
```javascript
// Servidor guarda sesión en memoria o BD
req.session.userId = user._id;
// Problema: Si tienes múltiples servidores, necesitas BD compartida
```

#### JWT (Stateless):
```javascript
// Token contiene toda la información
const token = jwt.sign({ userId: user._id }, SECRET);
// Cualquier servidor puede verificar el token sin consultar BD
```

**Ventajas de JWT**:
1. ✅ **Stateless**: No requiere almacenamiento en servidor
2. ✅ **Escalable**: Funciona con múltiples servidores
3. ✅ **Portable**: Funciona en web, móvil, etc.
4. ✅ **Estándar**: Ampliamente adoptado

### Verificación de Tokens

Cuando el frontend envía una petición, incluye el token:

```javascript
// Frontend
fetch('http://localhost:3000/api/users', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

El backend verifica el token en el middleware.

---

## Middleware de Autenticación

### Archivo: `backend/middleware/auth.js`

Este archivo se ejecuta **antes** de las rutas protegidas para verificar que el usuario está autenticado.

```javascript
module.exports = async (req, res, next) => {
```
**¿Qué hace?**: Exporta una función middleware.

**¿Qué es un middleware?**
Un middleware es una función que se ejecuta entre la petición y la respuesta. Puede:
- Modificar la petición (`req`)
- Modificar la respuesta (`res`)
- Terminar la petición (enviar respuesta)
- Continuar (`next()`)

```javascript
  const authHeader = req.headers['authorization'];
```
**¿Qué hace?**: Obtiene el header `Authorization` de la petición.

**Formato del header**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```javascript
  const token = authHeader && authHeader.split(' ')[1];
```
**¿Qué hace?**: Extrae el token del header.

**Desglose**:
- `authHeader.split(' ')`: Divide "Bearer token" en ["Bearer", "token"]
- `[1]`: Toma el segundo elemento (el token)

**Ejemplo**:
```javascript
authHeader = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
authHeader.split(' ') = ["Bearer", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."]
token = authHeader.split(' ')[1] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

```javascript
  if (!token) {
    return res.status(401).json({ message: 'No se proporcionó token de acceso' });
  }
```
**¿Qué hace?**: Si no hay token, retorna error 401.

```javascript
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta');
```
**¿Qué hace?**: Verifica y decodifica el token.

**¿Qué hace `jwt.verify()`?**
1. Verifica la firma del token
2. Verifica que no haya expirado
3. Retorna el payload decodificado

**Si el token fue modificado**:
```javascript
// Token original
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0In0.signature"

// Atacante modifica el payload
tokenModificado = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1Njc4In0.signature"
                                                      ↑ Cambió userId

// jwt.verify detecta que la firma no coincide
jwt.verify(tokenModificado, SECRET)
// Error: "invalid signature"
```

**Si el token expiró**:
```javascript
// Token expirado (más de 24 horas)
jwt.verify(tokenExpirado, SECRET)
// Error: "jwt expired"
```

```javascript
    const user = await User.findById(decoded.userId);
```
**¿Qué hace?**: Busca el usuario en la base de datos.

**¿Por qué buscar el usuario si ya tenemos el token?**
- Verificar que el usuario sigue existiendo
- Verificar que el usuario sigue activo
- Obtener datos actualizados del usuario

```javascript
    if (!user || !user.active) {
      return res.status(403).json({ message: 'Usuario inactivo o no encontrado' });
    }
```
**¿Qué hace?**: Verifica que el usuario existe y está activo.

**Escenarios**:
1. Usuario fue eliminado → `user = null`
2. Usuario fue desactivado → `user.active = false`

```javascript
    req.user = decoded;
```
**¿Qué hace?**: Agrega los datos del token a `req.user`.

**¿Por qué es útil?**
Las rutas pueden acceder a `req.user.userId` sin tener que decodificar el token de nuevo.

```javascript
    next();
```
**¿Qué hace?**: Continúa con la siguiente función (la ruta protegida).

```javascript
  } catch (err) {
    return res.status(403).json({ message: 'Token inválido' });
  }
};
```
**¿Qué hace?**: Si hay cualquier error (token inválido, expirado, etc.), retorna error 403.

### Uso del Middleware

```javascript
// Ruta protegida
router.get('/api/users', authenticateToken, async (req, res) => {
  // authenticateToken se ejecuta PRIMERO
  // Si pasa, continúa aquí
  // req.user.userId está disponible
  const users = await User.find();
  res.json(users);
});
```

**Flujo**:
1. Cliente envía petición con token
2. `authenticateToken` verifica el token
3. Si es válido, ejecuta `next()` → continúa a la ruta
4. Si es inválido, retorna error → NO ejecuta la ruta

---

## Almacenamiento en el Frontend

### Archivo: `frontend/vue-app/src/views/Login.vue`

#### Paso 1: Captura de Credenciales

```vue
<input 
  type="email" 
  id="email" 
  v-model="email" 
  placeholder="Tu correo electrónico"
  required
>
```

**¿Qué hace `v-model`?**
- Crea un binding bidireccional
- Cuando el usuario escribe, actualiza `this.email`
- Cuando cambias `this.email`, actualiza el input

**Ejemplo**:
```javascript
// Usuario escribe "juan@empresa.com"
// Automáticamente: this.email = "juan@empresa.com"
```

#### Paso 2: Envío de Credenciales

```javascript
async login() {
  const response = await fetch('http://localhost:3000/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: this.email,
      password: this.password
    })
  });
```

**¿Qué hace `fetch()`?**
- Hace una petición HTTP al servidor
- `method: 'POST'`: Método HTTP POST
- `headers`: Informa que envías JSON
- `body`: Datos en formato JSON

**¿Por qué `JSON.stringify()`?**
- `fetch` solo acepta strings en el body
- Convierte el objeto JavaScript a string JSON

```javascript
  const data = await response.json();
```
**¿Qué hace?**: Convierte la respuesta JSON a objeto JavaScript.

```javascript
  if (!response.ok) {
    alert(data.message || 'Error al iniciar sesión');
    return;
  }
```
**¿Qué hace?**: Si la respuesta no es exitosa (status 400, 401, 500, etc.), muestra error.

```javascript
  if (data.token && data.user) {
    localStorage.setItem('token', data.token);
```
**¿Qué hace?**: Guarda el token en `localStorage`.

**¿Qué es `localStorage`?**
- Almacenamiento persistente en el navegador
- Los datos persisten aunque cierres el navegador
- Específico del dominio (solo tu aplicación puede acceder)

**¿Por qué `localStorage` y no cookies?**
- Cookies se envían automáticamente en cada petición (más tráfico)
- `localStorage` es más simple de usar
- **Nota**: En producción, considera HttpOnly cookies para mayor seguridad

```javascript
    localStorage.setItem('user', JSON.stringify({
      _id: data.user.userId,
      name: data.user.name,
      role: data.user.role,
      email: data.user.email,
      active: data.user.active
    }));
```
**¿Qué hace?**: Guarda los datos del usuario en `localStorage`.

**¿Por qué `JSON.stringify()`?**
- `localStorage` solo acepta strings
- Convierte el objeto a string JSON

**¿Por qué guardar datos del usuario?**
- Evita hacer peticiones adicionales para obtener datos del usuario
- Permite mostrar el nombre del usuario inmediatamente

```javascript
    if (data.user.role === 'admin') {
      this.$router.push('/admin');
    } else {
      this.$router.push('/chat');
    }
```
**¿Qué hace?**: Redirige según el rol del usuario.

**¿Qué hace `$router.push()`?**
- Cambia la ruta de la aplicación
- Vue Router carga el componente correspondiente
- No recarga la página (SPA)

---

## Logout

### Archivo: `backend/routes/UserRoutes.js` - Ruta POST /logout

```javascript
router.post('/logout', authenticateToken, async (req, res) => {
```
**¿Qué hace?**: Define ruta de logout que requiere autenticación.

**¿Por qué requiere autenticación?**
- Necesitas saber qué usuario está haciendo logout
- Permite registrar el logout en logs

```javascript
  try {
    const user = await UserSchema.findById(req.user.userId);
    
    if (user) {
      console.log('🚪 Logout exitoso -', user.name);
    } else {
      console.log('⚠️ Logout - Usuario no encontrado en BD');
    }

    res.json({ message: 'Logout exitoso' });
```

**¿Qué hace?**: Registra el logout en la consola del servidor.

**¿Por qué registrar logout?**
- Auditoría: saber cuándo los usuarios cierran sesión
- Seguridad: detectar comportamientos sospechosos

### Frontend: Limpieza de Datos

```javascript
// En Chat.vue o Admin_app.vue
async logout() {
  // 1. Notificar al backend
  await fetch('http://localhost:3000/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  // 2. Limpiar localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  // 3. Redirigir a login
  this.$router.push('/login');
}
```

**¿Por qué limpiar `localStorage`?**
- Si no limpias, el token sigue disponible
- Cualquiera que use la computadora podría acceder
- Limpiar garantiza que la sesión terminó

---

## Resumen del Flujo Completo

### 1. Usuario ingresa credenciales
```javascript
// Frontend: Login.vue
email: "juan@empresa.com"
password: "miPassword123"
```

### 2. Frontend envía al backend
```javascript
POST http://localhost:3000/login
Body: { email: "juan@empresa.com", password: "miPassword123" }
```

### 3. Backend busca usuario
```javascript
// UserRoutes.js
const user = await UserSchema.findOne({ email: "juan@empresa.com" });
// user = { _id: "...", email: "...", password: "$2b$10$...", ... }
```

### 4. Backend verifica contraseña
```javascript
const validPassword = await bcrypt.compare("miPassword123", user.password);
// validPassword = true
```

### 5. Backend genera token
```javascript
const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '24h' });
// token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 6. Backend responde
```javascript
{
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  user: { userId: "...", name: "Juan", role: "user", ... }
}
```

### 7. Frontend guarda token
```javascript
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));
```

### 8. Frontend redirige
```javascript
this.$router.push('/chat'); // o '/admin' si es admin
```

### 9. Peticiones futuras
```javascript
// Frontend incluye token en header
fetch('http://localhost:3000/api/messages', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Backend verifica token
authenticateToken middleware → verifica token → permite acceso
```

---

## Conceptos Clave

### 1. Hash vs Encriptación

**Hash (bcrypt)**:
- ✅ Unidireccional (no se puede revertir)
- ✅ Determinístico (misma entrada = mismo hash, con salt)
- ✅ Usado para contraseñas
- ❌ No se puede deshashear

**Encriptación (AES-256)**:
- ✅ Bidireccional (se puede desencriptar)
- ✅ Usado para datos que necesitas leer después
- ✅ Requiere clave para desencriptar

### 2. Stateless vs Stateful

**Stateless (JWT)**:
- Token contiene toda la información
- No requiere almacenamiento en servidor
- Escalable

**Stateful (Sesiones)**:
- Servidor guarda sesión
- Requiere almacenamiento compartido
- Menos escalable

### 3. Middleware

**¿Qué es?**
Función que se ejecuta antes de las rutas.

**Ejemplo**:
```javascript
// Sin middleware
router.get('/ruta', (req, res) => {
  // Cualquiera puede acceder
});

// Con middleware
router.get('/ruta', authenticateToken, (req, res) => {
  // Solo usuarios autenticados pueden acceder
  // req.user.userId está disponible
});
```

---

## Preguntas Frecuentes

### ¿Por qué no guardar la contraseña en texto plano?

**Riesgo**: Si alguien accede a la base de datos, puede ver todas las contraseñas.

**Solución**: Hash con bcrypt. Aunque roben la BD, no pueden obtener las contraseñas.

### ¿Por qué JWT expira en 24 horas?

**Balance**: 
- Muy corto (15 min) → Usuario debe hacer login frecuentemente (molesto)
- Muy largo (30 días) → Si roban el token, es válido por mucho tiempo (inseguro)
- 24 horas → Balance razonable

### ¿Por qué verificar `user.active` en cada petición?

**Razón**: Si un admin desactiva un usuario, el token sigue siendo válido hasta que expire. Verificar `active` permite revocar acceso inmediatamente.

### ¿Es seguro guardar el token en localStorage?

**Riesgo**: Vulnerable a XSS (si hay código malicioso, puede leer localStorage).

**Mitigación actual**: Sanitización de datos en `localStorage`.

**Mejora futura**: HttpOnly cookies (no accesibles desde JavaScript).

---

## Próximos Pasos

Ahora que entiendes la autenticación, puedes continuar con:
- **Manual 03**: Chat en Tiempo Real (cómo funciona Socket.IO y la mensajería)

---

**Última actualización**: Enero 2025

**Versión**: 1.0

