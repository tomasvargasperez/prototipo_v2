# Guía de Prueba - Sistema de Sanitización

## 📋 Índice
1. [Prueba Rápida en Consola](#prueba-rápida-en-consola)
2. [Prueba con Datos Reales](#prueba-con-datos-reales)
3. [Prueba de Login](#prueba-de-login)
4. [Prueba de Mensajes](#prueba-de-mensajes)
5. [Verificación de Protección XSS](#verificación-de-protección-xss)

---

## Prerequisitos

1. ✅ La aplicación Vue.js debe estar ejecutándose
2. ✅ El interceptor debe estar activado en `main.js`
3. ✅ Abrir la consola del navegador (F12)

---

## Paso 1: Verificar que el Interceptor está Activo

### **Instrucciones:**

1. **Inicia la aplicación:**
   ```bash
   cd frontend/vue-app
   npm run dev
   ```

2. **Abre el navegador** y ve a la aplicación (ej: `http://localhost:5173`)

3. **Abre la consola del navegador:**
   - Presiona `F12` o `Ctrl+Shift+I` (Windows/Linux)
   - O `Cmd+Option+I` (Mac)
   - Ve a la pestaña **Console**

4. **Busca el mensaje:**
   ```
   ✅ Interceptor de seguridad de localStorage activado
   ```

### ✅ **Resultado Esperado:**
- Deberías ver el mensaje de confirmación en la consola
- Si NO lo ves, el interceptor NO está activo

---

## Paso 2: Prueba Rápida en Consola

### **Prueba 1: Sanitización de String Simple**

**En la consola del navegador, ejecuta:**

```javascript
// 1. Guardar un string con código malicioso
localStorage.setItem('test_xss', '<script>alert("XSS")</script>')

// 2. Leer el valor guardado
const valorGuardado = localStorage.getItem('test_xss')
console.log('Valor guardado (debería estar sanitizado):', valorGuardado)

// 3. Verificar que está sanitizado
console.log('¿Está sanitizado?', valorGuardado.includes('&lt;script&gt;'))
```

### ✅ **Resultado Esperado:**
```
Valor guardado (debería estar sanitizado): &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;
¿Está sanitizado? true
```

### ❌ **Si NO funciona:**
- El valor debería ser: `&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;`
- Si ves `<script>alert("XSS")</script>` sin sanitizar, el interceptor NO está funcionando

---

### **Prueba 2: Desanitización al Leer**

**En la consola del navegador, ejecuta:**

```javascript
// 1. Guardar un string sanitizado manualmente
localStorage.setItem('test_desanitize', '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;')

// 2. Leer el valor (debería desanitizarse automáticamente)
const valorLeido = localStorage.getItem('test_desanitize')
console.log('Valor leído (debería estar desanitizado):', valorLeido)

// 3. Verificar que está desanitizado
console.log('¿Está desanitizado?', valorLeido.includes('<script>'))
```

### ✅ **Resultado Esperado:**
```
Valor leído (debería estar desanitizado): <script>alert("XSS")</script>
¿Está desanitizado? true
```

---

### **Prueba 3: Sanitización de Objeto JSON**

**En la consola del navegador, ejecuta:**

```javascript
// 1. Crear un objeto con datos maliciosos
const usuarioMalicioso = {
    name: '<script>alert("XSS")</script>',
    email: 'user@example.com',
    role: '<img src=x onerror="alert(\'XSS\')">'
}

// 2. Guardar como JSON
localStorage.setItem('test_user', JSON.stringify(usuarioMalicioso))

// 3. Leer el valor guardado
const valorGuardado = localStorage.getItem('test_user')
console.log('Valor guardado:', valorGuardado)

// 4. Parsear y verificar
const usuarioLeido = JSON.parse(valorGuardado)
console.log('Usuario leído:', usuarioLeido)
console.log('¿Name está sanitizado?', usuarioLeido.name.includes('&lt;script&gt;'))
```

### ✅ **Resultado Esperado:**
```
Valor guardado: {"name":"&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;","email":"user@example.com","role":"&lt;img src=x onerror=&quot;alert(\'XSS\')&quot;&gt;"}
Usuario leído: {name: "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;", email: "user@example.com", role: "&lt;img src=x onerror=&quot;alert(\'XSS\')&quot;&gt;"}
¿Name está sanitizado? true
```

---

## Paso 3: Prueba con Datos Reales de la Aplicación

### **Prueba 4: Login con Datos Maliciosos**

**Instrucciones:**

1. **Abre la aplicación** en el navegador
2. **Abre la consola** (F12)
3. **Intenta hacer login** con un usuario normal
4. **Después del login, en la consola ejecuta:**

```javascript
// Verificar que los datos del usuario están sanitizados
const userData = localStorage.getItem('user')
console.log('Datos de usuario guardados:', userData)

// Parsear y verificar
if (userData) {
    const user = JSON.parse(userData)
    console.log('Usuario parseado:', user)
    
    // Verificar si hay caracteres peligrosos sin sanitizar
    const tieneCaracteresPeligrosos = JSON.stringify(user).includes('<script>') || 
                                       JSON.stringify(user).includes('<img') ||
                                       JSON.stringify(user).includes('onerror=')
    
    console.log('¿Tiene caracteres peligrosos sin sanitizar?', tieneCaracteresPeligrosos)
    
    if (tieneCaracteresPeligrosos) {
        console.warn('⚠️ ADVERTENCIA: Datos no sanitizados detectados!')
    } else {
        console.log('✅ Datos sanitizados correctamente')
    }
}
```

### ✅ **Resultado Esperado:**
- Si el usuario tiene datos normales, deberían guardarse normalmente
- Si el usuario tiene datos maliciosos, deberían estar sanitizados

---

### **Prueba 5: Token de Autenticación**

**En la consola del navegador, ejecuta:**

```javascript
// Verificar el token
const token = localStorage.getItem('token')
console.log('Token guardado:', token ? 'Token existe' : 'No hay token')

// IMPORTANTE: Los tokens JWT NO deberían ser sanitizados
// porque tienen un formato específico
// Si el token está roto, el interceptor está sanitizando tokens (problema)
```

### ⚠️ **Nota Importante:**
- Los tokens JWT NO deberían ser sanitizados
- Si el token está roto después de guardarlo, necesitas excluir 'token' del interceptor

---

## Paso 4: Prueba de Mensajes (Chat)

### **Prueba 6: Enviar Mensaje con Código Malicioso**

**Instrucciones:**

1. **Haz login** en la aplicación
2. **Ve al chat**
3. **Intenta enviar un mensaje** con código malicioso:
   ```
   <script>alert('XSS Attack')</script>
   ```
4. **En la consola, verifica:**

```javascript
// Verificar mensajes en localStorage (si se guardan ahí)
// Nota: Los mensajes normalmente se guardan en la base de datos
// pero si se guardan en localStorage, deberían estar sanitizados

// Si los mensajes se muestran en el chat, verificar que NO se ejecuten
// El mensaje debería mostrarse como texto plano, no como código ejecutado
```

### ✅ **Resultado Esperado:**
- El mensaje debería mostrarse como texto: `<script>alert('XSS Attack')</script>`
- NO debería ejecutarse el código JavaScript
- NO debería aparecer un alert

---

## Paso 5: Verificación de Protección XSS

### **Prueba 7: Test Completo de XSS**

**En la consola del navegador, ejecuta:**

```javascript
// Crear un test completo de XSS
const testsXSS = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror="alert(\'XSS\')">',
    '<svg onload="alert(\'XSS\')">',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    '<body onload="alert(\'XSS\')">',
    '<input onfocus="alert(\'XSS\')" autofocus>'
]

console.log('🧪 Iniciando pruebas de XSS...\n')

testsXSS.forEach((test, index) => {
    const key = `test_xss_${index}`
    
    // Guardar
    localStorage.setItem(key, test)
    
    // Leer
    const guardado = localStorage.getItem(key)
    const sanitizado = guardado.includes('&lt;') || guardado.includes('&quot;')
    
    console.log(`Test ${index + 1}: ${test}`)
    console.log(`  Guardado: ${guardado}`)
    console.log(`  ¿Sanitizado? ${sanitizado ? '✅ SÍ' : '❌ NO'}\n`)
})

console.log('✅ Pruebas completadas')
```

### ✅ **Resultado Esperado:**
- Todos los tests deberían mostrar `✅ SÍ` en "¿Sanitizado?"
- Si alguno muestra `❌ NO`, hay un problema con la sanitización

---

## Paso 6: Prueba de Rendimiento

### **Prueba 8: Impacto en el Rendimiento**

**En la consola del navegador, ejecuta:**

```javascript
// Medir el tiempo de sanitización
const datosGrandes = {
    name: '<script>alert("XSS")</script>',
    email: 'user@example.com',
    description: '<img src=x onerror="alert(\'XSS\')">'.repeat(100)
}

console.time('Sanitización')
for (let i = 0; i < 1000; i++) {
    localStorage.setItem(`test_perf_${i}`, JSON.stringify(datosGrandes))
    localStorage.getItem(`test_perf_${i}`)
}
console.timeEnd('Sanitización')

// Limpiar
for (let i = 0; i < 1000; i++) {
    localStorage.removeItem(`test_perf_${i}`)
}
```

### ✅ **Resultado Esperado:**
- El tiempo debería ser razonable (< 1 segundo para 1000 operaciones)
- Si es muy lento, puede haber un problema de rendimiento

---

## Checklist de Verificación

### ✅ **Verificar que todo funciona:**

- [ ] El interceptor está activo (mensaje en consola)
- [ ] Los strings se sanitizan al guardar
- [ ] Los strings se desanitizan al leer
- [ ] Los objetos JSON se sanitizan correctamente
- [ ] Los datos del login se guardan correctamente
- [ ] Los mensajes maliciosos NO se ejecutan
- [ ] Todos los tests XSS pasan
- [ ] El rendimiento es aceptable

---

## Problemas Comunes y Soluciones

### **Problema 1: No aparece el mensaje de activación**

**Solución:**
- Verifica que `main.js` tiene el import y la llamada a `setupLocalStorageInterceptor()`
- Verifica que no hay errores en la consola
- Recarga la página (Ctrl+R o F5)

---

### **Problema 2: Los datos NO se sanitizan**

**Solución:**
- Verifica que el interceptor está activo
- Verifica que no hay errores en `security.js`
- Verifica que el import en `main.js` es correcto

---

### **Problema 3: El token JWT está roto**

**Solución:**
- Los tokens NO deberían sanitizarse
- Necesitas modificar el interceptor para excluir la clave 'token'
- Ver sección "Solución para Tokens" en la documentación

---

### **Problema 4: Los datos se sanitizan pero NO se desanitizan**

**Solución:**
- Verifica que la función `desanitizeForStorage` está funcionando
- Verifica que `getItem` está sobrescrito correctamente

---

## Script de Prueba Automatizado

**Copia y pega este script completo en la consola:**

```javascript
// ============================================
// SCRIPT DE PRUEBA AUTOMATIZADO
// ============================================

console.log('🧪 Iniciando pruebas de sanitización...\n')

// Verificar que el interceptor está activo
const interceptorActivo = typeof localStorage.setItem !== 'function' || 
                          localStorage.setItem.toString().includes('sanitizedValue')
console.log('1. ¿Interceptor activo?', interceptorActivo ? '✅ SÍ' : '❌ NO')

// Prueba 1: String simple
localStorage.setItem('test1', '<script>alert("XSS")</script>')
const test1 = localStorage.getItem('test1')
const test1Ok = test1.includes('&lt;script&gt;')
console.log('2. ¿String sanitizado?', test1Ok ? '✅ SÍ' : '❌ NO')

// Prueba 2: Objeto JSON
const obj = { name: '<script>alert("XSS")</script>', email: 'test@test.com' }
localStorage.setItem('test2', JSON.stringify(obj))
const test2 = JSON.parse(localStorage.getItem('test2'))
const test2Ok = test2.name.includes('&lt;script&gt;')
console.log('3. ¿Objeto sanitizado?', test2Ok ? '✅ SÍ' : '❌ NO')

// Prueba 3: Desanitización
localStorage.setItem('test3', '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;')
const test3 = localStorage.getItem('test3')
const test3Ok = test3.includes('<script>')
console.log('4. ¿Desanitización funciona?', test3Ok ? '✅ SÍ' : '❌ NO')

// Limpiar
localStorage.removeItem('test1')
localStorage.removeItem('test2')
localStorage.removeItem('test3')

console.log('\n✅ Pruebas completadas')
console.log('Si todas las pruebas muestran ✅, el sistema está funcionando correctamente')
```

---

## Resultado Final

### ✅ **Si todas las pruebas pasan:**
- El sistema de sanitización está funcionando correctamente
- Tu aplicación está protegida contra XSS en localStorage
- Puedes continuar con el desarrollo

### ❌ **Si alguna prueba falla:**
- Revisa los errores en la consola
- Verifica que el interceptor está activo
- Consulta la sección "Problemas Comunes" arriba

---

**Última actualización:** 2025-01-XX  
**Versión:** 1.0

