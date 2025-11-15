<template>
  <div class="row justify-content-center">
    <div class="col-lg-8">
      <div class="card shadow-sm">
        <div class="card-body">
          <h1 class="card-title h3 mb-4">Create Game</h1>

          <form @submit.prevent="handleCreateLobby" class="row g-3">
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

            <div class="alert alert-info d-flex justify-content-between align-items-center" v-if="roomId">
              <div>
                <span class="fw-semibold">Room Key:</span>
                <span class="ms-2 font-monospace">{{ roomId }}</span>
              </div>
              <button
                class="btn btn-link btn-sm"
                type="button"
                @click="copyKey"
                :disabled="copied"
              >
                {{ copied ? 'Copied!' : 'Copy' }}
              </button>
            </div>

            <div v-if="error" class="alert alert-danger">
              {{ error }}
            </div>

            <div v-if="loading" class="alert alert-info">
              Creating lobby...
            </div>

            <div class="d-grid gap-2 d-md-flex">
              <button class="btn btn-primary" type="submit" :disabled="loading || !playerName">
                Create Lobby
              </button>
              
              <button class="btn btn-outline-secondary" type="button" @click="cancel" :disabled="loading">
                Cancel
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
import type { CreateLobbyDto } from '@/types/dtos';

const router = useRouter();

const playerName = ref('');
const roomId = ref('');
const copied = ref(false);
const loading = ref(false);
const error = ref('');

const copyKey = async () => {
  try {
    await navigator.clipboard.writeText(roomId.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    error.value = 'Failed to copy key';
  }
};

const handleCreateLobby = async () => {
  if (!playerName.value.trim()) {
    error.value = 'Please enter your name';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const payload: CreateLobbyDto = {
      name: playerName.value.trim(),
    };

    lobbySocketService.emit('lobby:create', payload, () => {
      console.log('Lobby creation acknowledged');
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create lobby';
    loading.value = false;
  }
};

const cancel = () => {
  lobbySocketService.disconnect();
  router.push({ name: 'Home' });
};

onMounted(async () => {
  try {
    if (!lobbySocketService.isConnected()) {
      await lobbySocketService.connect();
    }

    // Listen for lobby:created event
    lobbySocketService.on('lobby:created', (payload) => {
      console.log('Lobby created:', payload);
      roomId.value = payload.roomId;
      loading.value = false;
      // Optionally navigate to game board or waiting room
      // router.push({ name: 'GameBoard' });
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
  lobbySocketService.off('lobby:created');
  lobbySocketService.off('lobby:error');
});
</script>
