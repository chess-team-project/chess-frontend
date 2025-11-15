# Architecture & Flow Diagrams

## Overall Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Chess Frontend (Vue 3 + TS)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Routes (Vue Router)                   │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  / (Home)      /lobby (Create)  /join (Join)  /board    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│  ┌────────────────────────┼────────────────────────────────┐   │
│  │                        ▼                                │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │           Components & Pages                     │  │   │
│  │  ├──────────────────────────────────────────────────┤  │   │
│  │  │  Home.vue    CreateGame.vue   JoinGame.vue      │  │   │
│  │  │  GameBoard.vue                                  │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                        │                                │   │
│  └────────────────────────┼────────────────────────────────┘   │
│                           │                                     │
│  ┌────────────────────────┼────────────────────────────────┐   │
│  │                        ▼                                │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │         Socket Services (Singletons)            │  │   │
│  │  ├──────────────────────────────────────────────────┤  │   │
│  │  │  lobbySocketService    gameSocketService         │  │   │
│  │  │  (manages /lobby)      (manages /game)           │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                        │                                │   │
│  └────────────────────────┼────────────────────────────────┘   │
│                           │                                     │
│  ┌────────────────────────┼────────────────────────────────┐   │
│  │                        ▼                                │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │      Type Definitions (TypeScript)              │  │   │
│  │  ├──────────────────────────────────────────────────┤  │   │
│  │  │  DTOs:  CreateLobbyDto, JoinLobbyDto, etc       │  │   │
│  │  │  Events: S2C/C2S for Lobby & Game               │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                        │                                │   │
│  └────────────────────────┼────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│                    WebSocket (Socket.IO)                        │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ TCP/WebSocket
                            │
┌─────────────────────────────────────────────────────────────────┐
│                   Chess Backend (NestJS)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Socket Gateways                             │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  LobbyGateway (/lobby namespace)                         │  │
│  │  GameGateway (/game namespace)                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Business Logic Services                     │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  LobbyService    GameService                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Lifecycle Flow

### CreateGame Component Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│             CreateGame.vue Lifecycle                        │
└─────────────────────────────────────────────────────────────┘
                           │
                    onMounted()
                           │
                  ┌────────┴────────┐
                  ▼                 ▼
            Connect to      Set up event
            /lobby socket   listeners
                  │                 │
                  └────────┬────────┘
                           ▼
                 Ready for form input
                           │
                    User enters name
                           │
                  User clicks Submit
                           │
                    ▼─────────────────▼
              Form validation    Create Payload
                  │                  │
                  └────────┬─────────┘
                           ▼
                   emit('lobby:create')
                           │
                  ┌────────┴────────┐
                  ▼                 ▼
              Listen for:   Listen for:
            lobby:created   lobby:error
                  │                 │
         ┌────────▼────────┐ ┌─────▼───────┐
         │ Display roomId  │ │ Show error  │
         │ Show copy btn   │ │ message     │
         └────────┬────────┘ └─────┬───────┘
                  │                 │
                  └────────┬────────┘
                           ▼
                    onUnmounted()
                           │
                    Clean up listeners
                    Optionally disconnect
```

### JoinGame Component Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│              JoinGame.vue Lifecycle                         │
└─────────────────────────────────────────────────────────────┘
                           │
                    onMounted()
                           │
                  ┌────────┴────────┐
                  ▼                 ▼
            Connect to      Set up event
            /lobby socket   listeners
                  │                 │
                  └────────┬────────┘
                           ▼
               Ready for form input
                           │
              User enters roomId + name
                           │
               User clicks "Join Game"
                           │
                    ▼─────────────────▼
              Form validation    Create Payload
                  │                  │
                  └────────┬─────────┘
                           ▼
                    emit('lobby:join')
                           │
                  ┌────────┴────────┐
                  ▼                 ▼
              Listen for:   Listen for:
             lobby:update   lobby:error
                  │                 │
         ┌────────▼────────┐ ┌─────▼───────┐
         │ Show success    │ │ Show error  │
         │ Ready to play   │ │ message     │
         └────────┬────────┘ └─────┬───────┘
                  │                 │
                  └────────┬────────┘
                           ▼
                    onUnmounted()
                           │
                    Clean up listeners
```

### GameBoard Component Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│             GameBoard.vue Lifecycle                         │
└─────────────────────────────────────────────────────────────┘
                           │
                    onMounted()
                           │
                  ┌────────┴────────┐
                  ▼                 ▼
            Get route       Connect to
            parameters      /game socket
            (roomId, name)        │
                  │               │
                  └────────┬──────┘
                           ▼
           emit('game:join', {roomId, name})
                           │
                    ▼────────────────────▼
              Listen for:         Show status:
             game:joined       "Waiting for opponent..."
                  │                  │
         ┌────────▼───────────┐      ▼
         │ game:opponentReady │  Show status update
         │ game:moveMade      │  "Opponent ready!"
         │ game:error         │  Board becomes active
         └────────┬───────────┘
                  │
              Update board
              state on moves
                  │
              Display moves
                  │
                  │
              User leaves game
                           │
                    onUnmounted()
                           │
                  Call disconnect()
                  Clean up listeners
```

## Socket Event Flow Diagram

### Lobby Creation Sequence

```
┌──────────────────┐                              ┌──────────────────┐
│  Frontend        │                              │  Backend         │
│  (CreateGame)    │                              │  (LobbyGateway)  │
└──────┬───────────┘                              └────────┬─────────┘
       │                                                   │
       │  ─ User fills form ─                             │
       │  (name: "Alice")                                 │
       │                                                   │
       │  emit('lobby:create')                            │
       │  {'name': 'Alice'}                               │
       ├───────────────────────────────────────────────────>
       │                                                   │
       │                                            [Process on backend]
       │                                            Generate roomId
       │                                            Create lobby object
       │                                            Add player
       │                                                   │
       │  on('lobby:created')                             │
       │  <───────────────────────────────────────────────┤
       │  {'roomId': 'ABCD',                              │
       │   'players': [{'id': '...', 'name': 'Alice'}],   │
       │   'message': 'Lobby created successfully'}       │
       │                                                   │
       ├─ Display roomId ─────────────────────────────────>
       │ Show "Share this key: ABCD"                      │
       │ Enable copy button                               │
       │                                                   │
       └─────────────────────────────────────────────────┘
```

### Lobby Joining Sequence

```
┌──────────────────┐                              ┌──────────────────┐
│  Frontend        │                              │  Backend         │
│  (JoinGame)      │                              │  (LobbyGateway)  │
└──────┬───────────┘                              └────────┬─────────┘
       │                                                   │
       │  ─ User enters data ─                            │
       │  (roomId: "ABCD", name: "Bob")                  │
       │                                                   │
       │  emit('lobby:join')                              │
       │  {'roomId': 'ABCD', 'name': 'Bob'}              │
       ├───────────────────────────────────────────────────>
       │                                                   │
       │                                            [Process on backend]
       │                                            Find lobby ABCD
       │                                            Validate room full?
       │                                            Add Bob as player
       │                                            Broadcast to room
       │                                                   │
       │  on('lobby:update')                              │
       │  <───────────────────────────────────────────────┤
       │  {'roomId': 'ABCD',                              │
       │   'players': [                                   │
       │     {'id': '...', 'name': 'Alice'},             │
       │     {'id': '...', 'name': 'Bob'}                │
       │   ],                                             │
       │   'message': 'Player joined'}                    │
       │                                                   │
       ├─ Show confirmation ───────────────────────────────>
       │ Display player list                              │
       │ Enable game start                                │
       │                                                   │
       └─────────────────────────────────────────────────┘
```

### Game Start Sequence

```
┌──────────────────┐                              ┌──────────────────┐
│  Frontend        │                              │  Backend         │
│  (GameBoard)     │                              │  (GameGateway)   │
└──────┬───────────┘                              └────────┬─────────┘
       │                                                   │
       │  emit('game:join')                               │
       │  {'roomId': 'ABCD', 'playerName': 'Alice'}      │
       ├───────────────────────────────────────────────────>
       │                                                   │
       │                                            [Process on backend]
       │                                            Join player to game
       │                                            Add to game state
       │                                                   │
       │  on('game:joined')                               │
       │  <───────────────────────────────────────────────┤
       │  {'message': 'Successfully joined game'}         │
       │                                                   │
       │  [Backend detects both players ready]            │
       │                                                   │
       │  on('game:opponentReady')                        │
       │  <───────────────────────────────────────────────┤
       │  {'message': 'Game started! You are White'}      │
       │                                                   │
       ├─ Board becomes active ────────────────────────────>
       │ Enable piece selection                           │
       │ Show player colors                               │
       │                                                   │
       │  [User makes move]                               │
       │                                                   │
       │  emit('game:move')                               │
       │  {'roomId': 'ABCD',                              │
       │   'move': {from: 'e2', to: 'e4'},                │
       │   'playerName': 'Alice'}                         │
       ├───────────────────────────────────────────────────>
       │                                                   │
       │                                            [Validate move]
       │                                            [Update game state]
       │                                            [Broadcast to room]
       │                                                   │
       │  on('game:moveMade')                             │
       │  <───────────────────────────────────────────────┤
       │  {'move': {...}, 'playerName': 'Bob'}            │
       │                                                   │
       ├─ Update board ────────────────────────────────────>
       │ Show opponent's move                             │
       │ Enable next move                                 │
       │                                                   │
       └─────────────────────────────────────────────────┘
```

## Data Flow - Room Creation

```
User Interface
     │
     ├─ Input name: "Alice"
     │
     ▼
React to Form Submit
     │
     ├─ Validate input
     ├─ Create CreateLobbyDto {name: "Alice"}
     │
     ▼
LobbySocketService
     │
     ├─ emit('lobby:create', dto)
     │
     ▼
WebSocket (/lobby)
     │
     ├─ Send to server
     │
     ▼
Backend - LobbyGateway
     │
     ├─ Receive lobby:create event
     ├─ Validate DTO
     ├─ Generate roomId: "ABCD"
     ├─ Create LobbyRoom object
     ├─ Store in repository
     ├─ Add player to room
     │
     ▼
Emit lobby:created
     │
     ├─ Return {roomId, players, message}
     │
     ▼
WebSocket (/lobby)
     │
     ├─ Send to client
     │
     ▼
Frontend - LobbySocketService
     │
     ├─ Receive lobby:created event
     ├─ Trigger callback
     │
     ▼
CreateGame Component
     │
     ├─ Update roomId in state
     ├─ Show room key UI
     ├─ Enable copy button
     │
     ▼
User sees: "Your Room Key: ABCD"
```

## State Management

```
CreateGame Component
├── playerName (ref) ───┬─── Bound to input
│                       └─── Sent in lobby:create
├── roomId (ref) ───────┬─── Updated on lobby:created
│                       └─── Displayed in UI
├── loading (ref) ───── Shows "Creating..." message
├── error (ref) ──────── Shows error from server
└── copied (ref) ─────── Tracks copy button state

JoinGame Component
├── roomId (ref) ───────┬─── Bound to input
│                       └─── Sent in lobby:join
├── playerName (ref) ───┬─── Bound to input
│                       └─── Sent in lobby:join
├── loading (ref) ───── Shows "Joining..." message
└── error (ref) ──────── Shows error from server

GameBoard Component
├── roomId (ref) ───────┬─── From route params
│                       └─── Sent in game:join
├── playerName (ref) ───┬─── From route params
│                       └─── Sent in game:join
├── playerColor (ref) ─┬─── From game:opponentReady
│                      └─── Displayed in UI
├── status (ref) ──────┬─── Shows game status
│                      └─── Updated on events
├── error (ref) ─────── Shows game errors
└── connected (ref) ─── Tracks connection status
```

## Error Handling Flow

```
User Action
     │
     ▼
Form Validation (Frontend)
     │
     ├─ Pass? ──→ Proceed
     │
     └─ Fail? ──→ Show local error
                  (e.g., "Name too short")
                       │
                       ▼
                  Error displayed
                  Form remains active

     │
     ▼ (If validation passes)
Socket emit to Server
     │
     ▼
Backend Processing
     │
     ├─ Valid? ──→ Process & respond with success
     │
     └─ Invalid? ──→ Send error event (lobby:error)
                        │
                        ▼
              Frontend receives error
                        │
                        ▼
         Show user-friendly error message
                        │
                        ▼
            User can retry or navigate away
```

## Module Dependencies

```
main.ts
  │
  ├─ App.vue
  │   ├─ router/index.ts
  │   │   ├─ views/Home.vue
  │   │   ├─ components/CreateGame.vue
  │   │   │   ├─ services/lobby-socket.ts
  │   │   │   │   └─ types/socket-events.ts
  │   │   │   │       └─ types/dtos.ts
  │   │   │   └─ types/dtos.ts
  │   │   ├─ components/JoinGame.vue
  │   │   │   ├─ services/lobby-socket.ts
  │   │   │   └─ types/dtos.ts
  │   │   └─ components/GameBoard.vue
  │   │       ├─ services/game-socket.ts
  │   │       │   └─ types/socket-events.ts
  │   │       │       └─ types/dtos.ts
  │   │       └─ types/dtos.ts
  │   │
  │   └─ bootstrap CSS
  │
  └─ router
```

---

**Last Updated:** November 15, 2025
