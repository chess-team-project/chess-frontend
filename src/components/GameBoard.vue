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

          <div v-if="resultMessage" :class="['alert', isResultWinner ? 'alert-success' : 'alert-danger']">
            {{ resultMessage }}
          </div>

          <div v-if="drawOfferFrom" class="alert alert-secondary d-flex align-items-center justify-content-between">
            <div>
              <strong>Draw offer:</strong>
              <span v-if="drawOfferFrom === playerColor">You offered a draw — waiting for opponent</span>
              <span v-else>Opponent offered a draw</span>
            </div>
            <div v-if="drawOfferFrom !== playerColor">
              <button class="btn btn-sm btn-success me-2" @click="acceptDraw">Accept</button>
              <button class="btn btn-sm btn-outline-secondary" @click="declineDraw">Decline</button>
            </div>
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
                  :key="`board-${playerColor}`"
                  :board-config="boardConfig"
                  :reactive-config="true"
                  @move="onChessboardMove"
                />
              </div>
              <div class="text-center">
                <small class="text-muted">
                  FEN: <code style="font-size: 0.75rem;">{{ currentFEN }}</code>
                </small>
              </div>
            </div>

            <!-- Timer Column -->
            <div class="col-md-2 col-12 timers-wrapper d-flex flex-column justify-content-between" style="min-height:500px;">
              <!-- Top-right: Opponent -->
              <div class="timer-opponent d-flex justify-content-end mt-2">
                <TimerBubble
                  :time="playerColor === 'white' ? blackClockMs : whiteClockMs"
                  label="Opponent"
                  :active="playerColor === 'white' ? currentTurn === 'b' : currentTurn === 'w'"
                  :size="90"
                />
              </div>

              <!-- Bottom-right: You -->
              <div class="timer-you d-flex justify-content-end mb-2">
                <TimerBubble
                  :time="playerColor === 'white' ? whiteClockMs : blackClockMs"
                  label="You"
                  :active="playerColor === 'white' ? currentTurn === 'w' : currentTurn === 'b'"
                  :size="100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { RouterLink } from 'vue-router';
import { gameSocketService } from '@/services/game-socket';
import type { BoardConfig } from 'vue3-chessboard';
import { Chess } from 'chess.js';
import { TheChessboard } from 'vue3-chessboard';
import 'vue3-chessboard/style.css';
import type { GameSession } from '@/types/interfaces';
import TimerBubble from './TimerBubble.vue';

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
const resultMessage = ref('');
const isResultWinner = ref<boolean | null>(null);
const whiteClockMs = ref(300000); // 5 minutes default
const blackClockMs = ref(300000); // 5 minutes default
const drawOfferFrom = ref<'white' | 'black' | null>(null);

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
const isGameFinished = computed(() => gameStatus.value === 'finished');

// Board configuration - use ref for reactive-config to work properly
const boardConfig = ref<BoardConfig>({
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  orientation: 'white',
  coordinates: true,
  viewOnly: false,
});

// Update board config when FEN or player color changes
// Update properties directly for reactive-config to work properly
const updateBoardConfig = () => {
  try {
    const newFEN = currentFEN.value;
    const newOrientation = playerColor.value;
    const newViewOnly =
  isGameFinished.value || !isPlayerTurn.value || waitingForMoveAck.value;
    
    // Only update if values actually changed to prevent infinite loops
    if (boardConfig.value.fen !== newFEN) {
      boardConfig.value.fen = newFEN;
    }
    if (boardConfig.value.orientation !== newOrientation) {
      boardConfig.value.orientation = newOrientation;
    }
    if (boardConfig.value.viewOnly !== newViewOnly) {
      boardConfig.value.viewOnly = newViewOnly;
    }
  } catch (err) {
    console.error('Error updating board config:', err);
  }
};

// Watch for changes to update board config reactively
// Use flush: 'post' to ensure updates happen after DOM updates
watch([currentFEN, playerColor, isPlayerTurn, waitingForMoveAck], () => {
  updateBoardConfig();
}, { immediate: true, flush: 'post' });

// Handle moves from chessboard
const onChessboardMove = (moveData: any) => {
  // ✅ ГОЛОВНИЙ ЗАХИСТ: після resign / finished — жодних ходів
  if (gameStatus.value === 'finished') {
    console.warn('⛔ Move blocked: game already finished');
    return;
  }

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

    // Validate move locally first (but don't apply - wait for server confirmation)
    const testChess = new Chess(chess.value.fen());
    const testMove = testChess.move({
      from,
      to,
      promotion: promotion || undefined,
    });
    
    if (!testMove) {
      error.value = 'Invalid move';
      return;
    }

    console.log(`✅ Move validated locally: ${testMove.san}, sending to server...`);

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
  try {
    if (!roomId.value) {
      error.value = 'Missing room id';
      return;
    }
    // Emit draw offer to server using lobby roomId
    console.log('📨 Emitting game:draw:offer', { roomId: roomId.value });
    gameSocketService.emit('game:draw:offer', { roomId: roomId.value });
    // Optimistically mark that we offered a draw
    drawOfferFrom.value = playerColor.value;
    status.value = 'Draw offered — waiting for opponent';
  } catch (err) {
    console.error('Error offering draw:', err);
    error.value = err instanceof Error ? err.message : 'Failed to offer draw';
  }
};

const acceptDraw = () => {
  try {
    if (!roomId.value) {
      error.value = 'Missing room id';
      return;
    }
    console.log('📨 Emitting game:draw:accept', { roomId: roomId.value });
    gameSocketService.emit('game:draw:accept', { roomId: roomId.value });
    // wait for server to emit game:finished and game:update
    status.value = 'Accepted draw — waiting for server...';
  } catch (err) {
    console.error('Error accepting draw:', err);
    error.value = err instanceof Error ? err.message : 'Failed to accept draw';
  }
};

const declineDraw = () => {
  // Simple local dismissal — server should clear drawOfferFrom via game:update
  drawOfferFrom.value = null;
  status.value = 'Draw rejected';
};

const resign = () => {
  try {
    if (!roomId.value) {
      error.value = 'Missing room id';
      return;
    }

    // ✅ Миттєво блокуємо дошку локально, не чекаючи бекенда
    gameStatus.value = 'finished';
    waitingForMoveAck.value = true;
    status.value = 'You resigned. Waiting for server...';

    console.log('🏳️ Emitting game:resign', { roomId: roomId.value });
    gameSocketService.emit('game:resign', { roomId: roomId.value });
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to resign';
  }
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

    // Send game:join event (use roomId from route params)
    if (roomId.value && playerName.value) {
      console.log('📨 Sending game:join event...', { roomId: roomId.value, playerName: playerName.value });
      gameSocketService.emit('game:join', {
        roomId: roomId.value,
        playerName: playerName.value,
      });
      status.value = `Joining room ${roomId.value}...`;
    } else {
      error.value = `Missing required params: roomId=${roomId.value}, playerName=${playerName.value}`;
      console.error(error.value);
      return;
    }

    // Listen for game:joined event
    gameSocketService.on('game:joined', async (payload) => {
      console.log('Joined game:', payload);
      status.value = payload.message;
      gameStatus.value = 'playing';
      
      // Initialize with starting position if not already set
      if (moveHistory.value.length === 0) {
        chess.value.reset(); // Reset to starting position
        // Board config will be updated automatically by the watch on currentFEN
      }
    });
    gameSocketService.on('err', (payload: { message: string }) => {
      try {
        const msgs = JSON.parse(payload.message);
        error.value = Array.isArray(msgs) ? msgs.join('; ') : String(msgs);
      } catch {
        error.value = payload.message;
      }
      
      // No need to revert - we didn't apply the move optimistically
      waitingForMoveAck.value = false;
    });
    
    gameStatus.value = 'playing';
    
    // Listen for opponent ready
    gameSocketService.on('game:opponentReady', (payload) => {
      console.log('Opponent ready:', payload);
      status.value = payload.message;
    });

    // Listen for game updates (includes board state)
    gameSocketService.on('game:update', async (payload: GameSession) => {
      console.log('📊 Game update received:', payload);
      try {
        // Update gameId if we don't have it
        if (!gameId.value && payload.gameId) {
          gameId.value = payload.gameId;
        }

        // Store previous state for debugging
        const prevFEN = chess.value.fen();
        const previousMoveCount = chess.value.history().length;
        
        // ALWAYS load FEN from server - it's the source of truth
        // This ensures both players see the same position
        if (payload.fen) {
          console.log(`📥 Server FEN: ${payload.fen}`);
          console.log(`📥 Previous FEN: ${prevFEN}`);
          console.log(`📥 FEN changed: ${payload.fen !== prevFEN}`);
          
          // Load the authoritative state from server
          chess.value.load(payload.fen);
          
          // Force Vue to recognize the change by accessing the computed
          const newFEN = chess.value.fen();
          console.log(`📋 Loaded FEN: ${newFEN}`);
          
          // Get full move history from chess engine
          const allMoves = chess.value.history({ verbose: true });
          moveHistory.value = allMoves.map(m => m.san);
          
          // Log move information
          if (allMoves.length > previousMoveCount) {
            const lastMove = allMoves[allMoves.length - 1];
            console.log(`✅ New move applied: ${lastMove.san} (from ${lastMove.from} to ${lastMove.to})`);
          } else if (allMoves.length < previousMoveCount) {
            console.warn(`⚠️ Server state has fewer moves than local. Syncing to server state.`);
          } else if (payload.fen !== prevFEN) {
            console.log(`🔄 Position synced (same move count, different FEN)`);
          }
          
          console.log(`📋 Move history: ${moveHistory.value.length} moves - ${moveHistory.value.join(', ')}`);
          
          // Board config will be updated automatically by the watch on currentFEN
          // No need to call updateBoardConfig() here to avoid recursive updates
        } else {
          console.warn('⚠️ game:update received without FEN');
        }
        
        // Reset waiting flag - server has processed the move (ours or opponent's)
        waitingForMoveAck.value = false;
        
        // Check whose turn it is
        const turn = chess.value.turn();
        console.log(`🔄 Turn: ${turn === 'w' ? 'White' : 'Black'}, My color: ${playerColor.value}`);
        
        // Determine if it's player's turn
        const isMyTurn = (turn === 'w' && playerColor.value === 'white') || 
                        (turn === 'b' && playerColor.value === 'black');
        
        if (isMyTurn) {
          status.value = playerColor.value === 'white' ? '✅ Your turn (White)' : '✅ Your turn (Black)';
        } else {
          status.value = '⏳ Waiting for opponent...';
        }
        
        // Update draw offer state if provided by server
        if (typeof (payload as any).drawOfferFrom !== 'undefined') {
          drawOfferFrom.value = (payload as any).drawOfferFrom || null;
        }

        // Update gameStatus from payload if provided
        if ((payload as any).gameStatus) {
          gameStatus.value = (payload as any).gameStatus as any;
        }

        // Clear any previous errors on successful update
        error.value = '';
      } catch (err) {
        console.error('❌ Error updating game state:', err);
        error.value = 'Error syncing game state: ' + (err instanceof Error ? err.message : String(err));
        waitingForMoveAck.value = false;
      }
    });

    // Listen for opponent disconnected
    gameSocketService.on('game:opponentDisconnected', (payload) => {
      console.log('Opponent disconnected:', payload);
      error.value = payload.message;
      status.value = '';
      gameStatus.value = 'finished';
    });

    // Listen for draw offered by server (explicit event)
    gameSocketService.on('game:draw:offered', (payload: { from: 'white' | 'black' }) => {
      try {
        console.log('Draw offered by:', payload.from);
        drawOfferFrom.value = payload.from;
        // If opponent offered, show a prompt
        if (payload.from !== playerColor.value) {
          status.value = 'Opponent offered a draw';
        } else {
          status.value = 'Draw offered (waiting for opponent)';
        }
      } catch (err) {
        console.error('Error handling draw offered:', err);
      }
    });

    // Listen for finished messages (e.g., draw agreed)
    gameSocketService.on('game:finished', (payload: { message: string }) => {
      try {
        console.log('Game finished:', payload.message);
        status.value = payload.message;
        gameStatus.value = 'finished';
        if (payload.message.toLowerCase().includes('draw')) {
          resultMessage.value = payload.message;
          isResultWinner.value = null;
        }
      } catch (err) {
        console.error('Error handling game:finished:', err);
      }
    });

    // Listen for game result (winner/loser)
    gameSocketService.on('game:result', (payload: { winner: string; loser: string }) => {
      try {
        console.log('Game result received:', payload);
        gameStatus.value = 'finished';

        if (payload.winner === playerName.value) {
          status.value = '🎉 You won!';
          resultMessage.value = `You won — opponent: ${payload.loser}`;
          isResultWinner.value = true;
        } else if (payload.loser === playerName.value) {
          status.value = '😞 You lost';
          resultMessage.value = `You lost — winner: ${payload.winner}`;
          isResultWinner.value = false;
        } else {
          // Fallback for spectators or name mismatch
          status.value = '';
          resultMessage.value = `Game finished. Winner: ${payload.winner}, Loser: ${payload.loser}`;
          isResultWinner.value = false;
        }
      } catch (err) {
        console.error('Error handling game:result:', err);
      }
    });

    // Listen for game clock updates
    gameSocketService.on('game:clock', (payload: { white: number; black: number }) => {
      try {
        console.log('Clock update received:', payload);
        // Backend sends time in seconds, convert to milliseconds
        whiteClockMs.value = payload.white * 1000;
        blackClockMs.value = payload.black * 1000;
      } catch (err) {
        console.error('Error handling game:clock:', err);
      }
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
  gameSocketService.off('game:result');
  gameSocketService.off('game:clock');
  gameSocketService.off('game:draw:offered');
  gameSocketService.off('game:finished');
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

/* Make chessboard container a positioning context for small-screen timer bubbles */
.chessboard-container {
  position: relative;
}

/* Timers wrapper defaults (wide screens): column on the right with top and bottom alignment */
.timers-wrapper {
  position: static;
}

/* Small screens: position opponent left of board and player right of board, vertically centered */
@media (max-width: 767.98px) {
  /* Keep timers stacked top/bottom on small screens; only reduce sizes */
  .timers-wrapper {
    position: static;
  }

  /* Reduce bubble sizes on very small screens */
  .timer-bubble .bubble {
    width: 72px !important;
    height: 72px !important;
    font-size: 0.95rem !important;
  }
}

.move-history {
  font-family: monospace;
  background-color: #fff;
  padding: 0.5rem;
  border-radius: 0.25rem;
}
</style>

