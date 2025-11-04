# Diagrama de Despliegue - Chat Corporativo

## Arquitectura de Despliegue Principal

```mermaid
graph TB
    %% Cliente
    subgraph "Cliente Web"
        Browser[🌐 Navegador Web]
        Mobile[📱 Aplicación Móvil]
    end

    %% CDN y Balanceador
    subgraph "Capa de Red"
        CDN[🌍 CDN Global]
        LB[⚖️ Load Balancer]
        SSL[🔒 SSL/TLS]
    end

    %% Servidor Web
    subgraph "Servidor Web"
        Nginx[🔄 Nginx Reverse Proxy]
        Static[📁 Archivos Estáticos]
    end

    %% Aplicación
    subgraph "Servidor de Aplicación"
        NodeApp[🚀 Node.js App]
        SocketIO[🔌 Socket.IO Server]
        Express[🌐 Express.js]
    end

    %% Base de Datos
    subgraph "Base de Datos"
        MongoDB[🍃 MongoDB]
        MongoReplica[🔄 MongoDB Replica Set]
    end

    %% Cache y Sesiones
    subgraph "Cache y Sesiones"
        Redis[⚡ Redis Cache]
        SessionStore[💾 Session Store]
    end

    %% Monitoreo
    subgraph "Monitoreo y Logs"
        PM2[📊 PM2 Process Manager]
        Logs[📝 Log Files]
        Metrics[📈 Métricas]
    end

    %% Conexiones
    Browser --> CDN
    Mobile --> CDN
    CDN --> LB
    LB --> SSL
    SSL --> Nginx
    Nginx --> NodeApp
    NodeApp --> Express
    NodeApp --> SocketIO
    Express --> MongoDB
    SocketIO --> Redis
    NodeApp --> PM2
    PM2 --> Logs
    PM2 --> Metrics
    MongoDB --> MongoReplica
```

## Despliegue en Desarrollo

```mermaid
graph TB
    subgraph "Máquina de Desarrollo"
        Dev[💻 Desarrollador]
        LocalNode[🚀 Node.js Local]
        LocalMongo[🍃 MongoDB Local]
        LocalRedis[⚡ Redis Local]
        GitRepo[📁 Git Repository]
    end

    Dev --> LocalNode
    LocalNode --> LocalMongo
    LocalNode --> LocalRedis
    Dev --> GitRepo
```

## Despliegue en Producción

```mermaid
graph TB
    %% Servidores de Producción
    subgraph "Servidor Web (Ubuntu/CentOS)"
        WebServer[🖥️ Servidor Web]
        NginxProd[🔄 Nginx]
        NodeProd[🚀 Node.js Production]
        PM2Prod[📊 PM2]
    end

    subgraph "Servidor de Base de Datos"
        DBServer[🖥️ Servidor BD]
        MongoProd[🍃 MongoDB Production]
        MongoBackup[💾 Backup MongoDB]
    end

    subgraph "Servidor de Cache"
        CacheServer[🖥️ Servidor Cache]
        RedisProd[⚡ Redis Production]
    end

    subgraph "Servidor de Archivos"
        FileServer[🖥️ Servidor Archivos]
        StaticFiles[📁 Archivos Estáticos]
        Uploads[📤 Uploads]
    end

    %% Conexiones
    WebServer --> DBServer
    WebServer --> CacheServer
    WebServer --> FileServer
    DBServer --> MongoBackup
```

## Despliegue en la Nube (AWS)

```mermaid
graph TB
    %% AWS Services
    subgraph "AWS Cloud"
        subgraph "VPC - Virtual Private Cloud"
            subgraph "Public Subnet"
                ALB[⚖️ Application Load Balancer]
                NAT[🌐 NAT Gateway]
            end
            
            subgraph "Private Subnet - Web"
                EC2Web1[🖥️ EC2 Instance Web 1]
                EC2Web2[🖥️ EC2 Instance Web 2]
            end
            
            subgraph "Private Subnet - Database"
                RDS[🍃 Amazon RDS MongoDB]
                ElastiCache[⚡ ElastiCache Redis]
            end
            
            subgraph "Storage"
                S3[📦 Amazon S3]
                CloudFront[🌍 CloudFront CDN]
            end
        end
        
        subgraph "Monitoring"
            CloudWatch[📊 CloudWatch]
            XRay[🔍 X-Ray Tracing]
        end
    end

    %% Internet
    Internet[🌐 Internet] --> CloudFront
    CloudFront --> ALB
    ALB --> EC2Web1
    ALB --> EC2Web2
    EC2Web1 --> RDS
    EC2Web2 --> RDS
    EC2Web1 --> ElastiCache
    EC2Web2 --> ElastiCache
    EC2Web1 --> S3
    EC2Web2 --> S3
    EC2Web1 --> CloudWatch
    EC2Web2 --> CloudWatch
```

## Despliegue con Docker

```mermaid
graph TB
    subgraph "Docker Host"
        subgraph "Docker Compose"
            subgraph "Frontend Container"
                FrontendContainer[🐳 Vue.js Container]
                NginxContainer[🐳 Nginx Container]
            end
            
            subgraph "Backend Container"
                BackendContainer[🐳 Node.js Container]
                SocketContainer[🐳 Socket.IO Container]
            end
            
            subgraph "Database Container"
                MongoContainer[🐳 MongoDB Container]
                RedisContainer[🐳 Redis Container]
            end
            
            subgraph "Monitoring Container"
                PM2Container[🐳 PM2 Container]
                LogContainer[🐳 Log Container]
            end
        end
        
        DockerNetwork[🌐 Docker Network]
        DockerVolumes[💾 Docker Volumes]
    end

    FrontendContainer --> DockerNetwork
    BackendContainer --> DockerNetwork
    MongoContainer --> DockerNetwork
    RedisContainer --> DockerNetwork
    PM2Container --> DockerNetwork
    DockerNetwork --> DockerVolumes
```

## Despliegue con Kubernetes

```mermaid
graph TB
    subgraph "Kubernetes Cluster"
        subgraph "Ingress Layer"
            Ingress[🌐 Ingress Controller]
            Service[🔗 LoadBalancer Service]
        end
        
        subgraph "Application Layer"
            FrontendPod[🐳 Frontend Pod]
            BackendPod[🐳 Backend Pod]
            SocketPod[🐳 Socket.IO Pod]
        end
        
        subgraph "Data Layer"
            MongoPod[🐳 MongoDB Pod]
            RedisPod[🐳 Redis Pod]
        end
        
        subgraph "Storage Layer"
            PV[💾 Persistent Volume]
            PVC[📋 Persistent Volume Claim]
        end
        
        subgraph "Monitoring Layer"
            Prometheus[📊 Prometheus]
            Grafana[📈 Grafana]
        end
    end

    Ingress --> Service
    Service --> FrontendPod
    Service --> BackendPod
    Service --> SocketPod
    BackendPod --> MongoPod
    SocketPod --> RedisPod
    MongoPod --> PV
    RedisPod --> PVC
    BackendPod --> Prometheus
    SocketPod --> Prometheus
    Prometheus --> Grafana
```

## Configuración de Servicios

### Nginx Configuration
```nginx
upstream backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name chat-corp.com;
    
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### PM2 Configuration
```json
{
  "apps": [
    {
      "name": "chat-corp-backend",
      "script": "app.js",
      "instances": 2,
      "exec_mode": "cluster",
      "env": {
        "NODE_ENV": "production",
        "PORT": 3000
      }
    }
  ]
}
```

### Docker Compose
```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend/vue-app
    ports:
      - "80:80"
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_URL=mongodb://mongo:27017/chat_bbdd
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:latest
    ports:
      - "6379:6379"

volumes:
  mongo_data:
```

## Consideraciones de Despliegue

### Seguridad
- **SSL/TLS**: Certificados para HTTPS
- **Firewall**: Reglas de puertos
- **Autenticación**: JWT con expiración
- **CORS**: Configuración de orígenes

### Escalabilidad
- **Load Balancer**: Distribución de carga
- **Clustering**: Múltiples instancias Node.js
- **Cache**: Redis para sesiones
- **CDN**: Archivos estáticos

### Monitoreo
- **PM2**: Gestión de procesos
- **Logs**: Rotación y almacenamiento
- **Métricas**: CPU, memoria, red
- **Alertas**: Notificaciones automáticas

### Backup
- **Base de Datos**: Backups automáticos
- **Archivos**: Sincronización
- **Configuración**: Versionado
- **Recuperación**: Plan de contingencia