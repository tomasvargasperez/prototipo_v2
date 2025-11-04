# Chat Corporativo

Aplicación de mensajería corporativa en tiempo real construida con Node.js, Express, MongoDB, Socket.IO y Vue 3 (Vite). Incluye gestión de usuarios y roles, canales públicos/privados, foro de anuncios, buzón de sugerencias encriptado, dashboard administrativo y directorio telefónico integrado.

## Requisitos
- Node.js 18+ (recomendado para Vite y dependencias)
- MongoDB 5+
- npm 8+

## Estructura del proyecto (real)
```
app_chat_corp/
├── backend/
│   ├── app.js                # EntryPoint Express + HTTP + Socket.IO
│   ├── socket.js             # Inicialización de Socket.IO
│   ├── routes/               # Rutas HTTP
│   │   ├── UserRoutes.js
│   │   ├── MessageRoutes.js
│   │   ├── ChannelRoutes.js
│   │   ├── AnnouncementRoutes.js
│   │   ├── SuggestionRoutes.js
│   │   ├── DashboardRoutes.js
│   │   └── phoneBookRoutes.js
│   ├── controllers/
│   │   ├── UserController.js
│   │   ├── MessageController.js
│   │   └── phoneBookController.js
│   ├── models/               # Modelos Mongoose
│   │   ├── User.js
│   │   ├── Message.js
│   │   ├── Channel.js
│   │   ├── Announcement.js
│   │   └── Suggestion.js
│   ├── middleware/
│   │   └── auth.js           # Verificación JWT básica
│   ├── services/
│   │   └── phoneBookService.js
│   └── utils/
│       └── encryption.js     # AES-256 (CBC) para sugerencias
└── frontend/
    └── vue-app/
        ├── src/
        │   ├── main.js
        │   ├── App.vue
        │   ├── router/
        │   │   └── index.js
        │   ├── services/
        │   │   └── axiosConfig.js
        │   └── views/
        │       ├── Login.vue
        │       ├── Chat.vue
        │       ├── Admin_app.vue
        │       └── Admin_app_old.vue
        └── public/
```

## Configuración (.env en backend/)
```env
PORT=3000
DB_URL=mongodb://localhost:27017/chat_bbdd
JWT_SECRET=tu_clave_secreta
ENCRYPTION_KEY=clave_fuerte_para_sugerencias
# Opcional: si cambia la fuente del phonebook
PHONEBOOK_URL=https://icafal.alodesk.io:20080/panel/share/phonebook/9267361683
```

## Instalación
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend/vue-app
npm install
```

## Ejecución en desarrollo
Backend (no hay scripts definidos actualmente en backend/package.json):
```bash
cd backend
# Opción A: Node directo
node app.js
# Opción B: con nodemon (está en dependencies)
npx nodemon app.js
```

Frontend (Vite):
```bash
cd frontend/vue-app
npm run dev
# URL por defecto: http://localhost:5173
```

## Producción (básico)
Frontend (build):
```bash
cd frontend/vue-app
npm run build
```
Backend:
```bash
cd backend
node app.js
```
En `NODE_ENV=production` Express sirve `frontend/vue-app/dist/` como contenido estático.

## Endpoints HTTP (reales)

### Autenticación y Usuarios
- `POST /login` Iniciar sesión. Respuesta: `{ token, user }` (expira según configuración, típicamente 24h en rutas principales; 1h en `UserController.login`).
- `GET /api/users` Listar usuarios (admin, JWT requerido)
- `PATCH /api/users/:id` Actualizar usuario (admin)
- `DELETE /api/users/:id` Eliminar usuario (admin)

Rutas adicionales expuestas por compatibilidad:
- `GET /user` Lista todos los usuarios (requiere token vía `UserController.validateToken`)
- `GET /user/:id` Obtener usuario por id
- `GET /user/email/:email` Obtener usuario por email
- `POST /user` Crear usuario (hash en pre-save)
- `PATCH /user/:id` Actualizar usuario
- `DELETE /user/:id` Eliminar usuario

### Canales (`/api/channels`)
- `GET /` Canales visibles para el usuario (admin ve todos los activos)
- `GET /all` Listado completo (admin)
- `POST /` Crear canal (admin)
- `PUT /:id` Actualizar canal (admin)
- `DELETE /:id` Eliminar canal (admin)

### Mensajes (`/api/messages`)
- `GET /:channelId` Mensajes de un canal (valida acceso por canal)
- `POST /` Crear mensaje: `{ channelId, text }` (valida acceso)

Nota: `backend/controllers/MessageController.js` usa un modelo alterno (`content`, `user`), no usado por las rutas principales. Las rutas de `MessageRoutes.js` trabajan con `text`, `userId`, `channel` (ObjectId) según `models/Message.js`.

### Anuncios (`/api/announcements`)
- `GET /` Listar anuncios activos (JWT)
- `POST /` Crear anuncio (admin)
- `DELETE /:id` Eliminar anuncio (admin)

### Sugerencias (`/api/suggestions`)
- `POST /` Crear sugerencia (JWT). El contenido se encripta con AES-256-CBC.
- `GET /` Listar (admin). Se desencripta al responder.
- `PUT /:id/status` Actualizar estado `pending|reviewed|implemented` (admin)

### Dashboard (`/api/admin/dashboard`)
- `GET /dashboard` Métricas (admin). Incluye: totales, actividad por canal, top usuarios, actividad por día, conexiones simuladas.

### Directorio Telefónico (`/api/phonebook`)
- `GET /` Retorna el directorio (cache en memoria ~5 min)
- `GET /search?query=…` Busca en el directorio (case-insensitive)

## Eventos Socket.IO (tiempo real)
- `connection`/`disconnect`: conexión del cliente
- `join_channel` (channelId) → el servidor une al socket a la sala, carga historial y emite `message_history`
- `send_message` ({ channelId, text, userId }) → valida y persiste; emite `new_message` a la sala
- `new_message` (broadcast): `{ _id, text, userId, author, timestamp }`

## Frontend
- Router: `/login`, `/chat`, `/admin`
- `axiosConfig`: agrega `Authorization: Bearer <token>` automáticamente; en `401` limpia sesión y redirige a `/login`.
- Vistas principales: `Login.vue`, `Chat.vue`, `Admin_app.vue`. Estas vistas son grandes y concentran UI; se recomienda modularización futura.

## Seguridad
- JWT: verificación en middleware `backend/middleware/auth.js` (básico). Rutas admin usan `isAdmin` (en archivos de rutas).
- Roles: `admin` | `user`.
- Sugerencias: encriptación simétrica AES-256-CBC (clave derivada con scrypt). Recomendado migrar a AES-GCM (AEAD) para integridad.
- CORS Socket.IO: en `socket.js` restringido a `http://localhost:5173` y `5174` en dev.

## Variables y consideraciones adicionales
- Diferencias de expiración: `UserController.login()` usa 1h; rutas de `UserRoutes.js` emiten 24h.
- `backend/package.json` no define scripts `start`/`dev`; usar `node app.js` o `npx nodemon app.js`.
- `package.json` en la raíz tiene dependencia residual (`mongoose-unique-validator`).

## Troubleshooting
- MongoDB índices: `Message` sincroniza índices al iniciar. Asegura que la base esté disponible en primer arranque.
- Phonebook: la integración usa por defecto una URL HTTPS. En desarrollo, el `phoneBookService` configura un `httpsAgent` que ignora certificados. No usar en producción sin certificados válidos.
- CORS/Origen: si el frontend corre en otro host/puerto, agrega el origen en `socket.js` y configura CORS para Express si es necesario.
- 401 vs 403: 401 = sin token o inválido; 403 = sin permisos o usuario inactivo (según ruta).

## Licencia
MIT. Ver `LICENSE.md` si está disponible.

## Glosario
- **JWT (JSON Web Token)**: Token firmado usado para autenticar solicitudes entre frontend y backend.
- **Canal (Channel)**: Sala de conversación. Puede ser público o de acceso restringido por `allowedUsers`.
- **Socket.IO**: Biblioteca para comunicación bidireccional en tiempo real (eventos como `join_channel`, `new_message`).
- **MongoDB/Mongoose**: Base de datos NoSQL y ODM para definir esquemas y operar con documentos.
- **AES-256-CBC**: Algoritmo de cifrado simétrico usado para proteger el contenido de sugerencias.
- **Dashboard**: Vista administrativa con métricas agregadas del sistema.
- **Phonebook**: Directorio telefónico integrado, consumido desde una fuente XML externa y cacheado.
- **Cache en memoria**: Datos temporales almacenados en el proceso Node.js (no compartidos entre instancias).

## Preguntas Frecuentes (FAQ)
### ¿Cómo inicio el backend si no hay scripts en `backend/package.json`?
Ejecuta `node app.js` o `npx nodemon app.js` desde la carpeta `backend` (tras `npm install`).

### ¿Por qué no puedo ver el frontend en producción?
Asegúrate de ejecutar `npm run build` en `frontend/vue-app`. Con `NODE_ENV=production`, Express servirá `frontend/vue-app/dist/`.

### ¿Qué variables de entorno son obligatorias?
`PORT`, `DB_URL`, `JWT_SECRET`. Para cifrado de sugerencias agrega `ENCRYPTION_KEY`. Para cambiar la fuente del phonebook, usa `PHONEBOOK_URL`.

### ¿Cómo se controla el acceso a canales y mensajes?
Con JWT + roles y verificación de pertenencia al canal. Rutas de mensajes validan acceso en `MessageRoutes.js` (middleware `checkChannelAccess`).

### ¿Por qué el login a veces expira en 1h y otras en 24h?
`UserController.login()` emite tokens de 1h; otras rutas usan 24h. Unifica según la necesidad del proyecto.

### ¿Por qué la búsqueda del phonebook a veces demora?
Es una fuente externa XML. Se cachea ~5 minutos en memoria. Considera añadir Redis si requieres cache compartido entre instancias.

### ¿Cómo configuro CORS para el frontend?
En `socket.js` están permitidos `http://localhost:5173` y `5174`. Si cambias el origen, actualiza esa lista y configura CORS en Express si lo usas.

### ¿Dónde están documentados los eventos de tiempo real?
En la sección “Eventos Socket.IO” de este README. Principales: `join_channel`, `message_history`, `send_message`, `new_message`.