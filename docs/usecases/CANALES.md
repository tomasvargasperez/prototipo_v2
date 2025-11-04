## Casos de uso - Canales

```mermaid
%%{init: { 'theme': 'neutral' }}%%
usecase
  title Gestión de Canales
  actor Usuario
  actor Administrador

  Usuario -- (Ver canales disponibles)
  Usuario -- (Unirse a canal) 

  Administrador -- (Crear canal)
  Administrador -- (Actualizar canal)
  Administrador -- (Eliminar canal)

  (Ver canales disponibles) ..> (Filtrar por permisos) : <<include>>
```

### Notas
- Usuarios ven canales públicos o permitidos (`GET /api/channels`).
- CRUD de canales solo admin.

