# Diagramas de Secuencia - Chat Corporativo

## 1. Autenticación de Usuario

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant B as Backend
    participant DB as MongoDB
    
    U->>F: Ingresa email/password
    F->>B: POST /login
    B->>DB: Buscar usuario por email
    DB-->>B: Datos del usuario
    B->>B: Verificar password (bcrypt)
    B->>B: Generar JWT (24h)
    B-->>F: Token + datos usuario
    F->>F: Guardar token en localStorage
    F-->>U: Redirigir a /chat
```

## 2. Envío de Mensaje en Tiempo Real

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant S as Socket.IO
    participant B as Backend
    participant DB as MongoDB
    
    U->>F: Escribe mensaje
    F->>S: send_message(channelId, text, userId)
    S->>B: Validar userId y canal
    B->>DB: Verificar acceso al canal
    DB-->>B: Permisos confirmados
    B->>DB: Guardar mensaje
    DB-->>B: Mensaje guardado
    B->>B: Popular usuario
    B->>S: Emitir a canal
    S->>F: new_message(data)
    F-->>U: Mostrar mensaje en chat
```

## 3. Unirse a Canal

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant S as Socket.IO
    participant B as Backend
    participant DB as MongoDB
    
    U->>F: Selecciona canal
    F->>B: GET /api/channels
    B->>DB: Buscar canales disponibles
    DB-->>B: Lista de canales
    B-->>F: Canales permitidos
    F->>S: join_channel(channelId)
    S->>B: Validar acceso
    B->>DB: Obtener historial del canal
    DB-->>B: Mensajes históricos
    B->>S: message_history(messages)
    S-->>F: Historial del canal
    F-->>U: Mostrar chat del canal
```

## 4. Crear Canal (Admin)

```mermaid
sequenceDiagram
    participant A as Admin
    participant F as Frontend
    participant B as Backend
    participant DB as MongoDB
    participant S as Socket.IO
    
    A->>F: Formulario crear canal
    F->>B: POST /api/channels
    B->>B: Verificar token JWT
    B->>B: Verificar rol admin
    B->>DB: Crear canal
    DB-->>B: Canal creado
    B->>S: Emitir dashboard_update
    B-->>F: Canal creado
    F-->>A: Confirmación
```

## 5. Enviar Sugerencia

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant B as Backend
    participant DB as MongoDB
    
    U->>F: Escribe sugerencia
    F->>B: POST /api/suggestions
    B->>B: Verificar token JWT
    B->>B: Encriptar contenido
    B->>DB: Guardar sugerencia
    DB-->>B: Sugerencia guardada
    B-->>F: Confirmación
    F-->>U: "Sugerencia enviada"
```

## 6. Revisar Sugerencias (Admin)

```mermaid
sequenceDiagram
    participant A as Admin
    participant F as Frontend
    participant B as Backend
    participant DB as MongoDB
    
    A->>F: Accede a panel admin
    F->>B: GET /api/suggestions
    B->>B: Verificar rol admin
    B->>DB: Obtener sugerencias
    DB-->>B: Sugerencias encriptadas
    B->>B: Desencriptar contenido
    B-->>F: Lista de sugerencias
    F-->>A: Mostrar sugerencias
    
    A->>F: Cambiar estado
    F->>B: PUT /api/suggestions/:id/status
    B->>DB: Actualizar estado
    DB-->>B: Estado actualizado
    B-->>F: Confirmación
    F-->>A: Estado actualizado
```

## 7. Crear Anuncio (Admin)

```mermaid
sequenceDiagram
    participant A as Admin
    participant F as Frontend
    participant B as Backend
    participant DB as MongoDB
    
    A->>F: Formulario anuncio
    F->>B: POST /api/announcements
    B->>B: Verificar token JWT
    B->>B: Verificar rol admin
    B->>B: Validar título y contenido
    B->>DB: Guardar anuncio
    DB-->>B: Anuncio guardado
    B-->>F: Anuncio creado
    F-->>A: Confirmación
```

## 8. Ver Dashboard (Admin)

```mermaid
sequenceDiagram
    participant A as Admin
    participant F as Frontend
    participant B as Backend
    participant DB as MongoDB
    
    A->>F: Accede a dashboard
    F->>B: GET /api/admin/dashboard
    B->>B: Verificar rol admin
    B->>DB: Contar usuarios totales
    B->>DB: Contar canales activos
    B->>DB: Contar mensajes totales
    B->>DB: Agregación actividad por canal
    B->>DB: Agregación top usuarios
    B->>DB: Actividad últimos 7 días
    DB-->>B: Métricas consolidadas
    B-->>F: Datos del dashboard
    F-->>A: Mostrar gráficos y estadísticas
```

## 9. Gestión de Usuarios (Admin)

```mermaid
sequenceDiagram
    participant A as Admin
    participant F as Frontend
    participant B as Backend
    participant DB as MongoDB
    
    A->>F: Lista usuarios
    F->>B: GET /api/users
    B->>B: Verificar rol admin
    B->>DB: Obtener todos los usuarios
    DB-->>B: Lista de usuarios
    B-->>F: Usuarios (sin passwords)
    F-->>A: Mostrar tabla usuarios
    
    A->>F: Actualizar usuario
    F->>B: PATCH /api/users/:id
    B->>B: Verificar rol admin
    B->>DB: Actualizar usuario
    DB-->>B: Usuario actualizado
    B-->>F: Confirmación
    F-->>A: Usuario actualizado
```

## 10. Phonebook - Buscar Contacto

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant B as Backend
    participant PB as PhoneBookController
    
    U->>F: Busca contacto
    F->>B: GET /api/phonebook/search?q=nombre
    B->>B: Verificar token JWT
    B->>PB: searchDirectory(query)
    PB->>PB: Buscar en directorio
    PB-->>B: Resultados de búsqueda
    B-->>F: Contactos encontrados
    F-->>U: Mostrar resultados
```

## Notas sobre los Flujos

### Autenticación
- JWT con expiración de 24 horas
- Verificación de usuario activo
- Almacenamiento seguro del token

### Tiempo Real
- Socket.IO para comunicación bidireccional
- Validación de permisos por canal
- Persistencia en MongoDB

### Seguridad
- Verificación de roles en cada endpoint
- Encriptación de sugerencias
- Validación de acceso a canales

### Administración
- Dashboard con métricas en tiempo real
- Gestión completa de usuarios y canales
- Control de estados de sugerencias