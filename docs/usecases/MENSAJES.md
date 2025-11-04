## Casos de uso - Mensajes

```mermaid
%%{init: { 'theme': 'neutral' }}%%
usecase
  title Mensajería por canal
  actor Usuario
  actor Administrador

  Usuario -- (Enviar mensaje)
  Usuario -- (Ver historial de mensajes)

  Administrador -- (Enviar mensaje)
  Administrador -- (Ver historial de mensajes)

  (Enviar mensaje) ..> (Verificar acceso a canal) : <<include>>
  (Ver historial de mensajes) ..> (Verificar acceso a canal) : <<include>>
```

### Notas
- Acceso controlado por canal (`allowedUsers`, `isPublic`).
- Endpoints: `GET /api/messages/:channelId`, `POST /api/messages`.

