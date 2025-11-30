<template>
  <div class="row justify-content-center">
    <div class="col-lg-8">
      <div class="card shadow-sm">
        <div class="card-body">
          <h1 class="card-title h3 mb-4">Chess Game</h1>

          <div v-if="error" class="alert alert-danger">
            {{ error }}
          </div>

          <div v-if="status" class="alert alert-info">
            {{ status }}
          </div>

          <div class="chessboard-container d-flex justify-content-center mb-4">
            <TheChessboard
              :board-config="boardConfig"
            />
          </div>

          <div class="mt-4">
            <div class="row">
              <div class="col-md-6">
                <p v-if="playerColor" class="text-muted">
                  <strong>Your Color:</strong> {{ playerColor }}
                </p>
                <p v-if="roomId" class="text-muted">
                  <strong>Room:</strong> {{ roomId }}
                </p>
                <p class="text-muted">
                  <strong>Current FEN:</strong> <code>{{ FEN_POSITION }}</code>
                </p>
              </div>
            </div>
          </div>

          <div class="mt-4 d-flex gap-2">
            <RouterLink class="btn btn-outline-primary" :to="{ name: 'Home' }">
              Home
            </RouterLink>
            <button class="btn btn-outline-secondary" @click="goBack" :disabled="!connected">
              Leave Game
            </button>
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
import { Chess } from 'chess.js';
import { TheChessboard } from 'vue3-chessboard';
import 'vue3-chessboard/style.css';

const router = useRouter();
const route = useRoute();

// Hardcoded FEN position - starting position
// You can change this to any valid FEN string to test different positions
// Examples:
// - Starting position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
// - Middle game: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4'
// - Endgame: '8/8/8/8/8/4k3/4P3/4K3 w - - 0 1'
const FEN_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const roomId = ref('');
const playerName = ref('');
const playerColor = ref('');
const status = ref('Connecting to game...');
const error = ref('');
const connected = ref(false);

// Board configuration for vue3-chessboard
// TheChessboard uses boardConfig with fen property directly
const boardConfig = computed(() => {
  try {
    // Validate FEN
    const chess = new Chess(FEN_POSITION);
    
    return {
      fen: FEN_POSITION,
      orientation: playerColor.value?.toLowerCase() === 'black' ? 'black' : 'white',
      coordinates: true,
      viewOnly: false, // Set to true if you don't want user interaction
    };
  } catch (err) {
    console.error('Error parsing FEN:', err);
    error.value = `Invalid FEN position: ${err instanceof Error ? err.message : 'Unknown error'}`;
    return {
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Fallback to starting position
      orientation: 'white',
      coordinates: true,
      viewOnly: false,
    };
  }
});

const goBack = () => {
  gameSocketService.disconnect();
  router.push({ name: 'Home' });
};

onMounted(async () => {
  try {
    // Get room ID and player name from route query
    roomId.value = (route.query.roomId as string) || '';
    playerName.value = (route.query.playerName as string) || '';
    // Optional player color passed from lobby (White/Black)
    playerColor.value = (route.query.playerColor as string) || '';
    console.log('Joining room (query):', route.query.roomId, 'as', playerName.value, 'color:', route.query.playerColor);

    if (!gameSocketService.isConnected()) {
      await gameSocketService.connect();
    }

    connected.value = true;

    // Send game:join event
    if (roomId.value && playerName.value) {
      gameSocketService.emit('game:join', {
        roomId: roomId.value,
        playerName: playerName.value,
      });
      status.value = 'Waiting for opponent...';
    } else {
      error.value = 'Missing room ID or player name';
    }

    // Listen for game:joined event
    gameSocketService.on('game:joined', (payload) => {
      console.log('Joined game:', payload);
      status.value = payload.message;
    });

    // Listen for opponent ready
    gameSocketService.on('game:opponentReady', (payload) => {
      console.log('Opponent ready:', payload);
      status.value = payload.message;
      // Only set playerColor if it wasn't provided by the lobby
      if (!playerColor.value) {
        playerColor.value = 'White'; // Default or as determined by backend
      }
    });

    // Listen for move made
    gameSocketService.on('game:moveMade', (payload) => {
      console.log('Move made:', payload);
    });

    // Listen for errors
    gameSocketService.on('game:error', (payload) => {
      error.value = payload.message;
      status.value = '';
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to connect to game';
    connected.value = false;
  }
});

onUnmounted(() => {
  gameSocketService.off('game:joined');
  gameSocketService.off('game:opponentReady');
  gameSocketService.off('game:moveMade');
  gameSocketService.off('game:error');
});
</script>

<style scoped>
.chessboard-container {
  min-height: 400px;
}
</style>

