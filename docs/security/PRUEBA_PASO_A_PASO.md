# Guía Paso a Paso - Prueba de Sanitización

## 📋 Paso 3: Prueba Rápida en Consola - Explicación Detallada

---

## 🎯 Objetivo

Verificar que la sanitización está funcionando correctamente guardando y leyendo datos maliciosos.

---

## 📝 Preparación

### **Antes de empezar:**

1. ✅ La aplicación debe estar ejecutándose
2. ✅ Debes estar en la página de la aplicación (login o chat)
3. ✅ La consola del navegador debe estar abierta (F12)

---

## 🔍 Paso 3.1: Abrir la Consola del Navegador

### **Instrucciones Visuales:**

1. **Presiona la tecla `F12`** en tu teclado
   - O presiona `Ctrl + Shift + I` (Windows/Linux)
   - O presiona `Cmd + Option + I` (Mac)

2. **Se abrirá una ventana** en la parte inferior o lateral de tu navegador

3. **Busca la pestaña "Console"** o "Consola"
   - Haz clic en la pestaña que dice "Console" o "Consola"

4. **Deberías ver algo como esto:**
   ```
   ✅ Interceptor de seguridad de localStorage activado
   ```
   - Si ves este mensaje, el interceptor está activo ✅
   - Si NO lo ves, hay un problema ❌

---

## 🧪 Paso 3.2: Ejecutar la Prueba - Paso a Paso

### **Paso 3.2.1: Copiar el Script**

**Copia este código completo:**

```javascript
// Prueba rápida de sanitización
console.log('🧪 Iniciando prueba...\n')

// 1. Guardar un string malicioso
localStorage.setItem('test_xss', '<script>alert("XSS")</script>')

// 2. Leer el valor
const valorGuardado = localStorage.getItem('test_xss')
console.log('Valor guardado:', valorGuardado)

// 3. Verificar que está sanitizado
const estaSanitizado = valorGuardado.includes('&lt;script&gt;')
console.log('¿Está sanitizado?', estaSanitizado ? '✅ SÍ' : '❌ NO')

// Limpiar
localStorage.removeItem('test_xss')

console.log('\n✅ Prueba completada')
```

---

### **Paso 3.2.2: Pegar en la Consola**

1. **Haz clic dentro del área de la consola** (donde aparece el cursor parpadeante)

2. **Pega el código** que copiaste:
   - Presiona `Ctrl + V` (Windows/Linux)
   - O presiona `Cmd + V` (Mac)

3. **Presiona `Enter`** para ejecutar el código

---

### **Paso 3.2.3: Ver los Resultados**

**Deberías ver algo como esto en la consola:**

```
🧪 Iniciando prueba...

Valor guardado: &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;
¿Está sanitizado? ✅ SÍ

✅ Prueba completada
```

---

## 🔍 Explicación de Cada Línea

### **Línea 1: Mensaje inicial**
```javascript
console.log('🧪 Iniciando prueba...\n')
```
- **Qué hace:** Muestra un mensaje en la consola
- **Para qué:** Saber que la prueba empezó
- **Resultado esperado:** Verás `🧪 Iniciando prueba...`

---

### **Línea 2: Guardar datos maliciosos**
```javascript
localStorage.setItem('test_xss', '<script>alert("XSS")</script>')
```
- **Qué hace:** Guarda un string con código JavaScript malicioso
- **Para qué:** Probar que la sanitización funciona
- **Qué esperar:** El interceptor sanitiza automáticamente antes de guardar
- **Resultado:** Los datos se guardan sanitizados

---

### **Línea 3: Leer el valor guardado**
```javascript
const valorGuardado = localStorage.getItem('test_xss')
```
- **Qué hace:** Lee el valor que acabamos de guardar
- **Para qué:** Ver cómo quedó guardado
- **Qué esperar:** El valor debería estar sanitizado
- **Resultado:** Obtienes el valor sanitizado

---

### **Línea 4: Mostrar el valor**
```javascript
console.log('Valor guardado:', valorGuardado)
```
- **Qué hace:** Muestra en la consola el valor que se guardó
- **Para qué:** Ver visualmente cómo quedó
- **Resultado esperado:** Deberías ver algo como:
  ```
  Valor guardado: &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;
  ```

---

### **Línea 5: Verificar sanitización**
```javascript
const estaSanitizado = valorGuardado.includes('&lt;script&gt;')
```
- **Qué hace:** Verifica si el valor contiene `&lt;script&gt;` (versión sanitizada)
- **Para qué:** Confirmar que la sanitización funcionó
- **Qué esperar:** Si está sanitizado, `estaSanitizado` será `true`
- **Resultado:** Variable booleana (true/false)

---

### **Línea 6: Mostrar resultado**
```javascript
console.log('¿Está sanitizado?', estaSanitizado ? '✅ SÍ' : '❌ NO')
```
- **Qué hace:** Muestra si la sanitización funcionó o no
- **Para qué:** Ver claramente el resultado
- **Resultado esperado:** Deberías ver `¿Está sanitizado? ✅ SÍ`

---

### **Línea 7: Limpiar**
```javascript
localStorage.removeItem('test_xss')
```
- **Qué hace:** Elimina el valor de prueba del localStorage
- **Para qué:** Limpiar después de la prueba
- **Resultado:** El valor se elimina

---

### **Línea 8: Mensaje final**
```javascript
console.log('\n✅ Prueba completada')
```
- **Qué hace:** Muestra un mensaje de finalización
- **Para qué:** Saber que la prueba terminó
- **Resultado:** Verás `✅ Prueba completada`

---

## ✅ Interpretación de Resultados

### **Si ves esto (✅ FUNCIONA):**

```
🧪 Iniciando prueba...

Valor guardado: &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;
¿Está sanitizado? ✅ SÍ

✅ Prueba completada
```

**Significa:**
- ✅ La sanitización está funcionando
- ✅ Los datos maliciosos se están escapando correctamente
- ✅ Tu aplicación está protegida

---

### **Si ves esto (❌ NO FUNCIONA):**

```
🧪 Iniciando prueba...

Valor guardado: <script>alert("XSS")</script>
¿Está sanitizado? ❌ NO

✅ Prueba completada
```

**Significa:**
- ❌ La sanitización NO está funcionando
- ❌ Los datos se guardan sin sanitizar
- ⚠️ Necesitas revisar el interceptor

**Qué hacer:**
1. Verifica que el mensaje `✅ Interceptor activado` apareció
2. Verifica que no hay errores en la consola
3. Recarga la página (F5) y vuelve a probar

---

## 🎬 Ejemplo Visual Completo

### **Antes de ejecutar:**
```
Consola:
> (cursor parpadeando aquí)
```

### **Después de pegar y presionar Enter:**
```
Consola:
> // Prueba rápida de sanitización
> console.log('🧪 Iniciando prueba...\n')
🧪 Iniciando prueba...

> // 1. Guardar un string malicioso
> localStorage.setItem('test_xss', '<script>alert("XSS")</script>')
undefined

> // 2. Leer el valor
> const valorGuardado = localStorage.getItem('test_xss')
undefined

> // 3. Verificar que está sanitizado
> console.log('Valor guardado:', valorGuardado)
Valor guardado: &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;

> const estaSanitizado = valorGuardado.includes('&lt;script&gt;')
true

> console.log('¿Está sanitizado?', estaSanitizado ? '✅ SÍ' : '❌ NO')
¿Está sanitizado? ✅ SÍ

> // Limpiar
> localStorage.removeItem('test_xss')
undefined

> console.log('\n✅ Prueba completada')
✅ Prueba completada
```

---

## 🐛 Solución de Problemas

### **Problema 1: No puedo pegar el código**

**Solución:**
- Asegúrate de hacer clic dentro del área de la consola primero
- Intenta pegar con `Ctrl + V` o `Cmd + V`
- Si no funciona, escribe el código línea por línea

---

### **Problema 2: Aparece un error**

**Errores comunes:**

1. **`ReferenceError: localStorage is not defined`**
   - **Causa:** No estás en una página web
   - **Solución:** Asegúrate de estar en la página de tu aplicación

2. **`Cannot read property 'includes' of null`**
   - **Causa:** El valor no se guardó correctamente
   - **Solución:** Verifica que el interceptor está activo

3. **`Unexpected token`**
   - **Causa:** Error de sintaxis al copiar
   - **Solución:** Copia el código completo sin modificar

---

### **Problema 3: No veo el mensaje de activación**

**Solución:**
1. Recarga la página (F5)
2. Abre la consola de nuevo (F12)
3. Busca el mensaje: `✅ Interceptor de seguridad de localStorage activado`
4. Si no aparece, verifica que `main.js` tiene el código de activación

---

## 📸 Capturas de Pantalla Esperadas

### **Consola antes de ejecutar:**
```
Console
> 
```

### **Consola después de ejecutar (✅ Éxito):**
```
Console
> localStorage.setItem('test_xss', '<script>alert("XSS")</script>')
undefined
> const valorGuardado = localStorage.getItem('test_xss')
undefined
> console.log('Valor guardado:', valorGuardado)
Valor guardado: &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;
> const estaSanitizado = valorGuardado.includes('&lt;script&gt;')
true
> console.log('¿Está sanitizado?', estaSanitizado ? '✅ SÍ' : '❌ NO')
¿Está sanitizado? ✅ SÍ
```

---

## ✅ Checklist Final

Antes de considerar que la prueba fue exitosa, verifica:

- [ ] La consola está abierta (F12)
- [ ] El mensaje de activación aparece: `✅ Interceptor activado`
- [ ] El código se pegó correctamente
- [ ] No hay errores en rojo en la consola
- [ ] El resultado muestra: `¿Está sanitizado? ✅ SÍ`
- [ ] El valor guardado contiene: `&lt;script&gt;` (no `<script>`)

---

## 🎯 Resumen Ultra Simple

1. **Presiona F12** → Abre consola
2. **Pega el código** → Copia y pega el script
3. **Presiona Enter** → Ejecuta el código
4. **Verifica el resultado** → Debe decir `✅ SÍ`

---

**¿Tienes dudas en algún paso específico?** Puedo explicarte más detalladamente cualquier parte.

