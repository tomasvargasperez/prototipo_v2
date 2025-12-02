# Documentación de Middlewares

## 📋 Índice
1. [¿Qué es un Middleware?](#qué-es-un-middleware)
2. [Tipos de Middlewares en el Código](#tipos-de-middlewares-en-el-código)
3. [Middlewares Globales](#middlewares-globales)
4. [Middlewares de Ruta](#middlewares-de-ruta)
5. [Middlewares de Mongoose](#middlewares-de-mongoose)
6. [Resumen de Middlewares](#resumen-de-middlewares)
7. [Orden de Ejecución](#orden-de-ejecución)
8. [¿Por qué usar Middlewares?](#por-qué-usar-middlewares)

---

## ¿Qué es un Middleware?

Un **middleware** es una función que se ejecuta **entre** la petición HTTP y la respuesta. Puede:

- ✅ **Modificar la petición** (`req`)
- ✅ **Modificar la respuesta** (`res`)
- ✅ **Ejecutar código** (validaciones, logs, etc.)
- ✅ **Terminar el ciclo** (enviar respuesta o pasar al siguiente con `next()`)

### Estructura de un Middleware

```javascript
function middleware(req, res, next) {
  // 1. Hacer algo con req o res
  // 2. Llamar next() para continuar
  //    O enviar respuesta para terminar
  next(); // Pasa al siguiente middleware
}
```

---

## Tipos de Middlewares en el Código

En tu aplicación hay **3 tipos principales** de middlewares:

1. **Middlewares Globales** - Se aplican a TODAS las rutas
2. **Middlewares de Ruta** - Se aplican a rutas específicas
3. **Middlewares de Mongoose** - Se ejecutan automáticamente en operaciones de BD

---

## Middlewares Globales

Se aplican a **todas las rutas** automáticamente. Se definen en `backend/app.js`:

```javascript
// Middlewares
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
```

### a) CORS (Cross-Origin Resource Sharing)

**Ubicación**: `backend/app.js` línea 55

```javascript
app.use(cors());
```

**Función:**
- Permite peticiones desde otros orígenes (dominios diferentes)
- Ejemplo: Frontend en `localhost:5173` → Backend en `localhost:3000`

**Cuándo se ejecuta:**
- En **cada petición HTTP** antes de llegar a las rutas

**¿Qué pasa sin CORS?**
- El navegador bloquea peticiones entre dominios diferentes
- Error: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Ejemplo:**
```
Frontend (localhost:5173) → Petición → Backend (localhost:3000)
                                    ↓
                              CORS permite la petición
                                    ↓
                              Continúa a las rutas
```

---

### b) express.urlencoded()

**Ubicación**: `backend/app.js` línea 56

```javascript
app.use(express.urlencoded({ extended: true }));
```

**Función:**
- Parsea datos de formularios HTML (`application/x-www-form-urlencoded`)
- Convierte `name=Juan&email=test@test.com` → `{ name: "Juan", email: "test@test.com" }`

**Cuándo se ejecuta:**
- En peticiones con `Content-Type: application/x-www-form-urlencoded`

**Ejemplo:**
```html
<!-- Formulario HTML -->
<form method="POST" action="/api/users">
  <input name="name" value="Juan">
  <input name="email" value="test@test.com">
</form>
```

```javascript
// En el backend, req.body será:
req.body = { name: "Juan", email: "test@test.com" }
```

---

### c) express.json()

**Ubicación**: `backend/app.js` línea 57

```javascript
app.use(express.json());
```

**Función:**
- Parsea JSON del body de la petición
- Convierte JSON string → Objeto JavaScript

**Cuándo se ejecuta:**
- En peticiones con `Content-Type: application/json`

**Ejemplo:**
```javascript
// Frontend envía:
fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: "Juan", email: "test@test.com" })
})
```

```javascript
// En el backend, req.body será:
req.body = { name: "Juan", email: "test@test.com" }
```

**¿Qué pasa sin express.json()?**
- `req.body` sería `undefined`
- No podrías acceder a los datos enviados

---

### Flujo de Middlewares Globales

```
Request HTTP
    ↓
CORS → Permite/Rechaza petición
    ↓
express.urlencoded() → Parsea formularios (si aplica)
    ↓
express.json() → Parsea JSON (si aplica)
    ↓
Rutas (UserRoutes, MessageRoutes, etc.)
```

---

## Middlewares de Ruta

Se aplican a **rutas específicas** para protección y autorización.

### a) authenticateToken

**Ubicación**: `backend/middleware/auth.js`

**Código completo:**
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta');
    
    // Verificar si el usuario sigue activo
    const user = await User.findById(decoded.userId);
    if (!user || !user.active) {
      return res.status(403).json({ message: 'Usuario inactivo o no encontrado' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token inválido' });
  }
};
```

**Función:**
- Verifica que el usuario tenga un token JWT válido
- Verifica que el usuario esté activo en la base de datos
- Agrega `req.user` con los datos del token decodificado

**Cuándo se ejecuta:**
- En rutas protegidas que requieren autenticación

**Qué hace paso a paso:**
1. Extrae el token del header `Authorization: Bearer <token>`
2. Verifica la firma del token con `JWT_SECRET`
3. Consulta la base de datos para verificar que el usuario existe y está activo
4. Si todo es válido, agrega `req.user` y llama a `next()`
5. Si hay error, responde con 401 o 403

**Ejemplo de uso:**
```javascript
// backend/routes/UserRoutes.js
const authenticateToken = require('../middleware/auth');

router.get('/api/users', authenticateToken, async (req, res) => {
  // req.user está disponible aquí
  // Solo usuarios autenticados llegan a este código
  const userId = req.user.userId;
  // ...
});
```

**Rutas que lo usan:**
- `GET /api/users` - Obtener usuarios (admin)
- `POST /api/messages` - Crear mensaje
- `GET /api/messages/:channelId` - Obtener mensajes
- `POST /api/channels` - Crear canal
- `POST /api/announcements` - Crear anuncio
- Y muchas más...

---

### b) isAdmin

**Ubicación**: `backend/routes/UserRoutes.js` (y otros archivos de rutas)

**Código completo:**
```javascript
const isAdmin = async (req, res, next) => {
	try {
		const user = await UserSchema.findById(req.user.userId);
		if (user && user.role === 'admin') {
			next();
		} else {
			res.status(403).json({ message: 'Acceso denegado: se requieren privilegios de administrador' });
		}
	} catch (error) {
		res.status(500).json({ message: 'Error al verificar privilegios de administrador' });
	}
};
```

**Función:**
- Verifica que el usuario tenga el rol `admin`
- Debe usarse **después** de `authenticateToken`

**Cuándo se ejecuta:**
- En rutas que solo administradores pueden acceder

**Qué hace paso a paso:**
1. Busca el usuario en la base de datos usando `req.user.userId`
2. Verifica si `user.role === 'admin'`
3. Si es admin, llama a `next()` para continuar
4. Si no es admin, responde con 403 (Forbidden)

**Ejemplo de uso:**
```javascript
// backend/routes/UserRoutes.js
router.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
  // Solo administradores llegan aquí
  const users = await UserSchema.find();
  res.json(users);
});
```

**Rutas que lo usan:**
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `PATCH /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario
- `GET /api/admin/dashboard` - Dashboard de admin
- Y más rutas administrativas...

---

### c) checkChannelAccess

**Ubicación**: `backend/routes/MessageRoutes.js`

**Código completo:**
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

**Función:**
- Verifica que el usuario tenga acceso a un canal específico
- Debe usarse **después** de `authenticateToken`

**Cuándo se ejecuta:**
- En rutas que requieren acceso a un canal específico

**Qué hace paso a paso:**
1. Busca el canal en la base de datos usando `req.params.channelId`
2. Si el usuario es admin, permite acceso automáticamente
3. Si el canal es público (`channel.isPublic === true`), permite acceso
4. Si el usuario está en `channel.allowedUsers`, permite acceso
5. Si ninguna condición se cumple, responde con 403

**Ejemplo de uso:**
```javascript
// backend/routes/MessageRoutes.js
router.get('/api/messages/:channelId', authenticateToken, checkChannelAccess, async (req, res) => {
  // Solo usuarios con acceso al canal llegan aquí
  const messages = await Message.find({ channel: req.params.channelId });
  res.json(messages);
});
```

**Rutas que lo usan:**
- `GET /api/messages/:channelId` - Obtener mensajes de un canal

---

### d) validateToken (UserController)

**Ubicación**: `backend/controllers/UserController.js`

**Código completo:**
```javascript
async validateToken(req, res, next) {
    try {
        // Verificar el token del header
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ status: "error", message: "Token no proporcionado" });
        }
        
        // Verificar y decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ status: "error", message: "Token inválido" });
    }
}
```

**Función:**
- Similar a `authenticateToken`, pero **NO verifica** si el usuario está activo
- Solo verifica que el token sea válido

**Diferencia con `authenticateToken`:**
- `authenticateToken`: Verifica token + consulta BD para verificar usuario activo
- `validateToken`: Solo verifica token (más rápido, menos seguro)

**Cuándo se ejecuta:**
- En rutas que usan `userController.validateToken`

**Ejemplo de uso:**
```javascript
// backend/routes/UserRoutes.js
router.get('/user', userController.validateToken, async (req, res) => {
  // req.user está disponible
  const users = await UserSchema.find();
  res.json(users);
});
```

**Rutas que lo usan:**
- `GET /user` - Obtener todos los usuarios

---

## Middlewares de Mongoose

Se ejecutan **automáticamente** en operaciones de base de datos.

### pre('save') - Hash de Contraseña

**Ubicación**: `backend/models/User.js`

**Código completo:**
```javascript
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    console.log('📝 Password no modificado, saltando hasheo');
    return next();
  }
  
  try {
    console.log('🔐 Iniciando hasheo de password...');
    console.log('Password original (length):', this.password.length);
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    console.log('✅ Password hasheado exitosamente');
    console.log('Password hasheado (length):', this.password.length);
    next();
  } catch (error) {
    console.error('❌ Error al hashear password:', error);
    next(error);
  }
});
```

**Función:**
- Hashea automáticamente la contraseña antes de guardar el usuario
- Usa bcrypt con salt rounds = 10

**Cuándo se ejecuta:**
- Antes de `save()` o `create()` en el modelo User
- Solo si el campo `password` fue modificado

**Qué hace paso a paso:**
1. Verifica si `password` fue modificado
2. Si no fue modificado, salta el hasheo (evita re-hashear)
3. Genera un salt aleatorio
4. Hashea la contraseña con bcrypt
5. Reemplaza `this.password` con el hash
6. Continúa con el guardado

**Ejemplo:**
```javascript
// Crear nuevo usuario
const user = new User({
  email: "test@test.com",
  password: "123456" // Contraseña en texto plano
});

await user.save(); // ← Aquí se ejecuta el middleware pre('save')
// La contraseña se hashea automáticamente antes de guardar

// user.password ahora es: "$2b$10$abcdefghijklmnopqrstuv..."
```

**¿Por qué es importante?**
- Las contraseñas **nunca** se guardan en texto plano
- Si alguien roba la base de datos, no puede ver las contraseñas
- Solo se puede verificar si una contraseña es correcta (no se puede revertir)

---

## Resumen de Middlewares

| Tipo | Ubicación | Función | Cuándo se ejecuta |
|------|-----------|---------|-------------------|
| **CORS** | `app.js` línea 55 | Permite peticiones cross-origin | Todas las peticiones |
| **express.json()** | `app.js` línea 57 | Parsea JSON del body | Peticiones con JSON |
| **express.urlencoded()** | `app.js` línea 56 | Parsea formularios HTML | Peticiones con formularios |
| **authenticateToken** | `middleware/auth.js` | Verifica JWT y usuario activo | Rutas protegidas |
| **isAdmin** | `UserRoutes.js`, etc. | Verifica rol admin | Rutas de administración |
| **checkChannelAccess** | `MessageRoutes.js` | Verifica acceso a canal | Rutas de mensajes |
| **validateToken** | `UserController.js` | Verifica JWT (sin BD) | Rutas específicas |
| **pre('save')** | `models/User.js` | Hashea contraseña | Antes de guardar usuario |

---

## Orden de Ejecución

### Ejemplo con múltiples middlewares:

```javascript
router.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
  // Código de la ruta
});
```

### Flujo completo:

```
1. Request HTTP llega
   ↓
2. Middlewares Globales (app.js):
   - CORS → permite petición
   - express.json() → parsea body si hay JSON
   ↓
3. Router encuentra la ruta
   ↓
4. authenticateToken:
   - Extrae token del header
   - Verifica firma del token
   - Consulta BD: ¿usuario existe y está activo?
   - Agrega req.user = { userId: "...", email: "..." }
   ↓
5. isAdmin:
   - Consulta BD: ¿user.role === 'admin'?
   - Si es admin → next()
   - Si no es admin → responde 403
   ↓
6. Handler de la ruta:
   - Ejecuta el código
   - Envía respuesta JSON
```

### Diagrama visual:

```
┌─────────────────────────────────────────┐
│  Request HTTP                           │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  Middlewares Globales (app.js)         │
│  ┌──────────────────────────────────┐  │
│  │  CORS                            │  │
│  └──────────────┬───────────────────┘  │
│                 ↓                      │
│  ┌──────────────────────────────────┐  │
│  │  express.json()                  │  │
│  └──────────────┬───────────────────┘  │
└─────────────────┼──────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Router: GET /api/users                 │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  authenticateToken                     │
│  - Verifica token                      │
│  - Verifica usuario activo             │
│  - Agrega req.user                     │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  isAdmin                               │
│  - Verifica role === 'admin'           │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  Handler de la ruta                     │
│  - Ejecuta código                      │
│  - Envía respuesta                     │
└─────────────────────────────────────────┘
```

---

## ¿Por qué usar Middlewares?

### 1. ✅ Reutilización
- Un middleware puede usarse en múltiples rutas
- Ejemplo: `authenticateToken` se usa en 20+ rutas diferentes

### 2. ✅ Separación de Responsabilidades
- La lógica de autenticación está separada de la lógica de negocio
- Fácil de mantener y testear

### 3. ✅ Mantenibilidad
- Si cambias la lógica de autenticación, solo cambias un archivo
- No necesitas modificar cada ruta individualmente

### 4. ✅ Seguridad
- Validaciones centralizadas
- Fácil agregar nuevas validaciones

### 5. ✅ Orden
- Control del flujo de ejecución
- Puedes encadenar múltiples middlewares

### 6. ✅ DRY (Don't Repeat Yourself)
- No repites código de validación en cada ruta
- Un solo lugar para la lógica común

---

## Ejemplos Prácticos

### Ejemplo 1: Ruta pública (sin middleware)

```javascript
router.post('/login', async (req, res) => {
  // No necesita autenticación
  // Cualquiera puede intentar hacer login
});
```

### Ejemplo 2: Ruta protegida (con authenticateToken)

```javascript
router.get('/api/messages', authenticateToken, async (req, res) => {
  // Solo usuarios autenticados pueden acceder
  // req.user está disponible
});
```

### Ejemplo 3: Ruta de admin (con authenticateToken + isAdmin)

```javascript
router.delete('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
  // Solo administradores autenticados pueden acceder
  // req.user está disponible
});
```

### Ejemplo 4: Ruta con acceso a canal (múltiples middlewares)

```javascript
router.get('/api/messages/:channelId', 
  authenticateToken,      // 1. Verifica autenticación
  checkChannelAccess,     // 2. Verifica acceso al canal
  async (req, res) => {
    // Solo usuarios autenticados con acceso al canal llegan aquí
  }
);
```

---

## Buenas Prácticas

### ✅ DO (Hacer)

1. **Usar middlewares para validaciones comunes**
   ```javascript
   // ✅ Bien: Middleware reutilizable
   router.get('/api/users', authenticateToken, handler);
   router.get('/api/messages', authenticateToken, handler);
   ```

2. **Encadenar middlewares en orden lógico**
   ```javascript
   // ✅ Bien: Primero autenticación, luego autorización
   router.get('/api/users', authenticateToken, isAdmin, handler);
   ```

3. **Centralizar middlewares comunes**
   ```javascript
   // ✅ Bien: Un solo archivo para authenticateToken
   const authenticateToken = require('../middleware/auth');
   ```

### ❌ DON'T (No hacer)

1. **Duplicar lógica de middleware en cada ruta**
   ```javascript
   // ❌ Mal: Lógica duplicada
   router.get('/api/users', async (req, res) => {
     const token = req.headers.authorization?.split(' ')[1];
     // ... verificar token ...
   });
   ```

2. **Olvidar llamar next()**
   ```javascript
   // ❌ Mal: No llama next(), la petición se queda colgada
   function middleware(req, res, next) {
     if (condition) {
       return res.status(401).json({ message: 'Error' });
     }
     // Falta next() aquí
   }
   ```

3. **Usar middlewares en orden incorrecto**
   ```javascript
   // ❌ Mal: isAdmin antes de authenticateToken
   // isAdmin necesita req.user que lo agrega authenticateToken
   router.get('/api/users', isAdmin, authenticateToken, handler);
   ```

---

## Resumen Final

Los middlewares son una parte fundamental de Express.js que permiten:

- 🔒 **Seguridad**: Autenticación y autorización
- 🔄 **Reutilización**: Lógica común en un solo lugar
- 🧹 **Limpieza**: Separación de responsabilidades
- 📈 **Escalabilidad**: Fácil agregar nuevas validaciones
- 🎯 **Control**: Orden de ejecución predecible

**Tipos en tu aplicación:**
- **3 middlewares globales** (CORS, JSON parser, URL encoded)
- **4 middlewares de ruta** (authenticateToken, isAdmin, checkChannelAccess, validateToken)
- **1 middleware de Mongoose** (pre-save para hashear contraseñas)

---

**Última actualización**: Documentación completa de middlewares del sistema




