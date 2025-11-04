## Casos de uso - Autenticación y Roles

```mermaid
%%{init: { 'theme': 'neutral' }}%%
usecase
  title Autenticación JWT y Autorización por Rol
  actor Usuario
  actor Administrador

  Usuario -- (Iniciar sesión)
  Usuario -- (Acceder a recursos protegidos)

  Administrador -- (Acceder a recursos de administración)

  (Acceder a recursos protegidos) ..> (Validar token JWT) : <<include>>
  (Acceder a recursos de administración) ..> (Verificar rol admin) : <<include>>
```

### Notas
- Middleware `authenticateToken` y `isAdmin` en rutas.
- Expiración de token: 24h.

