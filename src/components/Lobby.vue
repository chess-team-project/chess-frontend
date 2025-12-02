<template>
  <div class="row justify-content-center">
    <div class="col-lg-8">
      <div class="card shadow-sm">
        <div class="card-body">
          <h1 class="card-title h3 mb-4">{{ mode === 'create' ? 'Create Game' : 'Join Game' }}</h1>

          <form @submit.prevent="handleSubmit" class="row g-3">
            <template v-if="mode === 'join'">
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
                  @input="onRoomInput"
                />
              </div>
            </template>

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

            <div class="alert alert-info d-flex justify-content-between align-items-center" v-if="mode === 'create' && roomId">
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
              {{ mode === 'create' ? 'Creating lobby...' : 'Joining lobby...' }}
            </div>

            <div class="d-grid gap-2 d-md-flex">
              <button class="btn btn-primary" type="submit" :disabled="loading || !playerName || (mode === 'join' && roomId.length !== 4)">
                {{ mode === 'create' ? 'Create Lobby' : 'Join Game' }}
              </button>

              <button class="btn btn-outline-secondary" type="button" @click="cancel" :disabled="loading">
                {{ mode === 'create' ? 'Cancel' : 'Back to Home' }}
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
import type { CreateLobbyDto, JoinLobbyDto, GameSession } from '@/types/interfaces';

const props = defineProps<{ mode?: 'create' | 'join' }>();
const mode = props.mode || 'create';

const router = useRouter();

const playerName = ref('');
const roomId = ref('');
const copied = ref(false);
const loading = ref(false);
const error = ref('');

const onRoomInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  roomId.value = target.value.toUpperCase();
};

const copyKey = async () => {
  try {
    await navigator.clipboard.writeText(roomId.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch (err) {
    error.value = 'Failed to copy key';
  }
};

const handleSubmit = async () => {
  if (!playerName.value.trim()) {
    error.value = 'Please enter your name';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    if (mode === 'create') {
      const payload: CreateLobbyDto = { name: playerName.value.trim() };
      lobbySocketService.emit('lobby:create', payload);
    } else {
      if (roomId.value.length !== 4) {
        error.value = 'Invalid room key';
        loading.value = false;
        return;
      }
      const payload: JoinLobbyDto = { roomId: roomId.value.toUpperCase(), name: playerName.value.trim() };
      lobbySocketService.emit('lobby:join', payload);
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to perform action';
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

    lobbySocketService.on('lobby:created', (payload) => {
      roomId.value = payload.roomId;
      loading.value = false;
    });

    lobbySocketService.on('lobby:update', (payload) => {
      roomId.value = payload.roomId;
      loading.value = false;
    });

    lobbySocketService.on('lobby:error', (payload) => {
      error.value = payload.message;
      loading.value = false;
    });

    // When backend signals game start/started, navigate to GameBoard
    const handleGameStart = (payload: GameSession) => {
      const ownName = playerName.value.trim();

      // Prefer explicit color from backend, otherwise fall back to name matching
      let playerColor: 'white' | 'black' = 'white';
      if (payload.playerColor === 'white' || payload.playerColor === 'black') {
        playerColor = payload.playerColor;
      } else {
        try {
          if (payload.whitePlayer?.name === ownName) playerColor = 'white';
          else if (payload.blackPlayer?.name === ownName) playerColor = 'black';
        } catch (e) {
          // ignore and keep default
        }
      }

      // Use server-stored player name to avoid mismatch in GameGateway
      let assignedName = ownName;
      try {
        const whiteName = (payload.whitePlayer?.name || '').trim();
        const blackName = (payload.blackPlayer?.name || '').trim();
        const ownLower = ownName.toLowerCase();
        if (whiteName.toLowerCase() === ownLower) assignedName = whiteName;
        else if (blackName.toLowerCase() === ownLower) assignedName = blackName;
      } catch (e) {
        // ignore and keep default
      }

      // Persist player name/color by gameId for GameBoard
      try {
        localStorage.setItem(`game:${payload.gameId}:playerName`, assignedName);
        localStorage.setItem(`game:${payload.gameId}:playerColor`, playerColor);
      } catch (e) {
        // ignore storage errors
      }

      try {
        localStorage.setItem(`game:${payload.gameId}:whiteName`, (payload.whitePlayer?.name || '').trim());
        localStorage.setItem(`game:${payload.gameId}:blackName`, (payload.blackPlayer?.name || '').trim());
        localStorage.setItem(`game:${payload.gameId}:playerName`, ownName);
        localStorage.setItem(`game:${payload.gameId}:playerColor`, playerColor);
      } catch (e) {}

      console.log('🎮 Game starting, disconnecting from lobby...', { playerColor, gameId: payload.gameId });
      lobbySocketService.disconnect();

      router.push({
        name: 'GameBoard',
        params: {
          roomId: roomId.value,
          gameId: payload.gameId,
          playerName: ownName,
          playerColor,
        },
      });
    };

    lobbySocketService.on('game:start', handleGameStart);
    // support alternative event name from backend
    lobbySocketService.on('game:started', handleGameStart);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to connect to server';
    loading.value = false;
  }
});

onUnmounted(() => {
  lobbySocketService.off('lobby:created');
  lobbySocketService.off('lobby:update');
  lobbySocketService.off('lobby:error');
  lobbySocketService.off('game:start');
  lobbySocketService.off('game:started');
});
</script>

