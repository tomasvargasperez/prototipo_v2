## Casos de uso - Chat en Tiempo Real

```mermaid
%%{init: { 'theme': 'neutral' }}%%
usecase
  title Comunicación en tiempo real (Socket.IO)
  actor Usuario
  actor Administrador

  Usuario -- (Unirse a canal en tiempo real)
  Usuario -- (Enviar mensaje en tiempo real)
  Usuario -- (Recibir historial del canal)

  Administrador -- (Unirse a canal en tiempo real)
  Administrador -- (Enviar mensaje en tiempo real)

  (Unirse a canal en tiempo real) ..> (Cargar historial del canal) : <<include>>
  (Enviar mensaje en tiempo real) ..> (Persistir y emitir a sala) : <<include>>
```

### Notas
- Eventos: `join_channel`, `message_history`, `send_message`, `new_message`.
- Validaciones: `userId` válido, acceso a canal.

