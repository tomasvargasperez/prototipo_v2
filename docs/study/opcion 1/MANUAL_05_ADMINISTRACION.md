# Manual 05: Administración - Dashboard y Gestión de Usuarios

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Panel de Administración](#panel-de-administración)
3. [Dashboard - Métricas y Estadísticas](#dashboard---métricas-y-estadísticas)
4. [Gestión de Usuarios](#gestión-de-usuarios)
5. [Gestión de Canales](#gestión-de-canales)
6. [Foro de Anuncios](#foro-de-anuncios)
7. [Sugerencias Anónimas](#sugerencias-anónimas)
8. [Directorio Telefónico](#directorio-telefónico)

---

## Introducción

El panel de administración es el **centro de control** de tu aplicación. Permite a los administradores gestionar usuarios, canales, ver estadísticas y moderar contenido. Este manual te explicará cómo funciona cada componente y por qué se implementó de esa manera.

### Objetivos del Panel de Administración

1. ✅ Visualizar métricas en tiempo real
2. ✅ Gestionar usuarios (crear, editar, eliminar, activar/desactivar)
3. ✅ Gestionar canales (crear, editar, eliminar)
4. ✅ Publicar y moderar anuncios
5. ✅ Revisar sugerencias anónimas
6. ✅ Acceder al directorio telefónico

### Control de Acceso

**Solo usuarios con rol `admin` pueden acceder al panel de administración.**

**Archivo**: `frontend/vue-app/src/views/Admin_app.vue`

```javascript
mounted() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || user.role !== 'admin') {
    this.$router.push('/chat');
    return;
  }
  // ... resto del código
}
```

**¿Qué hace?**: Verifica el rol del usuario antes de mostrar el panel.

**¿Por qué es importante?**: Previene que usuarios regulares accedan a funciones administrativas.

---

## Panel de Administración

### Estructura del Componente

**Archivo**: `frontend/vue-app/src/views/Admin_app.vue`

El panel tiene **6 secciones principales**:

1. **Dashboard**: Métricas y gráficos
2. **Usuarios**: Gestión de usuarios
3. **Canales**: Gestión de canales
4. **Foro de Anuncios**: Publicar y moderar anuncios
5. **Sugerencias Anónimas**: Revisar sugerencias
6. **Directorio Telefónico**: Ver directorio

### Navegación entre Secciones

```javascript
data() {
  return {
    activeSection: 'dashboard',  // Sección activa por defecto
    // ... otros datos
  }
},
methods: {
  setActiveSection(section) {
    this.activeSection = section;
  }
}
```

**¿Cómo funciona?**
- Cada sección tiene un botón en el sidebar
- Al hacer clic, se actualiza `activeSection`
- Vue renderiza condicionalmente según `activeSection`

**Ejemplo**:
```vue
<div v-if="activeSection === 'dashboard'">
  <!-- Contenido del dashboard -->
</div>
<div v-if="activeSection === 'usuarios'">
  <!-- Contenido de usuarios -->
</div>
```

---

## Dashboard - Métricas y Estadísticas

### Endpoint del Dashboard

**Archivo**: `backend/routes/DashboardRoutes.js`

```javascript
router.get('/dashboard', authenticateToken, isAdmin, async (req, res) => {
```

**¿Qué hace?**: Retorna todas las métricas del sistema.

**¿Por qué solo admin?**
- Las métricas son información sensible
- Solo los administradores necesitan ver estadísticas globales

### Métricas Recopiladas

#### 1. Total de Usuarios

```javascript
const totalUsers = await User.countDocuments();
```

**¿Qué hace?**: Cuenta todos los usuarios en la BD.

**¿Por qué `countDocuments()`?**
- Más eficiente que `find().length`
- No carga los documentos, solo cuenta
- MongoDB optimiza esta operación

#### 2. Total de Canales Activos

```javascript
const totalChannels = await Channel.countDocuments({ active: true });
```

**¿Qué hace?**: Cuenta solo canales activos.

**¿Por qué filtrar por `active: true`?**
- Los canales desactivados no se usan
- Solo interesan canales en uso

#### 3. Total de Mensajes

```javascript
const totalMessages = await Message.countDocuments();
```

**¿Qué hace?**: Cuenta todos los mensajes.

**Nota**: No filtra por fecha, cuenta todos los mensajes históricos.

### Actividad por Canal

**Consulta MongoDB con Agregación**:

```javascript
const channelActivity = await Message.aggregate([
  {
    $group: {
      _id: '$channel',
      messages: { $sum: 1 }
    }
  },
  {
    $lookup: {
      from: 'channels',
      localField: '_id',
      foreignField: '_id',
      as: 'channelInfo'
    }
  },
  {
    $unwind: '$channelInfo'
  },
  {
    $project: {
      name: '$channelInfo.name',
      messages: 1
    }
  },
  {
    $sort: { messages: -1 }
  }
]);
```

### Explicación Paso a Paso

#### Paso 1: `$group`

```javascript
{
  $group: {
    _id: '$channel',
    messages: { $sum: 1 }
  }
}
```

**¿Qué hace?**: Agrupa mensajes por canal y cuenta cuántos hay en cada uno.

**Ejemplo**:
```
Mensajes en BD:
- Mensaje 1: channel = "canal-1"
- Mensaje 2: channel = "canal-1"
- Mensaje 3: channel = "canal-2"

Después de $group:
[
  { _id: "canal-1", messages: 2 },
  { _id: "canal-2", messages: 1 }
]
```

#### Paso 2: `$lookup`

```javascript
{
  $lookup: {
    from: 'channels',
    localField: '_id',
    foreignField: '_id',
    as: 'channelInfo'
  }
}
```

**¿Qué hace?**: Hace un JOIN con la colección `channels` para obtener datos del canal.

**¿Por qué es necesario?**
- `_id` es solo el ObjectId del canal
- Necesitas el nombre del canal para mostrarlo

**Ejemplo**:
```
Antes de $lookup:
{ _id: "canal-1", messages: 2 }

Después de $lookup:
{
  _id: "canal-1",
  messages: 2,
  channelInfo: [
    { _id: "canal-1", name: "General", description: "..." }
  ]
}
```

#### Paso 3: `$unwind`

```javascript
{
  $unwind: '$channelInfo'
}
```

**¿Qué hace?**: Convierte el array `channelInfo` en un objeto.

**¿Por qué es necesario?**
- `$lookup` retorna un array
- Necesitas un objeto para acceder a `channelInfo.name`

**Ejemplo**:
```
Antes de $unwind:
{
  _id: "canal-1",
  messages: 2,
  channelInfo: [{ name: "General" }]  // ← Array
}

Después de $unwind:
{
  _id: "canal-1",
  messages: 2,
  channelInfo: { name: "General" }  // ← Objeto
}
```

#### Paso 4: `$project`

```javascript
{
  $project: {
    name: '$channelInfo.name',
    messages: 1
  }
}
```

**¿Qué hace?**: Selecciona solo los campos que necesitas.

**¿Por qué?**
- Reduce el tamaño de la respuesta
- Simplifica el objeto final

**Ejemplo**:
```
Antes de $project:
{
  _id: "canal-1",
  messages: 2,
  channelInfo: { name: "General", description: "...", ... }
}

Después de $project:
{
  name: "General",
  messages: 2
}
```

#### Paso 5: `$sort`

```javascript
{
  $sort: { messages: -1 }
}
```

**¿Qué hace?**: Ordena por cantidad de mensajes (descendente).

**Resultado final**:
```javascript
[
  { name: "General", messages: 16 },
  { name: "Normativas Internas", messages: 9 },
  { name: "Beneficios", messages: 7 }
]
```

### Top Usuarios Activos

**Consulta Similar**:

```javascript
const topUsers = await Message.aggregate([
  {
    $group: {
      _id: '$userId',
      messages: { $sum: 1 }
    }
  },
  {
    $lookup: {
      from: 'users',
      localField: '_id',
      foreignField: '_id',
      as: 'userInfo'
    }
  },
  {
    $unwind: '$userInfo'
  },
  {
    $project: {
      name: '$userInfo.name',
      messages: 1
    }
  },
  {
    $sort: { messages: -1 }
  },
  {
    $limit: 5
  }
]);
```

**Diferencia clave**: `$limit: 5` para obtener solo los top 5.

**Asignación de Ranking**:

```javascript
const rankedUsers = topUsers.map((user, index) => ({
  ...user,
  rank: index + 1
}));
```

**¿Qué hace?**: Agrega un campo `rank` basado en la posición del array.

**Resultado**:
```javascript
[
  { name: "Pedro Aranda", messages: 14, rank: 1 },
  { name: "Randy Medina", messages: 13, rank: 2 },
  { name: "pepito", messages: 5, rank: 3 }
]
```

### Actividad Diaria (Últimos 7 Días)

```javascript
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

const userActivityResults = await Message.aggregate([
  {
    $match: {
      createdAt: { $gte: sevenDaysAgo }
    }
  },
  {
    $group: {
      _id: {
        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
      },
      count: { $sum: 1 }
    }
  },
  {
    $sort: { _id: 1 }
  }
]);
```

### Explicación

#### `$match`

```javascript
{
  $match: {
    createdAt: { $gte: sevenDaysAgo }
  }
}
```

**¿Qué hace?**: Filtra mensajes de los últimos 7 días.

**Operador `$gte`**: "Greater Than or Equal" (mayor o igual que).

#### `$dateToString`

```javascript
{
  $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
}
```

**¿Qué hace?**: Convierte la fecha a string en formato `YYYY-MM-DD`.

**Ejemplo**:
```
createdAt: 2025-01-17T10:30:00Z
→ "2025-01-17"
```

#### Completar Fechas Faltantes

```javascript
const userActivity = [];
for (let i = 6; i >= 0; i--) {
  const date = new Date();
  date.setDate(date.getDate() - i);
  const dateStr = date.toISOString().split('T')[0];
  const activityForDate = userActivityResults.find(r => r._id === dateStr);
  userActivity.push({
    date: dateStr,
    count: activityForDate ? activityForDate.count : 0
  });
}
```

**¿Qué hace?**: Asegura que haya una entrada para cada día, incluso si no hay mensajes.

**¿Por qué es importante?**
- Los gráficos necesitan datos continuos
- Si falta un día, el gráfico se ve mal

**Ejemplo**:
```
userActivityResults:
[
  { _id: "2025-01-15", count: 5 },
  { _id: "2025-01-17", count: 8 }
]

userActivity (completado):
[
  { date: "2025-01-11", count: 0 },
  { date: "2025-01-12", count: 0 },
  { date: "2025-01-13", count: 0 },
  { date: "2025-01-14", count: 0 },
  { date: "2025-01-15", count: 5 },
  { date: "2025-01-16", count: 0 },
  { date: "2025-01-17", count: 8 }
]
```

### Visualización con Chart.js

**Frontend**: `Admin_app.vue`

```javascript
import Chart from 'chart.js/auto';

initializeCharts(data) {
  // Gráfico de barras - Actividad por Canal
  this.channelActivityChart = new Chart(channelCtx, {
    type: 'bar',
    data: {
      labels: data.channelActivity.map(c => c.name),
      datasets: [{
        label: 'Mensajes por Canal',
        data: data.channelActivity.map(c => c.messages),
        backgroundColor: '#8e44ad'
      }]
    }
  });
  
  // Gráfico de línea - Actividad diaria
  this.userActivityChart = new Chart(userCtx, {
    type: 'line',
    data: {
      labels: data.userActivity.map(d => d.date),
      datasets: [{
        label: 'Mensajes por Día',
        data: data.userActivity.map(d => d.count),
        borderColor: '#2ecc71'
      }]
    }
  });
}
```

**¿Por qué Chart.js?**
- Librería popular y bien mantenida
- Fácil de usar
- Soporta múltiples tipos de gráficos
- Responsive por defecto

### Actualización en Tiempo Real

**Socket.IO para Actualizaciones**:

```javascript
// Backend
socket.getIO().emit('dashboard_update');

// Frontend
this.socket.on('dashboard_update', () => {
  if (this.activeSection === 'dashboard') {
    this.fetchDashboardData();
  }
});
```

**¿Qué hace?**: Cuando se crea/elimina un canal, se emite evento para actualizar el dashboard.

**¿Por qué es útil?**
- El admin ve cambios inmediatamente
- No necesita refrescar la página

---

## Gestión de Usuarios

### Obtener Todos los Usuarios

**Backend**: `backend/routes/UserRoutes.js`

```javascript
router.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
  const users = await UserSchema.find({}, '-password');
  res.json(users);
});
```

**¿Qué hace `-password`?**
- Excluye el campo `password` de la respuesta
- **Nunca** se debe enviar contraseñas al frontend

**Seguridad**: Aunque las contraseñas están hasheadas, nunca se exponen.

### Crear Usuario

**Backend**:

```javascript
router.post('/api/users', authenticateToken, isAdmin, async (req, res) => {
  const { name, email, password, role, active } = req.body;

  // Verificar si el email ya existe
  const existingUser = await UserSchema.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'El email ya está registrado' });
  }

  const newUser = new UserSchema({
    name,
    email,
    password,  // Sin hashear aquí
    role,
    active
  });

  const savedUser = await newUser.save();
  // El middleware pre-save hashea la contraseña automáticamente
});
```

**¿Por qué no hashear manualmente?**
- El modelo `User` tiene un middleware `pre('save')` que hashea automáticamente
- Evita duplicar lógica
- Garantiza que siempre se hashee

**Middleware de Hasheo** (`backend/models/User.js`):

```javascript
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();  // Si no se modificó, no hashear
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

**¿Qué hace `isModified('password')`?**
- Verifica si el campo `password` fue modificado
- Si solo actualizas `name` o `email`, no re-hashea la contraseña

### Actualizar Usuario

**Backend**:

```javascript
router.patch('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
  const updateData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    active: req.body.active
  };

  // Si se proporciona una nueva contraseña, encriptarla
  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(req.body.password, salt);
  }

  const updatedUser = await UserSchema.findByIdAndUpdate(
    userId,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');
});
```

**¿Por qué hashear manualmente aquí?**
- `findByIdAndUpdate` **NO ejecuta** el middleware `pre('save')`
- Debes hashear manualmente si actualizas la contraseña

**Alternativa**: Usar `findById` + `save()` para que se ejecute el middleware.

**Frontend - Modal de Edición**:

```vue
<div class="password-section">
  <h3>Cambiar Contraseña</h3>
  <input 
    :type="showPassword ? 'text' : 'password'" 
    v-model="newPassword" 
    placeholder="Dejar vacío para mantener la actual"
  >
  <input 
    v-if="newPassword"
    v-model="confirmPassword"
    placeholder="Confirmar nueva contraseña"
  >
</div>
```

**Validación en Frontend**:

```javascript
async updateUser() {
  if (this.newPassword) {
    if (this.newPassword !== this.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    if (this.newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }
  }
  // ... enviar al backend
}
```

### Eliminar Usuario

**Backend**:

```javascript
router.delete('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
  const deletedUser = await UserSchema.findByIdAndDelete(userId);
  if (!deletedUser) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }
  res.json({ message: 'Usuario eliminado correctamente' });
});
```

**¿Qué pasa con los mensajes del usuario?**
- Los mensajes **NO se eliminan** automáticamente
- Quedan en la BD con referencia al usuario eliminado
- Puedes implementar eliminación en cascada si lo necesitas

### Activar/Desactivar Usuario

**Campo `active` en el Modelo**:

```javascript
active: {
  type: Boolean,
  default: true
}
```

**Uso**:
- `active: true` → Usuario puede hacer login
- `active: false` → Usuario **NO puede** hacer login

**Verificación en Login**:

```javascript
router.post('/login', async (req, res) => {
  const user = await UserSchema.findOne({ email });
  if (!user.active) {
    return res.status(403).json({ 
      message: 'Usuario inactivo. Contacte al administrador.' 
    });
  }
  // ... resto del login
});
```

**¿Por qué desactivar en lugar de eliminar?**
- Mantiene el historial
- Puedes reactivar más tarde
- Útil para suspensiones temporales

---

## Gestión de Canales

**Nota**: La gestión de canales se explica en detalle en el **Manual 04: Gestión de Canales**.

**Resumen de Funcionalidades**:
- Crear canal (público/privado)
- Editar canal (nombre, descripción, permisos)
- Eliminar canal
- Ver lista de canales con información detallada

**Frontend - Modal de Canal**:

```vue
<div v-if="!channelForm.isPublic">
  <label>Usuarios con acceso:</label>
  <div v-for="user in users" :key="user._id">
    <input 
      type="checkbox" 
      :value="user._id"
      v-model="channelForm.allowedUsers"
    >
    <span>{{ user.name }} ({{ user.email }})</span>
  </div>
</div>
```

**¿Qué hace?**: Muestra checkboxes para seleccionar usuarios cuando el canal es privado.

---

## Foro de Anuncios

### Obtener Anuncios

**Backend**: `backend/routes/AnnouncementRoutes.js`

```javascript
router.get('/', authenticateToken, async (req, res) => {
  const announcements = await Announcement.find()
    .populate('author', 'name')
    .sort({ timestamp: -1 });
  res.json(announcements);
});
```

**¿Qué hace `populate('author', 'name')`?**
- Reemplaza el ObjectId de `author` con el nombre del usuario
- Solo trae el campo `name` (más eficiente)

### Crear Anuncio

**Backend**:

```javascript
router.post('/', authenticateToken, async (req, res) => {
  const announcement = new Announcement({
    title: req.body.title,
    content: req.body.content,
    author: req.user.userId,
    timestamp: new Date()
  });
  const saved = await announcement.save();
  res.json({ announcement: saved });
});
```

**Frontend - Formulario**:

```vue
<div class="announcement-form">
  <input v-model="newAnnouncement.title" placeholder="Título">
  <textarea v-model="newAnnouncement.content" rows="4"></textarea>
  <button @click="createAnnouncement">Publicar Anuncio</button>
</div>
```

### Eliminar Anuncio

**Backend**:

```javascript
router.delete('/:id', authenticateToken, async (req, res) => {
  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ message: 'Anuncio eliminado' });
});
```

**Nota**: Solo admins pueden eliminar anuncios (verificado por middleware).

---

## Sugerencias Anónimas

### Obtener Sugerencias

**Backend**: `backend/routes/SuggestionRoutes.js`

```javascript
router.get('/', authenticateToken, async (req, res) => {
  const suggestions = await Suggestion.find()
    .sort({ timestamp: -1 });
  
  // Desencriptar contenido
  const decrypted = suggestions.map(s => ({
    ...s.toObject(),
    content: decrypt(s.content)
  }));
  
  res.json(decrypted);
});
```

**¿Por qué desencriptar?**
- Las sugerencias se almacenan encriptadas
- Solo los admins pueden verlas desencriptadas

### Actualizar Estado de Sugerencia

**Backend**:

```javascript
router.put('/:id/status', authenticateToken, async (req, res) => {
  const { status } = req.body;
  const suggestion = await Suggestion.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );
  res.json(suggestion);
});
```

**Estados posibles**:
- `pending`: Pendiente de revisión
- `reviewed`: Revisada
- `implemented`: Implementada

**Frontend - Filtro**:

```vue
<select v-model="suggestionFilter">
  <option value="all">Todas</option>
  <option value="pending">Pendientes</option>
  <option value="reviewed">Revisadas</option>
  <option value="implemented">Implementadas</option>
</select>
```

**Filtrado**:

```javascript
computed: {
  filteredSuggestions() {
    if (this.suggestionFilter === 'all') {
      return this.suggestions;
    }
    return this.suggestions.filter(
      s => s.status === this.suggestionFilter
    );
  }
}
```

---

## Directorio Telefónico

### Obtener Directorio

**Backend**: `backend/routes/phoneBookRoutes.js`

```javascript
router.get('/', authenticateToken, async (req, res) => {
  const entries = await phoneBookService.getPhoneBook();
  res.json({ entries });
});
```

**Servicio**: `backend/services/phoneBookService.js`

**¿Qué hace?**
- Consulta API externa (XML)
- Parsea los datos
- Retorna lista de contactos

**Frontend - Búsqueda**:

```javascript
searchDirectory() {
  const searchTerm = this.directorySearch.toLowerCase().trim();
  this.filteredDirectory = this.directoryContacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm) ||
    contact.extension.toString().includes(searchTerm)
  );
}
```

**¿Qué hace?**: Filtra contactos por nombre o anexo.

**Actualización**:

```javascript
async refreshDirectory() {
  const response = await fetch('http://localhost:3000/api/phonebook');
  const data = await response.json();
  this.directoryContacts = data.entries.map((entry, index) => ({
    id: index + 1,
    name: entry.name,
    extension: entry.extension
  }));
  this.lastDirectoryUpdate = new Date().toLocaleString();
}
```

---

## Resumen

### Funcionalidades del Panel de Administración

1. **Dashboard**:
   - Métricas globales (usuarios, canales, mensajes)
   - Actividad por canal (gráfico de barras)
   - Top usuarios activos
   - Actividad diaria (gráfico de línea)

2. **Gestión de Usuarios**:
   - Crear, editar, eliminar usuarios
   - Cambiar contraseñas
   - Activar/desactivar usuarios
   - Asignar roles (admin/user)

3. **Gestión de Canales**:
   - Crear canales públicos/privados
   - Editar permisos
   - Eliminar canales

4. **Foro de Anuncios**:
   - Publicar anuncios
   - Eliminar anuncios

5. **Sugerencias Anónimas**:
   - Ver sugerencias (desencriptadas)
   - Cambiar estado (pending/reviewed/implemented)
   - Filtrar por estado

6. **Directorio Telefónico**:
   - Ver directorio
   - Buscar por nombre/anexo
   - Actualizar desde API externa

### Seguridad

- ✅ Solo admins pueden acceder
- ✅ Contraseñas nunca se envían al frontend
- ✅ Validación en frontend y backend
- ✅ Middleware de autenticación en todas las rutas

---

## Preguntas Frecuentes

### ¿Por qué usar agregaciones de MongoDB?

**Respuesta**: Las agregaciones permiten procesar datos complejos directamente en la BD, reduciendo la carga en el servidor Node.js.

### ¿Qué pasa si elimino un usuario?

**Respuesta**: El usuario se elimina, pero sus mensajes quedan en la BD. Puedes implementar eliminación en cascada si lo necesitas.

### ¿Cómo se actualiza el dashboard en tiempo real?

**Respuesta**: Usando Socket.IO. Cuando se crea/elimina un canal, se emite `dashboard_update` y el frontend recarga los datos.

### ¿Por qué las sugerencias están encriptadas?

**Respuesta**: Para proteger la privacidad de los usuarios. Solo los admins pueden desencriptarlas.

---

## Próximos Pasos

Ahora que entiendes la administración, puedes continuar con:
- **Manual 06**: Seguridad (sanitización, encriptación, ISO 27001)
- **Manual 07**: Directorio Telefónico (integración externa)

---

**Última actualización**: Enero 2025

**Versión**: 1.0

