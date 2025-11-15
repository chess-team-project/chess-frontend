
<template>
  <div class="row justify-content-center">
    <div class="col-lg-8">
      <div class="card shadow-sm">
        <div class="card-body">
          <h1 class="card-title h3 mb-4">Join Game</h1>

          <form @submit.prevent="handleJoinLobby" class="row g-3">
            <div class="col-12">
              <label for="roomId" class="form-label">
                Room Key (4 characters)
              </label>
              <input
                id="roomId"
                v-model="roomId"
                type="text"
                class="form-control"
                placeholder="Enter the room key"
                maxlength="4"
                minlength="4"
                required
                @input="roomId = roomId.toUpperCase()"
              />
            </div>

            <div class="col-12">
              <label for="playerName" class="form-label">
                Your Name
              </label>
              <input
                id="playerName"
                v-model="playerName"
                type="text"
                class="form-control"
                placeholder="Enter your name (2-20 characters)"
                maxlength="20"
                minlength="2"
                required
              />
            </div>

            <div v-if="error" class="alert alert-danger">
              {{ error }}
            </div>

            <div v-if="loading" class="alert alert-info">
              Joining lobby...
            </div>

            <div class="col-12 d-flex gap-2">
              <button type="submit" class="btn btn-primary" :disabled="loading || roomId.length !== 4 || !playerName">
                Join Game
              </button>
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="goHome"
                :disabled="loading"
              >
                Back to Home
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { lobbySocketService } from '@/services/lobby-socket';
import type { JoinLobbyDto } from '@/types/dtos';

const router = useRouter();

const roomId = ref('');
const playerName = ref('');
const loading = ref(false);
const error = ref('');

const handleJoinLobby = async () => {
  if (roomId.value.length !== 4 || !playerName.value.trim()) {
    error.value = 'Please enter a valid room key and name';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const payload: JoinLobbyDto = {
      roomId: roomId.value.toUpperCase(),
      name: playerName.value.trim(),
    };

    lobbySocketService.emit('lobby:join', payload);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to join lobby';
    loading.value = false;
  }
};

const goHome = () => {
  lobbySocketService.disconnect();
  router.push({ name: 'Home' });
};

onMounted(async () => {
  try {
    if (!lobbySocketService.isConnected()) {
      await lobbySocketService.connect();
    }

    // Listen for lobby:update event when successfully joined
    lobbySocketService.on('lobby:update', (payload) => {
      console.log('Joined lobby:', payload);
      loading.value = false;
      // Optionally navigate to game board or waiting room
      // router.push({ name: 'GameBoard', params: { roomId: payload.roomId } });
    });

    // Listen for errors
    lobbySocketService.on('lobby:error', (payload) => {
      error.value = payload.message;
      loading.value = false;
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to connect to server';
  }
});

onUnmounted(() => {
  lobbySocketService.off('lobby:update');
  lobbySocketService.off('lobby:error');
});
</script>

