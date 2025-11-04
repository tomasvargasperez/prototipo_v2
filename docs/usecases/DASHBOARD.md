## Casos de uso - Dashboard

```mermaid
%%{init: { 'theme': 'neutral' }}%%
usecase
  title Panel de Administración
  actor Administrador

  Administrador -- (Ver métricas globales)
  Administrador -- (Ver actividad por canal)
  Administrador -- (Ver top usuarios)
  Administrador -- (Ver actividad diaria)

  (Ver métricas globales) ..> (Autenticación y rol admin) : <<include>>
```

### Notas
- Endpoint `GET /api/admin/dashboard` solo para administradores.

