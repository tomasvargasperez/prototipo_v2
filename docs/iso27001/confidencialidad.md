# Confidencialidad según ISO 27001 - Análisis de la Aplicación

## 📋 Tabla de Contenidos

1. [¿Qué es la Confidencialidad?](#qué-es-la-confidencialidad)
2. [Cómo tu Aplicación Maneja la Confidencialidad](#cómo-tu-aplicación-maneja-la-confidencialidad)
3. [Aspectos que Podrían Mejorarse](#aspectos-que-podrían-mejorarse)
4. [Resumen](#resumen)
5. [Conclusión](#conclusión)

---

## ¿Qué es la Confidencialidad?

### Definición según ISO 27001

**Confidencialidad** es uno de los tres pilares de la seguridad de la información (junto con **Integridad** e **Disponibilidad**). Se define como:

> **"Asegurar que la información solo sea accesible para aquellos autorizados a tener acceso"**

### Ejemplo Práctico

Imagina que tienes una caja fuerte con documentos importantes:
- ✅ **Confidencialidad**: Solo las personas con la llave pueden abrirla
- ❌ **Sin confidencialidad**: Cualquiera puede abrirla y leer los documentos

En tu aplicación:
- ✅ Un empleado solo puede ver mensajes de canales a los que tiene acceso
- ❌ Sin confidencialidad: Cualquiera podría ver todos los mensajes privados

---

## Cómo tu Aplicación Maneja la Confidencialidad

### 1. Autenticación (¿Quién eres?)

#### Implementación Actual

**Archivo**: `backend/routes/UserRoutes.js` (ruta `POST /login`)

**Proceso**:
1. Usuario envía email y contraseña
2. Backend busca el usuario en la base de datos
3. Compara la contraseña con el hash almacenado (bcrypt)
4. Si coincide, genera un token JWT
5. El token contiene el `userId` del usuario

**Ejemplo Práctico**:
```
Usuario: juan@empresa.com
Contraseña: miPassword123

Backend:
1. Busca usuario con email "juan@empresa.com"
2. Obtiene hash: "$2b$10$abcdefghijklmnopqrstuv..."
3. Compara "miPassword123" con el hash
4. Si coincide → Genera token JWT
5. Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Protección de Contraseñas**:

**Archivo**: `backend/models/User.js` (hook `pre('save')`)

```javascript
// ANTES de guardar, la contraseña se hashea automáticamente
UserSchema.pre('save', async function(next) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
```

**¿Por qué es importante?**
- Si alguien accede a la base de datos, **NO puede ver las contraseñas en texto plano**
- Solo se almacena el hash (60 caracteres)
- **NO se puede revertir** el hash a la contraseña original

**Estado**: ✅ **Bien implementado**

---

### 2. Autorización (¿Qué puedes hacer?)

#### Implementación Actual

**Archivo**: `backend/middleware/auth.js`

**Proceso**:
1. Cada petición incluye el token JWT en el header
2. El middleware verifica el token
3. Verifica que el usuario esté activo
4. Si todo es válido, permite el acceso

**Ejemplo Práctico**:
```
Frontend envía:
GET /api/channels
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
}

Backend:
1. Extrae el token del header
2. Verifica la firma del token (JWT_SECRET)
3. Decodifica el token → obtiene userId
4. Busca el usuario en BD
5. Verifica que esté activo
6. Si todo OK → permite acceso
```

**Control de Acceso por Roles**:

**Archivo**: `backend/routes/ChannelRoutes.js`, `SuggestionRoutes.js`, etc.

```javascript
// Middleware isAdmin verifica el rol
const isAdmin = async (req, res, next) => {
  const user = await User.findById(req.user.userId);
  if (user && user.role === 'admin') {
    next(); // Permite acceso
  } else {
    res.status(403).json({ message: 'Acceso denegado' });
  }
};
```

**Ejemplo Práctico**:
- Usuario regular intenta acceder a `/api/admin/dashboard`
- Backend verifica: `role !== 'admin'`
- Respuesta: `403 Forbidden`

**Estado**: ✅ **Bien implementado**

---

### 3. Control de Acceso a Recursos Específicos

#### Canales Privados

**Archivo**: `backend/routes/MessageRoutes.js` (middleware `checkChannelAccess`)

**Proceso**:
1. Usuario intenta acceder a mensajes de un canal
2. Backend verifica:
   - ¿Es admin? → Acceso total
   - ¿El canal es público? → Acceso permitido
   - ¿El usuario está en `allowedUsers`? → Acceso permitido
   - Si no cumple ninguna → Acceso denegado

**Ejemplo Práctico**:
```
Canal: "Reunión Ejecutiva"
isPublic: false
allowedUsers: ["user1_id", "user2_id"]

Usuario "user3" intenta acceder:
→ Backend verifica: user3_id NO está en allowedUsers
→ Respuesta: 403 "No tienes acceso a este canal"
```

**Estado**: ✅ **Bien implementado**

---

### 4. Encriptación de Datos Sensibles

#### Sugerencias Anónimas

**Archivo**: `backend/routes/SuggestionRoutes.js` y `backend/utils/encryption.js`

**Proceso**:
1. Usuario envía una sugerencia
2. Backend sanitiza el contenido (protección XSS)
3. Encripta con AES-256-CBC
4. Guarda el contenido encriptado en la BD
5. Solo los administradores pueden desencriptar

**Ejemplo Práctico**:
```
Usuario envía: "Sugerencia: Mejorar el sistema de reportes"

Backend:
1. Sanitiza: "Sugerencia: Mejorar el sistema de reportes"
2. Encripta: "a1b2c3d4e5f6...:9f8e7d6c5b4a..."
3. Guarda en BD: "a1b2c3d4e5f6...:9f8e7d6c5b4a..."

Si alguien accede a la BD directamente:
→ Solo ve texto encriptado (ilegible)
→ NO puede leer el contenido sin la clave de encriptación
```

**Algoritmo**: AES-256-CBC
- Clave derivada de `ENCRYPTION_KEY` (variable de entorno)
- IV aleatorio por cada encriptación
- Formato: `IV:encryptedText`

**Estado**: ✅ **Bien implementado**

---

### 5. Protección de Datos en el Cliente

#### Sanitización de localStorage

**Archivo**: `frontend/vue-app/src/utils/security.js`

**Proceso**:
1. Interceptor automático de `localStorage.setItem()`
2. Sanitiza datos antes de guardar
3. Al leer, desanitiza para mostrar legible

**Ejemplo Práctico**:
```
Usuario hace login:
Token: "eyJhbGciOiJIUzI1NiIs..."

Frontend intenta guardar:
localStorage.setItem('token', token);

Interceptor intercepta:
1. Sanitiza el token (aunque no es necesario, es preventivo)
2. Guarda sanitizado

Si hay un ataque XSS:
→ El atacante NO puede inyectar código malicioso
→ Los datos están protegidos
```

**Estado**: ✅ **Bien implementado**

---

### 6. Ocultación de Información Sensible

#### Contraseñas Nunca se Envían al Frontend

**Archivo**: `backend/models/User.js` (método `toJSON`)

```javascript
UserSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password; // Elimina password al serializar
    return ret;
  }
});
```

**Ejemplo Práctico**:
```
Backend obtiene usuario:
{
  _id: "...",
  name: "Juan",
  email: "juan@empresa.com",
  password: "$2b$10$abcdef..."  // ← Este campo existe
}

Al enviar al frontend (toJSON):
{
  _id: "...",
  name: "Juan",
  email: "juan@empresa.com"
  // password NO se incluye
}
```

**Estado**: ✅ **Bien implementado**

---

## Aspectos que Podrían Mejorarse

### 1. Datos en Tránsito (HTTPS)

**Estado Actual**: 
- La aplicación usa HTTP en desarrollo (`http://localhost:3000`)
- No hay HTTPS configurado

**Riesgo**:
- Si alguien intercepta el tráfico de red, puede ver:
  - Tokens JWT
  - Mensajes
  - Credenciales (aunque se envían hasheadas)

**Recomendación ISO 27001**:
- Usar HTTPS/TLS en producción
- Certificados SSL válidos
- Cifrado de todas las comunicaciones

**Impacto**: ⚠️ **Medio-Alto**

**Implementación Sugerida**:
```javascript
// En producción, usar HTTPS
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem')
};

https.createServer(options, app).listen(443);
```

---

### 2. Almacenamiento de Tokens en localStorage

**Estado Actual**:
- Tokens JWT se almacenan en `localStorage`
- Vulnerable a XSS (aunque hay sanitización)

**Riesgo**:
- Si hay un XSS exitoso, el atacante puede robar el token
- El token es válido por 24 horas

**Recomendación ISO 27001**:
- Usar HttpOnly cookies para tokens
- Implementar refresh tokens
- Reducir duración de access tokens (15-30 min)

**Impacto**: ⚠️ **Medio**

**Implementación Sugerida**:
```javascript
// En lugar de enviar token en JSON
res.cookie('token', token, {
  httpOnly: true,  // No accesible desde JavaScript
  secure: true,    // Solo HTTPS
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000  // 15 minutos
});
```

---

### 3. Logs con Información Sensible

**Estado Actual**:
- Logs simplificados (solo nombre)
- No se registran emails, IDs, etc.

**Estado**: ✅ **Bien implementado**

---

### 4. Gestión de Claves de Encriptación

**Estado Actual**:
- `ENCRYPTION_KEY` en variable de entorno
- Valor por defecto si no está configurada

**Riesgo**:
- Si la clave se compromete, todas las sugerencias pueden desencriptarse

**Recomendación ISO 27001**:
- Usar un gestor de secretos (AWS Secrets Manager, HashiCorp Vault)
- Rotación periódica de claves
- Nunca usar valores por defecto en producción

**Impacto**: ⚠️ **Medio**

**Implementación Sugerida**:
```javascript
// Usar AWS Secrets Manager
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const client = new SecretsManagerClient({ region: 'us-east-1' });
const command = new GetSecretValueCommand({ SecretId: 'encryption-key' });
const response = await client.send(command);
const ENCRYPTION_KEY = response.SecretString;
```

---

### 5. Control de Acceso a Nivel de Base de Datos

**Estado Actual**:
- Control de acceso a nivel de aplicación
- MongoDB sin autenticación configurada (probablemente)

**Riesgo**:
- Si alguien accede directamente a MongoDB, puede leer todo

**Recomendación ISO 27001**:
- Autenticación en MongoDB
- Roles y permisos en MongoDB
- Encriptación de la BD en reposo

**Impacto**: ⚠️ **Alto**

**Implementación Sugerida**:
```javascript
// Conexión con autenticación
mongoose.connect(DB_URL, {
  auth: {
    username: process.env.MONGODB_USER,
    password: process.env.MONGODB_PASSWORD
  },
  authSource: 'admin'
});
```

---

## Resumen: Confidencialidad en tu Aplicación

### ✅ Bien Implementado

1. ✅ **Autenticación con JWT**: Verificación de identidad mediante tokens
2. ✅ **Hash de Contraseñas (bcrypt)**: Contraseñas nunca en texto plano
3. ✅ **Control de Acceso por Roles**: Admin vs Usuario regular
4. ✅ **Control de Acceso a Canales Privados**: Solo usuarios autorizados
5. ✅ **Encriptación de Sugerencias (AES-256-CBC)**: Datos sensibles protegidos
6. ✅ **Sanitización de Datos en Frontend**: Protección contra XSS
7. ✅ **Ocultación de Contraseñas en Respuestas**: Nunca se envían al cliente
8. ✅ **Logs Simplificados**: Sin información sensible en logs

### ⚠️ Áreas de Mejora

1. ⚠️ **HTTPS/TLS en Producción**: Cifrado de comunicaciones
2. ⚠️ **HttpOnly Cookies para Tokens**: Mayor protección contra XSS
3. ⚠️ **Refresh Tokens**: Tokens de corta duración con renovación
4. ⚠️ **Gestión Segura de Claves de Encriptación**: Gestor de secretos
5. ⚠️ **Autenticación en MongoDB**: Control de acceso a nivel de BD
6. ⚠️ **Encriptación de BD en Reposo**: Protección de datos almacenados

---

## Conclusión

### Estado Actual

Tu aplicación implementa **medidas básicas de confidencialidad** que son fundamentales:

- ✅ **Autenticación y Autorización**: Sistema robusto de verificación de identidad
- ✅ **Encriptación de Datos Sensibles**: Sugerencias protegidas con AES-256-CBC
- ✅ **Control de Acceso Granular**: Canales privados y roles bien implementados
- ✅ **Protección de Contraseñas**: Hash con bcrypt, nunca en texto plano

### Cumplimiento ISO 27001

**Nivel Actual**: ⭐⭐⭐ (3/5)

- ✅ Cumple con requisitos básicos de confidencialidad
- ⚠️ Requiere mejoras para cumplimiento completo

### Prioridades para Mejora

Para alcanzar un **cumplimiento completo de ISO 27001** en confidencialidad, se recomienda priorizar:

1. **🔴 Alta Prioridad**:
   - HTTPS/TLS en producción
   - Autenticación en MongoDB
   - HttpOnly cookies para tokens

2. **🟡 Media Prioridad**:
   - Refresh tokens
   - Gestión segura de claves de encriptación
   - Encriptación de BD en reposo

3. **🟢 Baja Prioridad**:
   - Mejoras adicionales de logging
   - Auditoría de accesos

---

## Referencias

- **ISO/IEC 27001:2022**: Sistema de gestión de seguridad de la información
- **Anexo A.9**: Control de acceso
- **Anexo A.10**: Criptografía
- **Anexo A.14**: Seguridad de las operaciones

---

**Última actualización**: Enero 2025

**Versión del documento**: 1.0

