# Diagramas de Actividad - Chat Corporativo

## 1. Proceso de Autenticación

```mermaid
flowchart TD
    A[Usuario accede al sistema] --> B{¿Tiene token válido?}
    B -->|Sí| C[Redirigir a /chat]
    B -->|No| D[Mostrar formulario login]
    D --> E[Usuario ingresa credenciales]
    E --> F[Validar email y password]
    F --> G{¿Credenciales válidas?}
    G -->|No| H[Mostrar error]
    H --> E
    G -->|Sí| I{¿Usuario activo?}
    I -->|No| J[Mostrar: Usuario inactivo]
    I -->|Sí| K[Generar JWT]
    K --> L[Guardar token en localStorage]
    L --> C
    C --> M[Iniciar sesión WebSocket]
```

## 2. Envío de Mensaje

```mermaid
flowchart TD
    A[Usuario escribe mensaje] --> B[Validar mensaje no vacío]
    B --> C{¿Mensaje válido?}
    C -->|No| D[Mostrar error de validación]
    C -->|Sí| E[Verificar acceso al canal]
    E --> F{¿Tiene acceso?}
    F -->|No| G[Mostrar: Sin acceso al canal]
    F -->|Sí| H[Enviar via Socket.IO]
    H --> I[Backend valida userId]
    I --> J{¿UserId válido?}
    J -->|No| K[Error: Usuario inválido]
    J -->|Sí| L[Guardar en MongoDB]
    L --> M[Popular datos del usuario]
    M --> N[Emitir a todos en el canal]
    N --> O[Actualizar interfaz de chat]
    O --> P[Mostrar mensaje enviado]
```

## 3. Unirse a Canal

```mermaid
flowchart TD
    A[Usuario selecciona canal] --> B[Solicitar canales disponibles]
    B --> C[Backend verifica token JWT]
    C --> D{¿Token válido?}
    D -->|No| E[Redirigir a login]
    D -->|Sí| F[Obtener canales del usuario]
    F --> G[Filtrar por permisos]
    G --> H{¿Canal disponible?}
    H -->|No| I[Mostrar: Sin acceso]
    H -->|Sí| J[Unirse via Socket.IO]
    J --> K[Backend valida acceso]
    K --> L{¿Acceso permitido?}
    L -->|No| M[Error: Sin permisos]
    L -->|Sí| N[Cargar historial del canal]
    N --> O[Emitir historial al usuario]
    O --> P[Mostrar chat del canal]
    P --> Q[Escuchar nuevos mensajes]
```

## 4. Crear Canal (Admin)

```mermaid
flowchart TD
    A[Admin accede a gestión] --> B[Verificar rol admin]
    B --> C{¿Es admin?}
    C -->|No| D[Error: Sin permisos]
    C -->|Sí| E[Mostrar formulario crear canal]
    E --> F[Admin completa datos]
    F --> G[Validar campos requeridos]
    G --> H{¿Datos válidos?}
    H -->|No| I[Mostrar errores de validación]
    I --> F
    H -->|Sí| J[Crear canal en BD]
    J --> K[Asignar usuarios permitidos]
    K --> L[Emitir actualización dashboard]
    L --> M[Confirmar creación]
    M --> N[Actualizar lista de canales]
```

## 5. Enviar Sugerencia

```mermaid
flowchart TD
    A[Usuario accede a sugerencias] --> B[Mostrar formulario]
    B --> C[Usuario escribe sugerencia]
    C --> D[Validar contenido no vacío]
    D --> E{¿Contenido válido?}
    E -->|No| F[Mostrar error de validación]
    F --> C
    E -->|Sí| G[Encriptar contenido]
    G --> H[Guardar en BD]
    H --> I[Confirmar envío]
    I --> J[Mostrar mensaje de éxito]
    J --> K[Limpiar formulario]
```

## 6. Revisar Sugerencias (Admin)

```mermaid
flowchart TD
    A[Admin accede a panel] --> B[Verificar rol admin]
    B --> C{¿Es admin?}
    C -->|No| D[Error: Sin permisos]
    C -->|Sí| E[Cargar sugerencias]
    E --> F[Desencriptar contenido]
    F --> G[Mostrar lista de sugerencias]
    G --> H[Admin selecciona sugerencia]
    H --> I[Mostrar detalles]
    I --> J[Admin cambia estado]
    J --> K{¿Nuevo estado válido?}
    K -->|No| L[Mostrar error de estado]
    K -->|Sí| M[Actualizar en BD]
    M --> N[Confirmar cambio]
    N --> O[Actualizar lista]
```

## 7. Crear Anuncio (Admin)

```mermaid
flowchart TD
    A[Admin accede a anuncios] --> B[Verificar rol admin]
    B --> C{¿Es admin?}
    C -->|No| D[Error: Sin permisos]
    C -->|Sí| E[Mostrar formulario]
    E --> F[Admin completa datos]
    F --> G[Validar título y contenido]
    G --> H{¿Datos válidos?}
    H -->|No| I[Mostrar errores]
    I --> F
    H -->|Sí| J[Asignar autor]
    J --> K[Guardar en BD]
    K --> L[Confirmar creación]
    L --> M[Actualizar lista de anuncios]
```

## 8. Ver Dashboard (Admin)

```mermaid
flowchart TD
    A[Admin accede a dashboard] --> B[Verificar rol admin]
    B --> C{¿Es admin?}
    C -->|No| D[Error: Sin permisos]
    C -->|Sí| E[Iniciar recopilación de datos]
    E --> F[Contar usuarios totales]
    F --> G[Contar canales activos]
    G --> H[Contar mensajes totales]
    H --> I[Calcular actividad por canal]
    I --> J[Obtener top usuarios]
    J --> K[Calcular actividad diaria]
    K --> L[Generar datos de conexiones]
    L --> M[Consolidar métricas]
    M --> N[Mostrar gráficos]
    N --> O[Actualizar en tiempo real]
```

## 9. Gestión de Usuarios (Admin)

```mermaid
flowchart TD
    A[Admin accede a usuarios] --> B[Verificar rol admin]
    B --> C{¿Es admin?}
    C -->|No| D[Error: Sin permisos]
    C -->|Sí| E[Cargar lista de usuarios]
    E --> F[Mostrar tabla de usuarios]
    F --> G[Admin selecciona acción]
    G --> H{¿Qué acción?}
    H -->|Ver| I[Mostrar detalles usuario]
    H -->|Editar| J[Mostrar formulario edición]
    H -->|Eliminar| K[Confirmar eliminación]
    J --> L[Validar datos actualizados]
    L --> M{¿Datos válidos?}
    M -->|No| N[Mostrar errores]
    M -->|Sí| O[Actualizar en BD]
    K --> P{¿Confirmar?}
    P -->|No| F
    P -->|Sí| Q[Eliminar de BD]
    O --> R[Actualizar lista]
    Q --> R
    I --> F
```

## 10. Búsqueda en Phonebook

```mermaid
flowchart TD
    A[Usuario accede a phonebook] --> B[Verificar autenticación]
    B --> C{¿Autenticado?}
    C -->|No| D[Redirigir a login]
    C -->|Sí| E[Mostrar interfaz búsqueda]
    E --> F[Usuario ingresa término]
    F --> G[Validar término de búsqueda]
    G --> H{¿Término válido?}
    H -->|No| I[Mostrar error]
    I --> F
    H -->|Sí| J[Ejecutar búsqueda]
    J --> K[Filtrar resultados]
    K --> L{¿Hay resultados?}
    L -->|No| M[Mostrar: Sin resultados]
    L -->|Sí| N[Mostrar lista de contactos]
    N --> O[Usuario selecciona contacto]
    O --> P[Mostrar detalles del contacto]
```

## 11. Flujo de Reconexión WebSocket

```mermaid
flowchart TD
    A[Conexión WebSocket activa] --> B[Detectar pérdida de conexión]
    B --> C[Iniciar proceso de reconexión]
    C --> D[Esperar intervalo de tiempo]
    D --> E[Intentar reconectar]
    E --> F{¿Reconexión exitosa?}
    F -->|No| G{¿Máximo de intentos?}
    G -->|No| H[Aumentar intervalo]
    H --> D
    G -->|Sí| I[Mostrar error de conexión]
    F -->|Sí| J[Restaurar suscripciones]
    J --> K[Sincronizar estado]
    K --> L[Notificar reconexión exitosa]
    L --> M[Reanudar operaciones normales]
```

## 12. Flujo de Validación de Permisos

```mermaid
flowchart TD
    A[Solicitud a endpoint protegido] --> B[Extraer token JWT]
    B --> C{¿Token presente?}
    C -->|No| D[Error 401: No autorizado]
    C -->|Sí| E[Verificar firma del token]
    E --> F{¿Token válido?}
    F -->|No| G[Error 403: Token inválido]
    F -->|Sí| H[Verificar expiración]
    H --> I{¿Token expirado?}
    I -->|Sí| J[Error 403: Token expirado]
    I -->|No| K[Obtener usuario de BD]
    K --> L{¿Usuario existe y activo?}
    L -->|No| M[Error 403: Usuario inactivo]
    L -->|Sí| N{¿Requiere rol admin?}
    N -->|No| O[Permitir acceso]
    N -->|Sí| P{¿Es admin?}
    P -->|No| Q[Error 403: Sin permisos admin]
    P -->|Sí| O
```

## Notas sobre los Flujos

### Puntos de Decisión Clave
- **Autenticación**: Token JWT válido y no expirado
- **Autorización**: Verificación de roles (admin/usuario)
- **Validación**: Campos requeridos y formatos correctos
- **Permisos**: Acceso a canales según configuración

### Manejo de Errores
- **401**: No autenticado
- **403**: Sin permisos o token inválido
- **400**: Datos de entrada inválidos
- **404**: Recurso no encontrado
- **500**: Error interno del servidor

### Flujos Asíncronos
- **WebSocket**: Comunicación en tiempo real
- **Reconexión**: Manejo automático de desconexiones
- **Validación**: Verificaciones en múltiples capas