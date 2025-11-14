# Disponibilidad según ISO 27001 - Análisis de la Aplicación

## 📋 Tabla de Contenidos

1. [¿Qué es la Disponibilidad?](#qué-es-la-disponibilidad)
2. [Cómo tu Aplicación Maneja la Disponibilidad](#cómo-tu-aplicación-maneja-la-disponibilidad)
3. [Aspectos que Podrían Mejorarse](#aspectos-que-podrían-mejorarse)
4. [Resumen](#resumen)
5. [Conclusión](#conclusión)

---

## ¿Qué es la Disponibilidad?

### Definición según ISO 27001

**Disponibilidad** es uno de los tres pilares de la seguridad de la información (junto con **Confidencialidad** e **Integridad**). Se define como:

> **"Asegurar que la información y los sistemas estén accesibles cuando los usuarios autorizados los necesiten"**

### Ejemplo Práctico

Imagina que necesitas usar tu aplicación de chat:
- ✅ **Con disponibilidad**: La aplicación está funcionando y puedes chatear
- ❌ **Sin disponibilidad**: La aplicación está caída y no puedes usarla

En tu aplicación:
- ✅ Los usuarios pueden acceder al chat durante el horario laboral
- ❌ Sin disponibilidad: Si el servidor cae, nadie puede usar la aplicación

---

## Cómo tu Aplicación Maneja la Disponibilidad

### 1. Manejo de Errores y Recuperación

#### Implementación Actual

**Archivos**: `backend/routes/MessageRoutes.js`, `UserRoutes.js`, etc.

**Proceso**:
- Uso de bloques `try-catch` para capturar errores
- Respuestas de error estructuradas
- El servidor NO se cae ante errores individuales

**Ejemplo Práctico**:

**Archivo**: `backend/routes/MessageRoutes.js`

```javascript
router.get('/api/messages/:channelId', authenticateToken, checkChannelAccess, async (req, res) => {
  try {
    const messages = await Message.find({ channel: req.params.channelId })
      .populate('userId', 'name')
      .sort({ createdAt: 1 });
    
    res.json(desanitizedMessages);
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    res.status(500).json({ message: 'Error al obtener los mensajes' });
    // ← El servidor NO se cae, solo responde con error
  }
});
```

**Escenario**:
```
Usuario solicita mensajes de un canal
→ Error en la base de datos (conexión perdida)

Backend:
1. Captura el error en catch
2. Registra el error en consola
3. Responde con código 500 y mensaje de error
4. El servidor sigue funcionando para otros usuarios
```

**¿Por qué es importante?**
- Un error NO detiene todo el servicio
- Otros usuarios pueden seguir usando la aplicación
- Se registran errores para diagnóstico

**Estado**: ✅ **Bien implementado** (básico)

---

### 2. Caché para Mejorar Disponibilidad

#### Implementación Actual

**Archivo**: `backend/services/phoneBookService.js`

**Proceso**:
- Caché en memoria del directorio telefónico
- Reduce peticiones a servicios externos
- Mejora tiempo de respuesta

**Ejemplo Práctico**:

```javascript
class PhoneBookService {
  constructor() {
    this.cachedData = null;
    this.lastFetch = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  async fetchPhoneBook() {
    // Verificar si tenemos datos en caché válidos
    if (this.cachedData && this.lastFetch && (Date.now() - this.lastFetch) < this.cacheTimeout) {
      return this.cachedData; // ← Retorna caché sin hacer petición
    }

    // Si no hay caché válido, hacer petición
    const response = await this.axiosInstance.get(this.phoneBookUrl);
    this.cachedData = this.processPhoneBookData(result);
    this.lastFetch = Date.now();
    return this.cachedData;
  }
}
```

**Escenario**:
```
Primera petición (10:00):
→ Hace petición al servidor externo
→ Tarda 2 segundos
→ Guarda en caché

Segunda petición (10:02):
→ Usa caché (menos de 5 minutos)
→ Tarda 0.01 segundos
→ NO hace petición externa

Tercera petición (10:06):
→ Caché expirado (más de 5 minutos)
→ Hace nueva petición
→ Actualiza caché
```

**¿Por qué es importante?**
- Respuestas más rápidas
- Menor carga en servicios externos
- Funciona aunque el servicio externo esté lento

**Estado**: ✅ **Bien implementado**

---

### 3. Manejo de Desconexiones (Socket.IO)

#### Implementación Actual

**Archivo**: `backend/app.js`

**Proceso**:
- Socket.IO maneja desconexiones automáticamente
- Los usuarios pueden reconectarse sin perder funcionalidad

**Ejemplo Práctico**:

```javascript
io.on('connection', (socket) => {
  console.log('🔌 Usuario conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('⚠️ Usuario desconectado:', socket.id);
    // ← Socket.IO maneja la desconexión automáticamente
  });
});
```

**Escenario**:
```
Usuario está chateando:
1. Conexión a Internet se cae
2. Socket.IO detecta desconexión
3. Usuario intenta reconectar
4. Socket.IO restablece conexión
5. Usuario puede seguir chateando
```

**¿Por qué es importante?**
- Reconexión automática
- No se pierden funcionalidades
- Mejor experiencia de usuario

**Estado**: ✅ **Bien implementado**

---

### 4. Validación de Datos Antes de Procesar

#### Implementación Actual

**Archivo**: `backend/app.js` (Socket.IO)

**Proceso**:
- Validación de datos antes de procesar
- Previene errores que podrían afectar la disponibilidad

**Ejemplo Práctico**:

```javascript
socket.on('send_message', async ({ channelId, text, userId }) => {
  try {
    // Validar si userId existe
    if (!userId) {
      console.error("❌ No se recibió userId");
      return; // ← Sale sin procesar, evita error
    }

    // Validar que userId sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("❌ userId no es un ObjectId válido:", userId);
      return; // ← Sale sin procesar, evita error
    }

    // Si pasa validaciones, procesar
    const newMessage = new Message({ text, userId, channel: channelId });
    await newMessage.save();
  } catch (error) {
    console.error("❌ Error al guardar mensaje:", error);
  }
});
```

**¿Por qué es importante?**
- Previene errores que podrían afectar el servicio
- Datos inválidos NO causan fallos
- El servicio sigue disponible

**Estado**: ✅ **Bien implementado**

---

### 5. Filtrado de Datos Nulos

#### Implementación Actual

**Archivo**: `backend/app.js` (Socket.IO)

**Proceso**:
- Filtra mensajes con usuarios nulos antes de enviar
- Previene errores en el frontend

**Ejemplo Práctico**:

```javascript
const formattedMessages = messages
  .filter(msg => msg.userId != null) // ← Filtra usuarios nulos
  .map(msg => ({
    _id: msg._id,
    text: desanitizeMessage(msg.text),
    userId: msg.userId._id,
    author: msg.userId.name || 'Usuario Eliminado',
    timestamp: msg.createdAt
  }));
```

**¿Por qué es importante?**
- Evita errores en el frontend
- El servicio sigue funcionando aunque haya datos inconsistentes
- Mejor experiencia de usuario

**Estado**: ✅ **Bien implementado**

---

### 6. Manejo de Errores en Servicios Externos

#### Implementación Actual

**Archivo**: `backend/services/phoneBookService.js`

**Proceso**:
- Captura errores de servicios externos
- Lanza errores controlados

**Ejemplo Práctico**:

```javascript
async fetchPhoneBook() {
  try {
    // Verificar caché primero
    if (this.cachedData && this.lastFetch && (Date.now() - this.lastFetch) < this.cacheTimeout) {
      return this.cachedData; // ← Retorna caché si está disponible
    }

    // Intentar petición externa
    const response = await this.axiosInstance.get(this.phoneBookUrl);
    // ...
  } catch (error) {
    console.error('Error fetching phone book:', error);
    // Si hay caché, podría retornarlo aunque esté expirado
    throw new Error('Error al obtener el directorio telefónico');
  }
}
```

**¿Por qué es importante?**
- Si el servicio externo falla, el error se maneja
- El servidor NO se cae
- Se puede implementar fallback a caché expirado

**Estado**: ⚠️ **Parcialmente implementado**

---

### 7. Verificación Periódica de Estado del Usuario

#### Implementación Actual

**Archivo**: `frontend/vue-app/src/views/Chat.vue`

**Proceso**:
- Verifica el estado del usuario cada minuto
- Detecta si el usuario fue desactivado

**Ejemplo Práctico**:

```javascript
mounted() {
  // Verificar estado del usuario cada minuto
  this.statusInterval = setInterval(this.checkUserStatus, 60000);
}

async checkUserStatus() {
  try {
    const response = await fetch('http://localhost:3000/api/check-status', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      const data = await response.json();
      if (data.message.includes('inactivo')) {
        alert('Su cuenta ha sido desactivada.');
        this.logout();
      }
    }
  } catch (error) {
    console.error('Error al verificar estado:', error);
    // ← No afecta la disponibilidad, solo registra error
  }
}
```

**¿Por qué es importante?**
- Detecta cambios de estado del usuario
- Mantiene la seguridad sin afectar disponibilidad
- Manejo de errores no bloquea la aplicación

**Estado**: ✅ **Bien implementado**

---

## Aspectos que Podrían Mejorarse

### 1. Reintentos Automáticos (Retry Logic)

**Estado Actual**: 
- No hay reintentos automáticos
- Si una petición falla, se rechaza inmediatamente

**Riesgo**:
- Fallos temporales pueden afectar la disponibilidad
- Servicios externos pueden estar temporalmente no disponibles

**Recomendación ISO 27001**:
- Implementar reintentos con backoff exponencial
- Reintentar peticiones fallidas automáticamente

**Impacto**: ⚠️ **Medio**

**Implementación Sugerida**:
```javascript
async function fetchWithRetry(url, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      // Backoff exponencial: 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
}

// Uso
async fetchPhoneBook() {
  try {
    const response = await fetchWithRetry(this.phoneBookUrl);
    this.cachedData = this.processPhoneBookData(response);
    this.lastFetch = Date.now();
    return this.cachedData;
  } catch (error) {
    // Si falla después de 3 intentos, usar caché expirado
    if (this.cachedData) {
      console.warn('⚠️ Usando caché expirado debido a error en servicio externo');
      return this.cachedData;
    }
    throw error;
  }
}
```

---

### 2. Fallback a Caché Expirado

**Estado Actual**:
- Si el servicio externo falla, se lanza error
- No se usa caché expirado como respaldo

**Riesgo**:
- Si el servicio externo está caído, la funcionalidad no está disponible
- Aunque haya datos en caché (aunque expirados)

**Recomendación ISO 27001**:
- Usar caché expirado como último recurso
- Mejor disponibilidad aunque con datos no actualizados

**Impacto**: ⚠️ **Medio**

**Implementación Sugerida**:
```javascript
async fetchPhoneBook() {
  try {
    // Intentar obtener datos frescos
    const response = await this.axiosInstance.get(this.phoneBookUrl);
    this.cachedData = this.processPhoneBookData(result);
    this.lastFetch = Date.now();
    return this.cachedData;
  } catch (error) {
    console.error('Error fetching phone book:', error);
    
    // Si hay caché (aunque expirado), usarlo como fallback
    if (this.cachedData) {
      console.warn('⚠️ Usando caché expirado como fallback');
      return this.cachedData;
    }
    
    throw new Error('Error al obtener el directorio telefónico');
  }
}
```

---

### 3. Health Checks y Monitoreo

**Estado Actual**:
- No hay endpoint de health check
- No hay monitoreo del estado del servicio

**Riesgo**:
- No se puede verificar si el servicio está funcionando
- No se puede detectar problemas proactivamente

**Recomendación ISO 27001**:
- Endpoint `/health` que verifique estado del servicio
- Verificar conexión a BD, servicios externos, etc.

**Impacto**: ⚠️ **Alto**

**Implementación Sugerida**:
```javascript
// Endpoint de health check
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'unknown',
      externalService: 'unknown'
    }
  };

  // Verificar conexión a BD
  try {
    await mongoose.connection.db.admin().ping();
    health.checks.database = 'ok';
  } catch (error) {
    health.checks.database = 'error';
    health.status = 'degraded';
  }

  // Verificar servicio externo (phonebook)
  try {
    await phoneBookService.fetchPhoneBook();
    health.checks.externalService = 'ok';
  } catch (error) {
    health.checks.externalService = 'error';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

---

### 4. Timeouts en Peticiones

**Estado Actual**:
- No hay timeouts configurados explícitamente
- Las peticiones pueden quedarse colgadas indefinidamente

**Riesgo**:
- Si un servicio externo está lento, la aplicación puede quedar bloqueada
- Recursos del servidor pueden agotarse

**Recomendación ISO 27001**:
- Configurar timeouts en todas las peticiones
- Evitar que peticiones se queden colgadas

**Impacto**: ⚠️ **Medio**

**Implementación Sugerida**:
```javascript
// Configurar timeout en axios
this.axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  }),
  timeout: 5000  // ← 5 segundos de timeout
});

// O en fetch
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);
  return response;
} catch (error) {
  if (error.name === 'AbortError') {
    throw new Error('Timeout: La petición tardó demasiado');
  }
  throw error;
}
```

---

### 5. Rate Limiting

**Estado Actual**:
- No hay límites de peticiones por usuario/IP
- Vulnerable a ataques de denegación de servicio (DoS)

**Riesgo**:
- Un usuario puede hacer muchas peticiones y saturar el servidor
- Ataques DoS pueden hacer el servicio no disponible

**Recomendación ISO 27001**:
- Implementar rate limiting
- Limitar peticiones por IP/usuario

**Impacto**: ⚠️ **Alto**

**Implementación Sugerida**:
```javascript
const rateLimit = require('express-rate-limit');

// Rate limiting general
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 peticiones por IP
  message: 'Demasiadas peticiones desde esta IP, intenta más tarde',
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// Rate limiting más estricto para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // máximo 5 intentos de login
  message: 'Demasiados intentos de login, intenta más tarde',
  skipSuccessfulRequests: true
});

app.use('/login', loginLimiter);
```

---

### 6. Pool de Conexiones a Base de Datos

**Estado Actual**:
- Conexión básica a MongoDB
- No hay configuración de pool de conexiones

**Riesgo**:
- Si hay muchas peticiones simultáneas, pueden agotarse las conexiones
- El servicio puede volverse lento o no disponible

**Recomendación ISO 27001**:
- Configurar pool de conexiones
- Limitar y gestionar conexiones concurrentes

**Impacto**: ⚠️ **Medio**

**Implementación Sugerida**:
```javascript
mongoose.connect(DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10, // ← Máximo 10 conexiones simultáneas
  minPoolSize: 2,  // ← Mínimo 2 conexiones siempre activas
  serverSelectionTimeoutMS: 5000, // ← Timeout de 5 segundos
  socketTimeoutMS: 45000, // ← Timeout de socket de 45 segundos
  connectTimeoutMS: 10000, // ← Timeout de conexión de 10 segundos
});
```

---

### 7. Logging Estructurado

**Estado Actual**:
- Logs básicos con `console.log`
- No hay niveles de log ni estructura

**Riesgo**:
- Difícil diagnosticar problemas
- No se puede monitorear proactivamente

**Recomendación ISO 27001**:
- Usar librería de logging (winston, pino)
- Niveles de log (info, warn, error)
- Integración con sistemas de monitoreo

**Impacto**: ⚠️ **Medio**

**Implementación Sugerida**:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Uso
logger.info('Usuario conectado', { userId, socketId });
logger.error('Error al guardar mensaje', { 
  error: error.message, 
  stack: error.stack,
  userId,
  channelId 
});
```

---

### 8. Backups Automáticos

**Estado Actual**:
- No hay sistema de backups automáticos
- No hay plan de recuperación ante desastres

**Riesgo**:
- Si la BD se corrompe o se pierde, no hay respaldo
- Pérdida total de datos

**Recomendación ISO 27001**:
- Backups automáticos diarios
- Pruebas de restauración periódicas
- Almacenamiento de backups en ubicación segura

**Impacto**: ⚠️ **Alto**

**Implementación Sugerida**:
```javascript
// Script de backup (ejecutar con cron)
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

function backupDatabase() {
  const backupDir = path.join(__dirname, '../backups');
  
  // Crear directorio si no existe
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const backupFile = path.join(backupDir, `backup-${timestamp}.gz`);

  exec(`mongodump --uri="${DB_URL}" --archive=${backupFile} --gzip`, (error, stdout, stderr) => {
    if (error) {
      logger.error('Error en backup:', error);
      return;
    }
    logger.info('Backup completado:', backupFile);
    
    // Eliminar backups antiguos (mantener últimos 7 días)
    const files = fs.readdirSync(backupDir);
    const now = Date.now();
    files.forEach(file => {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;
      const daysOld = age / (1000 * 60 * 60 * 24);
      
      if (daysOld > 7) {
        fs.unlinkSync(filePath);
        logger.info('Backup antiguo eliminado:', file);
      }
    });
  });
}

// Ejecutar diariamente (usar node-cron o similar)
const cron = require('node-cron');
cron.schedule('0 2 * * *', () => { // 2:00 AM diariamente
  backupDatabase();
});
```

---

### 9. Redundancia y Alta Disponibilidad

**Estado Actual**:
- Servidor único
- Base de datos única
- Sin redundancia

**Riesgo**:
- Si el servidor falla, el servicio no está disponible
- Si la BD falla, el servicio no está disponible

**Recomendación ISO 27001**:
- Múltiples instancias del servidor (load balancer)
- Réplicas de MongoDB
- Failover automático

**Impacto**: ⚠️ **Alto** (depende del caso de uso)

**Implementación Sugerida**:
```javascript
// Configuración de MongoDB con réplicas
mongoose.connect(DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  replicaSet: 'rs0', // ← Conjunto de réplicas
  readPreference: 'secondaryPreferred', // ← Leer de réplicas secundarias
});

// Load balancer (usar nginx o similar)
// nginx.conf
/*
upstream backend {
  server localhost:3000;
  server localhost:3001;
  server localhost:3002;
}

server {
  listen 80;
  location / {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
*/
```

---

### 10. Circuit Breaker Pattern

**Estado Actual**:
- No hay circuit breaker
- Si un servicio externo falla, todas las peticiones fallan

**Riesgo**:
- Si el servicio externo está caído, todas las peticiones fallan
- Consumo innecesario de recursos

**Recomendación ISO 27001**:
- Implementar circuit breaker
- Detectar fallos y evitar peticiones innecesarias

**Impacto**: ⚠️ **Medio**

**Implementación Sugerida**:
```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      logger.warn('Circuit breaker OPEN - servicio externo no disponible');
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      nextAttempt: this.nextAttempt
    };
  }
}

// Uso
const breaker = new CircuitBreaker();

async fetchPhoneBook() {
  return breaker.execute(async () => {
    const response = await this.axiosInstance.get(this.phoneBookUrl);
    return this.processPhoneBookData(response.data);
  });
}
```

---

## Resumen: Disponibilidad en tu Aplicación

### ✅ Bien Implementado

1. ✅ **Manejo de Errores**: Try-catch en rutas críticas
2. ✅ **Caché**: Directorio telefónico con TTL de 5 minutos
3. ✅ **Manejo de Desconexiones**: Socket.IO con reconexión automática
4. ✅ **Validación de Datos**: Previene errores
5. ✅ **Filtrado de Datos Nulos**: Evita errores en frontend
6. ✅ **Verificación Periódica**: Estado del usuario cada minuto

### ⚠️ Áreas de Mejora

1. ⚠️ **Reintentos Automáticos**: Retry logic con backoff exponencial
2. ⚠️ **Fallback a Caché Expirado**: Usar datos antiguos si es necesario
3. ⚠️ **Health Checks**: Endpoint de monitoreo
4. ⚠️ **Timeouts**: Límites de tiempo en peticiones
5. ⚠️ **Rate Limiting**: Prevenir DoS
6. ⚠️ **Pool de Conexiones**: Gestión de conexiones a BD
7. ⚠️ **Logging Estructurado**: Mejor diagnóstico
8. ⚠️ **Backups Automáticos**: Recuperación ante desastres
9. ⚠️ **Redundancia**: Alta disponibilidad
10. ⚠️ **Circuit Breaker**: Protección contra servicios externos caídos

---

## Conclusión

### Estado Actual

Tu aplicación implementa **medidas básicas de disponibilidad** que son fundamentales:

- ✅ **Manejo de Errores Básico**: El servidor no se cae ante errores individuales
- ✅ **Caché**: Mejora rendimiento y reduce dependencia de servicios externos
- ✅ **Reconexión Automática**: Socket.IO maneja desconexiones

### Cumplimiento ISO 27001

**Nivel Actual**: ⭐⭐ (2/5)

- ⚠️ Cumple con requisitos básicos de disponibilidad
- ⚠️ Requiere mejoras significativas para cumplimiento completo

### Prioridades para Mejora

Para alcanzar un **cumplimiento completo de ISO 27001** en disponibilidad, se recomienda priorizar:

1. **🔴 Alta Prioridad**:
   - Health checks y monitoreo
   - Backups automáticos
   - Rate limiting
   - Timeouts en peticiones

2. **🟡 Media Prioridad**:
   - Reintentos automáticos
   - Fallback a caché expirado
   - Pool de conexiones
   - Logging estructurado
   - Circuit breaker

3. **🟢 Baja Prioridad**:
   - Redundancia y alta disponibilidad (según necesidad del caso de uso)

---

## Referencias

- **ISO/IEC 27001:2022**: Sistema de gestión de seguridad de la información
- **Anexo A.12**: Seguridad de las operaciones
- **Anexo A.14**: Seguridad de las operaciones
- **Anexo A.17**: Continuidad del negocio

---

**Última actualización**: Enero 2025

**Versión del documento**: 1.0

