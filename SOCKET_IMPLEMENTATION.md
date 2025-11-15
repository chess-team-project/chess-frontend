# Chess Frontend - Socket.IO Implementation Guide

## Overview

This document describes the complete Socket.IO implementation for the chess frontend application with two main routes: `/lobby` and `/game`.

## Architecture

### Routes Structure

```
/                  → Home page (options to create/join lobby)
├── /lobby         → Create Game component (lobby creation)
├── /join          → Join Game component (lobby joining)
└── /board         → Game Board component (active game)
```

### Socket Namespaces

The frontend connects to two separate Socket.IO namespaces:

1. **`/lobby`** - Handles lobby creation and joining
2. **`/game`** - Handles game state and moves

## Implementation Details

### 1. Type Definitions

#### DTOs (`src/types/dtos.ts`)
- `CreateLobbyDto` - Payload for creating a lobby (name only)
- `JoinLobbyDto` - Payload for joining a lobby (roomId, name)
- `GameJoinDto` - Payload for joining a game
- `Player` - Player information (id, name)

#### Socket Events (`src/types/socket-events.ts`)
- `S2CLobbyEvents` - Server-to-Client lobby events
- `C2SLobbyEvents` - Client-to-Server lobby events
- `S2CGameEvents` - Server-to-Client game events
- `C2SGameEvents` - Client-to-Server game events

### 2. Services

#### Lobby Socket Service (`src/services/lobby-socket.ts`)
Manages connection to `/lobby` namespace with typed event handlers.

**Key Methods:**
- `connect()` - Establish connection to `/lobby` namespace
- `disconnect()` - Close connection
- `isConnected()` - Check connection status
- `emit()` - Send typed events to server
- `on()` - Listen for typed events from server
- `off()` - Remove event listener

**Environment Variable:**
```
VITE_API_URL=http://localhost:3000
```

#### Game Socket Service (`src/services/game-socket.ts`)
Manages connection to `/game` namespace with typed event handlers.

Same interface as Lobby Socket Service for consistency.

### 3. Components

#### Home.vue (`src/views/Home.vue`)
**Purpose:** Entry point with options to create or join a game

**Features:**
- Two card options: "Create Game" and "Join Game"
- Navigation links to `/lobby` and `/join`

#### CreateGame.vue (`src/components/CreateGame.vue`)
**Purpose:** Create a new lobby

**Flow:**
1. User enters their name
2. Component connects to `/lobby` socket on mount
3. User submits form → `lobby:create` event sent to server
4. Server responds with `lobby:created` event containing:
   - `roomId` - Unique 4-character room identifier
   - `players` - Array of connected players
   - `message` - Status message
5. Display room key for sharing

**Event Handling:**
```
lobby:created  → Display room ID
lobby:error    → Show error message
```

#### JoinGame.vue (`src/components/JoinGame.vue`)
**Purpose:** Join an existing lobby

**Flow:**
1. User enters room key (4 characters, uppercase)
2. User enters their name
3. Component connects to `/lobby` socket on mount
4. User submits form → `lobby:join` event sent to server
5. Server responds with `lobby:update` or `lobby:error`

**Event Handling:**
```
lobby:update   → Successfully joined, show lobby status
lobby:error    → Show error message
```

#### GameBoard.vue (`src/components/GameBoard.vue`)
**Purpose:** Display active chess game

**Flow:**
1. Component connects to `/game` socket on mount
2. Extract `roomId` and `playerName` from route parameters
3. Send `game:join` event with credentials
4. Receive `game:joined` confirmation
5. Wait for `game:opponentReady` before starting
6. Display board and listen for `game:moveMade` events

**Event Handling:**
```
game:joined        → Player successfully joined
game:opponentReady → Opponent is ready, can start game
game:moveMade      → Opponent made a move
game:error         → Connection or game error
```

## Socket Event Flow

### Lobby Creation Flow

```
Client                          Server
  │                               │
  ├─── emit: lobby:create ───────→│
  │     { name: "Alice" }         │
  │                               │
  │                          [Generate roomId]
  │                          [Add player]
  │                               │
  │← emit: lobby:created ────────┤
  │  { roomId, players, msg }    │
  │                               │
  └─ Display room key/share ──────→
```

### Lobby Join Flow

```
Client                          Server
  │                               │
  ├─── emit: lobby:join ────────→│
  │     { roomId, name }         │
  │                               │
  │                          [Find lobby]
  │                          [Add player]
  │                          [Broadcast update]
  │                               │
  │← emit: lobby:update ────────┤
  │  { roomId, players, msg }    │
  │                               │
```

### Game Join Flow

```
Client                          Server
  │                               │
  ├─── emit: game:join ────────→│
  │     { roomId, playerName }   │
  │                               │
  │                          [Validate]
  │                          [Add to game]
  │                               │
  │← emit: game:joined ────────┤
  │  { message }                 │
  │                               │
  │        [Wait for opponent]    │
  │                               │
  │← emit: game:opponentReady ──┤
  │  { message }                 │
  │                               │
  │     [Chess game active]       │
  │                               │
```

## Configuration

### Environment Variables

Create `.env` file in the frontend root:

```env
VITE_API_URL=http://localhost:3000
```

For production, set `VITE_API_URL` to your backend URL.

### Vite Config

The `vite.config.ts` includes:
- Vue plugin support
- Path alias `@` → `src` directory
- Development server on port 3000

## Type Safety

All Socket.IO events are **fully typed** using TypeScript interfaces:

```typescript
// On the client side, type-safe emit:
lobbySocketService.emit('lobby:create', {
  name: 'Alice'  // ✓ Type-checked
});

// On the client side, type-safe listeners:
lobbySocketService.on('lobby:created', (payload) => {
  // payload is typed as { roomId, players, message }
  console.log(payload.roomId);  // ✓ Type-checked
});
```

## Error Handling

All components include error handling for:
- Connection failures
- Socket timeouts
- Server-side validation errors
- Invalid input from users

Error messages are displayed to the user via alert components.

## Connection Lifecycle

### Singleton Pattern

Both `lobbySocketService` and `gameSocketService` are singletons:
- Created once on module load
- Reused across components
- Safe to call `connect()` multiple times

### Auto-Reconnection

Socket.IO is configured with:
- Automatic reconnection enabled
- Initial delay: 1000ms
- Max delay: 5000ms
- Max attempts: 5

### Cleanup

Components properly cleanup on unmount:
- Remove event listeners with `off()`
- Optionally disconnect sockets
- Prevent memory leaks

## Next Steps

1. **Test Socket Connection:** Verify backend is running on `http://localhost:3000`
2. **Test Lobby Creation:** Submit form on CreateGame page
3. **Test Lobby Joining:** Enter room key and join
4. **Test Game Logic:** Implement chess move validation and broadcasting
5. **UI Polish:** Add animations and real-time player count updates

## Troubleshooting

### "Cannot find module 'socket.io-client'"
- Run: `npm install socket.io-client`

### Connection Refused
- Check backend is running on correct port
- Verify `VITE_API_URL` environment variable
- Check CORS settings on backend

### Events Not Firing
- Verify socket is connected: `console.log(lobbySocketService.isConnected())`
- Check browser console for errors
- Verify event names match backend exactly

### Type Errors in Events
- Ensure DTOs match backend definitions
- Update `socket-events.ts` if backend changes
- Run `npm run build` to check types

## File Structure

```
src/
├── types/
│   ├── dtos.ts              # Data Transfer Objects
│   └── socket-events.ts     # Socket.IO event interfaces
├── services/
│   ├── lobby-socket.ts      # Lobby namespace service
│   └── game-socket.ts       # Game namespace service
├── components/
│   ├── CreateGame.vue       # Create lobby form
│   ├── JoinGame.vue         # Join lobby form
│   └── GameBoard.vue        # Chess board display
├── views/
│   └── Home.vue             # Landing page
├── router/
│   └── index.ts             # Route definitions
├── App.vue                  # Root component
└── main.ts                  # Entry point
```

## Dependencies

- `vue` ^3.4.21
- `vue-router` ^4.6.3
- `socket.io-client` ^4.8.1 (newly added)
- `bootstrap` ^5.3.3
- `zustand` ^5.0.8 (for potential state management)

---

**Last Updated:** November 15, 2025
