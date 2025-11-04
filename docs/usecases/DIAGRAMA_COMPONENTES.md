# Diagrama de Componentes - Chat Corporativo

## Arquitectura de Componentes Principal

```mermaid
graph TB
    %% Frontend Components
    subgraph "Frontend Layer"
        subgraph "Vue.js Application"
            VueApp[📱 Vue App]
            VueRouter[🛣️ Vue Router]
            VueComponents[🧩 Vue Components]
            VueServices[🔧 Vue Services]
        end
        
        subgraph "UI Components"
            LoginForm[🔐 Login Form]
            ChatInterface[💬 Chat Interface]
            AdminPanel[⚙️ Admin Panel]
            PhoneBook[📞 Phone Book]
        end
        
        subgraph "Client Services"
            SocketClient[🔌 Socket.IO Client]
            HTTPClient[🌐 HTTP Client]
            AuthService[🔑 Auth Service]
            ChatService[💬 Chat Service]
        end
    end

    %% Backend Components
    subgraph "Backend Layer"
        subgraph "Express Application"
            ExpressApp[🚀 Express App]
            Middleware[🛡️ Middleware]
            Routes[🛤️ Routes]
            Controllers[🎮 Controllers]
        end
        
        subgraph "API Routes"
            UserRoutes[👤 User Routes]
            ChannelRoutes[📺 Channel Routes]
            MessageRoutes[💬 Message Routes]
            AnnouncementRoutes[📢 Announcement Routes]
            SuggestionRoutes[💡 Suggestion Routes]
            DashboardRoutes[📊 Dashboard Routes]
            PhoneBookRoutes[📞 PhoneBook Routes]
        end
        
        subgraph "Business Logic"
            UserController[👤 User Controller]
            PhoneBookController[📞 PhoneBook Controller]
            AuthMiddleware[🔐 Auth Middleware]
            ValidationService[✅ Validation Service]
        end
        
        subgraph "Real-time Services"
            SocketServer[🔌 Socket.IO Server]
            SocketHandler[🎯 Socket Handler]
            ChannelManager[📺 Channel Manager]
            MessageBroadcaster[📢 Message Broadcaster]
        end
        
        subgraph "Utility Services"
            EncryptionService[🔒 Encryption Service]
            JWTService[🎫 JWT Service]
            EmailService[📧 Email Service]
            LoggingService[📝 Logging Service]
        end
    end

    %% Data Layer
    subgraph "Data Layer"
        subgraph "Database Models"
            UserModel[👤 User Model]
            ChannelModel[📺 Channel Model]
            MessageModel[💬 Message Model]
            AnnouncementModel[📢 Announcement Model]
            SuggestionModel[💡 Suggestion Model]
        end
        
        subgraph "Database Services"
            MongoDB[🍃 MongoDB]
            MongooseODM[🔗 Mongoose ODM]
            DatabaseConnection[🔌 DB Connection]
        end
        
        subgraph "Cache Layer"
            Redis[⚡ Redis]
            SessionStore[💾 Session Store]
            CacheManager[🗄️ Cache Manager]
        end
    end

    %% External Services
    subgraph "External Services"
        CDN[🌍 CDN]
        LoadBalancer[⚖️ Load Balancer]
        FileStorage[📁 File Storage]
        MonitoringService[📊 Monitoring Service]
    end

    %% Connections
    VueApp --> VueRouter
    VueApp --> VueComponents
    VueApp --> VueServices
    
    LoginForm --> AuthService
    ChatInterface --> ChatService
    AdminPanel --> HTTPClient
    PhoneBook --> HTTPClient
    
    SocketClient --> SocketServer
    HTTPClient --> ExpressApp
    AuthService --> JWTService
    ChatService --> SocketClient
    
    ExpressApp --> Middleware
    ExpressApp --> Routes
    Routes --> Controllers
    
    UserRoutes --> UserController
    ChannelRoutes --> Controllers
    MessageRoutes --> Controllers
    AnnouncementRoutes --> Controllers
    SuggestionRoutes --> Controllers
    DashboardRoutes --> Controllers
    PhoneBookRoutes --> PhoneBookController
    
    Controllers --> UserModel
    Controllers --> ChannelModel
    Controllers --> MessageModel
    Controllers --> AnnouncementModel
    Controllers --> SuggestionModel
    
    SocketServer --> SocketHandler
    SocketHandler --> ChannelManager
    SocketHandler --> MessageBroadcaster
    
    UserModel --> MongooseODM
    ChannelModel --> MongooseODM
    MessageModel --> MongooseODM
    AnnouncementModel --> MongooseODM
    SuggestionModel --> MongooseODM
    
    MongooseODM --> MongoDB
    SessionStore --> Redis
    CacheManager --> Redis
```

## Componentes del Frontend

```mermaid
graph TB
    subgraph "Vue.js Frontend Architecture"
        subgraph "Views Layer"
            LoginView[🔐 Login View]
            ChatView[💬 Chat View]
            AdminView[⚙️ Admin View]
        end
        
        subgraph "Components Layer"
            ChatComponent[💬 Chat Component]
            MessageComponent[📝 Message Component]
            UserListComponent[👥 User List Component]
            ChannelListComponent[📺 Channel List Component]
            AdminDashboardComponent[📊 Admin Dashboard Component]
            SuggestionFormComponent[💡 Suggestion Form Component]
            AnnouncementComponent[📢 Announcement Component]
        end
        
        subgraph "Services Layer"
            APIService[🌐 API Service]
            SocketService[🔌 Socket Service]
            AuthService[🔑 Auth Service]
            NotificationService[🔔 Notification Service]
        end
        
        subgraph "State Management"
            VuexStore[🗄️ Vuex Store]
            UserState[👤 User State]
            ChatState[💬 Chat State]
            AdminState[⚙️ Admin State]
        end
        
        subgraph "Router Layer"
            RouterConfig[🛣️ Router Config]
            RouteGuards[🛡️ Route Guards]
            NavigationService[🧭 Navigation Service]
        end
    end

    LoginView --> AuthService
    ChatView --> ChatComponent
    AdminView --> AdminDashboardComponent
    
    ChatComponent --> MessageComponent
    ChatComponent --> UserListComponent
    ChatComponent --> ChannelListComponent
    
    APIService --> SocketService
    AuthService --> UserState
    SocketService --> ChatState
    
    VuexStore --> UserState
    VuexStore --> ChatState
    VuexStore --> AdminState
    
    RouterConfig --> RouteGuards
    RouteGuards --> AuthService
```

## Componentes del Backend

```mermaid
graph TB
    subgraph "Node.js Backend Architecture"
        subgraph "Application Layer"
            AppEntry[🚀 App Entry Point]
            ServerConfig[⚙️ Server Configuration]
            MiddlewareStack[🛡️ Middleware Stack]
        end
        
        subgraph "Route Layer"
            RouteManager[🛤️ Route Manager]
            RouteHandlers[📋 Route Handlers]
            RouteMiddleware[🔒 Route Middleware]
        end
        
        subgraph "Controller Layer"
            BaseController[🎮 Base Controller]
            UserController[👤 User Controller]
            ChannelController[📺 Channel Controller]
            MessageController[💬 Message Controller]
            AdminController[⚙️ Admin Controller]
        end
        
        subgraph "Service Layer"
            BusinessLogic[🧠 Business Logic]
            ValidationService[✅ Validation Service]
            EncryptionService[🔒 Encryption Service]
            NotificationService[📢 Notification Service]
        end
        
        subgraph "Data Access Layer"
            Repository[🗄️ Repository]
            ModelFactory[🏭 Model Factory]
            QueryBuilder[🔍 Query Builder]
        end
        
        subgraph "Infrastructure Layer"
            DatabaseConnection[🔌 Database Connection]
            CacheConnection[⚡ Cache Connection]
            SocketConnection[🔌 Socket Connection]
            LoggingSystem[📝 Logging System]
        end
    end

    AppEntry --> ServerConfig
    ServerConfig --> MiddlewareStack
    MiddlewareStack --> RouteManager
    
    RouteManager --> RouteHandlers
    RouteHandlers --> RouteMiddleware
    RouteMiddleware --> BaseController
    
    BaseController --> UserController
    BaseController --> ChannelController
    BaseController --> MessageController
    BaseController --> AdminController
    
    UserController --> BusinessLogic
    ChannelController --> BusinessLogic
    MessageController --> BusinessLogic
    AdminController --> BusinessLogic
    
    BusinessLogic --> ValidationService
    BusinessLogic --> EncryptionService
    BusinessLogic --> NotificationService
    
    ValidationService --> Repository
    EncryptionService --> Repository
    NotificationService --> Repository
    
    Repository --> ModelFactory
    ModelFactory --> QueryBuilder
    QueryBuilder --> DatabaseConnection
    
    DatabaseConnection --> CacheConnection
    CacheConnection --> SocketConnection
    SocketConnection --> LoggingSystem
```

## Componentes de Base de Datos

```mermaid
graph TB
    subgraph "Database Architecture"
        subgraph "MongoDB Collections"
            UsersCollection[👤 Users Collection]
            ChannelsCollection[📺 Channels Collection]
            MessagesCollection[💬 Messages Collection]
            AnnouncementsCollection[📢 Announcements Collection]
            SuggestionsCollection[💡 Suggestions Collection]
        end
        
        subgraph "Mongoose Models"
            UserSchema[👤 User Schema]
            ChannelSchema[📺 Channel Schema]
            MessageSchema[💬 Message Schema]
            AnnouncementSchema[📢 Announcement Schema]
            SuggestionSchema[💡 Suggestion Schema]
        end
        
        subgraph "Database Operations"
            CRUDOperations[🔄 CRUD Operations]
            QueryOperations[🔍 Query Operations]
            AggregationOperations[📊 Aggregation Operations]
            IndexOperations[📇 Index Operations]
        end
        
        subgraph "Data Validation"
            SchemaValidation[✅ Schema Validation]
            FieldValidation[🔍 Field Validation]
            BusinessRules[📋 Business Rules]
        end
    end

    UsersCollection --> UserSchema
    ChannelsCollection --> ChannelSchema
    MessagesCollection --> MessageSchema
    AnnouncementsCollection --> AnnouncementSchema
    SuggestionsCollection --> SuggestionSchema
    
    UserSchema --> CRUDOperations
    ChannelSchema --> CRUDOperations
    MessageSchema --> CRUDOperations
    AnnouncementSchema --> CRUDOperations
    SuggestionSchema --> CRUDOperations
    
    CRUDOperations --> QueryOperations
    QueryOperations --> AggregationOperations
    AggregationOperations --> IndexOperations
    
    SchemaValidation --> FieldValidation
    FieldValidation --> BusinessRules
    BusinessRules --> CRUDOperations
```

## Componentes de Tiempo Real

```mermaid
graph TB
    subgraph "Real-time Architecture"
        subgraph "Socket.IO Layer"
            SocketServer[🔌 Socket Server]
            SocketClient[📱 Socket Client]
            SocketManager[🎯 Socket Manager]
        end
        
        subgraph "Event Handlers"
            ConnectionHandler[🔗 Connection Handler]
            MessageHandler[💬 Message Handler]
            ChannelHandler[📺 Channel Handler]
            DisconnectionHandler[❌ Disconnection Handler]
        end
        
        subgraph "Room Management"
            RoomManager[🏠 Room Manager]
            ChannelRooms[📺 Channel Rooms]
            UserRooms[👤 User Rooms]
            AdminRooms[⚙️ Admin Rooms]
        end
        
        subgraph "Message Broadcasting"
            MessageBroadcaster[📢 Message Broadcaster]
            ChannelBroadcaster[📺 Channel Broadcaster]
            UserBroadcaster[👤 User Broadcaster]
            AdminBroadcaster[⚙️ Admin Broadcaster]
        end
        
        subgraph "Real-time Data"
            OnlineUsers[👥 Online Users]
            ActiveChannels[📺 Active Channels]
            MessageQueue[📬 Message Queue]
            EventLog[📝 Event Log]
        end
    end

    SocketServer --> SocketClient
    SocketServer --> SocketManager
    SocketManager --> ConnectionHandler
    
    ConnectionHandler --> MessageHandler
    MessageHandler --> ChannelHandler
    ChannelHandler --> DisconnectionHandler
    
    MessageHandler --> RoomManager
    ChannelHandler --> RoomManager
    RoomManager --> ChannelRooms
    RoomManager --> UserRooms
    RoomManager --> AdminRooms
    
    MessageHandler --> MessageBroadcaster
    ChannelHandler --> ChannelBroadcaster
    UserBroadcaster --> UserRooms
    AdminBroadcaster --> AdminRooms
    
    MessageBroadcaster --> OnlineUsers
    ChannelBroadcaster --> ActiveChannels
    UserBroadcaster --> MessageQueue
    AdminBroadcaster --> EventLog
```

## Componentes de Seguridad

```mermaid
graph TB
    subgraph "Security Architecture"
        subgraph "Authentication"
            JWTService[🎫 JWT Service]
            PasswordService[🔐 Password Service]
            SessionService[💾 Session Service]
            TokenValidator[✅ Token Validator]
        end
        
        subgraph "Authorization"
            RoleManager[👥 Role Manager]
            PermissionChecker[🔍 Permission Checker]
            AccessController[🛡️ Access Controller]
            RouteProtector[🛤️ Route Protector]
        end
        
        subgraph "Data Protection"
            EncryptionService[🔒 Encryption Service]
            DataSanitizer[🧹 Data Sanitizer]
            InputValidator[✅ Input Validator]
            SQLInjectionProtector[🛡️ SQL Injection Protector]
        end
        
        subgraph "Security Monitoring"
            SecurityLogger[📝 Security Logger]
            IntrusionDetector[🚨 Intrusion Detector]
            RateLimiter[⏱️ Rate Limiter]
            SecurityAuditor[🔍 Security Auditor]
        end
    end

    JWTService --> PasswordService
    PasswordService --> SessionService
    SessionService --> TokenValidator
    
    TokenValidator --> RoleManager
    RoleManager --> PermissionChecker
    PermissionChecker --> AccessController
    AccessController --> RouteProtector
    
    EncryptionService --> DataSanitizer
    DataSanitizer --> InputValidator
    InputValidator --> SQLInjectionProtector
    
    SecurityLogger --> IntrusionDetector
    IntrusionDetector --> RateLimiter
    RateLimiter --> SecurityAuditor
    SecurityAuditor --> SecurityLogger
```

## Notas sobre los Componentes

### **Frontend (Vue.js)**
- **Views**: Páginas principales (Login, Chat, Admin)
- **Components**: Elementos reutilizables
- **Services**: Lógica de negocio del cliente
- **State**: Gestión de estado con Vuex

### **Backend (Node.js)**
- **Controllers**: Lógica de negocio
- **Services**: Servicios especializados
- **Models**: Esquemas de base de datos
- **Middleware**: Funciones de procesamiento

### **Base de Datos**
- **MongoDB**: Almacenamiento principal
- **Redis**: Cache y sesiones
- **Mongoose**: ODM para MongoDB

### **Tiempo Real**
- **Socket.IO**: Comunicación bidireccional
- **Rooms**: Gestión de salas por canal
- **Events**: Manejo de eventos en tiempo real

### **Seguridad**
- **JWT**: Autenticación stateless
- **Roles**: Control de acceso
- **Encriptación**: Protección de datos sensibles
- **Validación**: Sanitización de entrada