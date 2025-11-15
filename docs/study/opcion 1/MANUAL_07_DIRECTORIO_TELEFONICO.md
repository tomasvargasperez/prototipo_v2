# Manual 07: Directorio Telefónico - Integración Externa

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura de la Integración](#arquitectura-de-la-integración)
3. [Servicio de Directorio Telefónico](#servicio-de-directorio-telefónico)
4. [Sistema de Caché](#sistema-de-caché)
5. [Parsing de XML a JSON](#parsing-de-xml-a-json)
6. [Controlador y Rutas](#controlador-y-rutas)
7. [Frontend: Visualización](#frontend-visualización)
8. [Manejo de Errores](#manejo-de-errores)
9. [Seguridad](#seguridad)

---

## Introducción

El directorio telefónico es una funcionalidad que **integra tu aplicación con un sistema externo** (central telefónica) para obtener la lista de contactos y sus anexos telefónicos. Este manual te explicará cómo funciona esta integración, desde la consulta a la API externa hasta la visualización en el frontend.

### Objetivos del Directorio Telefónico

1. ✅ Obtener lista de contactos desde API externa (XML)
2. ✅ Convertir XML a JSON para uso interno
3. ✅ Implementar caché para mejorar rendimiento
4. ✅ Permitir búsqueda de contactos
5. ✅ Mostrar directorio en el frontend

### Fuente de Datos

**URL Externa**: `https://icafal.alodesk.io:20080/panel/share/phonebook/9267361683`

**Formato**: XML (Yealink IP Phone Directory)

**Ejemplo de Respuesta XML**:
```xml
<YealinkIPPhoneDirectory>
  <DirectoryEntry>
    <Name>Juan Pérez</Name>
    <Telephone>1234</Telephone>
  </DirectoryEntry>
  <DirectoryEntry>
    <Name>María González</Name>
    <Telephone>5678</Telephone>
  </DirectoryEntry>
</YealinkIPPhoneDirectory>
```

---

## Arquitectura de la Integración

### Flujo de Datos

```
┌─────────────┐
│   Frontend  │
│  (Vue.js)   │
└──────┬──────┘
       │ HTTP GET /api/phonebook
       │ Authorization: Bearer <token>
       ▼
┌─────────────────┐
│  Express Server │
│  (Backend)      │
└──────┬──────────┘
       │
       ├─► JWT Auth Middleware
       │
       ├─► phoneBookController
       │
       ├─► phoneBookService
       │   │
       │   ├─► Verificar Caché
       │   │   │
       │   │   ├─► Caché válido? → Retornar caché
       │   │   │
       │   │   └─► Caché expirado? → Consultar API externa
       │   │
       │   ├─► HTTPS Request
       │   │   │
       │   │   └─► https://icafal.alodesk.io:20080/...
       │   │
       │   ├─► Parse XML → JSON
       │   │
       │   └─► Actualizar Caché
       │
       └─► JSON Response
```

### Componentes Principales

1. **phoneBookService.js**: Servicio que maneja la lógica de negocio
2. **phoneBookController.js**: Controlador que maneja las peticiones HTTP
3. **phoneBookRoutes.js**: Definición de rutas
4. **Frontend (Admin_app.vue)**: Visualización del directorio

---

## Servicio de Directorio Telefónico

### Archivo: `backend/services/phoneBookService.js`

#### Clase PhoneBookService

```javascript
class PhoneBookService {
    constructor() {
        this.parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_'
        });
        this.phoneBookUrl = 'https://icafal.alodesk.io:20080/panel/share/phonebook/9267361683';
        this.cachedData = null;
        this.lastFetch = null;
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
        
        this.axiosInstance = axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        });
    }
}
```

**Explicación de Propiedades**:

1. **`parser`**: Instancia de XMLParser (fast-xml-parser)
   - `ignoreAttributes: false`: Incluye atributos XML
   - `attributeNamePrefix: '@_'`: Prefijo para atributos

2. **`phoneBookUrl`**: URL de la API externa
   - Protocolo: HTTPS
   - Puerto: 20080
   - Endpoint: `/panel/share/phonebook/9267361683`

3. **`cachedData`**: Datos en caché
   - `null` inicialmente
   - Se actualiza después de cada consulta exitosa

4. **`lastFetch`**: Timestamp de la última consulta
   - `null` inicialmente
   - Se actualiza después de cada consulta exitosa

5. **`cacheTimeout`**: Tiempo de vida del caché
   - `5 * 60 * 1000` = 5 minutos en milisegundos
   - Después de 5 minutos, se considera expirado

6. **`axiosInstance`**: Instancia de axios configurada
   - `rejectUnauthorized: false`: Ignora errores de certificado SSL
   - **Nota**: En producción, deberías usar certificados válidos

### Método `fetchPhoneBook`

```javascript
async fetchPhoneBook() {
    try {
        // Verificar si tenemos datos en caché válidos
        if (this.cachedData && this.lastFetch && (Date.now() - this.lastFetch) < this.cacheTimeout) {
            return this.cachedData;
        }

        // Hacer la petición al servidor XML
        const response = await this.axiosInstance.get(this.phoneBookUrl);
        
        // Parsear el XML a JSON
        const result = this.parser.parse(response.data);
        
        // Procesar y formatear los datos
        this.cachedData = this.processPhoneBookData(result);
        this.lastFetch = Date.now();

        return this.cachedData;
    } catch (error) {
        console.error('Error fetching phone book:', error);
        throw new Error('Error al obtener el directorio telefónico');
    }
}
```

**Explicación Paso a Paso**:

#### Paso 1: Verificar Caché

```javascript
if (this.cachedData && this.lastFetch && (Date.now() - this.lastFetch) < this.cacheTimeout) {
    return this.cachedData;
}
```

**Lógica**:
- ¿Hay datos en caché? (`this.cachedData`)
- ¿Hay timestamp de última consulta? (`this.lastFetch`)
- ¿El caché no ha expirado? (`Date.now() - this.lastFetch < this.cacheTimeout`)

**Ejemplo**:
```javascript
// Escenario 1: Caché válido
this.cachedData = { entries: [...] };
this.lastFetch = Date.now() - (2 * 60 * 1000); // Hace 2 minutos
// Resultado: Retorna caché (menos de 5 minutos)

// Escenario 2: Caché expirado
this.cachedData = { entries: [...] };
this.lastFetch = Date.now() - (6 * 60 * 1000); // Hace 6 minutos
// Resultado: Consulta API externa (más de 5 minutos)
```

#### Paso 2: Consultar API Externa

```javascript
const response = await this.axiosInstance.get(this.phoneBookUrl);
```

**¿Qué hace?**
- Hace petición HTTPS GET a la URL externa
- Retorna la respuesta XML

**Manejo de Certificados SSL**:
```javascript
httpsAgent: new https.Agent({
    rejectUnauthorized: false
})
```

**¿Por qué `rejectUnauthorized: false`?**
- El certificado SSL del servidor externo puede no ser válido
- En desarrollo, permite conexión sin validar certificado
- **⚠️ En producción, deberías usar certificados válidos**

#### Paso 3: Parsear XML a JSON

```javascript
const result = this.parser.parse(response.data);
```

**¿Qué hace?**
- Convierte XML a objeto JavaScript
- Usa `fast-xml-parser` para el parsing

**Ejemplo**:
```xml
<!-- XML -->
<YealinkIPPhoneDirectory>
  <DirectoryEntry>
    <Name>Juan Pérez</Name>
    <Telephone>1234</Telephone>
  </DirectoryEntry>
</YealinkIPPhoneDirectory>
```

```javascript
// JSON resultante
{
  YealinkIPPhoneDirectory: {
    DirectoryEntry: {
      Name: "Juan Pérez",
      Telephone: "1234"
    }
  }
}
```

#### Paso 4: Procesar y Formatear

```javascript
this.cachedData = this.processPhoneBookData(result);
this.lastFetch = Date.now();
```

**¿Qué hace?**
- Procesa el JSON parseado
- Formatea a estructura más limpia
- Actualiza caché y timestamp

---

## Sistema de Caché

### ¿Por qué Caché?

**Ventajas**:
1. ✅ **Rendimiento**: Respuestas más rápidas (no consulta API externa cada vez)
2. ✅ **Reducción de Carga**: Menos peticiones al servidor externo
3. ✅ **Disponibilidad**: Si el servidor externo falla, se puede usar caché (aunque expirado)

**Desventajas**:
1. ⚠️ **Datos Desactualizados**: Puede mostrar datos antiguos (hasta 5 minutos)
2. ⚠️ **Memoria**: Almacena datos en memoria del servidor

### Implementación del Caché

**Estrategia**: Time-based caching (caché basado en tiempo)

**TTL (Time To Live)**: 5 minutos

**Almacenamiento**: En memoria (propiedades de la clase)

**Invalidación**: Automática por tiempo

### Ejemplo de Uso del Caché

```javascript
// Primera petición (10:00:00)
const data1 = await phoneBookService.fetchPhoneBook();
// → Consulta API externa
// → Tarda 2 segundos
// → Guarda en caché
// → Retorna datos

// Segunda petición (10:01:00) - 1 minuto después
const data2 = await phoneBookService.fetchPhoneBook();
// → Usa caché (menos de 5 minutos)
// → Tarda 0.01 segundos
// → Retorna datos del caché

// Tercera petición (10:06:00) - 6 minutos después
const data3 = await phoneBookService.fetchPhoneBook();
// → Caché expirado (más de 5 minutos)
// → Consulta API externa nuevamente
// → Actualiza caché
// → Retorna datos frescos
```

### Mejora Futura: Fallback a Caché Expirado

**Estado Actual**: Si el caché expira, consulta API externa. Si falla, lanza error.

**Mejora Sugerida**: Si la API externa falla, usar caché expirado como último recurso.

```javascript
async fetchPhoneBook() {
    try {
        // Verificar caché válido
        if (this.cachedData && this.lastFetch && (Date.now() - this.lastFetch) < this.cacheTimeout) {
            return this.cachedData;
        }

        // Intentar obtener datos frescos
        const response = await this.axiosInstance.get(this.phoneBookUrl);
        const result = this.parser.parse(response.data);
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

## Parsing de XML a JSON

### Método `processPhoneBookData`

```javascript
processPhoneBookData(data) {
    try {
        // Verificar estructura esperada
        if (!data.YealinkIPPhoneDirectory || !data.YealinkIPPhoneDirectory.DirectoryEntry) {
            throw new Error('Formato de datos inesperado');
        }

        // Extraer y formatear los datos
        const entries = data.YealinkIPPhoneDirectory.DirectoryEntry;
        
        const formattedData = {
            total: entries.length,
            lastUpdate: new Date().toISOString(),
            entries: entries
                .map(entry => ({
                    name: entry.Name.trim(),
                    extension: entry.Telephone.toString(),
                    searchText: `${entry.Name.trim()} ${entry.Telephone}`.toLowerCase()
                }))
                .sort((a, b) => a.name.localeCompare(b.name))
        };

        return formattedData;
    } catch (error) {
        console.error('Error processing phone book data:', error);
        throw new Error('Error al procesar los datos del directorio telefónico');
    }
}
```

**Explicación Paso a Paso**:

#### Paso 1: Validar Estructura

```javascript
if (!data.YealinkIPPhoneDirectory || !data.YealinkIPPhoneDirectory.DirectoryEntry) {
    throw new Error('Formato de datos inesperado');
}
```

**¿Qué hace?**
- Verifica que el XML parseado tenga la estructura esperada
- Si no, lanza error

**Estructura Esperada**:
```javascript
{
  YealinkIPPhoneDirectory: {
    DirectoryEntry: [
      { Name: "...", Telephone: "..." },
      { Name: "...", Telephone: "..." }
    ]
  }
}
```

#### Paso 2: Extraer Entradas

```javascript
const entries = data.YealinkIPPhoneDirectory.DirectoryEntry;
```

**¿Qué hace?**
- Extrae el array de entradas del directorio

**Nota**: Si hay solo una entrada, `DirectoryEntry` puede ser un objeto, no un array. Deberías normalizar:

```javascript
const entries = Array.isArray(data.YealinkIPPhoneDirectory.DirectoryEntry)
    ? data.YealinkIPPhoneDirectory.DirectoryEntry
    : [data.YealinkIPPhoneDirectory.DirectoryEntry];
```

#### Paso 3: Transformar y Formatear

```javascript
entries
    .map(entry => ({
        name: entry.Name.trim(),
        extension: entry.Telephone.toString(),
        searchText: `${entry.Name.trim()} ${entry.Telephone}`.toLowerCase()
    }))
```

**Transformaciones**:

1. **`name: entry.Name.trim()`**:
   - Elimina espacios en blanco al inicio y final
   - Ejemplo: `" Juan Pérez "` → `"Juan Pérez"`

2. **`extension: entry.Telephone.toString()`**:
   - Convierte a string (por si viene como número)
   - Ejemplo: `1234` → `"1234"`

3. **`searchText: ...`**:
   - Combina nombre y extensión en minúsculas
   - Facilita búsquedas case-insensitive
   - Ejemplo: `"juan pérez 1234"`

#### Paso 4: Ordenar

```javascript
.sort((a, b) => a.name.localeCompare(b.name))
```

**¿Qué hace?**
- Ordena alfabéticamente por nombre
- `localeCompare`: Compara considerando caracteres especiales (á, é, í, ó, ú)

**Ejemplo**:
```javascript
// Antes de ordenar:
[
  { name: "María González", extension: "5678" },
  { name: "Juan Pérez", extension: "1234" }
]

// Después de ordenar:
[
  { name: "Juan Pérez", extension: "1234" },
  { name: "María González", extension: "5678" }
]
```

#### Paso 5: Estructura Final

```javascript
{
    total: entries.length,
    lastUpdate: new Date().toISOString(),
    entries: [...]
}
```

**Campos**:
- `total`: Número total de contactos
- `lastUpdate`: Timestamp de última actualización (ISO 8601)
- `entries`: Array de contactos formateados

---

## Controlador y Rutas

### Controlador: `backend/controllers/phoneBookController.js`

```javascript
const phoneBookController = {
    async getDirectory(req, res) {
        try {
            const directory = await phoneBookService.fetchPhoneBook();
            res.json(directory);
        } catch (error) {
            console.error('Error en getDirectory:', error);
            res.status(500).json({ 
                error: 'Error al obtener el directorio telefónico',
                message: error.message 
            });
        }
    },

    async searchDirectory(req, res) {
        try {
            const { query } = req.query;
            const results = await phoneBookService.searchDirectory(query);
            res.json({
                query,
                total: results.length,
                results
            });
        } catch (error) {
            console.error('Error en searchDirectory:', error);
            res.status(500).json({ 
                error: 'Error al buscar en el directorio',
                message: error.message 
            });
        }
    }
};
```

**Métodos**:

1. **`getDirectory`**: Obtiene todo el directorio
   - Llama a `phoneBookService.fetchPhoneBook()`
   - Retorna JSON con todos los contactos

2. **`searchDirectory`**: Busca en el directorio
   - Extrae `query` de los parámetros de URL
   - Llama a `phoneBookService.searchDirectory(query)`
   - Retorna JSON con resultados filtrados

### Rutas: `backend/routes/phoneBookRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const phoneBookController = require('../controllers/phoneBookController');
const verifyToken = require('../middleware/auth');

// Proteger todas las rutas con autenticación
router.use(verifyToken);

// Obtener todo el directorio
router.get('/', phoneBookController.getDirectory);

// Buscar en el directorio
router.get('/search', phoneBookController.searchDirectory);

module.exports = router;
```

**Endpoints**:

1. **`GET /api/phonebook/`**:
   - Obtiene todo el directorio
   - Requiere autenticación JWT

2. **`GET /api/phonebook/search?query=<término>`**:
   - Busca contactos por nombre o extensión
   - Requiere autenticación JWT
   - Parámetro `query`: Término de búsqueda

**Ejemplo de Uso**:
```javascript
// Obtener todo el directorio
GET /api/phonebook/
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

// Buscar "Juan"
GET /api/phonebook/search?query=Juan
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Método de Búsqueda: `searchDirectory`

**Archivo**: `backend/services/phoneBookService.js`

```javascript
async searchDirectory(query) {
    const data = await this.fetchPhoneBook();
    if (!query) return data.entries;

    const searchText = query.toLowerCase();
    return data.entries.filter(entry => 
        entry.searchText.includes(searchText)
    );
}
```

**Explicación**:

1. **Obtener Datos**:
   ```javascript
   const data = await this.fetchPhoneBook();
   ```
   - Obtiene directorio (puede usar caché)

2. **Validar Query**:
   ```javascript
   if (!query) return data.entries;
   ```
   - Si no hay query, retorna todos los contactos

3. **Filtrar**:
   ```javascript
   const searchText = query.toLowerCase();
   return data.entries.filter(entry => 
       entry.searchText.includes(searchText)
   );
   ```
   - Convierte query a minúsculas
   - Filtra contactos que contengan el término en `searchText`

**Ejemplo**:
```javascript
// Directorio:
[
  { name: "Juan Pérez", extension: "1234", searchText: "juan pérez 1234" },
  { name: "María González", extension: "5678", searchText: "maría gonzález 5678" }
]

// Búsqueda: "juan"
searchDirectory("juan")
// Resultado:
[
  { name: "Juan Pérez", extension: "1234", searchText: "juan pérez 1234" }
]

// Búsqueda: "1234"
searchDirectory("1234")
// Resultado:
[
  { name: "Juan Pérez", extension: "1234", searchText: "juan pérez 1234" }
]
```

---

## Frontend: Visualización

### Archivo: `frontend/vue-app/src/views/Admin_app.vue`

#### Método `refreshDirectory`

```javascript
async refreshDirectory() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/phonebook', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            this.directoryContacts = data.entries.map((entry, index) => ({
                id: index + 1,
                name: entry.name,
                extension: entry.extension
            }));
            this.filteredDirectory = [...this.directoryContacts];
            this.lastDirectoryUpdate = new Date().toLocaleString();
        } else {
            console.error('Error al obtener el directorio');
            alert('Error al obtener el directorio telefónico');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al conectar con el servidor');
    }
}
```

**Explicación**:

1. **Obtener Token**:
   ```javascript
   const token = localStorage.getItem('token');
   ```
   - Obtiene token JWT del localStorage

2. **Hacer Petición**:
   ```javascript
   const response = await fetch('http://localhost:3000/api/phonebook', {
       headers: {
           'Authorization': `Bearer ${token}`
       }
   });
   ```
   - Petición GET con token en header

3. **Procesar Respuesta**:
   ```javascript
   const data = await response.json();
   this.directoryContacts = data.entries.map((entry, index) => ({
       id: index + 1,
       name: entry.name,
       extension: entry.extension
   }));
   ```
   - Mapea entradas a formato para la tabla
   - Agrega `id` secuencial

4. **Actualizar Estado**:
   ```javascript
   this.filteredDirectory = [...this.directoryContacts];
   this.lastDirectoryUpdate = new Date().toLocaleString();
   ```
   - Inicializa `filteredDirectory` con todos los contactos
   - Guarda timestamp de última actualización

#### Método `searchDirectory`

```javascript
searchDirectory() {
    if (!this.directorySearch) {
        this.filteredDirectory = [...this.directoryContacts];
        return;
    }

    const searchTerm = this.directorySearch.toLowerCase().trim();
    this.filteredDirectory = this.directoryContacts.filter(contact => 
        contact.name.toLowerCase().includes(searchTerm) ||
        contact.extension.toString().includes(searchTerm)
    );
}
```

**Explicación**:

1. **Validar Query**:
   ```javascript
   if (!this.directorySearch) {
       this.filteredDirectory = [...this.directoryContacts];
       return;
   }
   ```
   - Si no hay término de búsqueda, muestra todos los contactos

2. **Filtrar**:
   ```javascript
   const searchTerm = this.directorySearch.toLowerCase().trim();
   this.filteredDirectory = this.directoryContacts.filter(contact => 
       contact.name.toLowerCase().includes(searchTerm) ||
       contact.extension.toString().includes(searchTerm)
   );
   ```
   - Filtra por nombre o extensión
   - Búsqueda case-insensitive

**Nota**: La búsqueda se hace en el frontend (sobre datos ya cargados). Podrías también hacer búsqueda en el backend usando el endpoint `/api/phonebook/search`.

#### Template Vue

```vue
<div v-if="activeSection === 'directorio'" class="directory-section">
    <div class="section-header">
        <h3>Directorio Telefónico</h3>
        <button class="refresh-btn" @click="refreshDirectory">
            <i class="fas fa-sync-alt"></i> Actualizar
        </button>
    </div>

    <div class="last-update-info" v-if="lastDirectoryUpdate">
        Última actualización: {{ lastDirectoryUpdate }}
    </div>

    <div class="directory-search">
        <input 
            type="text" 
            v-model="directorySearch" 
            placeholder="Buscar por nombre o anexo..."
            @input="searchDirectory"
        >
    </div>

    <table class="directory-table">
        <thead>
            <tr>
                <th>Nombre</th>
                <th>Anexo</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="contact in filteredDirectory" :key="contact.id">
                <td>{{ contact.name }}</td>
                <td>{{ contact.extension }}</td>
            </tr>
        </tbody>
    </table>
</div>
```

**Elementos**:

1. **Botón Actualizar**: Llama a `refreshDirectory()`
2. **Info de Actualización**: Muestra timestamp de última actualización
3. **Campo de Búsqueda**: Filtra contactos en tiempo real
4. **Tabla**: Muestra contactos filtrados

---

## Manejo de Errores

### Errores en el Servicio

```javascript
async fetchPhoneBook() {
    try {
        // ... lógica ...
    } catch (error) {
        console.error('Error fetching phone book:', error);
        throw new Error('Error al obtener el directorio telefónico');
    }
}
```

**Tipos de Errores Posibles**:

1. **Error de Conexión**:
   - Servidor externo no disponible
   - Timeout de conexión
   - Error de red

2. **Error de Parsing**:
   - XML mal formado
   - Estructura inesperada

3. **Error de Procesamiento**:
   - Datos faltantes
   - Formato incorrecto

### Errores en el Controlador

```javascript
async getDirectory(req, res) {
    try {
        const directory = await phoneBookService.fetchPhoneBook();
        res.json(directory);
    } catch (error) {
        console.error('Error en getDirectory:', error);
        res.status(500).json({ 
            error: 'Error al obtener el directorio telefónico',
            message: error.message 
        });
    }
}
```

**Respuesta de Error**:
```json
{
    "error": "Error al obtener el directorio telefónico",
    "message": "Error al obtener el directorio telefónico"
}
```

### Errores en el Frontend

```javascript
async refreshDirectory() {
    try {
        // ... petición ...
    } catch (error) {
        console.error('Error:', error);
        alert('Error al conectar con el servidor');
    }
}
```

**Manejo**:
- Registra error en consola
- Muestra alerta al usuario
- No rompe la aplicación

---

## Seguridad

### Autenticación JWT

**Todas las rutas requieren autenticación**:

```javascript
router.use(verifyToken);
```

**¿Qué hace?**
- Verifica token JWT en todas las peticiones
- Si el token es inválido o expiró, retorna 401/403

### HTTPS

**Conexión a API Externa**:
- Protocolo: HTTPS
- Certificado SSL: Ignorado en desarrollo (`rejectUnauthorized: false`)
- **⚠️ En producción, usar certificados válidos**

### Validación de Datos

**Backend**:
- Valida estructura del XML parseado
- Valida que existan campos requeridos

**Frontend**:
- Sanitiza búsqueda (aunque se hace en frontend, no es crítico)
- Valida respuesta antes de procesar

---

## Resumen

### Componentes del Sistema

1. **Servicio** (`phoneBookService.js`):
   - Consulta API externa
   - Sistema de caché (5 minutos)
   - Parsing XML → JSON
   - Búsqueda de contactos

2. **Controlador** (`phoneBookController.js`):
   - Endpoints REST
   - Manejo de errores
   - Respuestas JSON

3. **Rutas** (`phoneBookRoutes.js`):
   - Definición de endpoints
   - Middleware de autenticación

4. **Frontend** (`Admin_app.vue`):
   - Visualización del directorio
   - Búsqueda en tiempo real
   - Actualización manual

### Flujo Completo

```
Usuario hace clic en "Actualizar"
    ↓
Frontend: refreshDirectory()
    ↓
HTTP GET /api/phonebook
    ↓
Backend: verifyToken (JWT)
    ↓
Backend: phoneBookController.getDirectory()
    ↓
Backend: phoneBookService.fetchPhoneBook()
    ↓
¿Caché válido?
    ├─► Sí → Retornar caché
    └─► No → Consultar API externa
            ↓
        HTTPS GET (XML)
            ↓
        Parse XML → JSON
            ↓
        Procesar y formatear
            ↓
        Actualizar caché
            ↓
        Retornar datos
    ↓
Frontend: Mostrar en tabla
```

---

## Preguntas Frecuentes

### ¿Por qué caché de 5 minutos?

**Respuesta**: Balance entre datos actualizados y rendimiento. 5 minutos es razonable para un directorio telefónico que no cambia frecuentemente.

### ¿Qué pasa si el servidor externo falla?

**Respuesta**: Actualmente lanza error. Mejora sugerida: usar caché expirado como fallback.

### ¿Por qué ignorar certificados SSL?

**Respuesta**: En desarrollo, el certificado puede no ser válido. En producción, deberías usar certificados válidos.

### ¿Se puede buscar por nombre parcial?

**Respuesta**: Sí, la búsqueda usa `includes()`, así que busca coincidencias parciales.

---

## Próximos Pasos

Ahora que entiendes el directorio telefónico, has completado todos los manuales. Puedes:
- Revisar los manuales anteriores para profundizar
- Implementar mejoras sugeridas
- Agregar nuevas funcionalidades

---

**Última actualización**: Enero 2025

**Versión**: 1.0

