# Diagrama de Clases - Chat Corporativo

## Diagrama Principal del Sistema

```mermaid
classDiagram
    %% Entidades principales
    class User {
        +ObjectId _id
        +String name
        +String lastname
        +String email
        +String password
        +String role
        +Boolean active
        +Date createdAt
        +Date updatedAt
        
        +save()
        +findById(id)
        +findByEmail(email)
        +updateUser(data)
        +deleteUser()
        +validatePassword(password)
        +hashPassword()
    }

    class Channel {
        +ObjectId _id
        +String name
        +String description
        +Boolean isPublic
        +Boolean active
        +ObjectId createdBy
        +Array~ObjectId~ allowedUsers
        +Date createdAt
        +Date updatedAt
        
        +save()
        +findById(id)
        +findPublicChannels()
        +findUserChannels(userId)
        +addAllowedUser(userId)
        +removeAllowedUser(userId)
        +updateChannel(data)
        +deleteChannel()
    }

    class Message {
        +ObjectId _id
        +String text
        +ObjectId userId
        +ObjectId channel
        +Date createdAt
        +Date updatedAt
        
        +save()
        +findByChannel(channelId)
        +findByUser(userId)
        +createMessage(data)
        +deleteMessage()
        +getMessageHistory(channelId)
    }

    class Announcement {
        +ObjectId _id
        +String title
        +String content
        +ObjectId author
        +Boolean active
        +Date timestamp
        +Date createdAt
        +Date updatedAt
        
        +save()
        +findById(id)
        +findActiveAnnouncements()
        +createAnnouncement(data)
        +updateAnnouncement(data)
        +deleteAnnouncement()
    }

    class Suggestion {
        +ObjectId _id
        +String content
        +String status
        +Date timestamp
        +Date createdAt
        +Date updatedAt
        
        +save()
        +findById(id)
        +findByStatus(status)
        +createSuggestion(data)
        +updateStatus(status)
        +deleteSuggestion()
    }

    %% Controladores
    class UserController {
        +validateToken(req, res, next)
        +registerUser(req, res)
        +loginUser(req, res)
        +getAllUsers(req, res)
        +getUserById(req, res)
        +updateUser(req, res)
        +deleteUser(req, res)
    }

    class PhoneBookController {
        +getDirectory(req, res)
        +searchDirectory(req, res)
    }

    %% Middleware
    class AuthMiddleware {
        +authenticateToken(req, res, next)
        +isAdmin(req, res, next)
        +checkChannelAccess(req, res, next)
    }

    %% Servicios
    class SocketService {
        +init(server)
        +getIO()
        +handleConnection(socket)
        +joinChannel(socket, channelId)
        +sendMessage(socket, data)
        +emitToChannel(channelId, event, data)
    }

    class EncryptionService {
        +encrypt(text)
        +decrypt(encryptedText)
        +generateKey()
    }

    %% Relaciones principales
    User ||--o{ Message : "envía"
    Channel ||--o{ Message : "contiene"
    User ||--o{ Channel : "crea"
    User ||--o{ Channel : "tiene acceso"
    User ||--o{ Announcement : "publica"
    User ||--o{ Suggestion : "envía"
    
    %% Relaciones de control
    UserController --> User : "maneja"
    PhoneBookController --> User : "consulta"
    AuthMiddleware --> User : "valida"
    SocketService --> Message : "transmite"
    SocketService --> Channel : "gestiona"
    EncryptionService --> Suggestion : "protege"
```

## Diagrama de Relaciones de Base de Datos

```mermaid
erDiagram
    USER {
        ObjectId _id PK
        string name
        string lastname
        string email UK
        string password
        string role
        boolean active
        date createdAt
        date updatedAt
    }
    
    CHANNEL {
        ObjectId _id PK
        string name
        string description
        boolean isPublic
        boolean active
        ObjectId createdBy FK
        array allowedUsers
        date createdAt
        date updatedAt
    }
    
    MESSAGE {
        ObjectId _id PK
        string text
        ObjectId userId FK
        ObjectId channel FK
        date createdAt
        date updatedAt
    }
    
    ANNOUNCEMENT {
        ObjectId _id PK
        string title
        string content
        ObjectId author FK
        boolean active
        date timestamp
        date createdAt
        date updatedAt
    }
    
    SUGGESTION {
        ObjectId _id PK
        string content
        string status
        date timestamp
        date createdAt
        date updatedAt
    }
    
    USER ||--o{ MESSAGE : "envía"
    CHANNEL ||--o{ MESSAGE : "contiene"
    USER ||--o{ CHANNEL : "crea"
    USER ||--o{ CHANNEL : "tiene acceso"
    USER ||--o{ ANNOUNCEMENT : "publica"
    USER ||--o{ SUGGESTION : "envía"
```

## Diagrama de Arquitectura de Capas

```mermaid
classDiagram
    %% Capa de Presentación
    class Frontend {
        +Vue.js 3
        +Vue Router
        +Socket.IO Client
        +Chart.js
        +FontAwesome
        
        +renderComponents()
        +handleUserInput()
        +manageState()
        +communicateWithBackend()
    }

    %% Capa de Control
    class ExpressApp {
        +Express Server
        +CORS Middleware
        +JSON Parser
        +Static Files
        
        +handleRequests()
        +serveStaticFiles()
        +configureMiddleware()
    }

    class RouteHandlers {
        +UserRoutes
        +ChannelRoutes
        +MessageRoutes
        +AnnouncementRoutes
        +SuggestionRoutes
        +DashboardRoutes
        +PhoneBookRoutes
        
        +processRequests()
        +validateInput()
        +callControllers()
    }

    %% Capa de Lógica de Negocio
    class Controllers {
        +UserController
        +PhoneBookController
        
        +businessLogic()
        +dataValidation()
        +responseFormatting()
    }

    class Services {
        +SocketService
        +EncryptionService
        +AuthService
        
        +coreFunctionality()
        +utilityFunctions()
    }

    %% Capa de Acceso a Datos
    class Models {
        +User Model
        +Channel Model
        +Message Model
        +Announcement Model
        +Suggestion Model
        
        +dataValidation()
        +schemaDefinition()
        +databaseOperations()
    }

    class Database {
        +MongoDB
        +Mongoose ODM
        
        +storeData()
        +retrieveData()
        +updateData()
        +deleteData()
    }

    %% Relaciones entre capas
    Frontend --> ExpressApp : "HTTP Requests"
    ExpressApp --> RouteHandlers : "Route to Handler"
    RouteHandlers --> Controllers : "Business Logic"
    Controllers --> Services : "Use Services"
    Controllers --> Models : "Data Operations"
    Models --> Database : "Persistence"
    Services --> Database : "Direct Access"
```

## Diagrama de Patrones de Diseño

```mermaid
classDiagram
    %% Patrón Repository
    class Repository {
        <<interface>>
        +save(entity)
        +findById(id)
        +findAll()
        +update(id, data)
        +delete(id)
    }

    class UserRepository {
        +save(user)
        +findById(id)
        +findByEmail(email)
        +findAll()
        +update(id, data)
        +delete(id)
    }

    class MessageRepository {
        +save(message)
        +findByChannel(channelId)
        +findByUser(userId)
        +findAll()
        +update(id, data)
        +delete(id)
    }

    %% Patrón Factory
    class ModelFactory {
        +createUser(data)
        +createChannel(data)
        +createMessage(data)
        +createAnnouncement(data)
        +createSuggestion(data)
    }

    %% Patrón Observer
    class EventEmitter {
        +on(event, callback)
        +emit(event, data)
        +removeListener(event, callback)
    }

    class SocketEventEmitter {
        +joinChannel(channelId)
        +leaveChannel(channelId)
        +sendMessage(data)
        +broadcastToChannel(channelId, data)
    }

    %% Relaciones
    Repository <|-- UserRepository
    Repository <|-- MessageRepository
    ModelFactory --> User : "creates"
    ModelFactory --> Channel : "creates"
    ModelFactory --> Message : "creates"
    EventEmitter <|-- SocketEventEmitter
```

## Notas sobre las Clases

### Entidades Principales
- **User**: Gestión de usuarios con roles y autenticación
- **Channel**: Canales de chat con permisos públicos/privados
- **Message**: Mensajes con relación a usuario y canal
- **Announcement**: Anuncios del sistema
- **Suggestion**: Sugerencias con encriptación

### Controladores
- **UserController**: Lógica de negocio para usuarios
- **PhoneBookController**: Gestión del directorio telefónico

### Servicios
- **SocketService**: Comunicación en tiempo real
- **EncryptionService**: Cifrado de datos sensibles
- **AuthService**: Autenticación y autorización

### Relaciones Clave
- **1:N** Usuario → Mensajes
- **1:N** Canal → Mensajes
- **N:M** Usuario ↔ Canal (acceso)
- **1:N** Usuario → Anuncios
- **1:N** Usuario → Sugerencias

### Patrones Implementados
- **Repository**: Abstracción de acceso a datos
- **Factory**: Creación de entidades
- **Observer**: Eventos en tiempo real
- **Middleware**: Autenticación y autorización