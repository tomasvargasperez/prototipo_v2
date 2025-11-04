## Casos de uso - Sugerencias

```mermaid
%%{init: { 'theme': 'neutral' }}%%
usecase
  title Buzón de Sugerencias
  actor Usuario
  actor Administrador

  Usuario -- (Enviar sugerencia)
  (Enviar sugerencia) ..> (Encriptar contenido) : <<include>>

  Administrador -- (Listar sugerencias)
  Administrador -- (Actualizar estado sugerencia)
  (Listar sugerencias) ..> (Desencriptar contenido) : <<include>>
```

### Notas
- Envío autenticado, almacenamiento cifrado.
- Admin gestiona estados: `pending|reviewed|implemented`.

