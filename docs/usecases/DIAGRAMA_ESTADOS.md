# Diagrama de Estados - Chat Corporativo

## Estados de Usuario

```mermaid
stateDiagram-v2
    [*] --> Inactivo
    Inactivo --> Activo : Login exitoso
    Activo --> Inactivo : Logout / Token expirado
    Activo --> Suspendido : Admin suspende
    Suspendido --> Activo : Admin reactiva
    Suspendido --> Inactivo : Admin elimina
    
    state Activo {
        [*] --> Conectado
        Conectado --> EnChat : Unirse a canal
        EnChat --> Conectado : Salir del canal
        Conectado --> Desconectado : Cerrar sesión
        Desconectado --> Conectado : Re-login
    }
```

## Estados de Canal

```mermaid
stateDiagram-v2
    [*] --> Creado
    Creado --> Activo : Admin activa
    Activo --> Inactivo : Admin desactiva
    Inactivo --> Activo : Admin reactiva
    Activo --> Eliminado : Admin elimina
    Eliminado --> [*]
    
    state Activo {
        [*] --> Disponible
        Disponible --> EnUso : Usuario se une
        EnUso --> Disponible : Usuario sale
    }
```

## Estados de Mensaje

```mermaid
stateDiagram-v2
    [*] --> Creado
    Creado --> Enviado : Socket.IO emite
    Enviado --> Leído : Usuario recibe
    Leído --> Archivado : Tiempo transcurre
    Archivado --> [*] : Limpieza automática
```

## Estados de Sugerencia

```mermaid
stateDiagram-v2
    [*] --> Pendiente
    Pendiente --> Revisada : Admin revisa
    Revisada --> Implementada : Admin implementa
    Revisada --> Rechazada : Admin rechaza
    Implementada --> [*]
    Rechazada --> [*]
```

## Estados de Sesión WebSocket

```mermaid
stateDiagram-v2
    [*] --> Desconectado
    Desconectado --> Conectando : Usuario inicia
    Conectando --> Conectado : Conexión exitosa
    Conectado --> EnCanal : join_channel
    EnCanal --> Conectado : leave_channel
    Conectado --> Reconectando : Pérdida de conexión
    Reconectando --> Conectado : Reconexión exitosa
    Reconectando --> Desconectado : Fallo de reconexión
    Conectado --> Desconectado : Usuario cierra
```

## Estados del Sistema (Dashboard)

```mermaid
stateDiagram-v2
    [*] --> Iniciando
    Iniciando --> ConectandoDB : Cargar variables
    ConectandoDB --> ConectadoDB : MongoDB OK
    ConectandoDB --> ErrorDB : Fallo conexión
    ConectadoDB --> IniciandoSocket : Socket.IO setup
    IniciandoSocket --> Listo : Servidor activo
    ErrorDB --> [*] : Sistema falla
    
    state Listo {
        [*] --> Operativo
        Operativo --> Mantenimiento : Admin detiene
        Mantenimiento --> Operativo : Admin reanuda
    }
```

## Estados de Autenticación

```mermaid
stateDiagram-v2
    [*] --> NoAutenticado
    NoAutenticado --> Autenticando : POST /login
    Autenticando --> Autenticado : Credenciales válidas
    Autenticando --> NoAutenticado : Credenciales inválidas
    Autenticado --> TokenExpirado : 24h transcurren
    TokenExpirado --> NoAutenticado : Token inválido
    Autenticado --> NoAutenticado : Logout explícito
    
    state Autenticado {
        [*] --> Usuario
        Usuario --> Admin : Verificar rol
        Admin --> Usuario : Cambio de rol
    }
```

## Notas sobre los Estados

### Usuario
- **Inactivo**: Usuario no autenticado o eliminado
- **Activo**: Usuario autenticado con token válido
- **Suspendido**: Usuario temporalmente deshabilitado por admin

### Canal
- **Creado**: Canal recién creado, no disponible aún
- **Activo**: Canal disponible para uso
- **Inactivo**: Canal deshabilitado temporalmente
- **Eliminado**: Canal eliminado permanentemente

### Mensaje
- **Creado**: Mensaje guardado en BD
- **Enviado**: Mensaje emitido via Socket.IO
- **Leído**: Mensaje recibido por usuarios
- **Archivado**: Mensaje antiguo para limpieza

### Sugerencia
- **Pendiente**: Sugerencia nueva sin revisar
- **Revisada**: Admin ha revisado la sugerencia
- **Implementada**: Sugerencia aplicada
- **Rechazada**: Sugerencia descartada

### WebSocket
- Estados de conexión en tiempo real
- Manejo de reconexión automática
- Gestión de salas por canal

### Sistema
- Estados de inicialización del servidor
- Conexión a base de datos
- Configuración de Socket.IO