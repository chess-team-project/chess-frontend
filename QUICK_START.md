# Quick Start Guide

## Installation

### 1. Install Dependencies
```bash
cd /Users/danylovakhniuk/Documents/react_apps/chess-frontend-danya-branch
npm install socket.io-client
```

### 2. Configure Environment
Create or update `.env` file:
```env
VITE_API_URL=http://localhost:3000
```

## Running the Application

### Development Mode
```bash
npm run dev
```
Frontend will be available at: `http://localhost:3000`

### Production Build
```bash
npm run build
npm run preview
```

## Testing the Socket Integration

### Step 1: Start the Backend
```bash
cd /Users/danylovakhniuk/Documents/react_apps/chess-proxy
npm run dev
```
Backend should be running on `http://localhost:3000` or configured port.

### Step 2: Start the Frontend
```bash
cd /Users/danylovakhniuk/Documents/react_apps/chess-frontend-danya-branch
npm run dev
```

### Step 3: Test Lobby Creation
1. Open browser: `http://localhost:3000`
2. Click "Create Game" button
3. Enter your name (e.g., "Alice")
4. Click "Create Lobby"
5. You should see a generated room key (e.g., "ABCD")
6. Copy the room key

### Step 4: Test Lobby Joining
1. Open a new browser tab/window to `http://localhost:3000`
2. Click "Join Game" button
3. Enter the room key you copied
4. Enter your name (e.g., "Bob")
5. Click "Join Game"
6. You should see confirmation

### Step 5: Test Game Board (When Ready)
1. Navigate to the game board
2. You should see the chess board rendered
3. Check browser console for socket events
4. Verify connection status messages

## Troubleshooting

### Issue: "Cannot find module 'socket.io-client'"
**Solution:**
```bash
npm install socket.io-client
```

### Issue: "Connection refused"
**Solution:**
- Verify backend is running: `npm run dev` in `chess-proxy` folder
- Check `VITE_API_URL` in `.env` matches backend URL
- Check backend port (default 3000)

### Issue: Socket events not firing
**Solution:**
- Open browser DevTools → Network → WS tab
- Verify WebSocket connection is established
- Check backend is emitting correct event names
- Compare event names with `SOCKET_API_REFERENCE.md`

### Issue: TypeScript errors
**Solution:**
- Run `npm install` again
- Delete `node_modules` and reinstall
- Check TypeScript version: `npm list typescript`

## File Structure

```
chess-frontend-danya-branch/
├── src/
│   ├── types/                  # Type definitions
│   │   ├── dtos.ts
│   │   └── socket-events.ts
│   ├── services/               # Socket services
│   │   ├── lobby-socket.ts
│   │   └── game-socket.ts
│   ├── components/             # Vue components
│   │   ├── CreateGame.vue
│   │   ├── JoinGame.vue
│   │   └── GameBoard.vue
│   ├── views/
│   │   └── Home.vue
│   ├── router/
│   │   └── index.ts
│   ├── App.vue
│   └── main.ts
├── .env                        # Environment variables (dev)
├── .env.example                # Environment template
├── vite.config.ts             # Vite configuration
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
└── index.html                 # HTML entry point
```

## Route Map

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Home.vue | Entry point with create/join options |
| `/lobby` | CreateGame.vue | Create a new lobby |
| `/join` | JoinGame.vue | Join existing lobby |
| `/board` | GameBoard.vue | Active chess game |

## Component Lifecycle

### Home Page
- Display options to create or join a game

### CreateGame (/lobby)
1. User enters name
2. Connects to `/lobby` socket
3. Sends `lobby:create` event
4. Receives room key
5. Can share key or wait for opponent

### JoinGame (/join)
1. User enters room key and name
2. Connects to `/lobby` socket
3. Sends `lobby:join` event
4. Receives confirmation
5. Ready to play

### GameBoard (/board)
1. Connects to `/game` socket
2. Sends `game:join` event
3. Waits for opponent ready
4. Chess board becomes active

## Key Features

✅ **Type-Safe Sockets**
- All events are TypeScript typed
- Compile-time safety
- IDE autocomplete support

✅ **Automatic Reconnection**
- Handles network interruptions
- Exponential backoff
- Configurable retry attempts

✅ **Clean Components**
- Proper event cleanup
- No memory leaks
- Lifecycle management

✅ **Error Handling**
- User-friendly messages
- Console debugging
- Network error recovery

✅ **Validation**
- Frontend input validation
- Backend DTO validation
- Format checking

## Commands Reference

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Install socket.io-client
npm install socket.io-client
```

## Debugging

### Browser Console
```javascript
// Check connection status
console.log(lobbySocketService.isConnected());
console.log(gameSocketService.isConnected());

// Access socket directly
const socket = lobbySocketService.getSocket();
console.log(socket);
```

### Network Tab
1. Open DevTools → Network → WS
2. Watch WebSocket messages
3. Verify event payloads

### VS Code Debugging
1. Set breakpoints in components
2. Run with debugger
3. Step through socket event handlers

## Performance Tips

- Components properly cleanup event listeners
- Services are singletons (no duplicate connections)
- Socket.IO handles buffering and queuing
- Reconnection doesn't lose queued events

## Security Notes

- Room IDs are 4 characters (backend-generated)
- Player names are validated (2-20 characters)
- WebSocket used with optional TLS
- CORS configured on backend

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Android)

## Documentation Files

- **`SOCKET_IMPLEMENTATION.md`** - Full technical documentation
- **`SOCKET_API_REFERENCE.md`** - API contract and examples
- **`IMPLEMENTATION_SUMMARY.md`** - Changes and features summary
- **`QUICK_START.md`** - This file

## Next Steps

1. ✅ Start frontend and backend
2. ✅ Test lobby creation flow
3. ✅ Test lobby joining flow
4. ✅ Verify game board displays
5. 📝 Implement chess move logic
6. 📝 Add piece rendering
7. 📝 Implement move validation
8. 📝 Add game state synchronization

## Support

For issues or questions:
1. Check the documentation files
2. Review console errors
3. Check Network → WS tab in DevTools
4. Verify backend is implementing correct events

---

**Status:** Ready to Use ✅

**Last Updated:** November 15, 2025
