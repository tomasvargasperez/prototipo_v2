## Casos de uso - Phonebook

```mermaid
%%{init: { 'theme': 'neutral' }}%%
usecase
  title Directorio Telefónico
  actor Usuario

  Usuario -- (Ver directorio)
  Usuario -- (Buscar en directorio)

  (Ver directorio) ..> (Autenticación requerida) : <<include>>
```

### Notas
- Rutas protegidas por token: `GET /api/phonebook`, `/search`.

