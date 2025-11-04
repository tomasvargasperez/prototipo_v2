## Casos de uso - Anuncios

```mermaid
%%{init: { 'theme': 'neutral' }}%%
usecase
  title Foro de Anuncios
  actor Usuario
  actor Administrador

  Usuario -- (Ver anuncios)

  Administrador -- (Crear anuncio)
  Administrador -- (Eliminar anuncio)

  (Crear anuncio) ..> (Validar campos requeridos) : <<include>>
```

### Notas
- Usuarios autentican para ver (`GET /api/announcements`).
- Admin crea/elimina (`POST /`, `DELETE /:id`).

