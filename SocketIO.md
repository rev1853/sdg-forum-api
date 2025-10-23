## Socket.IO Chat Integration

### Endpoint & Transport
- Connect to the same origin as the REST API (e.g. `https://api.example.com`) using Socket.IO v4.
- Real-time traffic uses WebSocket upgrades with long polling as fallback; no additional path configuration is required.

### Authentication
- Every connection must present the JWT returned by `/auth/login` or `/auth/google`.
- Pass the token in the handshake via `auth` or query/headers:

```js
import { io } from 'socket.io-client';

const socket = io(API_BASE_URL, {
  auth: { token: `Bearer ${jwt}` }
  // Alternatively: query: { token: `Bearer ${jwt}` }
});

socket.on('connect_error', (err) => {
  console.error('Socket auth failed:', err.message);
});
```

- The server rejects unauthenticated handshakes with `Unauthorized`.

### Room Model
- Each chat group has a room `group:<groupId>`.
- A client must explicitly join/leave the room after connecting.

### Client → Server Events

| Event        | Payload                              | Description |
|--------------|--------------------------------------|-------------|
| `chat:join`  | `{ groupId }`                        | Validates membership (user must have joined via REST). On success the socket joins `group:<groupId>`. Callback signature `callback({ status: 'ok' })` or `callback({ status: 'error', message })`. |
| `chat:leave` | `{ groupId }`                        | Leaves the Socket.IO room (does not alter DB membership). Same callback pattern. |
| `chat:send`  | `{ groupId, body, replyToId? }`      | Sends a text message (max 2000 chars). Optional `replyToId` must reference an existing message in the same group. On success, message is persisted and broadcast; response `callback({ status: 'ok' })` or error object. |

### Server → Client Events

| Event              | Payload Example |
|--------------------|-----------------|
| `chat:new-message` | ```json
{
  "id": "l8nrcm1m4k0",
  "group_id": "group-1",
  "user": { "id": "user-1", "username": "alice", "name": "Alice" },
  "body": "Hello everyone!",
  "reply_to": null,
  "created_at": "2025-10-23T10:55:12.345Z"
}
``` |

- `reply_to` contains `{ id, body, user }` if the message is a reply.
- Messages are ordered lexicographically by `id`. Fetch prior history via REST: `GET /chat/groups/{groupId}/messages?after=<lastMessageId>&limit=<n>`.

### Typical Workflow
1. **Join group via REST**: `POST /chat/groups/:groupId/join`.
2. **Connect Socket.IO** with JWT.
3. **Join real-time room**:
   ```js
   socket.emit('chat:join', { groupId }, (res) => {
     if (res.status !== 'ok') console.error(res.message);
   });
   ```
4. **Send messages**:
   ```js
   socket.emit('chat:send', { groupId, body, replyToId }, (res) => {
     if (res.status !== 'ok') alert(res.message);
   });
   ```
5. **Receive broadcasts**:
   ```js
   socket.on('chat:new-message', (message) => {
     // Update UI
   });
   ```
6. **Leave room** (optional):
   ```js
   socket.emit('chat:leave', { groupId });
   socket.disconnect();
   ```

### Error Handling
- All event callbacks return `{ status: 'ok' }` or `{ status: 'error', message }`.
- Connection-level failures surface via `connect_error`.
- If the user’s membership changes (e.g., they leave via REST), subsequent socket actions return 403; rejoin via REST before reconnecting.

### Notes
- Messages are text-only per spec; attachments are not processed.
- Membership is enforced server-side for every message send.
- Clients are responsible for read/unread tracking and paging history.

