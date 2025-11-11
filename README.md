# Chat Corporativo

Aplicación de mensajería corporativa en tiempo real construida con Node.js, Express, MongoDB, Socket.IO y Vue 3 (Vite). Incluye gestión de usuarios y roles, canales públicos/privados, foro de anuncios, buzón de sugerencias encriptado, dashboard administrativo y directorio telefónico integrado.

## Requisitos
- Node.js 18+ (recomendado para Vite y dependencias)
- MongoDB 5+
- npm 8+

## Resumen de mejoras recientes
- Sanitización automática de `localStorage` mediante interceptor global (`frontend/vue-app/src/utils/security.js`) para mitigar robo de tokens por XSS.
- Sanitización/desanitización de mensajes de chat en el backend (`backend/app.js`, `backend/routes/MessageRoutes.js`) antes de persistir y al emitir eventos tiempo real.
- Sanitización/desanitización de sugerencias antes de encriptar y después de desencriptar (`backend/routes/SuggestionRoutes.js`).
- Documentación de pruebas y guías de sanitización consolidada en `docs/`.
- Eliminación del código legado (`frontend/legacy/`) para simplificar mantenimiento.

## Estructura del proyecto (real)
```
app_chat_corp/
├── backend/
│   ├── app.js                # Orquesta Express, Socket.IO y sanitiza mensajes antes de persistir/enviar
│   ├── socket.js             # Inicializa Socket.IO y configura eventos de tiempo real
│   ├── routes/               # Rutas HTTP
│   │   ├── UserRoutes.js            # Login, JWT y gestión de usuarios
│   │   ├── MessageRoutes.js         # CRUD mensajes con sanitización backend
│   │   ├── ChannelRoutes.js         # Administración de canales y accesos
│   │   ├── AnnouncementRoutes.js    # Anuncios corporativos para el chat
│   │   ├── SuggestionRoutes.js      # Sugerencias encriptadas + sanitización
│   │   ├── DashboardRoutes.js       # Métricas administrativas agregadas
│   │   └── phoneBookRoutes.js       # API del directorio telefónico
│   ├── controllers/
│   │   ├── UserController.js        # Lógica alternativa de autenticación/usuarios
│   │   ├── MessageController.js     # Controlador legado de mensajes (no principal)
│   │   └── phoneBookController.js   # Adaptadores para integrarse con el phonebook
│   ├── models/               # Modelos Mongoose
│   │   ├── User.js                  # Esquema usuarios (roles, activo, hash)
│   │   ├── Message.js               # Esquema mensajes sanitizados
│   │   ├── Channel.js               # Esquema canales y permisos
│   │   ├── Announcement.js          # Esquema anuncios
│   │   └── Suggestion.js            # Esquema sugerencias cifradas
│   ├── middleware/
│   │   └── auth.js           # Middleware de verificación JWT para rutas protegidas
│   ├── services/
│   │   └── phoneBookService.js      # Consumo y cacheo del phonebook externo
│   └── utils/
│       ├── encryption.js     # AES-256 (CBC) para sugerencias
│       └── sanitize.js       # Funciones de sanitización/des-sanitización backend
└── frontend/
    └── vue-app/
        ├── src/
        │   ├── main.js              # Punto de entrada Vue + registro interceptor storage
        │   ├── utils/
        │   │   └── security.js        # Interceptor localStorage y helpers sanitización
        │   ├── App.vue               # Shell principal de la SPA
        │   ├── router/
        │   │   └── index.js          # Rutas `/login`, `/chat`, `/admin`
        │   ├── services/
        │   │   └── axiosConfig.js    # Axios con inclusión automática de JWT y manejo 401
        │   └── views/
        │       ├── Login.vue         # UI de autenticación
        │       ├── Chat.vue          # Chat en tiempo real + consumo sanitizado
        │       ├── Admin_app.vue     # Panel administrativo vigente
        │       └── Admin_app_old.vue # Versión previa del panel (referencia)
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
- Sanitización frontend: interceptor de `localStorage` evita almacenar entidades peligrosas y des-sanitiza al consumirlas (`utils/security.js`).
- Sanitización backend: mensajes y sugerencias se sanitizan antes de persistir y se des-sanitizan antes de enviarse al cliente (`backend/utils/sanitize.js`).
- Sugerencias: encriptación simétrica AES-256-CBC (clave derivada con scrypt). Recomendado migrar a AES-GCM (AEAD) para integridad.
- CORS Socket.IO: en `socket.js` restringido a `http://localhost:5173` y `5174` en dev.

## Pruebas de sanitización
- `docs/security/PRUEBA_SANITIZACION.md`: Validación rápida del interceptor de `localStorage`.
- `docs/security/PRUEBA_PASO_A_PASO.md`: Guía detallada para ejecutar pruebas en consola del navegador.
- `docs/security/SANITIZACION.md`: Contexto entre sanitización frontend vs backend.

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

### ¿Cuáles son los próximos pasos recomendados de seguridad?
- Reducir la vigencia del access token (actualmente 24h) y diseñar un flujo de refresh seguro.
- Configurar cabeceras de seguridad (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.).
- Extender la sanitización a anuncios y campos de usuario.
- Incorporar validaciones exhaustivas de entrada y rate-limiting en endpoints sensibles.