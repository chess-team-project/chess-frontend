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

          <div class="board">
            <div
              v-for="cell in 64"
              :key="cell"
              :class="['square', (Math.floor((cell - 1) / 8) + (cell - 1) % 8) % 2 === 0 ? 'light' : 'dark']"
            ></div>
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
import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { RouterLink } from 'vue-router';
import { gameSocketService } from '@/services/game-socket';

const router = useRouter();
const route = useRoute();

const roomId = ref('');
const playerName = ref('');
const playerColor = ref('');
const status = ref('Connecting to game...');
const error = ref('');
const connected = ref(false);

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
.board {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 2px;
  max-width: 480px;
  margin-inline: auto;
  border: 4px solid #6c757d;
}

.square {
  aspect-ratio: 1 / 1;
}

.light {
  background-color: #f8f9fa;
}

.dark {
  background-color: #6c757d;
}
</style>

