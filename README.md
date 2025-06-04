# Chat Corporativo

## Descripción
Aplicación de chat corporativo desarrollada con Node.js, Express, MongoDB y Vue.js. Permite la comunicación en tiempo real entre usuarios, gestión de canales, sistema de anuncios y buzón de sugerencias.

## Características Principales
- Sistema de autenticación de usuarios
- Chat en tiempo real
- Canales públicos y privados
- Panel de administración
- Foro de anuncios
- Buzón de sugerencias anónimas
- Gestión de usuarios y permisos

## Requisitos Previos
- Node.js (v14 o superior)
- MongoDB
- npm o yarn

## Estructura del Proyecto
```
app_chat_corp/
├── backend/               # Servidor Node.js + Express
│   ├── models/           # Modelos de MongoDB
│   ├── routes/           # Rutas de la API
│   └── app.js            # Archivo principal del servidor
└── frontend/
    └── vue-app/          # Aplicación Vue.js
        ├── src/
        │   ├── views/    # Componentes de vista
        │   ├── router/   # Configuración de rutas
        │   └── main.js   # Punto de entrada
        └── public/       # Archivos estáticos
```

## Instalación

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend/vue-app
npm install
```

## Configuración
1. Crear archivo `.env` en la carpeta backend:
```env
PORT=3000
DB_URL=mongodb://localhost:27017/chat_bbdd
JWT_SECRET=tu_clave_secreta
```

## Ejecución
### Desarrollo
Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend/vue-app
npm run dev
```

### Producción
Backend:
```bash
cd backend
npm start
```

Frontend:
```bash
cd frontend/vue-app
npm run build
```

## Funcionalidades

### Sistema de Usuarios
- Registro y autenticación
- Roles: administrador y usuario
- Estado activo/inactivo
- Gestión de perfiles

### Chat
- Mensajería en tiempo real
- Canales públicos y privados
- Historial de mensajes
- Control de acceso a canales

### Panel de Administración
- Gestión de usuarios
- Creación y gestión de canales
- Publicación de anuncios
- Monitoreo de sugerencias

### Foro de Anuncios
- Publicación de anuncios importantes
- Visibilidad para todos los usuarios
- Gestión desde panel de administración

### Buzón de Sugerencias
- Envío anónimo de sugerencias
- Revisión por administradores
- Interfaz intuitiva

## Tecnologías Utilizadas
- **Backend**
  - Node.js
  - Express
  - MongoDB (Mongoose)
  - Socket.IO
  - JSON Web Tokens (JWT)

- **Frontend**
  - Vue.js 3
  - Socket.IO Client
  - Vue Router
  - CSS personalizado

## Seguridad
- Autenticación mediante JWT
- Validación de roles
- Protección de rutas
- Sanitización de datos
- Control de acceso a canales

## API Endpoints

### Usuarios
- `POST /api/users/register` - Registro de usuario
- `POST /api/users/login` - Inicio de sesión
- `GET /api/users` - Listar usuarios (admin)
- `PATCH /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

### Canales
- `GET /api/channels` - Obtener canales disponibles
- `POST /api/channels` - Crear canal (admin)
- `PUT /api/channels/:id` - Actualizar canal (admin)
- `DELETE /api/channels/:id` - Eliminar canal (admin)

### Mensajes
- `GET /api/messages/:channelId` - Obtener mensajes de un canal
- `POST /api/messages` - Enviar mensaje

### Anuncios
- `GET /api/announcements` - Obtener anuncios
- `POST /api/announcements` - Crear anuncio (admin)
- `DELETE /api/announcements/:id` - Eliminar anuncio (admin)

### Sugerencias
- `POST /api/suggestions` - Enviar sugerencia
- `GET /api/suggestions` - Obtener sugerencias (admin)

## Contribución
1. Fork del repositorio
2. Crear rama para nueva funcionalidad (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## Licencia
Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para más detalles. 