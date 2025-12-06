<template>
  <div class="row justify-content-center">
    <div class="col-lg-10">
      <div class="card shadow-sm">
        <div class="card-body">
          <h1 class="card-title h3 mb-4">Chess Game</h1>

          <div v-if="error" class="alert alert-danger">
            {{ error }}
          </div>

          <div v-if="status" class="alert alert-info">
            {{ status }}
          </div>

          <div class="row mb-4">
            <!-- Game Info Column -->
            <div class="col-md-3">
              <div class="card bg-light">
                <div class="card-body">
                  <h5 class="card-title">Game Info</h5>
                  <p class="mb-2">
                    <strong>Room:</strong> <code>{{ roomId }}</code>
                  </p>
                  <p class="mb-2">
                    <strong>Your Name:</strong> {{ playerName }}
                  </p>
                  <p class="mb-2">
                    <strong>Your Color:</strong> 
                    <span class="badge" :class="playerColor === 'white' ? 'bg-light text-dark' : 'bg-dark'">
                      {{ playerColor?.toUpperCase() || 'Pending' }}
                    </span>
                  </p>
                  <p class="mb-2">
                    <strong>Game Status:</strong>
                    <span class="badge" :class="{
                      'bg-warning': gameStatus === 'waiting',
                      'bg-info': gameStatus === 'playing',
                      'bg-success': gameStatus === 'finished'
                    }">
                      {{ gameStatus }}
                    </span>
                  </p>
                  <p class="mb-0">
                    <strong>To Move:</strong> 
                    <span>{{ currentTurn === 'w' ? '⚪ White' : '⚫ Black' }}</span>
                  </p>
                </div>
              </div>

              <!-- Move History -->
              <div class="card bg-light mt-3">
                <div class="card-body">
                  <h6 class="card-title">Move History</h6>
                  <div class="move-history" style="max-height: 200px; overflow-y: auto;">
                    <small v-if="moveHistory.length === 0" class="text-muted">No moves yet</small>
                    <div v-for="(move, idx) in moveHistory" :key="idx" class="mb-1">
                      <small><strong>{{ idx + 1 }}.</strong> {{ move }}</small>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="mt-3">
                <button 
                  class="btn btn-sm btn-warning w-100 mb-2" 
                  @click="offerDraw"
                  :disabled="!isPlayerTurn"
                >
                  Offer Draw
                </button>
                <button 
                  class="btn btn-sm btn-danger w-100 mb-2"
                  @click="resign"
                >
                  Resign
                </button>
                <RouterLink class="btn btn-sm btn-outline-secondary w-100" :to="{ name: 'Home' }">
                  Home
                </RouterLink>
              </div>
            </div>

            <!-- Chessboard Column -->
            <div class="col-md-7">
              <div class="chessboard-container d-flex justify-content-center mb-3">
                <TheChessboard
                  :key="`${boardRefreshKey}-${playerColor}`"
                  :board-config="boardConfig"
                  @move="onChessboardMove"
                />
              </div>
              <div class="text-center">
                <small class="text-muted">
                  FEN: <code style="font-size: 0.75rem;">{{ currentFEN }}</code>
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { RouterLink } from 'vue-router';
import { gameSocketService } from '@/services/game-socket';
import type { BoardConfig } from 'vue3-chessboard';
import { Chess } from 'chess.js';
import { TheChessboard } from 'vue3-chessboard';
import 'vue3-chessboard/style.css';
import type { GameSession } from '@/types/interfaces';

const router = useRouter();
const route = useRoute();

// Game state
const roomId = ref('');
const gameId = ref('');
const playerName = ref('');
const playerColor = ref<'white' | 'black'>('white');
const status = ref('Connecting to game...');
const error = ref('');
const connected = ref(false);
const waitingForMoveAck = ref(false);
const boardRefreshKey = ref(0);

// Chess game state
const chess = ref(new Chess());
const gameStatus = ref<'waiting' | 'playing' | 'finished'>('waiting');
const moveHistory = ref<string[]>([]);
const currentTurn = computed(() => chess.value.turn()); // 'w' or 'b'
const currentFEN = computed(() => chess.value.fen());
const isPlayerTurn = computed(() => {
  if (playerColor.value === 'white') return currentTurn.value === 'w';
  return currentTurn.value === 'b';
});

// Board configuration
const boardConfig = computed<BoardConfig>(() => {
  try {
    const config: BoardConfig = {
      fen: currentFEN.value,
      orientation: playerColor.value,
      coordinates: true,
      viewOnly: false,
    };
    console.log('🎨 Board config updated:', { fen: config.fen, orientation: config.orientation });
    return config;
  } catch (err) {
    console.error('Error creating board config:', err);
    return {
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      orientation: 'white',
      coordinates: true,
      viewOnly: false,
    };
  }
});

// Handle moves from chessboard
const onChessboardMove = (moveData: any) => {
  try {
    console.log('♟️ Move attempt:', moveData);
    
    // Don't allow moves while waiting for server acknowledgment
    if (waitingForMoveAck.value) {
      error.value = 'Waiting for server response to previous move...';
      return;
    }

    // Validate it's player's turn
    if (!isPlayerTurn.value) {
      error.value = "It's not your turn!";
      return;
    }

    // Parse move data from chessboard
    const from = moveData.from || moveData.sourceSquare;
    const to = moveData.to || moveData.targetSquare;
    const promotion = moveData.promotion;

    if (!from || !to) {
      error.value = 'Invalid move data';
      return;
    }

    // Apply move locally
    const move = chess.value.move({
      from,
      to,
      promotion: promotion || undefined,
    });
    
    if (!move) {
      error.value = 'Invalid move';
      return;
    }

    // Add to history
    moveHistory.value.push(move.san);
    console.log(`✅ Move applied locally: ${move.san}`);

    // Mark as waiting for acknowledgment
    waitingForMoveAck.value = true;
    status.value = 'Sending move to server...';
    error.value = '';

    // Send to backend for validation (move string must be 4-5 chars, e.g. 'e2e4' or 'e7e8q')
    const promoChar = promotion ? String(promotion).charAt(0) : '';
    const movePayload = {
      roomId: gameId.value,
      move: `${from}${to}${promoChar}`,
      playerName: playerName.value,
    };

    console.log('📨 Emitting game:move:', movePayload);
    gameSocketService.emit('game:move', movePayload);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Move failed';
    console.error('❌ Move failed:', err);
  }
};

// Handle incoming moves from opponent
const handleOpponentMove = (moveData: any) => {
  try {
    console.log('Processing opponent move:', moveData);
    // The game:update event will handle the board state update
    if (moveData.move && moveData.move.from && moveData.move.to) {
      console.log(`Opponent made move: ${moveData.move.from} -> ${moveData.move.to}`);
    }
  } catch (err) {
    error.value = 'Error processing opponent move';
    console.error(err);
  }
};

const offerDraw = () => {
  // TODO: Implement draw offer when backend supports it
  error.value = 'Draw offer not yet implemented';
};

const resign = () => {
  // TODO: Implement resign when backend supports it
  error.value = 'Resign not yet implemented';
};

onMounted(async () => {
  try {
    // Get room ID, game ID, and player name from route params
    roomId.value = Array.isArray(route.params.roomId) ? route.params.roomId[0] : (route.params.roomId as string) || '';
    gameId.value = Array.isArray(route.params.gameId) ? route.params.gameId[0] : (route.params.gameId as string) || '';
    playerName.value = Array.isArray(route.params.playerName) ? route.params.playerName[0] : (route.params.playerName as string) || '';
    // Read playerColor from route params (provided by backend via Lobby)
    const colorParam = Array.isArray(route.params.playerColor)
      ? route.params.playerColor[0]
      : (route.params.playerColor as string | undefined);
    if (colorParam === 'white' || colorParam === 'black') {
      playerColor.value = colorParam;
    } else if (typeof colorParam === 'string') {
      const lc = colorParam.toLowerCase();
      playerColor.value = lc === 'white' || lc === 'black' ? (lc as 'white' | 'black') : 'white';
    } else {
      playerColor.value = 'white';
    }

    console.log('🎮 GameBoard mounted with params:', { 
      roomId: roomId.value, 
      gameId: gameId.value, 
      playerName: playerName.value, 
      playerColor: playerColor.value 
    });

    if (!gameSocketService.isConnected()) {
      console.log('📡 Game socket not connected, connecting...');
      await gameSocketService.connect();
    } else {
      console.log('✅ Game socket already connected');
    }

    connected.value = true;

    // Debug: log any incoming socket events to help diagnose mismatched event names/payloads
    const sock = gameSocketService.getSocket();
    if (sock && (sock as any).onAny) {
      (sock as any).onAny((event: string, ...args: any[]) => {
        console.log('🔔 Game socket event:', event, args);
      });
    }

    // Send game:join event (use gameId/UUID)
    if (gameId.value && playerName.value) {
      console.log('📨 Sending game:join event...', { gameId: gameId.value, playerName: playerName.value });
      gameSocketService.emit('game:join', {
        roomId: gameId.value,
        playerName: playerName.value,
      });
      status.value = `Joining game ${gameId.value}...`;
    } else {
      error.value = `Missing required params: gameId=${gameId.value}, playerName=${playerName.value}`;
      console.error(error.value);
      return;
    }

    // Listen for game:joined event
    gameSocketService.on('game:joined', (payload) => {
      console.log('Joined game:', payload);
      status.value = payload.message;
      gameStatus.value = 'playing';
      
      // Initialize with starting position if not already set
      if (moveHistory.value.length === 0) {
        chess.value.reset(); // Reset to starting position
      }
    });
    gameSocketService.on('err', (payload: { message: string }) => {
      try {
        const msgs = JSON.parse(payload.message);
        error.value = Array.isArray(msgs) ? msgs.join('; ') : String(msgs);
      } catch {
        error.value = payload.message;
      }
      waitingForMoveAck.value = false;
    });  gameStatus.value = 'playing';
    
    // Listen for opponent ready
    gameSocketService.on('game:opponentReady', (payload) => {
      console.log('Opponent ready:', payload);
      status.value = payload.message;
    });

    // Listen for game updates (includes board state)
    gameSocketService.on('game:update', (payload: GameSession) => {
      console.log('📊 Game update received:', payload);
      try {
        // Update gameId if we don't have it
        if (!gameId.value && payload.gameId) {
          gameId.value = payload.gameId;
        }

        // Store previous FEN for debugging
        const prevFEN = chess.value.fen();
        
        // Load new FEN from server (this is the authoritative state)
        if (payload.fen) {
          console.log(`📥 Loading FEN: ${payload.fen}`);
          console.log(`📥 Previous FEN: ${prevFEN}`);
          chess.value.load(payload.fen);
          
          // Force board refresh
          boardRefreshKey.value++;
          console.log(`🔄 Board refresh key: ${boardRefreshKey.value}`);
          
          // Get full move history from chess engine
          const allMoves = chess.value.history({ verbose: true });
          moveHistory.value = allMoves.map(m => m.san);
          
          console.log(`📋 Move history synced (${moveHistory.value.length} moves): ${moveHistory.value.join(', ')}`);
          console.log(`📋 New FEN: ${chess.value.fen()}`);
        }
        
        // Force reactive update by accessing the computed property
        console.log(`📊 Current board FEN: ${currentFEN.value}`);
        
        // Check whose turn it is
        const turn = chess.value.turn();
        console.log(`🔄 Turn: ${turn}, My color: ${playerColor.value}`);
        
        // Determine if it's player's turn
        const isMyTurn = (turn === 'w' && playerColor.value === 'white') || 
                        (turn === 'b' && playerColor.value === 'black');
        
        if (isMyTurn) {
          status.value = playerColor.value === 'white' ? '✅ Your turn (White)' : '✅ Your turn (Black)';
          waitingForMoveAck.value = false;
        } else {
          status.value = '⏳ Waiting for opponent...';
        }
      } catch (err) {
        console.error('Error updating game state:', err);
        error.value = 'Error syncing game state: ' + (err instanceof Error ? err.message : String(err));
      }
    });

    // Listen for opponent disconnected
    gameSocketService.on('game:opponentDisconnected', (payload) => {
      console.log('Opponent disconnected:', payload);
      error.value = payload.message;
      status.value = '';
      gameStatus.value = 'finished';
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to connect to game';
    connected.value = false;
  }
});

onUnmounted(() => {
  const sock = gameSocketService.getSocket();
  if (sock && (sock as any).offAny) {
    try {
      (sock as any).offAny();
    } catch (e) {
      // ignore if not supported
    }
  }
  gameSocketService.off('game:joined');
  gameSocketService.off('game:opponentReady');
  gameSocketService.off('game:update');
  gameSocketService.off('game:error');
  gameSocketService.off('game:opponentDisconnected');
});
</script>

<style scoped>
.chessboard-container {
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border-radius: 0.5rem;
}

.move-history {
  font-family: monospace;
  background-color: #fff;
  padding: 0.5rem;
  border-radius: 0.25rem;
}
</style>

