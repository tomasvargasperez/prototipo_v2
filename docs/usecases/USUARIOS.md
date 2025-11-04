## Casos de uso - Usuarios

```mermaid
%%{init: { 'theme': 'neutral' }}%%
usecase
  title Gestión de Usuarios
  actor Usuario
  actor Administrador

  Usuario -- (Registrarse)
  Usuario -- (Iniciar sesión)
  Usuario -- (Cerrar sesión)
  Usuario -- (Actualizar perfil)

  Administrador -- (Listar usuarios)
  Administrador -- (Actualizar usuario)
  Administrador -- (Eliminar usuario)

  (Iniciar sesión) ..> (Emitir JWT) : <<include>>
```

### Notas
- Autenticación via JWT (`POST /login`).
- Listado/gestión de usuarios requiere rol admin (`/api/users`).

