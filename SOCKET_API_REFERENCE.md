# Socket.IO API Contract

## Lobby Namespace (`/lobby`)

### Client → Server Events

#### `lobby:create`
Creates a new lobby.

**Payload:**
```typescript
{
  name: string  // Player name (2-20 characters)
}
```

**Example:**
```typescript
lobbySocketService.emit('lobby:create', { name: 'Alice' });
```

---

#### `lobby:join`
Joins an existing lobby.

**Payload:**
```typescript
{
  roomId: string;  // 4-character room ID (uppercase)
  name: string;    // Player name (2-20 characters)
}
```

**Example:**
```typescript
lobbySocketService.emit('lobby:join', { 
  roomId: 'ABCD', 
  name: 'Bob' 
});
```

---

### Server → Client Events

#### `lobby:created`
Emitted when a new lobby is successfully created.

**Payload:**
```typescript
{
  roomId: string;
  players: Player[];
  message: string;
}
```

**Player Interface:**
```typescript
{
  id: string;      // Socket ID
  name: string;    // Player name
}
```

**Example Handler:**
```typescript
lobbySocketService.on('lobby:created', (payload) => {
  console.log('Room ID:', payload.roomId);
  console.log('Players:', payload.players);
});
```

---

#### `lobby:update`
Emitted when a player joins an existing lobby or lobby state changes.

**Payload:**
```typescript
{
  roomId: string;
  players: Player[];
  message: string;
}
```

---

#### `lobby:error`
Emitted when an error occurs during lobby operations.

**Payload:**
```typescript
{
  message: string;  // Error description
}
```

---

#### `game:start`
Emitted when both players are ready and the game starts.

**Payload:**
```typescript
{
  roomId: string;
  white: Player;    // White player assignment
  black: Player;    // Black player assignment
}
```

---

## Game Namespace (`/game`)

### Client → Server Events

#### `game:join`
Joins a chess game in a specific room.

**Payload:**
```typescript
{
  roomId: string;      // 4-character room ID
  playerName: string;  // Player name (2-20 characters)
}
```

**Example:**
```typescript
gameSocketService.emit('game:join', { 
  roomId: 'ABCD', 
  playerName: 'Charlie' 
});
```

---

#### `game:move`
Sends a chess move to the opponent.

**Payload:**
```typescript
{
  roomId: string;
  move: ChessMove;       // Chess move object (format TBD)
  playerName: string;    // Player name
}
```

**Example:**
```typescript
gameSocketService.emit('game:move', {
  roomId: 'ABCD',
  move: { from: 'e2', to: 'e4' },  // Example format
  playerName: 'Charlie'
});
```

---

### Server → Client Events

#### `game:joined`
Emitted when a player successfully joins the game.

**Payload:**
```typescript
{
  message: string;  // Confirmation message
}
```

---

#### `game:opponentReady`
Emitted when the opponent joins and is ready to start.

**Payload:**
```typescript
{
  message: string;  // Status message
}
```

---

#### `game:moveMade`
Emitted when the opponent makes a move.

**Payload:**
```typescript
{
  move: ChessMove;      // The opponent's move
  playerName: string;   // Opponent's name
}
```

---

#### `game:error`
Emitted when a game error occurs.

**Payload:**
```typescript
{
  message: string;  // Error description
}
```

---

## Connection Management

### Connect to Lobby Socket
```typescript
await lobbySocketService.connect();
```

### Connect to Game Socket
```typescript
await gameSocketService.connect();
```

### Check Connection Status
```typescript
if (lobbySocketService.isConnected()) {
  // Socket is connected
}
```

### Disconnect
```typescript
lobbySocketService.disconnect();
gameSocketService.disconnect();
```

---

## Data Validation (Frontend)

### CreateLobbyDto
- `name`: string, 2-20 characters, not empty

### JoinLobbyDto
- `roomId`: string, exactly 4 characters, uppercase only
- `name`: string, 2-20 characters, not empty

### GameJoinDto
- `roomId`: string, exactly 4 characters, uppercase only
- `playerName`: string, 2-20 characters, not empty

---

## Environment Configuration

Create a `.env` file:
```env
VITE_API_URL=http://localhost:3000
```

The sockets will connect to:
- Lobby: `{VITE_API_URL}/lobby`
- Game: `{VITE_API_URL}/game`

---

## Error Codes (Reference)

Common error messages from backend:

- `"Room not found"` - Lobby with roomId doesn't exist
- `"Room is full"` - Lobby already has 2 players
- `"Invalid room ID"` - Room ID format is incorrect
- `"Player name is required"` - Name is empty or missing
- `"Player already in game"` - Player is already in a game

---

## Flow Examples

### Complete Lobby Creation & Join Flow

**Player 1 (Alice - Creates):**
```typescript
// Connect to lobby
await lobbySocketService.connect();

// Listen for creation confirmation
lobbySocketService.on('lobby:created', (payload) => {
  roomId = payload.roomId;  // e.g., "ABCD"
  // Show key to share
});

// Create lobby
lobbySocketService.emit('lobby:create', { name: 'Alice' });

// Listen for opponent joining
lobbySocketService.on('lobby:update', (payload) => {
  // Show updated player count
});

// Listen for game start
lobbySocketService.on('game:start', (payload) => {
  playerColor = payload.white?.id === myId ? 'white' : 'black';
  // Navigate to game board
});
```

**Player 2 (Bob - Joins):**
```typescript
// Connect to lobby
await lobbySocketService.connect();

// Join lobby
lobbySocketService.emit('lobby:join', { 
  roomId: 'ABCD',  // Received from Alice
  name: 'Bob' 
});

// Listen for confirmation
lobbySocketService.on('lobby:update', (payload) => {
  // Joined successfully, show players
});

// Listen for game start
lobbySocketService.on('game:start', (payload) => {
  // Navigate to game board
});
```

---

## Testing Checklist

- [ ] Can create a lobby
- [ ] Room ID is displayed correctly
- [ ] Can join a lobby with valid room ID
- [ ] Cannot join with invalid room ID
- [ ] Cannot create/join with empty name
- [ ] Both players see each other in lobby
- [ ] Can navigate to game board
- [ ] Game board connects to game socket
- [ ] Player color is assigned correctly
- [ ] Moves are sent and received correctly
- [ ] Error messages display properly
- [ ] Reconnection works after disconnect

---

**Last Updated:** November 15, 2025
