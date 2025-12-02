# Formato de Texto con Markdown en el Chat

## 📋 Índice
1. [Descripción General](#descripción-general)
2. [Objetivo](#objetivo)
3. [Decisiones Técnicas](#decisiones-técnicas)
4. [Implementación](#implementación)
5. [Guía de Uso](#guía-de-uso)
6. [Cambios en el Código](#cambios-en-el-código)
7. [Compatibilidad](#compatibilidad)
8. [Pruebas](#pruebas)
9. [Próximos Pasos](#próximos-pasos)

---

## Descripción General

Esta funcionalidad agrega capacidades de formateo de texto al sistema de chat mediante la implementación de **Markdown**. Los usuarios podrán aplicar formato a sus mensajes (negrita, cursiva, tachado, código, enlaces) utilizando una barra de herramientas visual y sintaxis Markdown estándar.

### Estado
- **Versión:** 1.1.0
- **Fecha:** [Fecha de implementación]
- **Estado:** ⏳ Pendiente de implementación
- **Prioridad:** Alta

---

## Objetivo

Mejorar la experiencia de usuario en el chat permitiendo:
- ✅ Formatear texto (negrita, cursiva, tachado)
- ✅ Insertar código inline
- ✅ Agregar enlaces
- ✅ Mantener compatibilidad con mensajes existentes
- ✅ Interfaz intuitiva con botones de formato

---

## Decisiones Técnicas

### Opción Seleccionada: Markdown con Librerías

**Librerías elegidas:**
- **`marked`**: Conversión de Markdown a HTML (Backend)
- **`DOMPurify`** o **`isomorphic-dompurify`**: Sanitización de HTML para seguridad XSS (Backend)

**IMPORTANTE:** Toda la sanitización y procesamiento se realiza en el **backend**, el frontend solo recibe HTML ya sanitizado y lo renderiza.

### ¿Por qué Markdown?

| Criterio | Markdown | WYSIWYG | contentEditable |
|----------|----------|---------|-----------------|
| **Peso** | ⭐⭐⭐⭐⭐ (20 KB) | ⭐⭐ (100-200 KB) | ⭐⭐⭐⭐⭐ (0 KB) |
| **Complejidad** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **UX** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Mantenimiento** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Estándar** | ✅ Sí | ❌ No | ❌ No |

**Ventajas:**
- ✅ Ligero y rápido
- ✅ Sintaxis estándar y conocida
- ✅ Fácil de implementar sin romper código existente
- ✅ Escalable (fácil agregar más sintaxis)
- ✅ Compatible con texto plano (si no usas Markdown, funciona igual)

---

## Implementación

### Arquitectura

```
┌─────────────────────────────────────────────────┐
│         Chat.vue (Frontend)                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Barra de Herramientas (Botones)         │  │
│  │  [B] [I] [S] [Code] [Link]               │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Textarea (v-model="newMessage")         │  │
│  │  - Sintaxis Markdown visible             │  │
│  │  - Enter = Enviar (opcional)             │  │
│  │  - Shift+Enter = Nueva línea             │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  sendMessage()                            │  │
│  │  → Envía texto con Markdown              │  │
│  │  → Socket.IO → Backend                   │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Renderizado de Mensajes                 │  │
│  │  → Recibe HTML ya sanitizado del backend │  │
│  │  → v-html → Renderizado                  │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────┐
│         Backend (Node.js/Express)               │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Recibe: texto con Markdown              │  │
│  │  Ejemplo: "**Hola** esto es *importante*"│  │
│  └──────────────────────────────────────────┘  │
│                         ↓                       │
│  ┌──────────────────────────────────────────┐  │
│  │  sanitizeForMarkdown()                    │  │
│  │  → Escapa HTML peligroso                  │  │
│  │  → Permite sintaxis Markdown              │  │
│  └──────────────────────────────────────────┘  │
│                         ↓                       │
│  ┌──────────────────────────────────────────┐  │
│  │  Guarda en BD: Markdown                   │  │
│  │  Ejemplo: "**Hola** esto es *importante*" │  │
│  └──────────────────────────────────────────┘  │
│                         ↓                       │
│  ┌──────────────────────────────────────────┐  │
│  │  marked() → Convierte a HTML              │  │
│  │  Ejemplo: "<strong>Hola</strong> esto..." │  │
│  └──────────────────────────────────────────┘  │
│                         ↓                       │
│  ┌──────────────────────────────────────────┐  │
│  │  DOMPurify.sanitize() → HTML seguro       │  │
│  │  → Elimina scripts, permite HTML seguro   │  │
│  └──────────────────────────────────────────┘  │
│                         ↓                       │
│  ┌──────────────────────────────────────────┐  │
│  │  Envía al Frontend: HTML sanitizado      │  │
│  │  Ejemplo: "<strong>Hola</strong> esto..." │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Flujo de Datos

```
1. Usuario escribe: "**Hola** esto es *importante*"
   ↓
2. Botón de formato inserta sintaxis Markdown
   ↓
3. Usuario presiona Enter o botón de envío
   ↓
4. Frontend: sendMessage() → Envía texto con Markdown
   ↓
5. Backend: Recibe texto con Markdown
   ↓
6. Backend: sanitizeForMarkdown() → Escapa HTML peligroso, permite Markdown
   ↓
7. Backend: Guarda en BD: "**Hola** esto es *importante*"
   ↓
8. Backend: marked() → Convierte Markdown a HTML
   ↓
9. Backend: DOMPurify.sanitize() → Sanitiza HTML (elimina scripts)
   ↓
10. Backend: Envía HTML sanitizado al frontend
   ↓
11. Frontend: Recibe HTML ya sanitizado
   ↓
12. Frontend: v-html → Renderiza HTML seguro
```

---

## Guía de Uso

### Sintaxis Markdown Soportada

| Formato | Sintaxis | Resultado |
|---------|----------|-----------|
| **Negrita** | `**texto**` o `__texto__` | **texto** |
| *Cursiva* | `*texto*` o `_texto_` | *texto* |
| ~~Tachado~~ | `~~texto~~` | ~~texto~~ |
| `Código` | `` `código` `` | `código` |
| [Enlace](url) | `[texto](url)` | [texto](url) |

### Uso de Botones

1. **Seleccionar texto y hacer clic en botón:**
   - Selecciona el texto que quieres formatear
   - Haz clic en el botón (Negrita, Cursiva, etc.)
   - El texto se envuelve automáticamente con la sintaxis

2. **Insertar formato sin texto seleccionado:**
   - Haz clic en el botón
   - Se insertan los marcadores de formato
   - Escribe el texto entre los marcadores

3. **Enlaces:**
   - Selecciona el texto
   - Haz clic en el botón de enlace
   - Ingresa la URL en el prompt
   - Se crea el enlace Markdown

### Atajos de Teclado

- **Enter**: Enviar mensaje (opcional, el botón sigue funcionando)
- **Shift + Enter**: Nueva línea
- **Botón de envío**: Sigue funcionando igual que antes
- **Ctrl/Cmd + B**: Negrita (futuro)
- **Ctrl/Cmd + I**: Cursiva (futuro)

### Nota Importante sobre el Envío

✅ **El botón de envío se mantiene**: La funcionalidad actual con el botón no se elimina, solo se agrega la opción de Enter como alternativa.

---

## Cambios en el Código

### 1. Instalación de Dependencias

**Backend:**
```bash
cd backend
npm install marked isomorphic-dompurify
```

**Frontend:**
```bash
# NO se necesitan dependencias adicionales
# El frontend solo renderiza HTML ya procesado
```

### 2. Archivo: `backend/utils/sanitize.js`

**Agregar nueva función para Markdown:**

```javascript
/**
 * Sanitiza texto que contiene Markdown
 * Escapa HTML peligroso pero permite sintaxis Markdown
 */
function sanitizeForMarkdown(text) {
    if (!text || typeof text !== 'string') {
        return text;
    }
    
    // Escapar scripts e iframes
    let sanitized = text
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '&lt;script&gt;')
        .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '&lt;iframe&gt;');
    
    // Escapar otros tags HTML peligrosos pero NO los de Markdown
    // Permitir: strong, em, b, i, code, a, s, strike, p, br
    sanitized = sanitized.replace(/<(?!\/?(strong|em|b|i|code|a|s|strike|p|br)\b)[^>]+>/gi, (match) => {
        return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    });
    
    return sanitized;
}

module.exports = {
    // ... exports existentes ...
    sanitizeForMarkdown
};
```

### 3. Archivo: `backend/utils/markdown.js` (NUEVO)

**Crear archivo nuevo para procesamiento de Markdown:**

```javascript
const { marked } = require('marked');
const createDOMPurify = require('isomorphic-dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Configurar marked
marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: false,
    mangle: false
});

/**
 * Convierte Markdown a HTML y lo sanitiza
 * 
 * @param {string} markdownText - Texto en Markdown
 * @returns {string} - HTML sanitizado
 */
function processMarkdown(markdownText) {
    if (!markdownText || typeof markdownText !== 'string') {
        return '';
    }
    
    // Convertir Markdown a HTML
    const html = marked(markdownText);
    
    // Sanitizar HTML
    const cleanHtml = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'code', 's', 'strike', 'p', 'br'],
        ALLOWED_ATTR: ['href', 'title'],
        ALLOW_DATA_ATTR: false
    });
    
    return cleanHtml;
}

module.exports = {
    processMarkdown
};
```

### 4. Archivo: `backend/app.js`

**Modificar el evento `send_message` de Socket.IO:**

```javascript
const { sanitizeForMarkdown } = require('./utils/sanitize');
const { processMarkdown } = require('./utils/markdown');

// ... código existente ...

socket.on('send_message', async ({ channelId, text, userId }) => {
    try {
        // ... validaciones existentes ...

        // Sanitizar para Markdown (escapa HTML pero permite Markdown)
        const sanitizedText = sanitizeForMarkdown(text);
        
        // Crear y guardar el mensaje
        const newMessage = new Message({
            text: sanitizedText,  // Guardar Markdown en BD
            userId,
            channel: channelId
        });
        
        const savedMessage = await newMessage.save();

        // Popular el usuario
        const populatedMessage = await Message.findById(savedMessage._id)
            .populate('userId', 'name');

        // Procesar Markdown a HTML y sanitizar
        const htmlContent = processMarkdown(populatedMessage.text);

        // Emitir mensaje al canal con HTML ya procesado
        io.to(channelId).emit('new_message', {
            _id: populatedMessage._id,
            text: htmlContent,  // Enviar HTML ya procesado
            userId: populatedMessage.userId._id,
            author: populatedMessage.userId.name,
            timestamp: populatedMessage.createdAt
        });
    } catch (error) {
        console.error("❌ Error al guardar mensaje:", error);
    }
});
```

**Modificar el evento `join_channel` para historial:**

```javascript
socket.on('join_channel', async (channelId) => {
    // ... código existente ...
    
    try {
        const messages = await Message.find({ channel: channelId })
            .sort({ createdAt: 1 })
            .populate('userId', 'name')
            .lean();
        
        // Transformar mensajes: procesar Markdown a HTML
        const formattedMessages = messages
            .filter(msg => msg.userId != null)
            .map(msg => ({
                _id: msg._id,
                text: processMarkdown(msg.text),  // Procesar Markdown a HTML
                userId: msg.userId._id,
                author: msg.userId.name || 'Usuario Eliminado',
                timestamp: msg.createdAt
            }));
        
        socket.emit('message_history', formattedMessages);
    } catch (error) {
        console.error("❌ Error al cargar historial:", error);
    }
});
```

### 5. Archivo: `backend/routes/MessageRoutes.js`

**Modificar ruta POST `/api/messages`:**

```javascript
const { sanitizeForMarkdown } = require('../utils/sanitize');
const { processMarkdown } = require('../utils/markdown');

// ... código existente ...

router.post('/api/messages', authenticateToken, async (req, res) => {
    try {
        // ... validaciones existentes ...

        // Sanitizar para Markdown
        const sanitizedText = sanitizeForMarkdown(text);
        
        const message = new Message({
            text: sanitizedText,  // Guardar Markdown
            userId: req.user.userId,
            channel: channelId
        });

        await message.save();

        const populatedMessage = await Message.findById(message._id)
            .populate('userId', 'name');

        // Procesar Markdown a HTML
        const htmlContent = processMarkdown(populatedMessage.text);

        // Enviar HTML procesado
        const responseMessage = {
            ...populatedMessage.toObject(),
            text: htmlContent  // HTML ya procesado
        };

        res.status(201).json(responseMessage);
    } catch (error) {
        console.error('Error al crear mensaje:', error);
        res.status(500).json({ message: 'Error al crear el mensaje' });
    }
});
```

**Modificar ruta GET `/api/messages/:channelId`:**

```javascript
router.get('/api/messages/:channelId', authenticateToken, async (req, res) => {
    try {
        const messages = await Message.find({ channel: req.params.channelId })
            .sort({ createdAt: 1 })
            .populate('userId', 'name')
            .lean();

        // Procesar Markdown a HTML para cada mensaje
        const processedMessages = messages.map(msg => ({
            ...msg,
            text: processMarkdown(msg.text)  // Procesar Markdown a HTML
        }));

        res.json(processedMessages);
    } catch (error) {
        console.error('Error al obtener mensajes:', error);
        res.status(500).json({ message: 'Error al obtener mensajes' });
    }
});
```

### 6. Archivo: `frontend/vue-app/src/views/Chat.vue`

#### Cambios en el Template

**Antes:**
```vue
<div class="message-input-container">
  <input 
    type="text" 
    v-model="newMessage" 
    @keyup.enter="sendMessage"
    placeholder="Escribe un mensaje..." 
  />
  <button class="send-button" @click="sendMessage">
    <i class="fas fa-paper-plane"></i>
  </button>
</div>
```

**Después:**
```vue
<div class="message-input-container">
  <!-- Barra de herramientas de formato -->
  <div class="format-toolbar">
    <button 
      type="button" 
      class="format-btn" 
      @click="insertMarkdown('**', '**')"
      title="Negrita"
    >
      <i class="fas fa-bold"></i>
    </button>
    <button 
      type="button" 
      class="format-btn" 
      @click="insertMarkdown('*', '*')"
      title="Cursiva"
    >
      <i class="fas fa-italic"></i>
    </button>
    <button 
      type="button" 
      class="format-btn" 
      @click="insertMarkdown('~~', '~~')"
      title="Tachado"
    >
      <i class="fas fa-strikethrough"></i>
    </button>
    <button 
      type="button" 
      class="format-btn" 
      @click="insertMarkdown('`', '`')"
      title="Código"
    >
      <i class="fas fa-code"></i>
    </button>
    <button 
      type="button" 
      class="format-btn" 
      @click="insertLink"
      title="Enlace"
    >
      <i class="fas fa-link"></i>
    </button>
  </div>
  
  <!-- Área de texto -->
  <div class="input-wrapper">
    <textarea 
      ref="messageInput"
      v-model="newMessage" 
      @keydown.enter.exact="handleEnterKey"
      @keydown.shift.enter="handleShiftEnter"
      placeholder="Escribe un mensaje... (Usa Shift+Enter para nueva línea)" 
      rows="1"
      class="message-textarea"
    ></textarea>
    <button class="send-button" @click="sendMessage">
      <i class="fas fa-paper-plane"></i>
    </button>
  </div>
</div>
```

#### Cambios en el Script

**IMPORTANTE:** El frontend NO necesita `marked` ni `DOMPurify`. Solo recibe HTML ya procesado.

**Métodos nuevos:**
```javascript
methods: {
  // ... métodos existentes ...
  
  // Insertar sintaxis Markdown en el cursor
  insertMarkdown(before, after) {
    const textarea = this.$refs.messageInput;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = this.newMessage;
    const selectedText = text.substring(start, end);
    
    if (selectedText) {
      // Si hay texto seleccionado, lo envuelve
      const newText = text.substring(0, start) + 
                     before + selectedText + after + 
                     text.substring(end);
      this.newMessage = newText;
      
      this.$nextTick(() => {
        textarea.focus();
        textarea.setSelectionRange(start + before.length, end + before.length);
      });
    } else {
      // Si no, inserta marcadores y coloca cursor en medio
      const newText = text.substring(0, start) + 
                     before + after + 
                     text.substring(end);
      this.newMessage = newText;
      
      this.$nextTick(() => {
        textarea.focus();
        textarea.setSelectionRange(start + before.length, start + before.length);
      });
    }
  },
  
  // Insertar enlace Markdown
  insertLink() {
    const textarea = this.$refs.messageInput;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = this.newMessage;
    const selectedText = text.substring(start, end);
    
    if (selectedText) {
      const url = prompt('Ingresa la URL:', 'https://');
      if (url) {
        const newText = text.substring(0, start) + 
                       `[${selectedText}](${url})` + 
                       text.substring(end);
        this.newMessage = newText;
      }
    } else {
      const newText = text.substring(0, start) + 
                     `[texto del enlace](url)` + 
                     text.substring(end);
      this.newMessage = newText;
      
      this.$nextTick(() => {
        textarea.focus();
        const linkStart = start + 1;
        const linkEnd = linkStart + 16;
        textarea.setSelectionRange(linkStart, linkEnd);
      });
    }
  },
  
  // Manejar Enter (enviar) vs Shift+Enter (nueva línea)
  handleEnterKey(event) {
    if (!event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  },
  
  // Permitir Shift+Enter para nueva línea
  handleShiftEnter(event) {
    // No hacer nada, permitir el comportamiento por defecto
  },
  
  // NOTA: Ya no se necesita renderMarkdown()
  // El backend envía HTML ya procesado y sanitizado
}
```

#### Cambios en el Renderizado de Mensajes

**Antes:**
```vue
<div class="message-text">{{ message.text }}</div>
```

**Después:**
```vue
<div 
  class="message-text" 
  v-html="message.text"
></div>
```

**Nota:** El backend ya envía el HTML procesado y sanitizado, por lo que el frontend solo necesita renderizarlo con `v-html`.

#### Cambios en los Estilos CSS

```css
/* Contenedor del input con barra de herramientas */
.message-input-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0;
  background-color: #ffffff;
  border-top: 1px solid #e1e4e8;
  z-index: 2;
}

/* Barra de herramientas de formato */
.format-toolbar {
  display: flex;
  gap: 5px;
  padding: 8px 12px;
  border-bottom: 1px solid #e1e4e8;
  background-color: #f8f9fa;
}

.format-btn {
  padding: 6px 10px;
  background-color: transparent;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  color: #555;
  font-size: 14px;
  transition: all 0.2s;
}

.format-btn:hover {
  background-color: #e9ecef;
  border-color: #3498db;
  color: #3498db;
}

.format-btn:active {
  background-color: #d0d7de;
}

/* Wrapper del textarea y botón enviar */
.input-wrapper {
  display: flex;
  gap: 10px;
  padding: 12px 20px;
  align-items: flex-end;
}

/* Textarea (reemplaza el input) */
.message-textarea {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  min-height: 40px;
  max-height: 120px;
  overflow-y: auto;
  line-height: 1.5;
}

.message-textarea:focus {
  outline: none;
  border-color: #3498db;
}

/* Estilos para mensajes renderizados con Markdown */
.message-text {
  word-break: break-word;
  text-align: left;
  color: #333;
}

.message-text strong {
  font-weight: bold;
}

.message-text em {
  font-style: italic;
}

.message-text code {
  background-color: #f4f4f4;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.message-text a {
  color: #3498db;
  text-decoration: none;
}

.message-text a:hover {
  text-decoration: underline;
}
```

---

## Compatibilidad

### Mensajes Existentes

✅ **Totalmente compatible:**
- Los mensajes existentes sin Markdown se mostrarán como texto plano
- No se requiere migración de datos
- El backend no necesita cambios (sigue guardando texto plano)

### Retrocompatibilidad

| Escenario | Comportamiento |
|-----------|----------------|
| Mensaje sin Markdown | Se muestra como texto plano |
| Mensaje con Markdown | Se renderiza con formato |
| Usuario no usa botones | Puede escribir Markdown manualmente |
| Usuario no conoce Markdown | Puede usar solo texto plano |

---

## Pruebas

### Casos de Prueba

#### 1. Formato Básico
- [ ] Negrita: `**texto**` → **texto**
- [ ] Cursiva: `*texto*` → *texto*
- [ ] Tachado: `~~texto~~` → ~~texto~~
- [ ] Código: `` `código` `` → `código`

#### 2. Enlaces
- [ ] Enlace simple: `[texto](url)` → [texto](url)
- [ ] Enlace con texto seleccionado
- [ ] Enlace sin texto seleccionado

#### 3. Interacción
- [ ] Botones insertan sintaxis correctamente
- [ ] Texto seleccionado se envuelve correctamente
- [ ] Cursor se posiciona correctamente después de insertar
- [ ] Enter envía mensaje
- [ ] Shift+Enter crea nueva línea

#### 4. Renderizado
- [ ] Markdown se convierte a HTML correctamente
- [ ] HTML se sanitiza (seguridad XSS)
- [ ] Mensajes antiguos sin Markdown funcionan
- [ ] Múltiples formatos en un mensaje funcionan

#### 5. Seguridad
- [ ] DOMPurify previene XSS
- [ ] Scripts maliciosos se eliminan
- [ ] Enlaces se validan

---

## Próximos Pasos

### Funcionalidades Futuras

1. **Adjuntos de Archivos** (Próxima feature)
   - Subir imágenes, documentos, etc.
   - Integración con el sistema de almacenamiento

2. **Vínculos Mejorados** (Próxima feature)
   - Preview de enlaces (Open Graph)
   - Validación de URLs
   - Enlaces embebidos

3. **Más Formatos Markdown**
   - Listas (ordenadas y no ordenadas)
   - Citas (blockquotes)
   - Código en bloque
   - Tablas

4. **Mejoras de UX**
   - Atajos de teclado (Ctrl+B, Ctrl+I)
   - Preview del mensaje antes de enviar
   - Contador de caracteres
   - Autocompletado de enlaces

---

## Notas Técnicas

### Configuración de `marked` (Backend)

**Ubicación:** `backend/utils/markdown.js`

```javascript
const { marked } = require('marked');

// Configurar opciones de marked
marked.setOptions({
  breaks: true,        // Convertir \n en <br>
  gfm: true,           // GitHub Flavored Markdown
  headerIds: false,    // No generar IDs en headers
  mangle: false        // No modificar emails
});
```

### Configuración de `DOMPurify` (Backend)

**Ubicación:** `backend/utils/markdown.js`

```javascript
const createDOMPurify = require('isomorphic-dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Configurar opciones de sanitización
const config = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'code', 's', 'strike', 'p', 'br'],
  ALLOWED_ATTR: ['href', 'title'],
  ALLOW_DATA_ATTR: false
};
```

**Nota:** Se usa `isomorphic-dompurify` porque `DOMPurify` solo funciona en el navegador. Para Node.js necesitas `isomorphic-dompurify` y `jsdom`.

---

## ⚠️ Arquitectura de Sanitización (TODO EN BACKEND)

### Principio: Toda la Sanitización en el Backend

**IMPORTANTE:** Toda la sanitización y procesamiento de Markdown se realiza en el **backend**. El frontend solo recibe HTML ya sanitizado y lo renderiza.

### Flujo Completo de Sanitización

```
┌─────────────────────────────────────────────────────┐
│  Usuario escribe: **Hola** <script>alert(1)</script>│
└───────────────────────┬─────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  Backend: sanitizeForMarkdown()                     │
│  → Escapa HTML peligroso: <script> → &lt;script&gt;│
│  → PERMITE sintaxis Markdown: **texto**            │
│  → Resultado: **Hola** &lt;script&gt;alert(1)... │
└───────────────────────┬─────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  Backend: Guarda en BD                              │
│  → Texto con Markdown: **Hola** &lt;script&gt;... │
└───────────────────────┬─────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  Backend: marked() → Convierte Markdown a HTML       │
│  → **Hola** → <strong>Hola</strong>                │
│  → &lt;script&gt; → &lt;script&gt; (se mantiene) │
│  → Resultado: <strong>Hola</strong> &lt;script&gt; │
└───────────────────────┬─────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  Backend: DOMPurify.sanitize()                      │
│  → Elimina scripts maliciosos                       │
│  → Permite HTML seguro (<strong>, <em>, etc.)       │
│  → Resultado: <strong>Hola</strong>                 │
└───────────────────────┬─────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  Backend: Envía HTML sanitizado al Frontend        │
│  → <strong>Hola</strong>                           │
└───────────────────────┬─────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  Frontend: v-html → Renderiza HTML seguro           │
│  → Muestra: Hola (en negrita, sin script)          │
└─────────────────────────────────────────────────────┘
```

### Cambios Necesarios en el Backend

#### 1. Nueva Función: `sanitizeForMarkdown()`

**Ubicación:** `backend/utils/sanitize.js`

**Función:**
- Escapa HTML peligroso (`<script>`, `<iframe>`, etc.)
- **NO** escapa sintaxis Markdown válida (`**`, `*`, `` ` ``, `[]()`, etc.)
- Permite que Markdown se guarde correctamente en la BD

**Código propuesto:**
```javascript
/**
 * Sanitiza texto que contiene Markdown
 * Escapa HTML peligroso pero permite sintaxis Markdown
 * 
 * @param {string} text - Texto con posible Markdown
 * @returns {string} - Texto sanitizado
 */
function sanitizeForMarkdown(text) {
    if (!text || typeof text !== 'string') {
        return text;
    }
    
    // Escapar HTML peligroso pero preservar Markdown
    // Usar regex más inteligente que no toque Markdown
    return text
        // Escapar scripts y iframes (más agresivo)
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '&lt;script&gt;')
        .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '&lt;iframe&gt;')
        // Escapar otros tags peligrosos pero NO los que Markdown usa
        .replace(/<(?!\/?(strong|em|b|i|code|a|s|strike|p|br)\b)[^>]+>/gi, (match) => {
            // Si no es un tag seguro de Markdown, escaparlo
            return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        });
}
```

#### 2. Procesamiento de Markdown en el Backend

**Ubicación:** `backend/utils/markdown.js` (nuevo archivo)

**Función:**
- Convierte Markdown a HTML
- Sanitiza el HTML resultante
- Retorna HTML seguro para el frontend

**Código propuesto:**
```javascript
const { marked } = require('marked');
const createDOMPurify = require('isomorphic-dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Configurar marked
marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: false,
    mangle: false
});

/**
 * Convierte Markdown a HTML y lo sanitiza
 * 
 * @param {string} markdownText - Texto en Markdown
 * @returns {string} - HTML sanitizado
 */
function processMarkdown(markdownText) {
    if (!markdownText || typeof markdownText !== 'string') {
        return '';
    }
    
    // Convertir Markdown a HTML
    const html = marked(markdownText);
    
    // Sanitizar HTML
    const cleanHtml = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'code', 's', 'strike', 'p', 'br'],
        ALLOWED_ATTR: ['href', 'title'],
        ALLOW_DATA_ATTR: false
    });
    
    return cleanHtml;
}

module.exports = {
    processMarkdown
};
```

#### 3. Modificar Socket.IO y Rutas

**Ubicación:** `backend/app.js` y `backend/routes/MessageRoutes.js`

**Cambios:**
- Usar `sanitizeForMarkdown()` en lugar de `sanitizeMessage()`
- Procesar Markdown antes de enviar al frontend
- Enviar HTML ya procesado en lugar de texto plano

### Ventajas de esta Arquitectura

✅ **Seguridad centralizada**: Toda la sanitización en un solo lugar  
✅ **No confiar en el frontend**: El frontend no puede bypassear la sanitización  
✅ **Consistencia**: Todos los clientes reciben el mismo HTML seguro  
✅ **Mantenibilidad**: Cambios de seguridad solo en el backend  
✅ **Performance**: El procesamiento se hace una vez en el servidor

---

## Referencias

- [Markdown Guide](https://www.marked.js.org/)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [Vue.js v-html Directive](https://vuejs.org/api/built-in-directives.html#v-html)

---

## Historial de Cambios

| Fecha | Versión | Cambio | Autor |
|-------|---------|--------|-------|
| [Fecha] | 1.1.0 | Documentación inicial | - |

---

**Última actualización:** [Fecha]
**Estado:** ⏳ Pendiente de implementación

