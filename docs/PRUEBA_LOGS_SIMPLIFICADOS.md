# Prueba de Logs Simplificados - Login y Logout

## Objetivo
Verificar que los logs en la consola del servidor muestren solo el nombre del usuario, sin información adicional.

---

## Requisitos Previos

1. **Servidor backend corriendo:**
   ```bash
   cd backend
   node app.js
   ```

2. **Tener al menos un usuario en la base de datos** (con email y contraseña conocidos)

---

## Prueba 1: Login Exitoso

### Pasos:

1. **Abre la aplicación en el navegador:**
   - Ve a `http://localhost:5173` (o el puerto que uses para el frontend)

2. **Inicia sesión con un usuario válido:**
   - Ingresa email y contraseña
   - Haz clic en "Iniciar Sesión"

3. **Verifica en la consola del servidor (CMD/PowerShell):**
   
   **✅ Resultado esperado:**
   ```
   ✅ Login exitoso - [Nombre del Usuario]
   ```
   
   **❌ NO deberías ver:**
   - Email del usuario
   - ID del usuario
   - Información de contraseña
   - Timestamp
   - Role del usuario
   - Objetos completos con múltiples campos

---

## Prueba 2: Logout Exitoso

### Pasos:

1. **Con la sesión iniciada, haz clic en "Cerrar Sesión"**

2. **Verifica en la consola del servidor:**
   
   **✅ Resultado esperado:**
   ```
   🚪 Logout exitoso - [Nombre del Usuario]
   ```
   
   **❌ NO deberías ver:**
   - Email del usuario
   - ID del usuario
   - Timestamp
   - Role del usuario
   - Objetos completos con múltiples campos

---

## Prueba 3: Login Fallido (Usuario No Encontrado)

### Pasos:

1. **Intenta iniciar sesión con un email que no existe**

2. **Verifica en la consola del servidor:**
   
   **✅ Resultado esperado:**
   ```
   ❌ Login fallido - Usuario no encontrado
   ```

---

## Prueba 4: Login Fallido (Contraseña Incorrecta)

### Pasos:

1. **Intenta iniciar sesión con un email válido pero contraseña incorrecta**

2. **Verifica en la consola del servidor:**
   
   **✅ Resultado esperado:**
   ```
   ❌ Login fallido - Contraseña incorrecta
   ```

---

## Prueba 5: Login Fallido (Usuario Inactivo)

### Pasos:

1. **Intenta iniciar sesión con un usuario que tiene `active: false` en la base de datos**

2. **Verifica en la consola del servidor:**
   
   **✅ Resultado esperado:**
   ```
   ❌ Login fallido - Usuario inactivo
   ```

---

## Ejemplo de Salida Esperada en Consola

### Escenario: Usuario "Soledad Miranda" hace login y luego logout

**Consola del servidor debería mostrar:**
```
✅ Login exitoso - Soledad Miranda
🚪 Logout exitoso - Soledad Miranda
```

**NO debería mostrar:**
```
❌ Email: soledad.miranda@a.a
❌ UserId: 6846fbe919c2a6a442e913eb
❌ Role: user
❌ Timestamp: 2025-01-17T15:30:45.123Z
❌ Objetos completos con múltiples campos
```

---

## Verificación Adicional

### Confirmar que el Frontend NO se ve afectado:

1. **Después del login, verifica que:**
   - El usuario puede ver su nombre en la interfaz
   - El usuario puede ver los canales
   - El usuario puede enviar mensajes
   - Todo funciona normalmente

2. **Después del logout, verifica que:**
   - El usuario es redirigido a la página de login
   - El token se elimina del localStorage
   - No hay errores en la consola del navegador (F12)

---

## Notas

- Los logs simplificados **SOLO afectan la consola del servidor**
- **NO afectan** las respuestas JSON que el backend envía al frontend
- **NO afectan** las vistas ni la funcionalidad de la aplicación
- Los datos del usuario siguen estando disponibles en el frontend normalmente

---

## Solución de Problemas

### Si ves información adicional en los logs:

1. Verifica que el servidor se haya reiniciado después de los cambios
2. Detén el servidor (Ctrl+C) y vuelve a iniciarlo:
   ```bash
   node app.js
   ```

### Si el frontend no funciona:

1. Verifica que el servidor esté corriendo en el puerto correcto (3000)
2. Revisa la consola del navegador (F12) para errores
3. Verifica que las respuestas JSON del backend sean correctas

