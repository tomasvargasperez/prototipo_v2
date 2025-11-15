# Manual Frontend - Arquitectura y Funcionamiento Completo

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura del Frontend](#arquitectura-del-frontend)
3. [Punto de Entrada: main.js](#punto-de-entrada-mainjs)
4. [Router: Navegación](#router-navegación)
5. [Componente Principal: App.vue](#componente-principal-appvue)
6. [Vistas (Views)](#vistas-views)
7. [Servicios](#servicios)
8. [Utilidades](#utilidades)
9. [Estilos y Assets](#estilos-y-assets)
10. [Comunicación con el Backend](#comunicación-con-el-backend)

---

## Introducción

El frontend de tu aplicación es la **interfaz de usuario** construida con Vue.js. Maneja toda la interacción con el usuario, visualización de datos y comunicación con el backend. Este manual te explicará cómo está estructurado y cómo funciona cada componente.

### Stack Tecnológico del Frontend

- **Vue.js 3**: Framework JavaScript progresivo
- **Vue Router**: Enrutamiento del lado del cliente
- **Axios**: Cliente HTTP para peticiones al backend
- **Socket.IO Client**: Comunicación en tiempo real
- **Font Awesome**: Iconos
- **Vite**: Build tool y dev server

### Estructura de Carpetas

```
frontend/vue-app/src/
├── main.js              # Punto de entrada
├── App.vue              # Componente raíz
├── router/
│   └── index.js         # Configuración de rutas
├── views/               # Componentes de página
│   ├── Login.vue
│   ├── Chat.vue
│   └── Admin_app.vue
├── services/
│   └── axiosConfig.js   # Configuración de Axios
├── utils/
│   └── security.js      # Utilidades de seguridad
├── assets/              # Recursos estáticos
└── style.css            # Estilos globales
```

---

## Arquitectura del Frontend

### Flujo de Aplicación Vue

```
Usuario accede a la aplicación
    ↓
main.js (Punto de entrada)
    ↓
App.vue (Componente raíz)
    ↓
Vue Router
    ↓
Vista correspondiente (Login.vue, Chat.vue, Admin_app.vue)
    ↓
Renderizado en el navegador
```

### Patrón de Componentes

**Vue.js usa componentes**:
- Cada vista es un componente
- Los componentes pueden tener:
  - **Template**: HTML con sintaxis Vue
  - **Script**: Lógica JavaScript
  - **Style**: Estilos CSS

---

## Punto de Entrada: main.js

### Archivo: `frontend/vue-app/src/main.js`

```javascript
// 👉 ACTIVAR SANITIZACIÓN AUTOMÁTICA (Protección XSS)
import { setupLocalStorageInterceptor } from './utils/security'
setupLocalStorageInterceptor()

import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import './assets/main.css'
import '@fortawesome/fontawesome-free/css/all.min.css'

// 👉 Importar el router
import router from './router'

// 👉 Crear instancia de la app y usar router
const app = createApp(App)
app.use(router)
app.mount('#app')
```

### Explicación Paso a Paso

#### 1. Activar Sanitización

```javascript
import { setupLocalStorageInterceptor } from './utils/security'
setupLocalStorageInterceptor()
```

**¿Qué hace?**
- Activa el interceptor de `localStorage` para sanitización automática
- **Debe ejecutarse ANTES** de cualquier otra operación
- Protege contra ataques XSS en `localStorage`

#### 2. Importar Dependencias

```javascript
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import './assets/main.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
```

**Explicación**:
- `createApp`: Función de Vue 3 para crear la aplicación
- `./style.css`: Estilos globales
- `App.vue`: Componente raíz
- `./assets/main.css`: Estilos adicionales
- `@fortawesome/...`: Iconos Font Awesome

#### 3. Importar Router

```javascript
import router from './router'
```

**¿Qué hace?**
- Importa la configuración del router
- Permite navegación entre vistas

#### 4. Crear y Montar Aplicación

```javascript
const app = createApp(App)
app.use(router)
app.mount('#app')
```

**Explicación**:
- `createApp(App)`: Crea instancia de la aplicación con `App.vue` como raíz
- `app.use(router)`: Registra el router en la aplicación
- `app.mount('#app')`: Monta la aplicación en el elemento `#app` del HTML

---

## Router: Navegación

### Archivo: `frontend/vue-app/src/router/index.js`

```javascript
import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Chat from '../views/Chat.vue'
import AdminApp from '../views/Admin_app.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/chat', component: Chat },
  { path: '/admin', component: AdminApp }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
```

### Explicación

#### 1. Importar Vistas

```javascript
import Login from '../views/Login.vue'
import Chat from '../views/Chat.vue'
import AdminApp from '../views/Admin_app.vue'
```

**¿Qué hace?**
- Importa los componentes de vista
- Cada vista es un componente Vue

#### 2. Definir Rutas

```javascript
const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/chat', component: Chat },
  { path: '/admin', component: AdminApp }
]
```

**Rutas**:
- `/`: Redirige a `/login`
- `/login`: Muestra `Login.vue`
- `/chat`: Muestra `Chat.vue`
- `/admin`: Muestra `Admin_app.vue`

#### 3. Crear Router

```javascript
const router = createRouter({
  history: createWebHistory(),
  routes
})
```

**`createWebHistory`**:
- Usa el modo History API del navegador
- URLs limpias (sin `#`)
- Requiere configuración en el servidor para SPA

**Alternativa**: `createWebHashHistory()` (usa `#` en la URL)

### Navegación Programática

**En componentes Vue**:
```javascript
// Ir a una ruta
this.$router.push('/chat')

// Ir hacia atrás
this.$router.go(-1)

// Reemplazar historial
this.$router.replace('/login')
```

---

## Componente Principal: App.vue

### Archivo: `frontend/vue-app/src/App.vue`

```vue
<template>
  <router-view />
</template>

<script setup>
// No es necesario importar nada aquí por ahora
</script>

<style>
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
}
</style>
```

### Explicación

#### Template

```vue
<template>
  <router-view />
</template>
```

**`<router-view />`**:
- Componente de Vue Router
- Renderiza la vista correspondiente a la ruta actual
- Es el "contenedor" de todas las vistas

**Ejemplo**:
- Ruta `/login` → Renderiza `Login.vue`
- Ruta `/chat` → Renderiza `Chat.vue`
- Ruta `/admin` → Renderiza `Admin_app.vue`

#### Script

```vue
<script setup>
// No es necesario importar nada aquí por ahora
</script>
```

**`<script setup>`**:
- Sintaxis de Composition API de Vue 3
- Código más limpio y conciso
- No necesita `export default`

#### Style

```vue
<style>
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
}
</style>
```

**Estilos globales**:
- Se aplican a toda la aplicación
- Reseteo básico de estilos

---

## Vistas (Views)

### Login.vue

**Ruta**: `/login`

**Funcionalidad**:
- Formulario de autenticación
- Validación de credenciales
- Redirección según rol (admin/user)

#### Estructura

```vue
<template>
  <div class="login-page">
    <form @submit.prevent="login">
      <input v-model="email" type="email" />
      <input v-model="password" type="password" />
      <button type="submit">INICIAR SESIÓN</button>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      email: '',
      password: ''
    }
  },
  methods: {
    async login() {
      // Lógica de autenticación
    }
  }
}
</script>
```

#### Método `login`

```javascript
async login() {
  const response = await fetch('http://localhost:3000/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: this.email,
      password: this.password
    })
  });

  const data = await response.json();

  if (data.token && data.user) {
    // Guardar token y usuario
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Redirigir según rol
    if (data.user.role === 'admin') {
      this.$router.push('/admin');
    } else {
      this.$router.push('/chat');
    }
  }
}
```

**Flujo**:
1. Envía credenciales al backend
2. Recibe token JWT y datos del usuario
3. Guarda en `localStorage`
4. Redirige según rol

### Chat.vue

**Ruta**: `/chat`

**Funcionalidad**:
- Chat en tiempo real
- Lista de canales
- Envío de mensajes
- Foro de anuncios
- Buzón de sugerencias
- Directorio telefónico

#### Estructura Principal

```vue
<template>
  <div class="chat-page">
    <div class="sidebar">
      <!-- Lista de canales -->
      <!-- Otras opciones -->
    </div>
    <div class="chat-main">
      <!-- Contenido del chat o submenús -->
    </div>
  </div>
</template>
```

#### Características Principales

1. **Conexión Socket.IO**:
   ```javascript
   mounted() {
     this.socket = io('http://localhost:3000');
     this.socket.on('new_message', (message) => {
       this.messages.push(message);
     });
   }
   ```

2. **Selección de Canal**:
   ```javascript
   selectChannel(channelId) {
     this.selectedChannel = channelId;
     this.socket.emit('join_channel', channelId);
   }
   ```

3. **Envío de Mensajes**:
   ```javascript
   sendMessage() {
     this.socket.emit('send_message', {
       channelId: this.selectedChannel,
       text: this.newMessage,
       userId: this.userId
     });
     this.newMessage = '';
   }
   ```

4. **Submenús**:
   - Foro de Anuncios
   - Buzón de Sugerencias
   - Directorio Telefónico

### Admin_app.vue

**Ruta**: `/admin`

**Funcionalidad**:
- Dashboard con métricas
- Gestión de usuarios
- Gestión de canales
- Foro de anuncios
- Sugerencias anónimas
- Directorio telefónico

#### Estructura Principal

```vue
<template>
  <div class="chat-page">
    <div class="sidebar">
      <!-- Menú de administración -->
    </div>
    <div class="chat-main">
      <!-- Contenido según sección activa -->
      <div v-if="activeSection === 'dashboard'">
        <!-- Dashboard -->
      </div>
      <div v-if="activeSection === 'usuarios'">
        <!-- Gestión de usuarios -->
      </div>
      <!-- ... otras secciones ... -->
    </div>
  </div>
</template>
```

#### Secciones

1. **Dashboard**:
   - Métricas (usuarios, canales, mensajes)
   - Gráficos (Chart.js)
   - Top usuarios activos

2. **Gestión de Usuarios**:
   - Lista de usuarios
   - Crear/editar/eliminar usuarios
   - Cambiar contraseñas

3. **Gestión de Canales**:
   - Lista de canales
   - Crear/editar/eliminar canales
   - Configurar permisos

4. **Foro de Anuncios**:
   - Publicar anuncios
   - Ver anuncios existentes

5. **Sugerencias Anónimas**:
   - Ver sugerencias (desencriptadas)
   - Cambiar estado

6. **Directorio Telefónico**:
   - Ver directorio
   - Buscar contactos

---

## Servicios

### axiosConfig.js

**Archivo**: `frontend/vue-app/src/services/axiosConfig.js`

```javascript
import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:3000',
    timeout: 10000
});

// Interceptor para agregar token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    }
);

// Interceptor para manejar errores
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
```

**Funcionalidad**:
1. **Configuración Base**:
   - URL base del backend
   - Timeout de 10 segundos

2. **Interceptor de Request**:
   - Agrega token JWT a todas las peticiones
   - Formato: `Authorization: Bearer <token>`

3. **Interceptor de Response**:
   - Si el token expiró (401), redirige al login
   - Limpia `localStorage`

**Uso**:
```javascript
import axiosInstance from '@/services/axiosConfig'

// Petición GET
const response = await axiosInstance.get('/api/users')

// Petición POST
const response = await axiosInstance.post('/api/users', { name: 'Juan' })
```

---

## Utilidades

### security.js

**Archivo**: `frontend/vue-app/src/utils/security.js`

**Funcionalidad**: Sanitización automática de `localStorage`

#### Función Principal: `setupLocalStorageInterceptor`

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

**Funcionalidad**:
- Intercepta **todas** las llamadas a `localStorage.setItem()` y `localStorage.getItem()`
- Sanitiza automáticamente antes de guardar
- Desanitiza automáticamente al leer

**Protección**: Previene ataques XSS en `localStorage`

---

## Estilos y Assets

### style.css

**Archivo**: `frontend/vue-app/src/style.css`

**Contenido**: Estilos globales de la aplicación

### assets/main.css

**Archivo**: `frontend/vue-app/src/assets/main.css`

**Contenido**: Estilos adicionales y reset CSS

### Estilos por Componente

**Cada componente Vue puede tener su propio `<style>`**:

```vue
<style scoped>
.chat-page {
  /* Estilos solo para este componente */
}
</style>
```

**`scoped`**: Los estilos solo se aplican a este componente

---

## Comunicación con el Backend

### HTTP REST API

**Método**: Usando `fetch` o `axios`

**Ejemplo con fetch**:
```javascript
const response = await fetch('http://localhost:3000/api/users', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
```

**Ejemplo con axios**:
```javascript
import axiosInstance from '@/services/axiosConfig'
const response = await axiosInstance.get('/api/users')
const data = response.data
```

### WebSocket (Socket.IO)

**Conexión**:
```javascript
import io from 'socket.io-client'
this.socket = io('http://localhost:3000')
```

**Eventos**:
```javascript
// Escuchar eventos
this.socket.on('new_message', (message) => {
  this.messages.push(message)
})

// Emitir eventos
this.socket.emit('send_message', {
  channelId: this.selectedChannel,
  text: this.newMessage,
  userId: this.userId
})
```

**Eventos Principales**:
- `join_channel`: Unirse a un canal
- `send_message`: Enviar mensaje
- `new_message`: Recibir nuevo mensaje
- `message_history`: Recibir historial de mensajes

---

## Gestión de Estado

### localStorage

**Uso**:
```javascript
// Guardar
localStorage.setItem('token', token)
localStorage.setItem('user', JSON.stringify(user))

// Leer
const token = localStorage.getItem('token')
const user = JSON.parse(localStorage.getItem('user'))

// Eliminar
localStorage.removeItem('token')
```

**Datos Almacenados**:
- `token`: Token JWT
- `user`: Datos del usuario (nombre, rol, email, etc.)

**Nota**: Los datos se sanitizan automáticamente por el interceptor.

### Estado del Componente

**Options API** (usado en tu aplicación):
```javascript
export default {
  data() {
    return {
      messages: [],
      channels: [],
      selectedChannel: null
    }
  }
}
```

**Composition API** (alternativa):
```javascript
import { ref } from 'vue'

export default {
  setup() {
    const messages = ref([])
    const channels = ref([])
    return { messages, channels }
  }
}
```

---

## Ciclo de Vida de Componentes

### Hooks Principales

1. **`created`**: Se ejecuta después de crear la instancia
2. **`mounted`**: Se ejecuta después de montar el componente en el DOM
3. **`updated`**: Se ejecuta después de actualizar el componente
4. **`beforeDestroy`**: Se ejecuta antes de destruir el componente

**Ejemplo**:
```javascript
export default {
  mounted() {
    // Inicializar Socket.IO
    this.socket = io('http://localhost:3000')
    
    // Cargar datos
    this.fetchChannels()
  },
  beforeDestroy() {
    // Limpiar recursos
    if (this.socket) {
      this.socket.disconnect()
    }
  }
}
```

---

## Resumen

### Componentes del Frontend

1. **main.js**: Punto de entrada, inicialización
2. **App.vue**: Componente raíz, contiene `<router-view>`
3. **router/index.js**: Configuración de rutas
4. **views/**: Componentes de página (Login, Chat, Admin)
5. **services/axiosConfig.js**: Configuración de Axios
6. **utils/security.js**: Sanitización de localStorage

### Flujos Principales

1. **Autenticación**:
   - Login → Backend → Token → localStorage → Redirección

2. **Chat en Tiempo Real**:
   - Socket.IO → Backend → Emit Event → Frontend

3. **Peticiones HTTP**:
   - Frontend → Axios → Backend → Response → Frontend

### Tecnologías Clave

- **Vue.js 3**: Framework principal
- **Vue Router**: Navegación
- **Socket.IO Client**: Tiempo real
- **Axios**: HTTP client
- **Font Awesome**: Iconos

---

## Próximos Pasos

Ahora que entiendes el frontend, puedes continuar con:
- **MANUAL_BASE_DATOS.md**: Modelos y esquemas

---

**Última actualización**: Enero 2025

**Versión**: 1.0

