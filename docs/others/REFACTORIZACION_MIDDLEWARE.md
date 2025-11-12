# Refactorización del Middleware de Autenticación

## 📋 Resumen

Este documento explica la refactorización del middleware de autenticación para eliminar código duplicado y centralizar la lógica de autenticación.

## 🎯 Objetivo

- **Eliminar código duplicado**: El middleware `authenticateToken` estaba definido en 6 archivos diferentes
- **Centralizar la lógica**: Un solo lugar para mantener y actualizar el middleware
- **Mejorar consistencia**: Todos los archivos usan la misma lógica de autenticación

## 📊 Comparación: Antes vs Después

### Estado Actual (ANTES)

| Archivo | Middleware Local | Rutas | Funcionalidad Específica |
|---------|-----------------|-------|-------------------------|
| `UserRoutes.js` | ✅ `authenticateToken` (líneas 11-33) | 10 rutas | Gestión de usuarios, login |
| `MessageRoutes.js` | ✅ `authenticateToken` (líneas 10-25) | 2 rutas | Mensajes, `checkChannelAccess` |
| `DashboardRoutes.js` | ✅ `authenticateToken` (líneas 9-24) | 1 ruta | Dashboard, `isAdmin` |
| `ChannelRoutes.js` | ✅ `authenticateToken` (líneas 9-24) | 5 rutas | Canales, `isAdmin` |
| `AnnouncementRoutes.js` | ✅ `authenticateToken` (líneas 8-23) | 3 rutas | Anuncios, `isAdmin` |
| `SuggestionRoutes.js` | ✅ `authenticateToken` (líneas 10-25) | 3 rutas | Sugerencias, `isAdmin` |
| `phoneBookRoutes.js` | ❌ Ya usa centralizado | 2 rutas | Directorio telefónico |

### Estado Deseado (DESPUÉS)

| Archivo | Middleware Centralizado | Rutas | Funcionalidad Específica |
|---------|------------------------|-------|-------------------------|
| `UserRoutes.js` | ✅ Importa desde `../middleware/auth` | 11 rutas (+ `/logout`) | Gestión de usuarios, login, logout |
| `MessageRoutes.js` | ✅ Importa desde `../middleware/auth` | 2 rutas | Mensajes, `checkChannelAccess` |
| `DashboardRoutes.js` | ✅ Importa desde `../middleware/auth` | 1 ruta | Dashboard, `isAdmin` |
| `ChannelRoutes.js` | ✅ Importa desde `../middleware/auth` | 5 rutas | Canales, `isAdmin` |
| `AnnouncementRoutes.js` | ✅ Importa desde `../middleware/auth` | 3 rutas | Anuncios, `isAdmin` |
| `SuggestionRoutes.js` | ✅ Importa desde `../middleware/auth` | 3 rutas | Sugerencias, `isAdmin` |
| `phoneBookRoutes.js` | ✅ Ya usa centralizado | 2 rutas | Directorio telefónico |

## 🔄 Cambios por Archivo

### 1. `backend/middleware/auth.js`

**ANTES:**
```javascript
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Solo verifica el token
  // NO verifica si el usuario está activo
};
```

**DESPUÉS:**
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  // Verifica el token
  // VERIFICA si el usuario está activo
  // Consulta la base de datos
};
```

### 2. `backend/routes/UserRoutes.js`

**Cambios:**
- ❌ Eliminar: Middleware local `authenticateToken` (líneas 11-33)
- ✅ Agregar: `const authenticateToken = require('../middleware/auth');`
- ✅ Agregar: Nueva ruta `POST /logout`

**Rutas que se mantienen:**
- `GET /api/users` - Obtener todos los usuarios (admin)
- `GET /user` - Obtener todos los usuarios
- `GET /user/:id` - Obtener usuario por ID
- `GET /user/email/:email` - Obtener usuario por email
- `POST /user` - Crear usuario
- `PATCH /user/:id` - Actualizar usuario
- `DELETE /user/:id` - Eliminar usuario
- `POST /login` - Iniciar sesión
- `POST /logout` - **NUEVA** - Cerrar sesión
- `PATCH /api/users/:id` - Actualizar usuario (admin)
- `DELETE /api/users/:id` - Eliminar usuario (admin)
- `POST /api/users` - Crear usuario (admin)
- `GET /api/check-status` - Verificar estado del usuario

### 3. `backend/routes/MessageRoutes.js`

**Cambios:**
- ❌ Eliminar: Middleware local `authenticateToken` (líneas 10-25)
- ✅ Agregar: `const authenticateToken = require('../middleware/auth');`
- ✅ Mantener: `checkChannelAccess` (específico de mensajes, NO se elimina)

**Rutas que se mantienen:**
- `GET /api/messages/:channelId` - Obtener mensajes de un canal
- `POST /api/messages` - Crear nuevo mensaje

### 4. `backend/routes/DashboardRoutes.js`

**Cambios:**
- ❌ Eliminar: Middleware local `authenticateToken` (líneas 9-24)
- ✅ Agregar: `const authenticateToken = require('../middleware/auth');`
- ✅ Mantener: `isAdmin` (específico del dashboard, NO se elimina)

**Rutas que se mantienen:**
- `GET /dashboard` - Obtener datos del dashboard (admin)

### 5. `backend/routes/ChannelRoutes.js`

**Cambios:**
- ❌ Eliminar: Middleware local `authenticateToken` (líneas 9-24)
- ✅ Agregar: `const authenticateToken = require('../middleware/auth');`
- ✅ Mantener: `isAdmin` (específico de canales, NO se elimina)

**Rutas que se mantienen:**
- `GET /all` - Obtener todos los canales (admin)
- `GET /` - Obtener canales disponibles para un usuario
- `POST /` - Crear nuevo canal (admin)
- `PUT /:id` - Actualizar canal (admin)
- `DELETE /:id` - Eliminar canal (admin)

### 6. `backend/routes/AnnouncementRoutes.js`

**Cambios:**
- ❌ Eliminar: Middleware local `authenticateToken` (líneas 8-23)
- ✅ Agregar: `const authenticateToken = require('../middleware/auth');`
- ✅ Mantener: `isAdmin` (específico de anuncios, NO se elimina)

**Rutas que se mantienen:**
- `GET /` - Obtener todos los anuncios activos
- `POST /` - Crear nuevo anuncio (admin)
- `DELETE /:id` - Eliminar anuncio (admin)

### 7. `backend/routes/SuggestionRoutes.js`

**Cambios:**
- ❌ Eliminar: Middleware local `authenticateToken` (líneas 10-25)
- ✅ Agregar: `const authenticateToken = require('../middleware/auth');`
- ✅ Mantener: `isAdmin` (específico de sugerencias, NO se elimina)

**Rutas que se mantienen:**
- `POST /` - Crear nueva sugerencia
- `GET /` - Obtener todas las sugerencias (admin)
- `PUT /:id/status` - Actualizar estado de sugerencia (admin)

### 8. `backend/routes/phoneBookRoutes.js`

**Cambios:**
- ✅ Ya usa el middleware centralizado (no requiere cambios)
- ✅ Funcionará correctamente con la versión mejorada

**Rutas que se mantienen:**
- `GET /` - Obtener todo el directorio
- `GET /search` - Buscar en el directorio

## ✅ Middlewares que NO se Eliminan

Los siguientes middlewares son **específicos** de cada módulo y **NO se eliminan**:

1. **`checkChannelAccess`** en `MessageRoutes.js` - Verifica acceso a canales
2. **`isAdmin`** en `DashboardRoutes.js` - Verifica privilegios de administrador
3. **`isAdmin`** en `ChannelRoutes.js` - Verifica privilegios de administrador
4. **`isAdmin`** en `AnnouncementRoutes.js` - Verifica privilegios de administrador
5. **`isAdmin`** en `SuggestionRoutes.js` - Verifica privilegios de administrador
6. **`validateToken`** en `UserController.js` - Método del controlador (diferente uso)

## 🎯 Beneficios de la Refactorización

1. **Código más limpio**: Eliminamos ~150 líneas de código duplicado
2. **Mantenimiento más fácil**: Un solo lugar para actualizar la lógica de autenticación
3. **Consistencia**: Todos los archivos usan la misma lógica de autenticación
4. **Verificación de usuario activo**: Todos los endpoints ahora verifican si el usuario está activo
5. **Mejor seguridad**: Lógica de autenticación centralizada y consistente

## 📝 Notas Importantes

- **NO se pierde funcionalidad**: Todas las rutas y lógicas específicas se mantienen
- **Solo se elimina código duplicado**: El middleware `authenticateToken` se centraliza
- **Los middlewares específicos se mantienen**: `isAdmin`, `checkChannelAccess`, etc.
- **Las rutas no cambian**: Todas las rutas existentes funcionan igual
- **Nueva funcionalidad**: Se agrega la ruta `POST /logout` en `UserRoutes.js`

## 🚀 Próximos Pasos

1. Mejorar `backend/middleware/auth.js` para verificar usuario activo
2. Reemplazar middleware local en todos los archivos de rutas
3. Implementar ruta `POST /logout` en `UserRoutes.js`
4. Actualizar frontend para usar la ruta de logout
5. Probar todas las rutas para verificar que funcionan correctamente

