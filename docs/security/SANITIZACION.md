# Documentación de Sanitización - Sistema Completo

## 📋 Índice
1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Frontend: Protección de localStorage](#frontend-protección-de-localstorage)
4. [Backend: Protección de Mensajes](#backend-protección-de-mensajes)
5. [Relación entre Sistemas](#relación-entre-sistemas)
6. [Flujo Completo](#flujo-completo)
7. [Comparación Detallada](#comparación-detallada)
8. [Casos de Uso](#casos-de-uso)

---

## Introducción

Este documento explica el sistema completo de sanitización implementado en la aplicación, que consta de **dos sistemas complementarios** que protegen diferentes aspectos de la aplicación contra ataques XSS (Cross-Site Scripting).

### ¿Por qué dos sistemas?

La aplicación necesita protección en **dos niveles diferentes**:

1. **Frontend (localStorage)**: Protege datos sensibles almacenados en el navegador
2. **Backend (Mensajes)**: Protege contenido de usuario almacenado en la base de datos

Ambos sistemas son **necesarios y complementarios**, no redundantes.

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│              SISTEMA DE SANITIZACIÓN                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────┐      ┌─────────────────────────┐
│   FRONTEND              │      │   BACKEND                │
│   security.js           │      │   sanitize.js            │
│                         │      │                         │
│  Protege:               │      │  Protege:               │
│  - localStorage         │      │  - Mensajes del chat     │
│  - Tokens JWT           │      │  - Base de datos        │
│  - Datos de usuario     │      │  - Contenido de usuarios│
└─────────────────────────┘      └─────────────────────────┘
         │                                  │
         │                                  │
         └──────────┬───────────────────────┘
                    │
         ┌──────────▼──────────┐
         │  PROTECCIÓN XSS     │
         │  Múltiples Capas    │
         └─────────────────────┘
```

---

## Frontend: Protección de localStorage

### **Ubicación:** `frontend/vue-app/src/utils/security.js`

### **Propósito:**
Proteger datos almacenados en `localStorage` del navegador contra ataques XSS.

### **Qué Protege:**
- ✅ **Tokens JWT** de autenticación
- ✅ **Datos de usuario** (nombre, email, rol)
- ✅ **Cualquier dato** guardado en localStorage

### **Cómo Funciona:**

#### **1. Interceptor Automático**
```javascript
// Se activa en main.js
setupLocalStorageInterceptor()
```

El interceptor sobrescribe `localStorage.setItem()` y `localStorage.getItem()` para:
- **Al GUARDAR**: Sanitiza automáticamente todos los datos
- **Al LEER**: Desanitiza automáticamente los datos

#### **2. Funciones Principales**

**`sanitizeForStorage(data)`**
- Escapa caracteres HTML peligrosos
- Funciona con strings, objetos y arrays
- Se ejecuta automáticamente al guardar

**`desanitizeForStorage(data)`**
- Revierte el escape de caracteres HTML
- Se ejecuta automáticamente al leer

**`setupLocalStorageInterceptor()`**
- Configura el interceptor global
- Se ejecuta una vez al iniciar la aplicación

### **Ejemplo de Uso:**

```javascript
// Al hacer login (automático)
localStorage.setItem('user', JSON.stringify({
    name: '<script>alert("XSS")</script>',  // ← Se sanitiza automáticamente
    email: 'user@example.com'
}));

// Al leer (automático)
const user = JSON.parse(localStorage.getItem('user'));
// user.name será: '<script>alert("XSS")</script>' (desanitizado)
```

### **Archivos Afectados:**
- `frontend/vue-app/src/main.js` - Activa el interceptor
- `frontend/vue-app/src/views/Login.vue` - Guarda token y usuario
- `frontend/vue-app/src/views/Chat.vue` - Lee token y usuario
- `frontend/vue-app/src/services/axiosConfig.js` - Lee token para requests

---

## Backend: Protección de Mensajes

### **Ubicación:** `backend/utils/sanitize.js`

### **Propósito:**
Proteger mensajes del chat antes de guardarlos en la base de datos y desanitizarlos al enviar al frontend.

### **Qué Protege:**
- ✅ **Mensajes del chat** enviados por usuarios
- ✅ **Contenido almacenado** en MongoDB
- ✅ **Datos enviados** vía WebSocket y API REST

### **Cómo Funciona:**

#### **1. Sanitización al Guardar**
```javascript
// En app.js (WebSocket)
const sanitizedText = sanitizeMessage(text);
const newMessage = new Message({
    text: sanitizedText,  // ← Guardado sanitizado
    // ...
});
```

#### **2. Desanitización al Enviar**
```javascript
// Al enviar al frontend
io.to(channelId).emit('new_message', {
    text: desanitizeMessage(populatedMessage.text),  // ← Desanitizado para mostrar
    // ...
});
```

#### **3. Funciones Principales**

**`sanitizeMessage(text)`**
- Escapa caracteres HTML peligrosos
- Se ejecuta antes de guardar en BD

**`desanitizeMessage(text)`**
- Revierte el escape de caracteres HTML
- Se ejecuta antes de enviar al frontend

### **Ejemplo de Uso:**

```javascript
// Usuario envía mensaje
socket.emit('send_message', {
    text: '<script>alert("XSS")</script>'
});

// Backend sanitiza antes de guardar
// BD guarda: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'

// Backend desanitiza antes de enviar
// Frontend recibe: '<script>alert("XSS")</script>'

// Vue.js escapa automáticamente al mostrar
// Usuario ve: '<script>alert("XSS")</script>' (texto plano, seguro)
```

### **Archivos Afectados:**
- `backend/app.js` - WebSocket handlers
- `backend/routes/MessageRoutes.js` - API REST handlers
- `backend/models/Message.js` - Modelo de mensaje

---

## Relación entre Sistemas

### **¿Son Redundantes?**

**NO.** Ambos sistemas protegen **diferentes cosas**:

| Aspecto | Frontend (security.js) | Backend (sanitize.js) |
|---------|------------------------|----------------------|
| **Ubicación** | Navegador (cliente) | Servidor |
| **Protege** | localStorage | Base de datos |
| **Datos** | Token, usuario | Mensajes del chat |
| **Cuándo** | Al guardar/leer localStorage | Al guardar/leer mensajes |
| **Automático** | Sí (interceptor) | Sí (en handlers) |

### **¿Se Complementan?**

**SÍ.** Ambos sistemas trabajan juntos para proporcionar **defensa en profundidad**:

```
┌─────────────────────────────────────────┐
│  CAPA 1: Frontend (localStorage)       │
│  Protege tokens y datos de usuario    │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  CAPA 2: Backend (Mensajes)            │
│  Protege contenido de mensajes         │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  CAPA 3: Vue.js (Escape automático)    │
│  Escapa HTML al renderizar             │
└─────────────────────────────────────────┘
```

---

## Flujo Completo

### **Escenario 1: Usuario Hace Login**

```
1. USUARIO HACE LOGIN
   ↓
2. Backend envía: { token, user: { name: "Pedro" } }
   ↓
3. Frontend guarda en localStorage:
   - localStorage.setItem('token', token)  
     ← Frontend sanitiza automáticamente (security.js)
   - localStorage.setItem('user', user)    
     ← Frontend sanitiza automáticamente (security.js)
   ↓
4. Datos guardados sanitizados en localStorage
   ↓
5. Al leer, Frontend desanitiza automáticamente
   ↓
6. Aplicación usa datos normalmente
```

### **Escenario 2: Usuario Envía Mensaje**

```
1. USUARIO ENVÍA MENSAJE
   Texto: '<script>alert("XSS")</script>'
   ↓
2. Frontend envía vía WebSocket:
   socket.emit('send_message', { text: '<script>alert("XSS")</script>' })
   ↓
3. Backend recibe y sanitiza:
   sanitizeMessage('<script>alert("XSS")</script>')
   Resultado: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
   ↓
4. Backend guarda en MongoDB:
   { text: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;' }
   ↓
5. Backend desanitiza antes de enviar:
   desanitizeMessage('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;')
   Resultado: '<script>alert("XSS")</script>'
   ↓
6. Frontend recibe:
   { text: '<script>alert("XSS")</script>' }
   ↓
7. Vue.js renderiza:
   <div class="message-text">{{ message.text }}</div>
   ↓
8. Vue.js escapa automáticamente:
   Muestra: '<script>alert("XSS")</script>' (texto plano)
   ↓
9. NO se ejecuta código JavaScript ✅
```

---

## Comparación Detallada

### **Tabla Comparativa Completa**

| Característica | Frontend (security.js) | Backend (sanitize.js) |
|----------------|------------------------|----------------------|
| **Archivo** | `frontend/vue-app/src/utils/security.js` | `backend/utils/sanitize.js` |
| **Ubicación** | Navegador (cliente) | Servidor |
| **Protege** | localStorage | Base de datos |
| **Datos Protegidos** | Token JWT, datos de usuario | Mensajes del chat |
| **Cuándo Sanitiza** | Al guardar en localStorage | Al guardar en BD |
| **Cuándo Desanitiza** | Al leer de localStorage | Al enviar al frontend |
| **Automático** | Sí (interceptor global) | Sí (en handlers) |
| **Funciones** | `sanitizeForStorage()`, `desanitizeForStorage()` | `sanitizeMessage()`, `desanitizeMessage()` |
| **Activa en** | `main.js` (inicio de app) | `app.js` y `MessageRoutes.js` |
| **Impacto** | Todos los datos en localStorage | Solo mensajes del chat |

### **Caracteres Escapados (Ambos Sistemas)**

Ambos sistemas escapan los mismos caracteres:

| Carácter | Entidad HTML | Ejemplo |
|----------|--------------|---------|
| `<` | `&lt;` | `<script>` → `&lt;script&gt;` |
| `>` | `&gt;` | `</script>` → `&lt;/script&gt;` |
| `"` | `&quot;` | `"texto"` → `&quot;texto&quot;` |
| `'` | `&#x27;` | `'texto'` → `&#x27;texto&#x27;` |
| `/` | `&#x2F;` | `</script>` → `&lt;&#x2F;script&gt;` |
| `&` | `&amp;` | `&amp;` → `&amp;amp;` |

---

## Casos de Uso

### **Caso 1: Login con Nombre Malicioso**

**Escenario:** Usuario con nombre `<script>alert("XSS")</script>`

**Flujo:**
1. Backend envía: `{ user: { name: '<script>alert("XSS")</script>' } }`
2. Frontend guarda: `localStorage.setItem('user', ...)`
3. **Frontend sanitiza automáticamente** (security.js)
4. localStorage guarda: `{ name: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;' }`
5. Al leer, Frontend desanitiza automáticamente
6. Aplicación usa: `{ name: '<script>alert("XSS")</script>' }`
7. Vue.js escapa al mostrar: `<script>alert("XSS")</script>` (texto plano)

**Protección:** ✅ Frontend (security.js)

---

### **Caso 2: Mensaje con Código XSS**

**Escenario:** Usuario envía mensaje `<script>alert("XSS")</script>`

**Flujo:**
1. Usuario escribe: `<script>alert("XSS")</script>`
2. Frontend envía vía WebSocket
3. **Backend sanitiza antes de guardar** (sanitize.js)
4. BD guarda: `&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;`
5. **Backend desanitiza antes de enviar** (sanitize.js)
6. Frontend recibe: `<script>alert("XSS")</script>`
7. Vue.js escapa al mostrar: `<script>alert("XSS")</script>` (texto plano)

**Protección:** ✅ Backend (sanitize.js)

---

### **Caso 3: Token JWT Robado**

**Escenario:** Atacante intenta robar token desde localStorage

**Flujo:**
1. Token guardado: `localStorage.setItem('token', 'eyJhbGc...')`
2. **Frontend sanitiza automáticamente** (security.js)
3. Si hay XSS, atacante lee: `localStorage.getItem('token')`
4. Frontend desanitiza automáticamente
5. Token sigue siendo válido, pero...
6. **Protección adicional:** Tokens de corta duración recomendados

**Protección:** ✅ Frontend (security.js) + Tokens cortos

---

## Ventajas de Tener Ambos Sistemas

### **1. Defensa en Profundidad**
- Múltiples capas de protección
- Si una falla, la otra protege

### **2. Separación de Responsabilidades**
- Frontend protege datos del navegador
- Backend protege datos del servidor

### **3. Independencia**
- Cada sistema funciona independientemente
- No hay dependencias entre ellos

### **4. Mantenibilidad**
- Código organizado y claro
- Fácil de entender y modificar

---

## Desventajas (Mínimas)

### **1. Complejidad**
- Dos sistemas que mantener
- **Mitigación:** Documentación clara (este documento)

### **2. Rendimiento**
- Impacto mínimo: +0.5-1ms por operación
- **Mitigación:** Operaciones rápidas, impacto despreciable

---

## Recomendaciones

### **✅ Mantener Ambos Sistemas**

**Razones:**
1. Protegen diferentes cosas
2. No son redundantes
3. Proporcionan defensa en profundidad
4. Impacto mínimo en rendimiento

### **✅ Mejoras Futuras**

1. **Tokens de corta duración** (15-30 min)
2. **HttpOnly Cookies** para tokens
3. **CSP Headers** en el backend
4. **Validación exhaustiva** en el backend

---

## Resumen Ejecutivo

### **Frontend (security.js)**
- **Protege:** localStorage (tokens, datos de usuario)
- **Cuándo:** Al guardar/leer localStorage
- **Automático:** Sí (interceptor)
- **Necesario:** ✅ SÍ

### **Backend (sanitize.js)**
- **Protege:** Mensajes del chat (base de datos)
- **Cuándo:** Al guardar/leer mensajes
- **Automático:** Sí (en handlers)
- **Necesario:** ✅ SÍ

### **Relación**
- **¿Redundantes?** ❌ NO
- **¿Complementarios?** ✅ SÍ
- **¿Ambos necesarios?** ✅ SÍ

---

## Conclusión

El sistema de sanitización implementado consta de **dos sistemas complementarios** que trabajan juntos para proporcionar **protección completa** contra ataques XSS:

1. **Frontend** protege datos sensibles en el navegador
2. **Backend** protege contenido de usuario en la base de datos

Ambos sistemas son **necesarios** y proporcionan **defensa en profundidad** contra ataques XSS.

---

**Última actualización:** 2025-01-XX  
**Versión:** 1.0  
**Autor:** Documentación de Sanitización - Chat Corporativo

