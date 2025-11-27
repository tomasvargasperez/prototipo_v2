# Arquitectura del Sistema - Después de la Refactorización

## 📋 Índice
1. [Patrón Arquitectónico](#patrón-arquitectónico)
2. [Diagrama de Arquitectura](#diagrama-de-arquitectura)
3. [Flujo Completo del Login](#flujo-completo-del-login)
4. [Separación de Responsabilidades](#separación-de-responsabilidades)
5. [Ventajas de la Arquitectura](#ventajas-de-la-arquitectura)
6. [Comparación: Antes vs Después](#comparación-antes-vs-después)

---

## Patrón Arquitectónico

### MVC (Model-View-Controller)

La aplicación sigue el patrón **MVC (Model-View-Controller)** con una separación clara de responsabilidades:

- **Model**: Interacción con la base de datos (MongoDB)
- **View**: Frontend (Vue.js) - Presentación
- **Controller**: Lógica de negocio y validaciones

---

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vue.js)                        │
│  Login.vue → POST /login → Recibe { token, user }           │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP Request
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Express)                       │
│                      app.js                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Middlewares Globales:                               │  │
│  │  - CORS                                              │  │
│  │  - express.json()                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                        │                                     │
│                        ↓                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Rutas Registradas:                                  │  │
│  │  app.use('/', userRoutes)  ← POST /login aquí       │  │
│  │  app.use('/api/users', userRoutes)                  │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│              CAPA DE RUTAS (UserRoutes.js)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  router.post('/login', async (req, res) => {        │  │
│  │    const result = await userController.login(...)    │  │
│  │    // Convierte resultado a HTTP response            │  │
│  │  })                                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│  Responsabilidades:                                         │
│  ✓ Recibe HTTP request (req, res)                          │
│  ✓ Extrae datos del body (email, password)                │
│  ✓ Llama al controlador                                    │
│  ✓ Convierte respuesta a códigos HTTP (401, 403, 500)     │
│  ✓ Envía JSON response                                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│         CAPA DE CONTROLADORES (UserController.js)           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  class UserController {                              │  │
│  │    async login(email, password) {                     │  │
│  │      // 1. Buscar usuario                             │  │
│  │      // 2. Verificar activo                          │  │
│  │      // 3. Validar contraseña                        │  │
│  │      // 4. Generar token JWT                         │  │
│  │      // 5. Retornar { status, token, user }          │  │
│  │    }                                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│  Responsabilidades:                                         │
│  ✓ Lógica de negocio (autenticación)                       │
│  ✓ Validaciones de negocio                                  │
│  ✓ Generación de tokens                                     │
│  ✓ Retorna objetos JavaScript (no HTTP)                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│            CAPA DE MODELOS (models/User.js)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  User.findOne({ email })                             │  │
│  │  User.findById(id)                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│  Responsabilidades:                                         │
│  ✓ Interacción con MongoDB                                  │
│  ✓ Esquemas y validaciones                                  │
│  ✓ Middlewares de Mongoose (pre-save, etc.)                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                    MONGODB                                 │
│              Base de datos NoSQL                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Flujo Completo del Login

### 1. Frontend → Backend

```javascript
// frontend/vue-app/src/views/Login.vue
POST http://localhost:3000/login
Body: { email: "user@example.com", password: "123456" }
```

### 2. Backend: app.js

```javascript
// Registra las rutas
app.use('/', userRoutes);  // POST /login está aquí
```

### 3. Router: UserRoutes.js

**Archivo**: `backend/routes/UserRoutes.js`

```javascript
// Ruta de login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Usar el método login del controlador
        const result = await userController.login(email, password);

        // Convertir respuesta del controlador a HTTP response
        if (result.status === 'success') {
            res.json({
                token: result.token,
                user: result.user
            });
        } else {
            // Manejar diferentes tipos de errores con códigos HTTP apropiados
            if (result.errorType === 'USER_INACTIVE') {
                return res.status(403).json({ message: result.message });
            } else if (result.errorType === 'USER_NOT_FOUND' || result.errorType === 'INVALID_PASSWORD') {
                return res.status(401).json({ message: result.message });
            } else {
                return res.status(500).json({ message: result.message });
            }
        }
    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});
```

**Responsabilidades del Router:**
- ✅ Recibe el HTTP request (`req, res`)
- ✅ Extrae datos del body (`email, password`)
- ✅ Llama al controlador (`userController.login()`)
- ✅ Convierte la respuesta del controlador a códigos HTTP apropiados
- ✅ Envía la respuesta JSON al frontend

### 4. Controller: UserController.js

**Archivo**: `backend/controllers/UserController.js`

```javascript
// método logeo usuario mediante correo y password
async login(email, password) { 
    try { 
        // 1. Buscar al usuario por correo electrónico 
        const user = await User.findOne({ email }); 
        if (!user) {
            console.log('❌ Login fallido - Usuario no encontrado');
            return { 
                status: "error", 
                message: "Credenciales incorrectas",
                errorType: "USER_NOT_FOUND"
            }; 
        }   
        
        // 2. Verificar si el usuario está activo
        if (!user.active) {
            console.log('❌ Login fallido - Usuario inactivo');
            return { 
                status: "error", 
                message: "Usuario inactivo. Contacte al administrador.",
                errorType: "USER_INACTIVE"
            };
        }
        
        // 3. Comparar la contraseña proporcionada con la contraseña almacenada
        const passwordMatch = await bcrypt.compare(password, user.password); 
        if (!passwordMatch) { 
            console.log('❌ Login fallido - Contraseña incorrecta');
            return { 
                status: "error", 
                message: "Credenciales incorrectas",
                errorType: "INVALID_PASSWORD"
            }; 
        } 
        
        // 4. Generar un token JWT para el usuario 
        const token = jwt.sign(
            { userId: user._id }, 
            process.env.JWT_SECRET || 'tu_clave_secreta', 
            { expiresIn: '24h' }
        ); 
        
        console.log('✅ Login exitoso -', user.name);
        
        // 5. Retornar resultado exitoso
        return { 
            status: "success", 
            token: token,
            user: {
                userId: user._id,
                name: user.name,
                email: user.email,
                role: user.role || 'user',
                active: user.active
            }
        };		  
    } catch (error) { 
        console.error('❌ Error en login:', error);
        return { 
            status: "error", 
            message: "Error en el servidor",
            errorType: "SERVER_ERROR"
        };
    } 
}
```

**Responsabilidades del Controller:**
- ✅ Contiene toda la lógica de negocio de autenticación
- ✅ Valida credenciales (usuario existe, contraseña correcta)
- ✅ Verifica estado del usuario (activo/inactivo)
- ✅ Genera tokens JWT
- ✅ Retorna objetos JavaScript (no respuestas HTTP)
- ✅ Maneja errores y los categoriza

### 5. Model → MongoDB

```javascript
// models/User.js
User.findOne({ email })  // Consulta a MongoDB
```

**Responsabilidades del Model:**
- ✅ Define el esquema de datos
- ✅ Interactúa con MongoDB
- ✅ Aplica validaciones de Mongoose
- ✅ Ejecuta middlewares (pre-save para hashear contraseñas)

### 6. Respuesta: Controller → Router → Frontend

```javascript
// Controller retorna:
{ 
    status: "success", 
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", 
    user: {
        userId: "...",
        name: "...",
        email: "...",
        role: "user",
        active: true
    }
}

// Router convierte a HTTP:
res.json({ token: "...", user: {...} })  // Status 200

// Frontend recibe:
{ token: "...", user: {...} }
```

---

## Separación de Responsabilidades

| Capa | Responsabilidad | Ejemplo | No Debe Hacer |
|------|----------------|---------|---------------|
| **Router** | HTTP: recibe requests, envía responses, códigos de estado | `res.status(401).json(...)` | Lógica de negocio, consultas directas a BD |
| **Controller** | Lógica de negocio: validaciones, reglas, transformaciones | `login()`, `validateToken()` | Enviar respuestas HTTP directamente, consultas complejas |
| **Model** | Datos: consultas a BD, esquemas, validaciones de datos | `User.findOne()`, `User.findById()` | Lógica de negocio, autenticación |
| **Middleware** | Autenticación/autorización: verificación de tokens | `authenticateToken`, `isAdmin` | Lógica de negocio compleja |

### Ejemplo de Flujo Correcto:

```
1. Router recibe POST /login
   ↓
2. Router extrae email, password del body
   ↓
3. Router llama a userController.login(email, password)
   ↓
4. Controller busca usuario con User.findOne()
   ↓
5. Controller valida contraseña con bcrypt
   ↓
6. Controller genera token JWT
   ↓
7. Controller retorna { status, token, user }
   ↓
8. Router convierte a HTTP response
   ↓
9. Router envía JSON al frontend
```

---

## Ventajas de la Arquitectura

### 1. ✅ Separación Clara de Responsabilidades
- Cada capa tiene un propósito específico
- Fácil de entender y mantener
- Cambios en una capa no afectan directamente a otras

### 2. ✅ Reutilizable
- El método `login()` del controlador puede ser usado desde:
  - Rutas HTTP
  - Scripts de administración
  - Tests unitarios
  - Otros controladores

### 3. ✅ Testeable
- Puedes probar el controlador sin necesidad de HTTP
- Tests unitarios más simples
- Mocks más fáciles de implementar

### 4. ✅ Mantenible
- Cambios en la lógica de negocio solo afectan al controlador
- Cambios en las rutas HTTP solo afectan al router
- Fácil de localizar y corregir bugs

### 5. ✅ Escalable
- Fácil agregar nuevas rutas que usen el mismo controlador
- Fácil agregar nuevos métodos al controlador
- Estructura clara para crecer

### 6. ✅ Consistente
- Un solo lugar donde se genera el token (24h)
- Un solo lugar donde se valida el login
- Comportamiento predecible

---

## Comparación: Antes vs Después

### ❌ Antes (Duplicado)

```
┌─────────────────────────────────────┐
│         UserRoutes.js                │
│  router.post('/login', ...) {       │
│    // 46 líneas de lógica inline    │
│    // - Buscar usuario              │
│    // - Validar contraseña         │
│    // - Verificar activo           │
│    // - Generar token              │
│    // - Responder HTTP             │
│  }                                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│      UserController.js               │
│  async login() {                    │
│    // Método NO usado               │
│    // Token de 1h (diferente)      │
│  }                                  │
└─────────────────────────────────────┘
```

**Problemas:**
- ❌ Lógica duplicada en dos lugares
- ❌ Token con duración diferente (1h vs 24h)
- ❌ Difícil de mantener (cambios en dos lugares)
- ❌ No reutilizable
- ❌ Inconsistencia en el código

### ✅ Después (Refactorizado)

```
┌─────────────────────────────────────┐
│         UserRoutes.js                │
│  router.post('/login', ...) {       │
│    const result = await             │
│      userController.login(...)      │
│    // Convierte a HTTP response    │
│    // 22 líneas (más limpio)       │
│  }                                  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│      UserController.js               │
│  async login(email, password) {    │
│    // Lógica completa aquí          │
│    // Token de 24h (unificado)     │
│    // 63 líneas (bien organizado) │
│    return { status, token, user }   │
│  }                                  │
└─────────────────────────────────────┘
```

**Beneficios:**
- ✅ Una sola implementación de login
- ✅ Token unificado a 24 horas
- ✅ Fácil de mantener (un solo lugar)
- ✅ Reutilizable desde cualquier lugar
- ✅ Código consistente y organizado

---

## Resumen

La arquitectura actual sigue el patrón **MVC estándar** con una separación clara de responsabilidades:

1. **Router** (`UserRoutes.js`): Maneja HTTP, convierte respuestas
2. **Controller** (`UserController.js`): Contiene la lógica de negocio
3. **Model** (`models/User.js`): Interactúa con MongoDB
4. **Middleware** (`middleware/auth.js`): Autenticación y autorización

Esta estructura hace el código más:
- 🎯 **Mantenible**: Cambios localizados
- 🔄 **Reutilizable**: Lógica compartida
- 🧪 **Testeable**: Fácil de probar
- 📈 **Escalable**: Fácil de crecer
- ✅ **Consistente**: Comportamiento predecible

---

**Última actualización**: Después de la refactorización del login (unificación de UserController y UserRoutes)

